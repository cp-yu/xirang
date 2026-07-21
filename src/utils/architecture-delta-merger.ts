import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runLikeC4, type LikeC4Runner } from '../commands/arch/runner.js';
import { atomicWrite } from './likec4-writer.js';

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

export interface MergeArchitectureDeltaOptions {
  changeName?: string;
  runLikeC4?: LikeC4Runner;
  write?: (file: string, content: string) => Promise<void>;
}

export async function mergeArchitectureDelta(projectRoot: string, deltaPath: string, options: MergeArchitectureDeltaOptions = {}): Promise<void> {
  const delta = formalizeSpecPaths(await fs.readFile(deltaPath, 'utf8'), options.changeName);
  const architectureDir = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
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

  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-likec4-merge-'));
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
