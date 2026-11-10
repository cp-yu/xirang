import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const cli = path.resolve('bin/xirang.js');
const roots: string[] = [];
afterEach(async () => { while (roots.length) await fs.rm(roots.pop()!, { recursive: true, force: true }); });
async function workspace() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-flow-'));
  roots.push(root);
  return root;
}
function run(root: string, args: string[], status = 0): any {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', XIRANG_INTERACTIVE: '0' } });
  expect(result.status, result.stderr || result.stdout).toBe(status);
  if (status !== 0) {
    expect(result.stdout).toBe('');
    return JSON.parse(result.stderr);
  }
  expect(result.stderr).toBe('');
  return result.stdout ? JSON.parse(result.stdout) : undefined;
}
async function input(root: string, name: string, data: unknown) {
  const file = path.join(root, name);
  await fs.writeFile(file, JSON.stringify(data));
  return file;
}

describe('built Record CLI workflow', () => {
  it('hands an initial Build source to the Candidate and preserves exact source bytes through promotion', async () => {
    const root = await workspace();
    const payload = await input(root, 'payload.json', { schemaVersion: 4, context: 'build', entries: [
      { identity: 'scope', nature: 'normative', decision: 'accepted', content: 'A confirmed project root scope.' },
      { identity: 'future', nature: 'normative', decision: 'pending', content: 'Future independent direction' },
    ] });
    const filename = 'initial-build.md';
    expect(run(root, ['record', 'create', filename, '--from', payload, '--json'])).toBeUndefined();
    const source = path.join(root, '.xirang/records', filename);
    const bytes = await fs.readFile(source);
    for (const target of [[], ['--candidate', '--change', 'ambiguous']]) {
      expect(run(root, ['record', 'consume', filename, ...target, '--json'], 1).code).toBe('INVALID_CONSUME_TARGET');
    }
    run(root, ['candidate', 'init', '--from', 'clean', '--json']);
    expect(run(root, ['record', 'consume', filename, '--candidate', '--json'], 1).code).toBe('COVERAGE_MISSING');
    const coverage = await input(root, 'coverage.json', { entries: [
      { identity: 'future', result: 'pending', affectsTarget: false, reason: 'Independent future work' },
      { identity: 'scope', result: 'covered', details: [{ detail: 'root scope', location: { elementKind: 'project' } }] },
    ] });
    expect(run(root, ['record', 'coverage', filename, '--candidate', '--from', coverage, '--json'])).toBeUndefined();
    expect(await fs.readFile(source)).toEqual(bytes);
    expect(run(root, ['record', 'consume', filename, '--candidate', '--json'])).toBeUndefined();
    await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
    const validation = run(root, ['candidate', 'validate', '--json']);
    expect(Object.keys(validation)).toEqual(['reviewDigest']);
    const details = run(root, ['candidate', 'validate', '--details', '--json']);
    expect(details.reviewDigest).toBe(validation.reviewDigest);
    expect(details.comparison.baseline).toBe('absent');
    const promotion = run(root, ['candidate', 'promote', '--digest', validation.reviewDigest, '--json']);
    expect(await fs.readFile(path.join(root, promotion.historyPath, 'record-source.md'))).toEqual(bytes);
    await expect(fs.access(path.join(root, promotion.historyPath, 'record-coverage.json'))).resolves.toBeUndefined();
    expect(run(root, ['record', 'list', '--json'])).toEqual({ records: [] });
  });

  it('queries drift as data, rebases with partial CLI updates and consumes an explicit Change', async () => {
    const root = await workspace();
    await writeProjectModel(root, minimalModel());
    const filename = 'root-scope.md';
    const entries = [{ identity: 'boundary', nature: 'normative', decision: 'accepted', content: 'Target root boundary.' }];
    const payload = await input(root, 'payload.json', { schemaVersion: 4, context: 'change', relatedIdentities: ['root'], entries });
    run(root, ['record', 'create', filename, '--from', payload, '--json']);
    await fs.writeFile(path.join(root, '.xirang/model/elements/root.md'), elementUnit({ identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Concurrent definition.' }));
    expect(run(root, ['record', 'status', filename, '--json'])).toMatchObject({ drift: 'relevant-drift', changed: expect.arrayContaining(['element:root']) });
    expect(run(root, ['record', 'validate', filename, '--json'], 1).code).toBe('INVALID_RECORD');
    const patch = await input(root, 'patch.json', { entries: { upsert: entries } });
    expect(run(root, ['record', 'update', filename, '--from', patch, '--json'])).toBeUndefined();
    expect(run(root, ['record', 'status', filename, '--json']).drift).toBe('fresh');
    run(root, ['record', 'validate', filename, '--json']);
    await writeChangeDelta(root, 'root-change', {
      'proposal.md': '## Why\n\nThe confirmed root definition becomes canonical.\n\n## What Changes\n\n- Update root scope.\n',
      'elements/root.md': `---\noperation: MODIFIED\n${elementUnit({ identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Target root definition.' }).slice(4)}`,
    });
    const coverage = await input(root, 'coverage.json', { entries: [{ identity: 'boundary', result: 'covered', details: [{ detail: 'boundary', location: { element: 'root' }, quote: 'Target root definition.' }] }] });
    const bytes = await fs.readFile(path.join(root, '.xirang/records', filename));
    run(root, ['record', 'coverage', filename, '--change', 'root-change', '--from', coverage, '--json']);
    run(root, ['record', 'consume', filename, '--change', 'root-change', '--json']);
    expect(await fs.readFile(path.join(root, '.xirang/changes/root-change/record-source.md'))).toEqual(bytes);
    expect(run(root, ['record', 'list', '--json'])).toEqual({ records: [] });
    expect(run(root, ['validate', '--change', 'root-change', '--json'])).toBeUndefined();
  });

  it('preserves unsupported records and rejects retired commands', async () => {
    const root = await workspace();
    const legacy = spawnSync(process.execPath, [cli, 'framing', 'list', '--json'], { cwd: root, encoding: 'utf8' });
    expect(legacy.status).not.toBe(0);
    expect(legacy.stderr).toMatch(/unknown command/i);
    const records = path.join(root, '.xirang/records');
    await fs.mkdir(records, { recursive: true });
    const file = path.join(records, 'old.md');
    const unsupported = '---\nentity: confirmed-design-record\nsemanticModelFingerprint: ' + 'f'.repeat(64) + '\n---\nschemaVersion: 3\n';
    await fs.writeFile(file, unsupported);
    expect(run(root, ['record', 'list', '--json'], 1).code).toBeTruthy();
    expect(await fs.readFile(file, 'utf8')).toBe(unsupported);
  });
});
