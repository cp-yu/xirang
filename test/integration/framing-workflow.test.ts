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

describe('built framing CLI workflow', () => {
  it('binds an initial Build record to an explicit Candidate and preserves its source in history', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-framing-build-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.xirang'));
    const payloadPath = path.join(root, 'payload.json');
    await fs.writeFile(payloadPath, JSON.stringify({
      schemaVersion: 2, context: 'build', relatedIdentities: ['project.root'],
      entries: [{ identity: 'scope', nature: 'normative', content: 'A project root with a confirmed scope.' }],
    }));
    const created = run(root, ['framing', 'create', '--slug', 'initial-build', '--from', payloadPath, '--json']);
    const { sourceVersion, document, path: sourcePath } = created.result!;
    const id = document.metadata.explorationId as string;
    expect(document.baseline.modelState).toBe('absent');
    for (const args of [[], ['--candidate', '--change', 'ambiguous']]) {
      expect(run(root, ['framing', 'consume', id, ...args, '--source-version', sourceVersion, '--json'], 1))
        .toMatchObject({ status: 'error', error: { code: 'INVALID_CONSUME_TARGET' } });
    }
    const initialized = spawnSync(process.execPath, [cli, 'candidate', 'init', '--from', 'clean'], { cwd: root, encoding: 'utf8' });
    expect(initialized.status, initialized.stderr || initialized.stdout).toBe(0);
    const bytes = await fs.readFile(path.join(root, sourcePath));
    expect(run(root, ['framing', 'consume', id, '--candidate', '--source-version', sourceVersion, '--json']))
      .toMatchObject({ status: 'ok', result: { candidate: true, path: '.xirang/candidate/framing-source.md' } });
    const validated = spawnSync(process.execPath, [cli, 'candidate', 'validate', '--json'], { cwd: root, encoding: 'utf8' });
    expect(validated.status, validated.stderr || validated.stdout).toBe(0);
    const validation = JSON.parse(validated.stdout);
    const promoted = spawnSync(process.execPath, [cli, 'candidate', 'promote', '--digest', validation.reviewDigest, '--json'], { cwd: root, encoding: 'utf8' });
    expect(promoted.status, promoted.stderr || promoted.stdout).toBe(0);
    const promotion = JSON.parse(promoted.stdout);
    expect(await fs.readFile(path.join(root, promotion.historyPath, 'framing-source.md'))).toEqual(bytes);
    expect((await fs.readdir(path.join(root, '.xirang', 'model'))).sort()).toEqual(['elements', 'metamodel', 'relationships', 'views']);
    expect(run(root, ['framing', 'list', '--json']).result).toEqual({ explorations: [] });
  });

  it('creates, rebases after relevant drift, validates, consumes, and isolates discovery', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-framing-flow-'));
    roots.push(root);
    await writeProjectModel(root, minimalModel());
    const payloadPath = path.join(root, 'payload.json');
    const payload = {
      schemaVersion: 2, context: 'change', relatedIdentities: ['root'],
      entries: [{ identity: 'root-boundary', nature: 'normative', content: '目标项目根边界。' }],
    };
    await fs.writeFile(payloadPath, JSON.stringify(payload), 'utf8');

    const created = run(root, ['framing', 'create', '--slug', 'root-scope', '--from', payloadPath, '--json']);
    expect(created).toMatchObject({ version: '1.0', command: 'framing create', status: 'ok', error: null });
    const explorationId = created.result!.document.metadata.explorationId as string;
    const sourcePath = path.join(root, ...(created.result!.path as string).split('/'));

    await fs.writeFile(
      path.join(root, '.xirang', 'model', 'elements', 'root.md'),
      elementUnit({ identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Concurrent root definition.' }),
      'utf8',
    );
    expect(run(root, ['framing', 'status', explorationId, '--json'], 1)).toMatchObject({
      status: 'invalid',
      result: { drift: 'relevant-drift', changed: expect.arrayContaining(['element:root']) },
      diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'ERROR', code: 'RELEVANT_DRIFT' })]),
    });
    const invalid = run(root, ['framing', 'validate', explorationId, '--json'], 1);
    expect(invalid).toMatchObject({
      status: 'invalid',
      diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'ERROR', code: 'RELEVANT_DRIFT' })]),
    });

    const updated = run(root, ['framing', 'update', explorationId, '--from', payloadPath, '--json']);
    expect(updated.result!.document.metadata.explorationId).toBe(explorationId);
    expect(updated.result!.diff).toEqual({ added: [], modified: [], removed: [] });
    expect(run(root, ['framing', 'status', explorationId, '--json']).result).toMatchObject({ drift: 'fresh' });
    expect(run(root, ['framing', 'validate', explorationId, '--json'])).toMatchObject({ status: 'ok' });

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

    const consumed = run(root, ['framing', 'consume', explorationId, '--change', 'root-scope-change', '--source-version', updated.result!.sourceVersion as string, '--json']);
    expect(consumed).toMatchObject({
      status: 'ok',
      result: { path: '.xirang/changes/root-scope-change/framing-source.md', recovered: false },
    });
    expect(await fs.readFile(path.join(
      root, '.xirang', 'changes', 'root-scope-change', 'framing-source.md',
    ))).toEqual(before);
    await expect(fs.access(sourcePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(run(root, ['framing', 'list', '--json']).result).toEqual({ explorations: [] });
  });
});
