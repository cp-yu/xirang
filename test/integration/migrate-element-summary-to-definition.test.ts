import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const script = path.resolve('tmp_script', 'migrate-element-summary-to-definition.mjs');

function declaration(summary = '原样保留: value # text'): string {
  return `---\nentity: element-declaration\nidentity: sample\nkind: capability\nparent: null\ntitle: Sample\nsummary: ${JSON.stringify(summary)}\n---\n\n## Requirements\n\n正文保持不变。\n`;
}

async function write(root: string, relative: string, content: string): Promise<string> {
  const file = path.join(root, ...relative.split('/'));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  return file;
}

async function run(root: string, ...args: string[]) {
  return execFileAsync(process.execPath, [script, ...args], { cwd: root });
}

async function fails(root: string, ...args: string[]) {
  try {
    await run(root, ...args);
    throw new Error('expected migration to fail');
  } catch (error) {
    return error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
  }
}

describe('Element Declaration summary migration', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-definition-migration-'));
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('uses cwd and migrates only the active Xirang work surfaces', async () => {
    const model = await write(root, '.xirang/model/elements/model.md', declaration('model value'));
    const candidate = await write(root, '.xirang/candidate/elements/candidate.md', declaration('candidate value'));
    const active = await write(root, '.xirang/changes/active/elements/active.md', declaration('active value'));
    const archive = await write(root, '.xirang/changes/archive/old/elements/archive.md', declaration('archive value'));
    const history = await write(root, '.xirang/history/old/elements/history.md', declaration('history value'));
    const unrelated = await write(root, '.xirang/model/elements/note.md', '---\nentity: authored-view\nidentity: note\ninclude: "*"\nsummary: untouched\n---\n');
    const beforeArchive = await fs.readFile(archive, 'utf8');
    const beforeHistory = await fs.readFile(history, 'utf8');

    await run(root);

    for (const file of [model, candidate, active]) {
      const content = await fs.readFile(file, 'utf8');
      expect(content).toContain('definition:');
      expect(content).not.toContain('\nsummary:');
    }
    expect(await fs.readFile(archive, 'utf8')).toBe(beforeArchive);
    expect(await fs.readFile(history, 'utf8')).toBe(beforeHistory);
    expect(await fs.readFile(unrelated, 'utf8')).toContain('summary: untouched');
  });

  it('preserves the YAML value and body bytes while changing only the key', async () => {
    const before = declaration('含有: 冒号、# 和 emoji 😀');
    const file = await write(root, '.xirang/model/elements/sample.md', before);

    await run(root);

    expect(await fs.readFile(file, 'utf8')).toBe(before.replace('\nsummary:', '\ndefinition:'));
  });

  it('--check reports pending work without writing and passes after an idempotent migration', async () => {
    const file = await write(root, '.xirang/model/elements/sample.md', declaration());
    const before = await fs.readFile(file, 'utf8');

    const pending = await fails(root, '--check');
    expect(pending.code).not.toBe(0);
    expect(pending.stdout).toContain('pending: 1');
    expect(await fs.readFile(file, 'utf8')).toBe(before);

    await run(root);
    await expect(run(root, '--check')).resolves.toMatchObject({ stdout: expect.stringContaining('pending: 0') });
    const migrated = await fs.readFile(file, 'utf8');
    await run(root);
    expect(await fs.readFile(file, 'utf8')).toBe(migrated);
  });

  it('preflights every file and writes nothing when fields conflict or are missing', async () => {
    const migratable = await write(root, '.xirang/model/elements/a.md', declaration('must remain summary'));
    await write(root, '.xirang/model/elements/b.md', declaration().replace('\nsummary:', '\ndefinition:')
      .replace('\n---\n\n## Requirements', '\nsummary: duplicate\n---\n\n## Requirements'));
    await write(root, '.xirang/model/elements/c.md', declaration().replace('\nsummary: "原样保留: value # text"', ''));
    const before = await fs.readFile(migratable, 'utf8');

    const conflict = await fails(root);

    expect(conflict.code).not.toBe(0);
    expect(conflict.stderr).toContain('conflicts: 2');
    expect(await fs.readFile(migratable, 'utf8')).toBe(before);
  });
});
