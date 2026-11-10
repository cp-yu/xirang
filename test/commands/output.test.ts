import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createCompleteQualityFixture } from '../helpers/quality-fixture.js';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
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
it('keeps problem-free noninteractive bulk validation silent without a negated flag', async () => {
  expect(await runCLI(['validate', '--changes'], { cwd: root, env: { XIRANG_INTERACTIVE: '0' } })).toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
});
it('returns the existing archive location on retries in either mode', async () => {
  const archive = path.join('.xirang', 'changes', 'archive', '2026-01-01-demo');
  await fs.mkdir(path.join(root, archive), { recursive: true });
  for (const json of [[], ['--json']]) {
    const result = await runCLI(['archive', 'demo', ...json], { cwd: root });
    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(json.length ? JSON.parse(result.stdout) : result.stdout.trim()).toEqual(json.length ? { archive } : archive);
  }
});
it('rejects invalid final archive validation without moving the active Change', async () => {
  const active = path.join(root, '.xirang', 'changes', 'invalid');
  await fs.mkdir(active, { recursive: true });
  await fs.writeFile(path.join(active, '.delta-noop'), '');
  for (const json of [[], ['--json']]) {
    const result = await runCLI(['archive', 'invalid', '--yes', '--no-verify', '--no-sync', ...json], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    const messages = json.length ? result.stderr.trim().split('\n').map(line => JSON.parse(line).message).join('\n') : result.stderr;
    expect(messages).toContain('MISSING_PROJECT_ROOT');
    expect((await fs.stat(active)).isDirectory()).toBe(true);
    await expect(fs.access(path.join(root, '.xirang', 'changes', 'archive'))).rejects.toThrow();
  }
});
it.each([false, true])('preserves successful Sync/Archive warnings and problem-free silence (json=%s)', async json => {
  for (const warning of [false, true]) {
    const project = path.join(root, warning ? 'warning' : 'clean');
    await writeProjectModel(project, minimalModel());
    if (warning) await fs.rename(path.join(project, '.xirang/model/metamodel/project.md'), path.join(project, '.xirang/model/views/project.md'));
    const change = await writeChangeDelta(project, 'sample', {
      'proposal.md': '## Why\n\nPreserve the requested change and its real validation warnings.\n\n## What Changes\n\n- Revise root definition.\n',
      'elements/root.md': '---\noperation: MODIFIED\n' + elementUnit({ identity: 'root', kind: 'project', parent: null, definition: 'Updated project definition.' }).slice(4),
    });
    await createCompleteQualityFixture(project, change);
    const flags = json ? ['--json'] : [];
    const diagnostics = (stderr: string) => {
      if (!warning) expect(stderr).toBe('');
      else if (json) expect(stderr.trim().split('\n').map(line => JSON.parse(line))).toContainEqual({ code: 'ENTITY_PARTITION_MISMATCH', message: expect.stringContaining('views/project.md') });
      else {
        expect(stderr).toContain('ENTITY_PARTITION_MISMATCH');
        expect(stderr).toContain('views/project.md');
      }
    };
    for (let repeat = 0; repeat < 2; repeat++) {
      const synced = await runCLI(['sync', 'sample', ...flags], { cwd: project });
      expect(synced).toMatchObject({ exitCode: 0, stdout: '' });
      diagnostics(synced.stderr);
      expect(await fs.readFile(path.join(project, '.xirang/model/elements/root.md'), 'utf8')).toContain('Updated project definition.');
    }
    const archived = await runCLI(['archive', 'sample', '--yes', ...flags], { cwd: project });
    expect(archived.exitCode).toBe(0);
    const location = json ? JSON.parse(archived.stdout).archive : archived.stdout.trim();
    expect(location).toContain('sample');
    expect((await fs.stat(path.join(project, location))).isDirectory()).toBe(true);
    await expect(fs.access(change)).rejects.toMatchObject({ code: 'ENOENT' });
    diagnostics(archived.stderr);
  }
});
it('encodes format-json model and argument failures as diagnostics', async () => {
  for (const args of [['arch', 'outline', '--format', 'json'], ['arch', 'snapshot', '--format=json'], ['arch', 'outline', '--format', 'json', '--definition-depth', 'bad'], ['arch', 'snapshot', '--format', 'json', '--unknown']]) {
    const result = await runCLI(args, { cwd: root });
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).message).toBeTruthy();
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
