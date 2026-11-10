import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

let root: string;
beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-output-')); });
afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });
it('creates changes and validates built-in schemas without success receipts in either mode', async () => {
  for (const json of [[], ['--json']]) {
    const name = json.length ? 'json-change' : 'text-change';
    expect(await runCLI(['new', 'change', name, ...json], { cwd: root })).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
    expect((await fs.stat(path.join(root, '.xirang/changes', name))).isDirectory()).toBe(true);
    expect(await runCLI(['schema', 'validate', 'semantic-model', ...json], { cwd: root })).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
  }
});
it('reports operation and argument failures as JSON diagnostics without result data', async () => {
  for (const args of [['new', 'change', 'BAD NAME'], ['schema', 'validate', 'missing'], ['new', 'change']]) {
    const result = await runCLI([...args, '--json'], { cwd: root });
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).message).toBeTruthy();
  }
});
