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

function formalizeSpecPaths(content: string, changeName?: string): string {
  return changeName ? content.replaceAll(`openspec/changes/${changeName}/specs/`, 'openspec/specs/') : content;
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
  const architectureDir = path.join(projectRoot, 'openspec', 'architecture');
  const domainsDir = path.join(architectureDir, 'domains');
  const names = (await fs.readdir(domainsDir)).filter(name => name.endsWith('.c4'));
  const contents = new Map(await Promise.all(names.map(async name => [path.join(domainsDir, name), await fs.readFile(path.join(domainsDir, name), 'utf8')] as const)));
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
  }

  for (const match of delta.matchAll(/\bextend\s+([A-Za-z_][\w-]*)\s*\{/g)) {
    const file = domainFile.get(match[1]);
    if (!file) throw new Error(`Cannot extend nonexistent domain: ${match[1]}`);
    const open = match.index + match[0].lastIndexOf('{');
    contents.set(file, insertIntoDomain(contents.get(file)!, match[1], blockAt(delta, open).body));
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
  if (relations.length) contents.set(relationsPath, mergeRelations(currentRelations, relations));

  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-likec4-merge-'));
  try {
    await fs.cp(architectureDir, staging, { recursive: true });
    for (const [file, content] of contents) {
      const staged = path.join(staging, path.relative(architectureDir, file));
      await fs.mkdir(path.dirname(staged), { recursive: true });
      await fs.writeFile(staged, content);
    }
    await (options.runLikeC4 ?? runLikeC4)(['validate', staging]);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }

  const originals = new Map<string, string | null>();
  for (const file of contents.keys()) originals.set(file, await fs.readFile(file, 'utf8').catch(error => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }));
  try {
    for (const [file, content] of contents) await (options.write ?? atomicWrite)(file, content);
  } catch (error) {
    await Promise.all([...originals].map(([file, content]) => content === null ? fs.rm(file, { force: true }) : fs.writeFile(file, content)));
    throw error;
  }
}
