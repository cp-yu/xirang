import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

describe('Record results and diagnostics', () => {
  let root: string;
  beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-output-')); });
  afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });
  async function input(name: string, data: unknown) {
    const file = path.join(root, name);
    await fs.writeFile(file, JSON.stringify(data));
    return file;
  }
  async function create() {
    const payload = await input('payload.json', { schemaVersion: 4, context: 'build', entries: ['A', 'B', 'C'].map(identity => ({ identity, nature: 'normative', decision: 'accepted', content: `${identity} 第一行\n第二行` })) });
    const result = await runCLI(['record', 'create', 'design.md', '--from', payload, '--json'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  }
  it('reads selected complete entries and reports unknown entries on stderr', async () => {
    await create();
    const result = await runCLI(['record', 'show', 'design.md', '--entry', 'A', '--entry', 'C', '--json'], { cwd: root });
    expect(JSON.parse(result.stdout)).toEqual({ filename: 'design.md', entries: ['A', 'C'].map(identity => ({ identity, nature: 'normative', decision: 'accepted', content: `${identity} 第一行\n第二行` })) });
    const failed = await runCLI(['record', 'show', 'design.md', '--entry', 'missing', '--json'], { cwd: root });
    expect(failed.exitCode).toBe(1);
    expect(failed.stdout).toBe('');
    expect(JSON.parse(failed.stderr).code).toBe('RECORD_ENTRY_NOT_FOUND');
  });
  it('updates silently, requests differences and renames by filename without versions', async () => {
    await create();
    const patch = await input('patch.json', { entries: { upsert: [{ identity: 'B', nature: 'normative', decision: 'accepted', content: 'Changed' }] } });
    const result = await runCLI(['record', 'update', 'design.md', '--from', patch, '--json'], { cwd: root });
    expect(result).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
    const shown = await runCLI(['record', 'show', 'design.md', '--json'], { cwd: root });
    expect(JSON.parse(shown.stdout).entries.map((e: {content: string}) => e.content)).toEqual(['A 第一行\n第二行', 'Changed', 'C 第一行\n第二行']);
    expect(shown.stdout).not.toMatch(/sourceVersion|explorationId|baseline/);
    const diff = await runCLI(['record', 'update', 'design.md', '--from', patch, '--diff', '--json'], { cwd: root });
    expect(JSON.parse(diff.stdout).diff.entries.modified).toEqual([]);
    expect(await runCLI(['record', 'validate', 'design.md', '--json'], { cwd: root })).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
    expect(await runCLI(['record', 'rename', 'design.md', 'renamed.md', '--json'], { cwd: root })).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
    const listed = await runCLI(['record', 'list', '--json'], { cwd: root });
    expect(JSON.parse(listed.stdout)).toEqual({ records: [{ filename: 'renamed.md', context: 'build' }] });
  });
  it('returns a real empty list and rejects unsafe filenames without writes', async () => {
    const listed = await runCLI(['record', 'list', '--json'], { cwd: root });
    expect(JSON.parse(listed.stdout)).toEqual({ records: [] });
    const result = await runCLI(['record', 'show', '../outside.md', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).message).toContain('filename');
  });
});
