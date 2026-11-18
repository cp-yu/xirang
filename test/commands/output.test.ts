import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCompleteQualityFixture } from '../helpers/quality-fixture.js';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import { runCLI } from '../helpers/run-cli.js';

vi.mock('@inquirer/prompts', async importOriginal => {
  const real = await importOriginal<typeof import('@inquirer/prompts')>();
  type Context = Parameters<typeof real.confirm>[1];
  const enter = (text: string, run: (input: PassThrough) => Promise<unknown>) => {
    const input = new PassThrough();
    const result = run(input);
    queueMicrotask(() => input.write(text));
    return result.finally(() => input.end());
  };
  return {
    ...real,
    select: (config: Parameters<typeof real.select>[0], context?: Context) => enter('\r', input => real.select(config, { ...context, input })),
    confirm: (config: Parameters<typeof real.confirm>[0], context?: Context) => enter('y\r', input => real.confirm(config, { ...context, input })),
  };
});

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
    expect(json.length ? JSON.parse(result.stdout) : result.stdout.trim()).toEqual(json.length ? { archive, alreadyArchived: true } : archive);
  }
});
it('rejects invalid final archive validation without moving the active Change', async () => {
  const active = path.join(root, '.xirang', 'changes', 'invalid');
  await fs.mkdir(active, { recursive: true });
  await fs.writeFile(path.join(active, '.delta-noop'), '');
  for (const json of [[], ['--json']]) {
    const result = await runCLI(['archive', 'invalid', '--yes', '--quick', ...json], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    const messages = json.length ? result.stderr.trim().split('\n').map(line => JSON.parse(line).message).join('\n') : result.stderr;
    expect(messages).toContain('MISSING_PROJECT_ROOT');
    expect((await fs.stat(active)).isDirectory()).toBe(true);
    await expect(fs.access(path.join(root, '.xirang', 'changes', 'archive'))).rejects.toThrow();
  }
});
it.each([false, true])('preserves successful archive warnings and problem-free silence (json=%s)', async json => {
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
    const archived = await runCLI(['archive', 'sample', '--yes', ...flags], { cwd: project });
    expect(archived.exitCode).toBe(0);
    const location = json ? JSON.parse(archived.stdout).archive : archived.stdout.trim();
    expect(location).toContain('sample');
    expect((await fs.stat(path.join(project, location))).isDirectory()).toBe(true);
    await expect(fs.access(change)).rejects.toMatchObject({ code: 'ENOENT' });
    diagnostics(archived.stderr);
    await expect(fs.readFile(path.join(project, '.xirang', 'model', 'elements', 'root.md'), 'utf8')).resolves.toContain('Updated project definition.');
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

it('rejects retired closure syntax and conflicting modes before writing', async () => {
  await writeProjectModel(root, minimalModel());
  const source = await writeChangeDelta(root, 'demo', {});
  await fs.mkdir(source, { recursive: true });
  for (const [args, message] of [
    [['sync', 'demo'], /unknown command/i],
    ...['--no-sync', '--no-validate', '--no-verify'].map(flag => [['archive', 'demo', flag], /unknown option/i] as const),
    [['archive', 'demo', '--quick', '--abandon', '--yes'], /mutually exclusive/i],
  ] as const) {
    const result = await runCLI([...args, '--json'], { cwd: root });
    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(JSON.parse(result.stderr).message).toMatch(message);
    await expect(fs.stat(source)).resolves.toBeDefined();
  }
});

it('returns the abandoned location by exact Change name and leaves implementation untouched', async () => {
  const source = await writeChangeDelta(root, 'demo', { 'elements/broken.md': 'unparseable delta' });
  const unrelated = path.join(root, '.xirang', 'changes', 'archive', '2099-01-01-other-demo');
  await fs.mkdir(unrelated, { recursive: true });
  const impl = path.join(root, 'in-progress.ts');
  await fs.writeFile(impl, 'in-progress implementation');
  const result = await runCLI(['archive', 'demo', '--abandon', '--yes', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 0, stderr: '' });
  const { archive } = JSON.parse(result.stdout);
  expect(archive).toBe(path.join('.xirang', 'changes', 'archive', 'abandoned', `${new Date().toISOString().slice(0, 10)}-demo`));
  await expect(fs.readFile(path.join(root, archive, 'elements', 'broken.md'), 'utf8')).resolves.toBe('unparseable delta');
  await expect(fs.readFile(impl, 'utf8')).resolves.toBe('in-progress implementation');
  await expect(fs.stat(source)).rejects.toMatchObject({ code: 'ENOENT' });
  const retry = await runCLI(['archive', 'demo', '--json'], { cwd: root });
  expect(JSON.parse(retry.stdout)).toEqual({ archive, alreadyArchived: true });
});


it('keeps both real prompts off stdout when interactively selecting and abandoning with --json', async () => {
  const change = await writeChangeDelta(root, 'demo', { '.quality.json': 'unreadable quality' });
  const result = await runCLI(['archive', '--abandon', '--json'], { cwd: root });
  expect(result.exitCode).toBe(0);
  const { archive } = JSON.parse(result.stdout);
  expect(result.stderr).toContain('Select a change to archive');
  expect(result.stderr).toContain("Abandon 'demo'");
  await expect(fs.access(change)).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.readFile(path.join(root, archive, '.quality.json'), 'utf8')).resolves.toBe('unreadable quality');
});

it.each([false, true])('reports the initiating failure and failed compensation (json=%s)', async json => {
  const source = await writeChangeDelta(root, 'move-failure', { 'proposal.md': 'Preserve me' });
  const rename = fs.rename;
  const rm = fs.rm;
  const mocks = [
    vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (from === source) throw Object.assign(new Error('fallback required'), { code: 'EXDEV' });
      if (path.basename(String(from)).startsWith('.') && String(to).startsWith(path.join(root, '.xirang', 'changes', 'archive'))) {
        throw new Error('install injected failure');
      }
      return rename(from, to);
    }),
    vi.spyOn(fs, 'rm').mockImplementation(async (target, options) => {
      if (path.basename(String(target)).startsWith('.') && String(target).startsWith(path.join(root, '.xirang', 'changes', 'archive'))) {
        throw new Error('cleanup injected failure');
      }
      return rm(target, options);
    }),
  ];
  try {
    const result = await runCLI(['archive', 'move-failure', '--abandon', '--yes', ...(json ? ['--json'] : [])], { cwd: root });
    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    const message = json ? JSON.parse(result.stderr).message : result.stderr;
    expect(message).toContain('install injected failure');
    expect(message).toContain('cleanup injected failure');
    await expect(fs.readFile(path.join(source, 'proposal.md'), 'utf8')).resolves.toBe('Preserve me');
  } finally { for (const mock of mocks) mock.mockRestore(); }
});


it('reports an archive error and incomplete model rollback in structured diagnostics', async () => {
  await writeProjectModel(root, minimalModel());
  const source = await writeChangeDelta(root, 'rollback-failure', {
    'elements/root.md': '---\noperation: MODIFIED\n' + elementUnit({ identity: 'root', kind: 'project', parent: null, definition: 'New root.' }).slice(4),
  });
  const target = path.join(root, '.xirang', 'model', 'elements', 'root.md');
  const rename = fs.rename;
  const write = fs.writeFile;
  const mocks = [
    vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (from === source) throw new Error('archive move injected failure');
      return rename(from, to);
    }),
    vi.spyOn(fs, 'writeFile').mockImplementation(async (file, bytes, options) => {
      if (file === target) throw new Error('model restore injected failure');
      return write(file, bytes, options);
    }),
  ];
  try {
    const result = await runCLI(['archive', 'rollback-failure', '--quick', '--yes', '--json'], { cwd: root });
    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    const records = result.stderr.trim().split('\n').map(line => JSON.parse(line));
    expect(records.find(record => record.code === 'COMMAND_ERROR')?.message).toMatch(/archive move injected failure[\s\S]*model restore injected failure/);
    await expect(fs.access(source)).resolves.toBeUndefined();
  } finally { for (const mock of mocks) mock.mockRestore(); }
});
