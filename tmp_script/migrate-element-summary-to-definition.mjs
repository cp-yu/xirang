#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isMap, parseDocument } from 'yaml';

const CHECK = '--check';
const args = process.argv.slice(2);
if (args.some(arg => arg !== CHECK) || args.filter(arg => arg === CHECK).length > 1) {
  console.error('Usage: node migrate-element-summary-to-definition.mjs [--check]');
  process.exitCode = 2;
} else {
  await main(args.includes(CHECK));
}

async function main(check) {
  const root = process.cwd();
  const files = await declarationCandidates(root);
  const pending = [];
  const migrated = [];
  const current = [];
  const conflicts = [];

  for (const file of files) {
    const result = await inspect(file, root);
    if (result.kind === 'pending') pending.push(result);
    else if (result.kind === 'current') current.push(result);
    else if (result.kind === 'conflict') conflicts.push(result);
  }

  const summary = `pending: ${pending.length}, current: ${current.length}, conflicts: ${conflicts.length}`;
  console.log(summary);

  if (conflicts.length > 0) {
    console.error(`conflicts: ${conflicts.length}`);
    for (const conflict of conflicts) console.error(`${conflict.relative}: ${conflict.message}`);
    process.exitCode = 1;
    return;
  }

  if (check) {
    if (pending.length > 0) process.exitCode = 1;
    return;
  }

  for (const item of pending) {
    const next = `${item.content.slice(0, item.keyStart)}definition${item.content.slice(item.keyEnd)}`;
    const temporary = path.join(path.dirname(item.file), `.${path.basename(item.file)}.${process.pid}.tmp`);
    try {
      await fs.writeFile(temporary, next);
      await fs.rename(temporary, item.file);
      migrated.push(item);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  console.log(`migrated: ${migrated.length}`);
}

async function declarationCandidates(root) {
  const xirang = path.join(root, '.xirang');
  const roots = [path.join(xirang, 'model')];
  const candidate = path.join(xirang, 'candidate');
  if (await isDirectory(candidate)) roots.push(candidate);

  const changes = path.join(xirang, 'changes');
  if (await isDirectory(changes)) {
    for (const entry of await fs.readdir(changes, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'archive') roots.push(path.join(changes, entry.name));
    }
  }

  const files = [];
  for (const directory of roots) {
    if (await isDirectory(directory)) await collectMarkdown(directory, files);
  }
  return files.sort((left, right) => left.localeCompare(right));
}

async function collectMarkdown(directory, files) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectMarkdown(target, files);
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') files.push(target);
  }
}

async function isDirectory(target) {
  try {
    return (await fs.stat(target)).isDirectory();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function inspect(file, root) {
  const content = await fs.readFile(file, 'utf8');
  const relative = path.relative(root, file);
  const frontmatter = extractFrontmatter(content);
  if (frontmatter === null) return { kind: 'ignored' };

  const document = parseDocument(frontmatter.yaml, { keepSourceTokens: true });
  if (document.errors.length > 0 || !isMap(document.contents)) {
    return { kind: 'conflict', file, relative, message: 'invalid YAML frontmatter' };
  }
  if (document.get('entity') !== 'element-declaration') return { kind: 'ignored' };

  const summary = document.contents.items.find(pair => pair.key?.value === 'summary');
  const definition = document.contents.items.find(pair => pair.key?.value === 'definition');
  if (summary && definition) {
    return { kind: 'conflict', file, relative, message: 'both summary and definition are present' };
  }
  if (!summary && !definition) {
    return { kind: 'conflict', file, relative, message: 'neither summary nor definition is present' };
  }
  if (definition) return { kind: 'current', file, relative };

  const range = summary.key?.range;
  if (!range || frontmatter.yaml.slice(range[0], range[1]) !== 'summary') {
    return { kind: 'conflict', file, relative, message: 'summary key is not a plain YAML key' };
  }
  return {
    kind: 'pending',
    file,
    relative,
    content,
    keyStart: frontmatter.offset + range[0],
    keyEnd: frontmatter.offset + range[1],
  };
}

function extractFrontmatter(content) {
  const opening = content.match(/^(?:\uFEFF)?---(?:\r?\n)/);
  if (!opening) return null;
  const offset = opening[0].length;
  const rest = content.slice(offset);
  const closing = rest.match(/(?:^|\r?\n)---(?=\r?\n|$)/m);
  if (!closing || closing.index === undefined) return null;
  const yamlEnd = closing.index + (closing[0].startsWith('\n') || closing[0].startsWith('\r') ? closing[0].match(/^\r?\n/)?.[0].length ?? 0 : 0);
  return { yaml: rest.slice(0, yamlEnd), offset };
}
