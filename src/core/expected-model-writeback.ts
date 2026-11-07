import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from './change-compiler.js';
import { parseSemanticDeltaFiles, type DeltaEntry, type Operation } from './model/delta.js';
import { renderFrontmatter, splitFrontmatter } from './model/frontmatter.js';
import { parseUnit, readModelFiles } from './model/parser.js';
import { serializeContract, serializeSemanticModel } from './model/serializer.js';
import type { ModelElement, Section } from './model/types.js';
import { validateTaskStructure } from './parsers/task-structure.js';
import { canonicalJson } from './semantic-diff.js';
import { Validator } from './validation/validator.js';
import { validateChangeName } from '../utils/change-utils.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';

export class WritebackError extends Error {
  constructor(readonly code: string, message: string, readonly diagnostics: unknown[] = []) {
    super(message);
  }
}

function fail(code: string, message: string, diagnostics: unknown[] = []): never {
  throw new WritebackError(code, message, diagnostics);
}

async function regularPath(root: string, target: string): Promise<void> {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail('INVALID_SOURCE', '源文件必须位于指定 Change 内。');
  }
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink()) fail('INVALID_SOURCE', '源路径不允许符号链接。');
  }
  if (!(await fs.lstat(target)).isFile()) fail('INVALID_SOURCE', '源文件必须为普通文件。');
}

function same(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sectionEntries(base: Section[], target: Section[], host: string): DeltaEntry[] {
  const previous = new Map(base.map(section => [section.name, section]));
  const next = new Map(target.map(section => [section.name, section]));
  return [
    ...target.flatMap(section => {
      const before = previous.get(section.name);
      return before && same(before, section) ? [] : [{
        entity: 'section' as const, identity: `${host}#${section.name}`,
        operation: before ? 'MODIFIED' as const : 'ADDED' as const, target: section,
      }];
    }),
    ...base.filter(section => !next.has(section.name)).map(section => ({
      entity: 'section' as const, identity: `${host}#${section.name}`, operation: 'REMOVED' as const,
    })),
  ];
}

function serializeDelta(element: ModelElement, entries: DeltaEntry[]): string {
  const declaration = entries.find(entry => entry.entity === 'element-declaration');
  const parts = [renderFrontmatter('element-declaration', {
    ...element.declaration, ...(declaration ? { operation: declaration.operation } : {}),
  }).trimEnd()];
  for (const operation of ['ADDED', 'MODIFIED', 'REMOVED'] as Operation[]) {
    const sections = entries.filter(entry => entry.entity === 'section' && entry.operation === operation);
    if (!sections.length) continue;
    parts.push(`## ${operation} Sections`);
    for (const entry of sections) {
      parts.push(operation === 'REMOVED' ? `### Section: ${entry.identity.slice(element.declaration.identity.length + 1)}`
        : serializeContract({ declaration: element.declaration, sections: [entry.target as Section] }).replace('## Specification\n\n', ''));
    }
  }
  return `${parts.join('\n\n')}\n`;
}

export async function writebackExpectedModel(
  projectRoot: string, change: string, source: string, text: string,
  replace: typeof fs.rename = fs.rename,
): Promise<{ changed: boolean; ignoredChanges: string[] }> {
  if (!validateChangeName(change).valid || change === 'archive') fail('INVALID_CHANGE', '需要有效的活动 Change 名称。');
  const root = path.resolve(projectRoot);
  if (!(await getActiveChangeIds(root)).includes(change)) fail('INVALID_CHANGE', '只能写回活动 Change。');
  const directory = path.join(root, '.xirang', 'changes', change);
  const target = path.resolve(directory, source);
  await regularPath(root, target);
  const relative = path.relative(directory, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) fail('INVALID_SOURCE', '源文件不在指定 Change 内。');
  const sourcePath = relative.split(path.sep).join('/');
  const current = await compileChangeDelta(root, change);
  if (!current.compiled.valid || !current.compiled.target) fail('INVALID_CHANGE', '当前 Change 无效。', current.compiled.diagnostics);
  const files = await readModelFiles(directory);
  const original = files.get(sourcePath);
  if (original === undefined) fail('INVALID_SOURCE', '请选择审阅投影中的 Delta 源文件。');
  const unit = splitFrontmatter(original);
  if (!unit.ok || unit.data.entity !== 'element-declaration') {
    const projection = serializeSemanticModel(current.compiled.target);
    const entities = current.sources.find(item => item.path === sourcePath)?.entities ?? [];
    const paths = new Set(entities.map(item => {
      if (item.entity === 'relationship') return `relationships/${item.identity.split('\0')[1]}.yaml`;
      if (item.entity === 'element-kind' || item.entity === 'relationship-kind') return `metamodel/${item.identity}.md`;
      if (item.entity === 'authored-view') return `views/${item.identity}.md`;
      return `elements/${item.identity.split('#')[0]}.md`;
    }));
    const expectedText = [...paths].map(file => projection.get(file)?.toString('utf8') ?? '').filter(Boolean).join('\n\n');
    return { changed: false, ignoredChanges: text === expectedText ? [] : ['content'] };
  }
  const identity = String(unit.data.identity);
  const expected = current.compiled.target.elements.find(element => element.declaration.identity === identity);
  if (!expected) return { changed: false, ignoredChanges: text.trim() ? ['content'] : [] };
  const input = splitFrontmatter(text);
  if (!input.ok) fail('INVALID_INPUT', input.message);
  const existingFields = { entity: 'element-declaration', ...expected.declaration };
  const ignoredChanges = [...new Set([...Object.keys(input.data), ...Object.keys(existingFields)])]
    .filter(key => key !== 'definition' && !same(input.data[key], existingFields[key as keyof typeof existingFields]));
  const parsed = parseUnit(sourcePath, { ...existingFields, definition: input.data.definition }, input.body);
  if (Array.isArray(parsed) || !parsed.element || parsed.diagnostics.some(item => item.level === 'ERROR')) {
    fail('INVALID_INPUT', '目标文本无法解析。', Array.isArray(parsed) ? parsed : parsed.diagnostics);
  }
  const edited = parsed.element;
  const base = current.base.model.elements.find(element => element.declaration.identity === identity);
  const entries: DeltaEntry[] = [];
  if (!base || !same(base.declaration, edited.declaration)) entries.push({
    entity: 'element-declaration', identity, operation: base ? 'MODIFIED' : 'ADDED', target: edited.declaration,
  });
  entries.push(...sectionEntries(base?.sections ?? [], edited.sections, identity));
  const content = serializeDelta(edited, entries);
  if (same(edited, expected)) return { changed: false, ignoredChanges };
  files.set(sourcePath, content);
  const candidate = await compileChangeDelta(root, change, { base: current.base, parsedDelta: parseSemanticDeltaFiles(files) });
  const notation = await new Validator().validateChangeDeltaSpecs(directory, { files });
  const tasks = await fs.readFile(path.join(directory, 'tasks.md'), 'utf8').catch(() => '');
  const taskErrors = tasks ? validateTaskStructure(tasks).issues.filter(issue => issue.severity === 'error') : [];
  if (!candidate.compiled.valid || !notation.valid || taskErrors.length) {
    fail('INVALID_TARGET', '微调后的完整 Change 校验失败。', [...candidate.compiled.diagnostics, ...notation.issues, ...taskErrors]);
  }
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await replace(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { changed: true, ignoredChanges };
}
