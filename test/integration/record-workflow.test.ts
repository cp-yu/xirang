import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const cli = path.resolve('bin/xirang.js');
const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

function run(root: string, args: string[], expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.status, result.stderr || result.stdout).toBe(expectedStatus);
  expect(result.stderr).toBe('');
  expect(() => JSON.parse(result.stdout)).not.toThrow();
  return JSON.parse(result.stdout) as {
    version: string;
    command: string;
    status: string;
    result: Record<string, any> | null;
    diagnostics: Array<{ severity: 'ERROR' | 'WARNING' | 'INFO'; code: string }>;
    error: unknown;
  };
}

describe('built record CLI workflow', () => {
  it('binds an initial Build record to an explicit Candidate and preserves its source in history', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-build-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.xirang'));
    const payloadPath = path.join(root, 'payload.json');
    await fs.writeFile(payloadPath, JSON.stringify({
      schemaVersion: 4, context: 'build', relatedIdentities: ['project.root'],
      entries: [
        { identity: 'scope', nature: 'normative', decision: 'accepted', content: 'A project root with a confirmed scope.' },
        { identity: 'future', nature: 'normative', decision: 'pending', content: '未来独立方向' },
        { identity: 'excluded', nature: 'normative', decision: 'excluded', content: '排除方案' },
      ],
    }));
    const created = run(root, ['record', 'create', '--slug', 'initial-build', '--from', payloadPath, '--json']);
    const { sourceVersion, document, path: sourcePath } = created.result!;
    const id = document.metadata.explorationId as string;
    expect(document.baseline.modelState).toBe('absent');
    for (const args of [[], ['--candidate', '--change', 'ambiguous']]) {
      expect(run(root, ['record', 'consume', id, ...args, '--source-version', sourceVersion, '--json'], 1))
        .toMatchObject({ status: 'error', error: { code: 'INVALID_CONSUME_TARGET' } });
    }
    const initialized = spawnSync(process.execPath, [cli, 'candidate', 'init', '--from', 'clean'], { cwd: root, encoding: 'utf8' });
    expect(initialized.status, initialized.stderr || initialized.stdout).toBe(0);
    const bytes = await fs.readFile(path.join(root, sourcePath));
    expect(run(root, ['record', 'consume', id, '--candidate', '--source-version', sourceVersion, '--json'], 1))
      .toMatchObject({ status: 'error', error: { code: 'COVERAGE_MISSING' } });
    const coveragePath = path.join(root, 'coverage.json');
    await fs.writeFile(coveragePath, JSON.stringify({ entries: [{ identity: 'future', result: 'pending', affectsTarget: false, reason: '当前根模型不依赖未来方向' }, { identity: 'scope', result: 'covered', details: [{ detail: '项目根', location: { element: 'ghost' }, quote: '项目根' }] }] }));
    expect(run(root, ['record', 'coverage', id, '--candidate', '--source-version', sourceVersion, '--from', coveragePath, '--json'], 1)).toMatchObject({
      status: 'invalid', diagnostics: [expect.objectContaining({ code: 'COVERAGE_LOCATION_UNRESOLVED', identity: 'scope' })],
    });
    await fs.writeFile(coveragePath, JSON.stringify({ entries: [{ identity: 'future', result: 'pending', affectsTarget: false, reason: '当前根模型不依赖未来方向' }, { identity: 'scope', result: 'covered', details: [{ detail: '项目根', location: { elementKind: 'project' } }] }] }));
    expect(run(root, ['record', 'coverage', id, '--candidate', '--source-version', sourceVersion, '--from', coveragePath, '--json']))
      .toMatchObject({ status: 'ok', result: { path: '.xirang/candidate/record-coverage.json' } });
    expect(run(root, ['record', 'consume', id, '--candidate', '--source-version', sourceVersion, '--json']))
      .toMatchObject({ status: 'ok', result: { candidate: true, path: '.xirang/candidate/record-source.md' } });
    const validated = spawnSync(process.execPath, [cli, 'candidate', 'validate', '--json'], { cwd: root, encoding: 'utf8' });
    expect(validated.status, validated.stderr || validated.stdout).toBe(0);
    const validation = JSON.parse(validated.stdout);
    const promoted = spawnSync(process.execPath, [cli, 'candidate', 'promote', '--digest', validation.reviewDigest, '--json'], { cwd: root, encoding: 'utf8' });
    expect(promoted.status, promoted.stderr || promoted.stdout).toBe(0);
    const promotion = JSON.parse(promoted.stdout);
    expect(await fs.readFile(path.join(root, promotion.historyPath, 'record-source.md'))).toEqual(bytes);
    await expect(fs.access(path.join(root, promotion.historyPath, 'record-coverage.json'))).resolves.toBeUndefined();
    expect((await fs.readdir(path.join(root, '.xirang', 'model'))).sort()).toEqual(['elements', 'metamodel', 'relationships', 'views']);
    expect(run(root, ['record', 'list', '--json']).result).toEqual({ explorations: [] });
  });

  it('creates, rebases after relevant drift, validates, consumes, and isolates discovery', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-flow-'));
    roots.push(root);
    await writeProjectModel(root, minimalModel());
    const payloadPath = path.join(root, 'payload.json');
    const payload = {
      schemaVersion: 4, context: 'change', relatedIdentities: ['root'],
      entries: [
        { identity: 'root-boundary', nature: 'normative', decision: 'accepted', content: '目标项目根边界。' },
        { identity: 'other-change', nature: 'normative', decision: 'accepted', content: '另一Change已确认义务' },
      ],
    };
    await fs.writeFile(payloadPath, JSON.stringify(payload), 'utf8');

    const created = run(root, ['record', 'create', '--slug', 'root-scope', '--from', payloadPath, '--json']);
    expect(created).toMatchObject({ version: '1.0', command: 'record create', status: 'ok', error: null });
    const explorationId = created.result!.document.metadata.explorationId as string;
    const sourcePath = path.join(root, ...(created.result!.path as string).split('/'));

    await fs.writeFile(
      path.join(root, '.xirang', 'model', 'elements', 'root.md'),
      elementUnit({ identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Concurrent root definition.' }),
      'utf8',
    );
    expect(run(root, ['record', 'status', explorationId, '--json'], 1)).toMatchObject({
      status: 'invalid',
      result: { drift: 'relevant-drift', changed: expect.arrayContaining(['element:root']) },
      diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'ERROR', code: 'RELEVANT_DRIFT' })]),
    });
    const invalid = run(root, ['record', 'validate', explorationId, '--json'], 1);
    expect(invalid).toMatchObject({
      status: 'invalid',
      diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'ERROR', code: 'RELEVANT_DRIFT' })]),
    });

    const patchPath = path.join(root, 'patch.json');
    await fs.writeFile(patchPath, JSON.stringify({ entries: { upsert: payload.entries } }), 'utf8');
    expect(run(root, ['record', 'update', explorationId, '--from', patchPath, '--source-version', 'e'.repeat(64), '--json'], 1)).toMatchObject({
      status: 'invalid', result: { currentSourceVersion: created.result!.sourceVersion },
      diagnostics: [expect.objectContaining({ code: 'SOURCE_VERSION_STALE' })],
    });
    const updated = run(root, ['record', 'update', explorationId, '--from', patchPath, '--source-version', created.result!.sourceVersion as string, '--json']);
    expect(updated.result).not.toHaveProperty('document');
    expect(updated.result!.diff).toEqual({
      entries: { added: [], modified: [], removed: [] },
      structure: { added: [], modified: [], withdrawn: [] },
    });
    expect(updated.result!.summary).toMatchObject({ entries: 2, normativeEntries: 2, decisions: { accepted: 2, pending: 0, excluded: 0 } });
    expect(run(root, ['record', 'status', explorationId, '--json']).result).toMatchObject({ drift: 'fresh' });
    expect(run(root, ['record', 'validate', explorationId, '--json'])).toMatchObject({ status: 'ok' });

    await writeChangeDelta(root, 'root-scope-change', {
      'proposal.md': '## Why\n\nThe confirmed project definition must become canonical.\n\n## What Changes\n\n- Update the project root definition.\n',
      'elements/root.md': `---\noperation: MODIFIED\n${elementUnit({
        identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Target project root definition.',
      }).slice(4)}`,
    });
    const before = await fs.readFile(sourcePath);
    const discovery = spawnSync(process.execPath, [cli, 'list', '--json'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' },
    });
    expect(discovery.status, discovery.stderr).toBe(0);
    expect(discovery.stdout).not.toContain('.explore-');

    const coveragePath = path.join(root, 'coverage.json');
    await fs.writeFile(coveragePath, JSON.stringify({ entries: [{ identity: 'other-change', result: 'not-applicable', reason: '属于独立Change且当前目标无依赖' }, { identity: 'root-boundary', result: 'covered', details: [{ detail: '目标项目根边界', location: { element: 'root' }, quote: 'Target project root definition.' }] }] }));
    expect(run(root, ['record', 'coverage', explorationId, '--change', 'root-scope-change', '--source-version', updated.result!.sourceVersion as string, '--from', coveragePath, '--json']))
      .toMatchObject({ status: 'ok', result: { path: '.xirang/changes/root-scope-change/record-coverage.json' } });
    const consumed = run(root, ['record', 'consume', explorationId, '--change', 'root-scope-change', '--source-version', updated.result!.sourceVersion as string, '--json']);
    expect(consumed).toMatchObject({
      status: 'ok',
      result: { path: '.xirang/changes/root-scope-change/record-source.md', recovered: false },
    });
    expect(await fs.readFile(path.join(
      root, '.xirang', 'changes', 'root-scope-change', 'record-source.md',
    ))).toEqual(before);
    await expect(fs.access(sourcePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(run(root, ['record', 'list', '--json']).result).toEqual({ explorations: [] });
    const validated = spawnSync(process.execPath, [cli, 'validate', '--change', 'root-scope-change', '--json'], { cwd: root, encoding: 'utf8' });
    expect(validated.status, validated.stderr || validated.stdout).toBe(0);
    expect(validated.stdout).not.toMatch(/record-(source|coverage)/);
  });

  it('rejects the old command surface and does not discover old records', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-legacy-'));
    roots.push(root);
    const legacy = spawnSync(process.execPath, [cli, 'framing', 'list', '--json'], { cwd: root, encoding: 'utf8' });
    expect(legacy.status).not.toBe(0);
    expect(legacy.stderr).toMatch(/unknown command/i);
    const oldDirectory = path.join(root, '.xirang', 'framing');
    await fs.mkdir(oldDirectory, { recursive: true });
    await fs.writeFile(path.join(oldDirectory, 'old-20260729T120000Z-a1b2c3d4.md'), 'legacy', 'utf8');
    expect(run(root, ['record', 'list', '--json']).result).toEqual({ explorations: [] });
    const v3 = [
      '---', 'entity: confirmed-design-record', 'explorationId: 20260729T120000Z-a1b2c3d4', 'slug: old',
      `semanticModelFingerprint: ${'f'.repeat(64)}`, '---',
      'schemaVersion: 3', 'context: build', 'relatedIdentities: []', 'entries:',
      '  - identity: a', '    nature: normative', '    content: 旧记录', '<!-- XIRANG:SEMANTIC_MODEL_BASELINE',
      'modelState: absent', 'objects: {}', '-->', '',
    ].join('\n');
    const records = path.join(root, '.xirang', 'records');
    await fs.mkdir(records);
    const v3Path = path.join(records, 'old-20260729T120000Z-a1b2c3d4.md');
    await fs.writeFile(v3Path, v3, 'utf8');
    expect(run(root, ['record', 'list', '--json'], 1)).toMatchObject({ status: 'error', error: { code: 'UNSUPPORTED_RECORD_VERSION' } });
    expect(await fs.readFile(v3Path, 'utf8')).toBe(v3);
  });
});
