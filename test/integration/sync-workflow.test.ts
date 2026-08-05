import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assessChangeSyncState,
  applyPreparedChangeSync,
  getPendingChangeSync,
  prepareChangeSync,
} from '../../src/core/change-sync.js';
import { readModelTree } from '../../src/core/model/parser.js';
import { modelRoot } from '../../src/core/model/paths.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Requirements\n\n### Requirement: Existing behavior\nThe system SHALL keep behaving.\n\n#### Scenario: Existing\n- **WHEN** invoked\n- **THEN** it works';

const ADD_ELEMENT = '---\noperation: ADDED\nentity: element-declaration\nidentity: cap.added\nkind: capability\nparent: root\ntitle: Added\ndefinition: Added summary\n---\n\n'
  + '## ADDED Requirements\n\n### Requirement: Added behavior\nThe system SHALL add behavior.\n\n'
  + '#### Scenario: Added succeeds\n- **WHEN** added runs\n- **THEN** it succeeds\n';

const ADD_VIEW = '---\noperation: ADDED\nentity: authored-view\nidentity: detail\ninclude: "*"\n---\n';

describe('Semantic Model sync workflow', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-architecture-sync-'));
    await writeProjectModel(root, minimalModel({
      elements: [{ identity: 'cap.existing', parent: 'root', title: 'Existing', definition: 'Existing summary', requirements: CONTRACT }],
    }));
    await fs.mkdir(path.join(root, '.xirang', 'changes', 'add'), { recursive: true });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('treats an absent Semantic Delta as no sync', async () => {
    const state = await assessChangeSyncState(root, 'add');
    expect(state.entries).toEqual([]);
    expect(state.requiresSync).toBe(false);
  });

  it('prepares a sorted manifest with preimage bytes across partitions', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT, 'views/detail.md': ADD_VIEW });

    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'));

    expect(prepared.manifest.map(entry => entry.path)).toEqual([
      '.xirang/model/elements/cap.added.md',
      '.xirang/model/views/detail.md',
    ]);
    expect(prepared.manifest.every(entry => entry.preimage === null)).toBe(true);
    expect(prepared.partitions).toEqual({ metamodel: 0, elements: 1, relationships: 0, views: 1 });
  });

  it('rewrites only the units the delta touched', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT });
    const before = await readModelTree(modelRoot(root));

    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'));
    await applyPreparedChangeSync(root, prepared);

    const after = await readModelTree(modelRoot(root));
    for (const [file, bytes] of before) expect(after.get(file)).toEqual(bytes);
    expect(after.get('elements/cap.added.md')?.toString('utf8')).toContain('### Requirement: Added behavior');
  });

  it('rolls back every partition when a prepared write fails', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT, 'views/detail.md': ADD_VIEW });
    const before = await readModelTree(modelRoot(root));
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'));

    await expect(applyPreparedChangeSync(root, prepared, {
      filesystem: {
        writeFile: async (file, data) => {
          if (String(file).includes('views')) throw Object.assign(new Error('injected failure'), { code: 'EIO' });
          await fs.writeFile(file as string, data as Buffer);
        },
      },
    })).rejects.toThrow('injected failure');

    expect(await readModelTree(modelRoot(root))).toEqual(before);
  });

  it('removes a unit when its Element is removed', async () => {
    await writeChangeDelta(root, 'add', {
      'elements/cap.existing.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: cap.existing\n---\n',
    });

    await applyPreparedChangeSync(root, await prepareChangeSync(root, await assessChangeSyncState(root, 'add')));

    await expect(fs.access(path.join(modelRoot(root), 'elements', 'cap.existing.md'))).rejects.toThrow();
    await expect(fs.access(path.join(modelRoot(root), 'elements', 'root.md'))).resolves.toBeUndefined();
  });

  it('rejects an invalid Expected Semantic Model before any write', async () => {
    await writeChangeDelta(root, 'add', {
      'elements/cap.orphan.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: cap.orphan\nkind: capability\nparent: ghost\ntitle: Orphan\ndefinition: Orphan\n---\n',
    });
    const before = await readModelTree(modelRoot(root));

    await expect(prepareChangeSync(root, await assessChangeSyncState(root, 'add'))).rejects.toThrow(/MISSING_PARENT/);
    expect(await readModelTree(modelRoot(root))).toEqual(before);
  });

  it('rejects a stale Formal snapshot before any write', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT });
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'));
    await fs.writeFile(path.join(modelRoot(root), 'views', 'concurrent.md'),
      '---\nentity: authored-view\nidentity: concurrent\ninclude: []\n---\n');

    await expect(applyPreparedChangeSync(root, prepared)).rejects.toThrow(/stale/i);
    await expect(fs.access(path.join(modelRoot(root), 'elements', 'cap.added.md'))).rejects.toThrow();
  });

  it('reports no pending work after a successful sync', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT });
    const state = await assessChangeSyncState(root, 'add');
    expect((await getPendingChangeSync(root, state)).pending).toBeGreaterThan(0);

    await applyPreparedChangeSync(root, await prepareChangeSync(root, state));

    expect((await getPendingChangeSync(root, state)).pending).toBe(0);
  });

  it('reports evidence refresh failure after the semantic commit without claiming rollback', async () => {
    await writeChangeDelta(root, 'add', { 'elements/cap.added.md': ADD_ELEMENT });
    const prepared = await prepareChangeSync(root, await assessChangeSyncState(root, 'add'));

    await expect(applyPreparedChangeSync(root, prepared, {
      refreshEvidence: async () => { throw new Error('evidence write failed'); },
    })).rejects.toThrow(/Semantic sync committed, but evidence refresh failed/);

    await expect(fs.access(path.join(modelRoot(root), 'elements', 'cap.added.md'))).resolves.toBeUndefined();
  });
});
