import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { pendingArchivePath } from '../../src/core/archive-paths.js';
import { readModelTree } from '../../src/core/model/parser.js';
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
beforeEach(async () => { root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-output-'))); });
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
    expect(result).toMatchObject({ exitCode: 0, stderr: json.length ? '' : expect.stringContaining('Already archived') });
    expect(json.length ? JSON.parse(result.stdout) : result.stdout.trim()).toEqual(json.length ? { archive, alreadyArchived: true } : archive);
  }
});
it('archives the no-op marker unchanged rather than treating it as a model unit', async () => {
  await writeProjectModel(root, minimalModel());
  await writeChangeDelta(root, 'no-delta', { '.delta-noop': '' });
  const result = await runCLI(['archive', 'no-delta', '--quick', '--yes', '--json'], { cwd: root });
  expect(result.exitCode).toBe(0);
  const { archive } = JSON.parse(result.stdout);
  await expect(fs.readFile(path.join(root, archive, '.delta-noop'), 'utf8')).resolves.toBe('');
  await expect(fs.access(path.join(root, '.xirang', 'model', '.delta-noop'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it.each([
  ['elements/root.md', 'elements/duplicate.md'],
  ['metamodel/project.md', 'metamodel/duplicate.md'],
  ['metamodel/links.md', 'metamodel/duplicate.md'],
  ['relationships/links.yaml', 'relationships/duplicate.yaml'],
  ['views/overview.md', 'views/duplicate.md'],
])('rejects a duplicate Formal identity at %s even for a no-Delta delivery', async (original, duplicate) => {
  await writeProjectModel(root, minimalModel({
    relationshipKinds: [{ identity: 'links' }],
    relationships: [{ source: 'root', kind: 'links', target: 'root' }],
    views: [{ identity: 'overview' }],
  }));
  const model = path.join(root, '.xirang', 'model');
  await fs.copyFile(path.join(model, original), path.join(model, duplicate));
  const before = await readModelTree(model);
  const source = await writeChangeDelta(root, 'no-delta', { '.delta-noop': '' });

  const result = await runCLI(['archive', 'no-delta', '--quick', '--yes', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 1, stdout: '', stderr: expect.stringContaining('DUPLICATE_FORMAL_IDENTITY') });
  expect(result.stderr).toContain(original);
  expect(result.stderr).toContain(duplicate);
  await expect(readModelTree(model)).resolves.toEqual(before);
  await expect(fs.readFile(path.join(source, '.delta-noop'), 'utf8')).resolves.toBe('');
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it.skipIf(process.platform === 'win32')('rejects a Delta snapshot that cannot represent two distinct POSIX unit paths', async () => {
  await writeProjectModel(root, minimalModel());
  const model = path.join(root, '.xirang', 'model');
  const before = await readModelTree(model);
  const add = (identity: string) => '---\noperation: ADDED\n' + elementUnit({ identity }).slice(4);
  const source = await writeChangeDelta(root, 'bad-path', { 'elements/unit-�.md': add('utf8-unit') });
  const opaque = Buffer.concat([Buffer.from(`${source}/elements/unit-`), Buffer.from([0x80]), Buffer.from('.md')]);
  await fs.writeFile(opaque, add('raw-unit'));

  const result = await runCLI(['archive', 'bad-path', '--quick', '--yes', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 1, stdout: '', stderr: expect.stringContaining('NON_UTF8_UNIT_PATH') });
  await expect(readModelTree(model)).resolves.toEqual(before);
  await expect(fs.readFile(opaque, 'utf8')).resolves.toBe(add('raw-unit'));
  await expect(fs.readFile(path.join(source, 'elements', 'unit-�.md'), 'utf8')).resolves.toBe(add('utf8-unit'));
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });

  await fs.rename(opaque, path.join(source, 'elements', 'unit-raw.md'));
  expect(await runCLI(['archive', 'bad-path', '--quick', '--yes', '--json'], { cwd: root })).toMatchObject({ exitCode: 0 });
  await expect(fs.readFile(path.join(model, 'elements', 'raw-unit.md'), 'utf8')).resolves.toContain('identity: raw-unit');
  await expect(fs.readFile(path.join(model, 'elements', 'utf8-unit.md'), 'utf8')).resolves.toContain('identity: utf8-unit');
});

it('previews and delivers extensionless hidden Delta units without applying CLI staging files', async () => {
  await writeProjectModel(root, minimalModel({ relationshipKinds: [{ identity: 'links' }] }));
  const add = (identity: string) => '---\noperation: ADDED\n' + elementUnit({ identity }).slice(4);
  const source = await writeChangeDelta(root, 'hidden-units', {
    'proposal.md': '# Hidden Delta units\n',
    'elements/.author-unit': add('hidden-unit'),
    'elements/.drafts/another-unit': add('nested-unit'),
    'relationships/.edges': '{"relationships":[{"operation":"ADDED","source":"hidden-unit","kind":"links","target":"nested-unit"}]}\n',
    'elements/.author-unit.12345678-1234-4321-8765-0123456789ab.tmp': add('staged-unit'),
    'elements/.gitkeep': '',
  });

  const preview = await runCLI(['validate', '--change', 'hidden-units', '--preview', '--json'], { cwd: root });
  expect(preview.exitCode, preview.stderr).toBe(0);
  expect(JSON.parse(preview.stdout).summary).toMatchObject({ ADDED: 3, total: 3 });
  const result = await runCLI(['archive', 'hidden-units', '--yes', '--quick', '--json'], { cwd: root });
  expect(result.exitCode).toBe(0);
  const model = path.join(root, '.xirang', 'model');
  await expect(fs.readFile(path.join(model, 'elements', 'hidden-unit.md'), 'utf8')).resolves.toContain('identity: hidden-unit');
  await expect(fs.readFile(path.join(model, 'elements', 'nested-unit.md'), 'utf8')).resolves.toContain('identity: nested-unit');
  await expect(fs.readFile(path.join(model, 'relationships', 'links.yaml'), 'utf8')).resolves.toContain('target: nested-unit');
  await expect(fs.access(path.join(model, 'elements', 'staged-unit.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
});

it.each(['relationships: [\n', '{"relationships": [\n', 'relationships\n  - operation: ADDED\n'])('rejects a malformed extensionless hidden Relationship unit (%j)', async delta => {
  await writeProjectModel(root, minimalModel());
  const model = path.join(root, '.xirang', 'model');
  const before = await readModelTree(model);
  const source = await writeChangeDelta(root, 'broken-hidden-relation', {
    'proposal.md': '# Hidden relationship\n',
    'relationships/.edges': delta,
  });
  for (const commands of [['validate', '--change', 'broken-hidden-relation', '--preview'], ['archive', 'broken-hidden-relation', '--yes', '--quick']]) {
    const result = await runCLI([...commands, '--json'], { cwd: root });
    expect(result.exitCode, result.stderr).toBe(1);
    expect(result.stderr).toContain('relationships/.edges');
    expect(result.stderr).toContain('MALFORMED_UNIT');
  }
  await expect(readModelTree(model)).resolves.toEqual(before);
  await expect(fs.readFile(path.join(source, 'relationships/.edges'), 'utf8')).resolves.toBe(delta);
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it('compiles a split Element and its Sections with the same order after renaming all source files', async () => {
  const host = elementUnit({ identity: 'split-host' });
  const sections = (headings: string[]) => host + '## ADDED Sections\n\n' + headings.map(heading =>
    `### Section: ${heading}\nThe system SHALL provide this behavior.\n`).join('\n');
  let expected: string | undefined;
  for (const [declaration, one, two] of [['01', '02', '03'], ['30', '20', '10']]) {
    const project = path.join(root, declaration);
    await writeProjectModel(project, minimalModel());
    await writeChangeDelta(project, 'split-element', {
      'proposal.md': '# Split Element\n',
      [`elements/${declaration}.md`]: '---\noperation: ADDED\n' + host.slice(4),
      [`elements/${one}.md`]: sections(['B first', 'A second']),
      [`elements/${two}.md`]: sections(['C third']),
    });
    const preview = await runCLI(['validate', '--change', 'split-element', '--preview', '--json'], { cwd: project });
    expect(preview.exitCode, preview.stderr).toBe(0);
    expect(JSON.parse(preview.stdout).summary).toMatchObject({ ADDED: 4, total: 4 });
    const archived = await runCLI(['archive', 'split-element', '--yes', '--quick', '--json'], { cwd: project });
    expect(archived.exitCode, archived.stderr).toBe(0);
    const installed = await fs.readFile(path.join(project, '.xirang/model/elements/split-host.md'), 'utf8');
    expect([...installed.matchAll(/^### Section: (.*)$/gm)].map(match => match[1])).toEqual(['B first', 'A second', 'C third']);
    if (expected === undefined) expected = installed;
    else expect(installed).toBe(expected);
  }
});

it.each([
  ['ADDED', '01', '02'], ['ADDED', '02', '01'], ['MODIFIED', '01', '02'], ['MODIFIED', '02', '01'],
])('rejects a %s Section whose host is removed, regardless of filenames (%s, %s)', async (operation, declaration, section) => {
  const oldSection = '### Section: Still needed\nThe system SHALL provide previous behavior.';
  await writeProjectModel(root, minimalModel({ elements: [{ identity: 'removed-host', sections: '## Specification\n\n' + oldSection }] }));
  const model = path.join(root, '.xirang', 'model');
  const before = await readModelTree(model);
  const sectionFile = `elements/${section}.md`;
  const delta = elementUnit({ identity: 'removed-host' }) + `## ${operation} Sections\n\n`
    + `### Section: ${operation === 'ADDED' ? 'New' : 'Still needed'}\nThe system SHALL provide new behavior.\n`;
  const source = await writeChangeDelta(root, 'remove-host', {
    'proposal.md': '# Remove a host\n',
    [`elements/${declaration}.md`]: '---\nentity: element-declaration\noperation: REMOVED\nidentity: removed-host\n---\n',
    [sectionFile]: delta,
  });
  for (const commands of [['validate', '--change', 'remove-host', '--preview'], ['archive', 'remove-host', '--yes', '--quick']]) {
    const result = await runCLI([...commands, '--json'], { cwd: root });
    expect(result.exitCode, result.stderr).toBe(1);
    expect(result.stderr).toContain('SECTION_HOST_REMOVED');
    expect(result.stderr).toContain(sectionFile);
  }
  await expect(readModelTree(model)).resolves.toEqual(before);
  await expect(fs.readFile(path.join(source, sectionFile), 'utf8')).resolves.toBe(delta);
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it('requires .delta-noop for a preview that contains only writeback staging and placeholders', async () => {
  await writeProjectModel(root, minimalModel());
  const source = await writeChangeDelta(root, 'staging-only', {
    'proposal.md': '# Staging-only change\n',
    'elements/.draft.12345678-1234-4321-8765-0123456789ab.tmp': '---\noperation: ADDED\n' + elementUnit({ identity: 'staged' }).slice(4),
    'views/.gitkeep': '',
  });
  const preview = () => runCLI(['validate', '--change', 'staging-only', '--preview', '--json'], { cwd: root });
  const rejected = await preview();
  expect(rejected.exitCode).toBe(1);
  expect(rejected.stderr).toContain('at least one delta');
  expect(JSON.parse(rejected.stdout).summary.total).toBe(0);

  await fs.writeFile(path.join(source, '.delta-noop'), '');
  const marked = await preview();
  expect(marked).toMatchObject({ exitCode: 0, stderr: '' });
  expect(JSON.parse(marked.stdout).summary.total).toBe(0);
});

it('rejects a new owner of the exact path of a removed Formal unit', async () => {
  await writeProjectModel(root, minimalModel({ elements: [{ identity: 'old-id', fileName: 'new-id' }] }));
  const model = path.join(root, '.xirang', 'model');
  const before = await readModelTree(model);
  const source = await writeChangeDelta(root, 'path-reuse', {
    'elements/add.md': '---\noperation: ADDED\n' + elementUnit({ identity: 'new-id' }).slice(4),
    'elements/remove.md': '---\nentity: element-declaration\noperation: REMOVED\nidentity: old-id\n---\n',
  });
  const result = await runCLI(['archive', 'path-reuse', '--yes', '--quick', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 1, stdout: '' });
  expect(result.stderr).toMatch(/collision:.*element-declaration old-id.*element-declaration new-id.*elements\/new-id\.md/);
  await expect(readModelTree(model)).resolves.toEqual(before);
  expect((await fs.readdir(path.join(source, 'elements'))).sort()).toEqual(['add.md', 'remove.md']);
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it.each([true, false])('rejects reusing a Relationship container for a foreign Kind (remove original=%s)', async remove => {
  await writeProjectModel(root, minimalModel({
    elements: [{ identity: 'child' }],
    relationshipKinds: [{ identity: 'old' }, { identity: 'new' }],
    relationships: [{ source: 'root', kind: 'old', target: 'child' }],
  }));
  const model = path.join(root, '.xirang', 'model');
  const location = 'relationships/new.yaml';
  await fs.rename(path.join(model, 'relationships/old.yaml'), path.join(model, location));
  const before = await readModelTree(model);
  const delta = 'relationships:\n  - operation: ADDED\n    source: child\n    kind: new\n    target: root\n'
    + (remove ? '  - operation: REMOVED\n    source: root\n    kind: old\n    target: child\n' : '');
  const source = await writeChangeDelta(root, 'relationship-reuse', { [location]: delta });
  const result = await runCLI(['archive', 'relationship-reuse', '--yes', '--quick', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 1, stdout: '' });
  expect(result.stderr).toContain('collision');
  expect(result.stderr).toContain('root -[old]-> child');
  expect(result.stderr).toContain('child -[new]-> root');
  expect(result.stderr).toContain(location);
  await expect(readModelTree(model)).resolves.toEqual(before);
  await expect(fs.readFile(path.join(source, location), 'utf8')).resolves.toBe(delta);
  await expect(fs.access(path.join(path.dirname(source), 'archive'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it('allows a replacement tuple to use the existing container for the same Relationship Kind', async () => {
  await writeProjectModel(root, minimalModel({
    elements: [{ identity: 'child' }],
    relationshipKinds: [{ identity: 'links' }],
    relationships: [{ source: 'root', kind: 'links', target: 'child' }],
  }));
  const location = 'relationships/links.yaml';
  await writeChangeDelta(root, 'replace-relationship', {
    [location]: 'relationships:\n  - operation: REMOVED\n    source: root\n    kind: links\n    target: child\n'
      + '  - operation: ADDED\n    source: child\n    kind: links\n    target: root\n',
  });
  const result = await runCLI(['archive', 'replace-relationship', '--yes', '--quick', '--json'], { cwd: root });
  expect(result.exitCode, result.stderr).toBe(0);
  await expect(fs.readFile(path.join(root, '.xirang/model', location), 'utf8'))
    .resolves.toBe('relationships:\n  - source: child\n    kind: links\n    target: root\n');
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
    [['archive', 'demo', '--quick', '--abandon', '--yes'], /--quick[\s\S]*--abandon/i],
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
  const rm = fs.rm;
  const copyFile = fs.copyFile;
  const archive = path.join(root, '.xirang', 'changes', 'archive', 'abandoned');
  const mocks = [
    vi.spyOn(fs, 'copyFile').mockImplementation(async (from, to, mode) => {
      if (path.basename(String(to)) === 'proposal.md' && String(to).startsWith(archive + path.sep)) {
        throw new Error('install injected failure');
      }
      return copyFile(from, to, mode);
    }),
    vi.spyOn(fs, 'rm').mockImplementation(async (target, options) => {
      const location = String(target);
      if (path.dirname(location) === archive && path.basename(location).endsWith('-move-failure')) {
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


it('completes both finished archive modes and omits marked incomplete history', async () => {
  const archive = path.join(root, '.xirang', 'changes', 'archive');
  const abandoned = path.join(archive, 'abandoned');
  const interrupted = path.join(archive, '2026-01-01-interrupted');
  const interruptedAbandon = path.join(abandoned, '2026-01-01-interrupted-abandon');
  for (const directory of [path.join(archive, '2026-01-01-delivered'), interrupted,
    path.join(abandoned, '2026-01-01-dropped'), interruptedAbandon, path.join(archive, 'not-a-dated-archive')]) {
    await fs.mkdir(directory, { recursive: true });
    if (directory !== path.join(abandoned, '2026-01-01-dropped')) {
      await fs.writeFile(path.join(directory, 'proposal.md'), 'Proposal already copied');
    }
  }
  await fs.mkdir(pendingArchivePath(interrupted));
  await fs.mkdir(pendingArchivePath(interruptedAbandon));

  const completion = await runCLI(['__complete', 'archived-changes'], { cwd: root });
  expect(completion).toMatchObject({
    exitCode: 0, stdout: '2026-01-01-delivered\tarchived change\n2026-01-01-dropped\tarchived change\n', stderr: '',
  });
  for (const [name, mode] of [['interrupted', '--quick'], ['interrupted-abandon', '--abandon']]) {
    const retry = await runCLI(['archive', name, mode], { cwd: root });
    expect(retry).toMatchObject({ exitCode: 1, stdout: '', stderr: expect.stringContaining('Archive is incomplete') });
  }
});

it.each([false, true])('ignores a history entry rolled back between listing and inspecting its marker (completion=%s)', async completion => {
  const changes = path.join(root, '.xirang', 'changes');
  const history = path.join(changes, 'archive', '2026-01-01-failed');
  const pending = pendingArchivePath(history);
  const active = path.join(changes, 'failed');
  await fs.mkdir(history, { recursive: true });
  await fs.mkdir(pending);
  const lstat = fs.lstat;
  let rolledBack = false;
  const marker = vi.spyOn(fs, 'lstat').mockImplementation(async (location, options) => {
    if (location === pending && !rolledBack) {
      rolledBack = true;
      await fs.mkdir(active);
      await fs.rmdir(history);
      await fs.rmdir(pending);
    }
    return lstat(location, options);
  });
  try {
    const result = await runCLI(completion ? ['__complete', 'archived-changes'] : ['archive', 'failed', '--json'], { cwd: root });
    expect(rolledBack).toBe(true);
    expect(result).toMatchObject({ exitCode: completion ? 0 : 1, stdout: '' });
    if (!completion) expect(result.stderr).toContain("Change 'failed' not found");
    await expect(fs.access(active)).resolves.toBeUndefined();
  } finally {
    marker.mockRestore();
  }
});

it.skipIf(process.platform === 'win32').for([false, true])('retries and completes archive names at the component limit (abandon=%s)', async (abandon, context) => {
  const archive = path.join(root, '.xirang', 'changes', 'archive', ...(abandon ? ['abandoned'] : []));
  const name = 'l'.repeat(244);
  const entry = `2026-01-01-${name}`;
  const location = path.join(archive, entry);
  try { await fs.mkdir(location, { recursive: true }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENAMETOOLONG') return context.skip('Filesystem component limit is below 255');
    throw error;
  }
  await fs.writeFile(path.join(location, 'proposal.md'), 'Legacy archive');

  const completion = await runCLI(['__complete', 'archived-changes'], { cwd: root });
  expect(completion.stdout).toBe(`${entry}\tarchived change\n`);
  const retry = await runCLI(['archive', name, '--json'], { cwd: root });
  expect(retry).toMatchObject({ exitCode: 0, stderr: '' });
  expect(JSON.parse(retry.stdout)).toEqual({ archive: path.relative(root, location), alreadyArchived: true });
});

it('reports an archive error and incomplete model rollback in structured diagnostics', async () => {
  await writeProjectModel(root, minimalModel());
  const source = await writeChangeDelta(root, 'rollback-failure', {
    'elements/root.md': '---\noperation: MODIFIED\n' + elementUnit({ identity: 'root', kind: 'project', parent: null, definition: 'New root.' }).slice(4),
  });
  const target = path.join(root, '.xirang', 'model', 'elements', 'root.md');
  const rename = fs.rename;
  let original: string | undefined;
  const hook = vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
    if (from === source) throw new Error('archive move injected failure');
    if (to === target && path.basename(String(from)) === 'original') {
      original = String(from);
      throw new Error('model restore injected failure');
    }
    return rename(from, to);
  });
  try {
    const result = await runCLI(['archive', 'rollback-failure', '--quick', '--yes', '--json'], { cwd: root });
    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    const records = result.stderr.trim().split('\n').map(line => JSON.parse(line));
    expect(records.find(record => record.code === 'COMMAND_ERROR')?.message).toMatch(/archive move injected failure[\s\S]*model restore injected failure/);
    expect(records.find(record => record.code === 'COMMAND_ERROR')?.message).toContain(path.dirname(original!));
    await expect(fs.readFile(original!, 'utf8')).resolves.toContain('Project root definition.');
    await expect(fs.access(source)).resolves.toBeUndefined();
  } finally { hook.mockRestore(); }
});


it('warns without undoing delivery if post-commit Formal staging cleanup fails', async () => {
  await writeProjectModel(root, minimalModel());
  const source = await writeChangeDelta(root, 'formal-cleanup-failure', {
    'elements/root.md': '---\noperation: MODIFIED\n' + elementUnit({ identity: 'root', kind: 'project', parent: null, definition: 'New root.' }).slice(4),
  });
  const elements = path.join(root, '.xirang', 'model', 'elements');
  const rm = fs.rm;
  const hook = vi.spyOn(fs, 'rm').mockImplementation(async (location, options) => {
    if (path.dirname(String(location)) === elements && path.basename(String(location)).startsWith('.xirang-sync-')) {
      throw new Error('Formal cleanup injected failure');
    }
    return rm(location, options);
  });
  try {
    const result = await runCLI(['archive', 'formal-cleanup-failure', '--quick', '--yes', '--json'], { cwd: root });
    expect(result.exitCode).toBe(0);
    const { archive } = JSON.parse(result.stdout);
    expect(result.stderr.trim().split('\n').map(line => JSON.parse(line))).toContainEqual({
      code: 'FORMAL_STAGING_CLEANUP', message: expect.stringContaining('Formal cleanup injected failure'),
    });
    await expect(fs.readFile(path.join(root, archive, 'elements', 'root.md'), 'utf8')).resolves.toContain('New root.');
    await expect(fs.readFile(path.join(elements, 'root.md'), 'utf8')).resolves.toContain('New root.');
    await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally { hook.mockRestore(); }
});

it('rejects mutually exclusive archive options as an invalid CLI argument', async () => {
  const result = await runCLI(['archive', '--quick', '--abandon', '--json'], { cwd: root });
  expect(result).toMatchObject({ exitCode: 1, stdout: '' });
  expect(JSON.parse(result.stderr)).toMatchObject({ code: 'INVALID_ARGUMENT', message: expect.stringMatching(/--quick[\s\S]*--abandon/) });
});


it('returns the matching history after a same-day reuse of the exact Change name', async () => {
  await writeProjectModel(root, minimalModel());
  const flags = ['--yes', '--json'];
  const archive = async (...options: string[]) => {
    const result = await runCLI(['archive', 'demo', ...options, ...flags], { cwd: root });
    expect(result.exitCode).toBe(0);
    return JSON.parse(result.stdout);
  };
  await writeChangeDelta(root, 'demo', { 'proposal.md': 'First delivered version.' });
  const delivery = await archive('--quick');
  await writeChangeDelta(root, 'demo', { 'proposal.md': 'Second abandoned version.' });
  const abandonment = await archive('--abandon');
  expect(await archive('--abandon')).toEqual({ archive: abandonment.archive, alreadyArchived: true });
  expect(await archive('--quick')).toEqual({ archive: delivery.archive, alreadyArchived: true });
});
