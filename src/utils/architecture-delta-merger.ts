import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runLikeC4, type LikeC4Runner } from '../commands/arch/runner.js';
import { validateArchitecture } from './architecture-validator.js';
import { readLikeC4Architecture } from './likec4-reader.js';
import { atomicWrite } from './likec4-writer.js';
import type { SemanticArchitectureModel, SemanticElement } from './semantic-model.js';

function blockAt(content: string, open: number): { body: string; end: number } {
  let depth = 0;
  let quote = false;
  for (let index = open; index < content.length; index += 1) {
    if (content[index] === "'" && content[index - 1] !== '\\') quote = !quote;
    if (quote) continue;
    if (content[index] === '{') depth += 1;
    if (content[index] === '}' && --depth === 0) return { body: content.slice(open + 1, index), end: index };
  }
  throw new Error('Unclosed LikeC4 block');
}

function insertIntoDomain(content: string, domain: string, addition: string): string {
  const pattern = new RegExp(`\\b${domain}\\s*=\\s*domain\\b[^\\{]*\\{`);
  const match = pattern.exec(content);
  if (!match) throw new Error(`Cannot extend nonexistent domain: ${domain}`);
  const open = match.index + match[0].lastIndexOf('{');
  const block = blockAt(content, open);
  return `${content.slice(0, block.end)}\n${addition.trim().split('\n').map(line => `    ${line}`).join('\n')}\n  ${content.slice(block.end)}`;
}

function metadataValues(body: string): Map<string, string> {
  const values = new Map<string, string>();
  const pattern = /([A-Za-z_][\w-]*)\s+(\[(?:[^\]'\\]|\\.|'(?:[^'\\]|\\.)*')*\]|'(?:[^'\\]|\\.)*')/g;
  for (const match of body.matchAll(pattern)) values.set(match[1], match[2]);
  return values;
}

function specValues(value: string | undefined): string[] {
  return value ? [...value.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(match => match[1]) : [];
}

function renderMetadata(values: Map<string, string>, indent: string): string {
  const entries = [...values].map(([key, value]) => `${indent}  ${key} ${value}`).join('\n');
  return `${indent}metadata {\n${entries}\n${indent}}`;
}

function applyElementExtension(content: string, qualifiedId: string, extension: string): string {
  const [, element] = qualifiedId.split('.');
  const pattern = new RegExp(`\\b${element}\\s*=\\s*[A-Za-z_][\\w-]*\\b[^\\{]*\\{`);
  const match = pattern.exec(content);
  if (!match) throw new Error(`Cannot extend nonexistent element: ${qualifiedId}`);

  const open = match.index + match[0].lastIndexOf('{');
  const elementBlock = blockAt(content, open);
  let body = elementBlock.body;
  const metadataMatch = /\bmetadata\s*\{/.exec(body);
  const existing = new Map<string, string>();
  let metadataStart = -1;
  let metadataEnd = -1;
  if (metadataMatch) {
    metadataStart = metadataMatch.index;
    const metadataOpen = metadataStart + metadataMatch[0].lastIndexOf('{');
    const metadataBlock = blockAt(body, metadataOpen);
    metadataEnd = metadataBlock.end + 1;
    for (const [key, value] of metadataValues(metadataBlock.body)) existing.set(key, value);
  }

  const extensionMetadataMatch = /\bmetadata\s*\{/.exec(extension);
  if (!extensionMetadataMatch) return content;
  const extensionOpen = extensionMetadataMatch.index + extensionMetadataMatch[0].lastIndexOf('{');
  const incoming = metadataValues(blockAt(extension, extensionOpen).body);
  const intent = incoming.get('intent');
  incoming.delete('intent');

  const specs = [...new Set([...specValues(existing.get('specs')), ...specValues(incoming.get('specs'))])];
  if (specs.length) incoming.set('specs', `[${specs.map(spec => `'${spec}'`).join(', ')}]`);
  for (const [key, value] of incoming) existing.set(key, value);

  if (metadataStart >= 0) {
    const indent = body.slice(0, metadataStart).match(/(?:^|\n)([ \t]*)[^\n]*$/)?.[1] ?? '    ';
    body = `${body.slice(0, metadataStart)}${renderMetadata(existing, indent)}${body.slice(metadataEnd)}`;
  } else if (existing.size) {
    body = `${body.trimEnd()}\n    ${renderMetadata(existing, '    ').trimStart()}\n  `;
  }

  if (intent) {
    const description = `description ${intent}`;
    if (/\bdescription\s+'(?:[^'\\]|\\.)*'/.test(body)) {
      body = body.replace(/\bdescription\s+'(?:[^'\\]|\\.)*'/, description);
    } else {
      body = `\n    ${description}${body}`;
    }
  }

  return `${content.slice(0, open + 1)}${body}${content.slice(elementBlock.end)}`;
}

function formalizeSpecPaths(content: string, changeName?: string): string {
  return changeName ? content.replaceAll(`.opsx/changes/${changeName}/specs/`, '.opsx/specs/') : content;
}

function copyDurableArchitecture(source: string, destination: string): Promise<void> {
  return fs.cp(source, destination, {
    recursive: true,
    filter: file => path.basename(file) !== '.likec4',
  });
}

function mergeRelations(content: string, additions: string[]): string {
  const open = content.indexOf('{');
  const block = blockAt(content, open);
  const relations = [...block.body.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean), ...additions]
    .sort((left, right) => left.localeCompare(right));
  return `${content.slice(0, open + 1)}\n${relations.map(relation => relation.split('\n').map(line => `  ${line}`).join('\n')).join('\n\n')}\n${content.slice(block.end)}`;
}

function extractRelations(content: string): string[] {
  const pattern = /([A-Za-z_][\w.-]*\.[A-Za-z_][\w-]*)\s+-\[([\w-]+)\]->\s+([A-Za-z_][\w.-]*)/g;
  const relations: string[] = [];
  for (const match of content.matchAll(pattern)) {
    let end = match.index + match[0].length;
    while (end < content.length && /[ \t]/.test(content[end])) end += 1;
    if (content[end] === '{') end = blockAt(content, end).end + 1;
    else while (end < content.length && content[end] !== '\n' && content[end] !== '}') end += 1;
    const lines = content.slice(match.index, end).trim().split('\n');
    const continuationIndent = Math.min(...lines.slice(1)
      .filter(line => line.trim())
      .map(line => line.match(/^\s*/)![0].length));
    relations.push(lines.map((line, index) => index === 0 ? line : line.slice(continuationIndent)).join('\n'));
  }
  return relations;
}

export interface WriteSemanticArchitectureOptions {
  write?: (file: string, content: string) => Promise<void>;
}

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

function renderStringArray(values: string[]): string {
  return `[${values.map(quote).join(', ')}]`;
}

function renderMetadataRecord(metadata: Record<string, string | string[]>, indent: string): string[] {
  const values = { ...metadata };
  const lines = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${indent}${key} ${Array.isArray(value) ? renderStringArray(value) : quote(value)}`);
  return lines.length ? [`${indent.slice(2)}metadata {`, ...lines, `${indent.slice(2)}}`] : [];
}

function validFqn(fqn: string): boolean {
  return fqn.split('.').every(part => /^[A-Za-z_][\w-]*$/.test(part));
}

function buildFqns(elements: SemanticElement[]): Map<string, string> {
  const byId = new Map(elements.map(element => [element.id, element]));
  const fqns = new Map<string, string>();
  const resolve = (element: SemanticElement): string => {
    const cached = fqns.get(element.id);
    if (cached) return cached;
    if (validFqn(element.fqn)) {
      fqns.set(element.id, element.fqn);
      return element.fqn;
    }
    const local = element.id.split('/').pop()!.replace(/[^A-Za-z0-9_-]/g, '_').replace(/^[^A-Za-z_]/, '_$&');
    const parent = element.parent ? byId.get(element.parent) : undefined;
    const fqn = parent ? `${resolve(parent)}.${local}` : local;
    fqns.set(element.id, fqn);
    return fqn;
  };
  for (const element of elements) resolve(element);
  return fqns;
}

function renderElementTree(
  element: SemanticElement,
  children: Map<string | null, SemanticElement[]>,
  fqns: Map<string, string>,
  indent: string,
): string[] {
  const localName = fqns.get(element.id)!.split('.').pop()!;
  const nested = children.get(element.id) ?? [];
  const metadata = { ...element.metadata, elementId: element.id };
  const body = [
    ...renderMetadataRecord(metadata, `${indent}    `),
    ...nested.flatMap(child => renderElementTree(child, children, fqns, `${indent}  `)),
  ];
  const declaration = `${indent}${localName} = ${element.kind} ${quote(element.title)} ${quote(element.summary)}`;
  if (!body.length) return [declaration];
  return [`${declaration} {`, ...body, `${indent}}`];
}

function renderSpecification(model: SemanticArchitectureModel): string {
  const lines = [`opsx {`, `  languageVersion ${quote(model.languageVersion ?? '1')}`, `}`, '', 'specification {'];
  for (const [kind, constraints] of Object.entries(model.metamodel.elements).sort(([left], [right]) => left.localeCompare(right))) {
    const properties = [
      ...(constraints.root ? ['root true'] : []),
      ...(constraints.contractPolicy ? [`contract ${constraints.contractPolicy}`] : []),
      ...(constraints.parents ? [`parents [${constraints.parents.join(', ')}]`] : []),
      ...(constraints.children ? [`children [${constraints.children.join(', ')}]`] : []),
    ];
    lines.push(properties.length ? `  element ${kind} { opsx { ${properties.join(' ')} } }` : `  element ${kind}`);
  }
  for (const [kind, constraints] of Object.entries(model.metamodel.relationships).sort(([left], [right]) => left.localeCompare(right))) {
    const properties = [
      ...(constraints.sourceKinds ? [`sourceKinds [${constraints.sourceKinds.join(', ')}]`] : []),
      ...(constraints.targetKinds ? [`targetKinds [${constraints.targetKinds.join(', ')}]`] : []),
    ];
    lines.push(properties.length ? `  relationship ${kind} { opsx { ${properties.join(' ')} } }` : `  relationship ${kind}`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

function renderModel(model: SemanticArchitectureModel): { model: string; relations: string } {
  const fqns = buildFqns(model.elements);
  const children = new Map<string | null, SemanticElement[]>();
  for (const element of model.elements) {
    const siblings = children.get(element.parent) ?? [];
    siblings.push(element);
    children.set(element.parent, siblings);
  }
  for (const siblings of children.values()) siblings.sort((left, right) => left.id.localeCompare(right.id));
  const modelLines = ['model {', ...(children.get(null) ?? []).flatMap(element => renderElementTree(element, children, fqns, '  ')), '}', ''];
  const relationLines = ['model {'];
  for (const relation of [...model.relations].sort((left, right) => `${left.source}|${left.kind}|${left.target}`.localeCompare(`${right.source}|${right.kind}|${right.target}`))) {
    const description = relation.description ? ` ${quote(relation.description)}` : '';
    relationLines.push(`  ${fqns.get(relation.source) ?? relation.source} -[${relation.kind}]-> ${fqns.get(relation.target) ?? relation.target}${description}`);
  }
  relationLines.push('}', '');
  return { model: modelLines.join('\n'), relations: relationLines.join('\n') };
}

async function removeSupersededSemanticModules(architectureDir: string): Promise<void> {
  const canonicalModules = new Set(['specification.c4', 'model.c4', 'relations.c4']
    .map(file => path.resolve(architectureDir, file)));
  const visit = async (directory: string): Promise<void> => {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.c4') || canonicalModules.has(path.resolve(target))) continue;
      const source = await fs.readFile(target, 'utf8');
      if (/\b(?:model|specification)\s*\{/.test(source) || /\bopsx\s*\{/.test(source)) {
        await fs.rm(target, { force: true });
      }
    }
  };
  await visit(architectureDir);
}

export async function writeSemanticArchitectureSnapshot(
  projectRoot: string,
  model: SemanticArchitectureModel,
  options: WriteSemanticArchitectureOptions = {},
): Promise<void> {
  const architectureDir = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  const rendered = renderModel(model);
  const writes = options.write ?? atomicWrite;
  await fs.mkdir(architectureDir, { recursive: true });
  await fs.rm(path.join(architectureDir, 'deltas'), { recursive: true, force: true });
  await removeSupersededSemanticModules(architectureDir);
  await writes(path.join(architectureDir, 'specification.c4'), renderSpecification(model));
  await writes(path.join(architectureDir, 'model.c4'), rendered.model);
  await writes(path.join(architectureDir, 'relations.c4'), rendered.relations);
}

export interface MergeArchitectureDeltaOptions {
  changeName?: string;
  runLikeC4?: LikeC4Runner;
  write?: (file: string, content: string) => Promise<void>;
}

function deltaModuleName(deltaPath: string, changeName?: string): string {
  const source = changeName ?? path.basename(deltaPath, path.extname(deltaPath));
  const normalized = source.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${normalized || 'architecture-delta'}.c4`;
}

async function mergeV1ArchitectureDelta(
  architectureDir: string,
  deltaPath: string,
  delta: string,
  options: MergeArchitectureDeltaOptions,
): Promise<void> {
  const modulePath = path.join(architectureDir, 'deltas', deltaModuleName(deltaPath, options.changeName));
  const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-v1-merge-'));
  const stagingArchitecture = path.join(stagingRoot, OPSX_DIR_NAME, 'architecture');
  try {
    await copyDurableArchitecture(architectureDir, stagingArchitecture);
    const stagedModule = path.join(stagingArchitecture, 'deltas', path.basename(modulePath));
    await fs.mkdir(path.dirname(stagedModule), { recursive: true });
    await fs.writeFile(stagedModule, delta);
    await (options.runLikeC4 ?? runLikeC4)(['validate', stagingArchitecture]);

    const architecture = await readLikeC4Architecture(stagingRoot);
    const validation = await validateArchitecture(stagingRoot, architecture);
    if (!validation.success) {
      const issue = validation.errors[0];
      throw new Error(`${issue.code}: ${issue.message}`);
    }
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }

  const original = await fs.readFile(modulePath, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  await fs.mkdir(path.dirname(modulePath), { recursive: true });
  try {
    await (options.write ?? atomicWrite)(modulePath, delta);
  } catch (error) {
    if (original === null) await fs.rm(modulePath, { force: true });
    else await fs.writeFile(modulePath, original);
    throw error;
  }
}

export async function mergeArchitectureDelta(projectRoot: string, deltaPath: string, options: MergeArchitectureDeltaOptions = {}): Promise<void> {
  const sourceDelta = await fs.readFile(deltaPath, 'utf8');
  const architectureDir = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  const architecture = await readLikeC4Architecture(projectRoot);
  if (architecture.profile === 'v1') {
    await mergeV1ArchitectureDelta(architectureDir, deltaPath, sourceDelta, options);
    return;
  }

  const delta = formalizeSpecPaths(sourceDelta, options.changeName);
  const domainsDir = path.join(architectureDir, 'domains');
  const names = (await fs.readdir(domainsDir)).filter(name => name.endsWith('.c4'));
  const contents = new Map(await Promise.all(names.map(async name => [path.join(domainsDir, name), await fs.readFile(path.join(domainsDir, name), 'utf8')] as const)));
  const originals = new Map<string, string | null>(contents);
  const domainFile = new Map<string, string>();
  for (const [file, content] of contents) {
    for (const match of content.matchAll(/([A-Za-z_][\w-]*)\s*=\s*domain\b/g)) domainFile.set(match[1], file);
  }

  for (const match of delta.matchAll(/\b([A-Za-z_][\w-]*)\s*=\s*domain\b[^\{]*\{/g)) {
    const domain = match[1];
    if (domainFile.has(domain)) throw new Error(`Domain already exists: ${domain}`);
    const open = match.index + match[0].lastIndexOf('{');
    const declaration = delta.slice(match.index, blockAt(delta, open).end + 1);
    const file = path.join(domainsDir, `${domain.replaceAll('_', '-')}.c4`);
    domainFile.set(domain, file);
    contents.set(file, `model {\n  ${declaration.trim().split('\n').join('\n  ')}\n}\n`);
    originals.set(file, null);
  }

  for (const match of delta.matchAll(/\bextend\s+([A-Za-z_][\w-]*)\s*\{/g)) {
    const file = domainFile.get(match[1]);
    if (!file) throw new Error(`Cannot extend nonexistent domain: ${match[1]}`);
    const open = match.index + match[0].lastIndexOf('{');
    contents.set(file, insertIntoDomain(contents.get(file)!, match[1], blockAt(delta, open).body));
  }

  for (const match of delta.matchAll(/\bextend\s+([A-Za-z_][\w-]*\.[A-Za-z_][\w-]*)\s*\{/g)) {
    const domain = match[1].split('.')[0];
    const file = domainFile.get(domain);
    if (!file) throw new Error(`Cannot extend nonexistent domain: ${domain}`);
    const open = match.index + match[0].lastIndexOf('{');
    contents.set(file, applyElementExtension(contents.get(file)!, match[1], blockAt(delta, open).body));
  }

  const relations = extractRelations(delta);
  for (const relation of relations) {
    const sourceDomain = relation.split('.')[0];
    if (!domainFile.has(sourceDomain)) throw new Error(`Cannot find source domain: ${sourceDomain}`);
  }
  const relationsPath = path.join(architectureDir, 'relations.c4');
  const currentRelations = await fs.readFile(relationsPath, 'utf8').catch(error => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'model {\n}\n';
    throw error;
  });
  if (relations.length) {
    contents.set(relationsPath, mergeRelations(currentRelations, relations));
    originals.set(relationsPath, await fs.readFile(relationsPath, 'utf8').catch(error => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }));
  }

  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-merge-'));
  try {
    await copyDurableArchitecture(architectureDir, staging);
    for (const [file, content] of contents) {
      const staged = path.join(staging, path.relative(architectureDir, file));
      await fs.mkdir(path.dirname(staged), { recursive: true });
      await fs.writeFile(staged, content);
    }
    await (options.runLikeC4 ?? runLikeC4)(['validate', staging]);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }

  const changed = new Map([...contents].filter(([file, content]) => originals.get(file) !== content));
  try {
    for (const [file, content] of changed) await (options.write ?? atomicWrite)(file, content);
  } catch (error) {
    await Promise.all([...changed.keys()].map(file => {
      const content = originals.get(file);
      return content === null ? fs.rm(file, { force: true }) : fs.writeFile(file, content!);
    }));
    throw error;
  }
}
