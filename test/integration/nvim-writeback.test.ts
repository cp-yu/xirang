import { execFileSync, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import { cliProjectRoot } from '../helpers/run-cli.js';

const nvim = spawnSync('nvim', ['--version']).status === 0;
const require = createRequire(import.meta.url);

describe('Delta writeback CLI and Neovim round trip', () => {
  let root: string;
  let original: string;
  const cli = path.join(cliProjectRoot, 'bin', 'xirang.js');
  beforeAll(() => {
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc')], { cwd: cliProjectRoot, stdio: 'pipe' });
  });
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-save-'));
    await writeProjectModel(root, minimalModel({ elements: [{ identity: 'item', sections:
      '## Specification\n\n### Section: Existing\n\nItem SHALL keep old text.' }] }));
    original = elementUnit({ identity: 'item', sections: '## MODIFIED Sections\n\n### Section: Existing\n\nItem SHALL have planned text.' });
    const directory = await writeChangeDelta(root, 'demo', { 'elements/item.md': original });
    await fs.writeFile(path.join(directory, 'proposal.md'), '# Change: Demo\n');
  });
  afterEach(async () => { await fs.rm(root, { force: true, recursive: true }); });

  function run(args: string[], input?: string) {
    return spawnSync(process.execPath, [cli, ...args], { cwd: root, input, encoding: 'utf8', timeout: 15000 });
  }

  it('accepts stdin and emits silent success and structured stderr diagnostics through the installed entry point', async () => {
    const review = run(['show', 'demo', '--review', '--json']);
    expect(review.status, review.stderr).toBe(0);
    const target = JSON.parse(review.stdout).sources[0].after.replace('planned text', 'saved text');
    const saved = run(['delta', 'writeback', 'demo', '--source', path.join('elements', 'item.md'), '--json'], target);
    expect(saved.status, saved.stderr).toBe(0);
    expect(saved.stdout).toBe('');
    expect(saved.stderr).toBe('');
    const invalid = run(['delta', 'writeback', 'demo', '--source', path.join('elements', 'item.md'), '--json'], 'invalid');
    expect(invalid.status).toBe(1);
    expect(invalid.stdout).toBe('');
    expect(JSON.parse(invalid.stderr)).toMatchObject({ code: 'INVALID_INPUT' });
    expect(await fs.readFile(path.join(root, '.xirang', 'changes', 'demo', 'elements', 'item.md'), 'utf8')).toContain('saved text');
  });

  it.skipIf(!nvim)('saves from :write through the real CLI, refreshes ignored fields and preserves rejected drafts', () => {
    const result = spawnSync('nvim', ['--headless', '-u', 'NONE', '-i', 'NONE', '-n', '-l',
      path.join(cliProjectRoot, 'integrations', 'nvim', 'tests', 'writeback.lua')], {
      cwd: cliProjectRoot, encoding: 'utf8', timeout: 30000,
      env: { ...process.env, XIRANG_TEST_PROJECT: root, XIRANG_TEST_REPO: cliProjectRoot, XIRANG_TEST_NODE: process.execPath },
    });
    expect(result.status, `${result.stderr}\n${result.error ?? ''}`).toBe(0);
  });
});
