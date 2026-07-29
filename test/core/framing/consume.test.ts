import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { consumeFraming, verifyStructuralCoverage } from '../../../src/core/framing/consume.js';
import type { ChangeStructuralDefinitionDocument } from '../../../src/core/framing/types.js';
import type { DeltaEntry } from '../../../src/core/model/delta.js';
import { createFraming } from '../../../src/core/framing/workspace.js';
import { modelRoot } from '../../../src/core/model/paths.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { readSemanticTree, semanticTreeFingerprint } from '../../../src/core/model/transaction.js';
import { writeChangeDelta, writeProjectModel, minimalModel, elementUnit } from '../../helpers/model-fixture.js';

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function setup(changeName = 'sample') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-'));
  roots.push(root);
  await writeProjectModel(root, minimalModel());
  const parsed = await parseSemanticModel(modelRoot(root));
  const context = {
    model: parsed.model,
    semanticModelFingerprint: semanticTreeFingerprint(await readSemanticTree(root)),
  };
  const payload = {
    elementKinds: [], relationshipKinds: [], relationships: [],
    elements: [{ identity: 'new', kind: 'capability', parent: 'root', title: 'New', definition: 'New capability.' }],
  } as const;
  const framing = await createFraming(root, 'sample', payload, context, {
    now: new Date('2026-07-29T12:00:00Z'), randomHex: 'a1b2c3d4',
  });
  return { root, changeName, framing };
}

async function validChange(root: string, changeName: string): Promise<string> {
  return writeChangeDelta(root, changeName, {
    'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add new capability.\n',
    'elements/new.md': `---\noperation: ADDED\n${elementUnit({ identity: 'new', title: 'New', definition: 'New capability.' }).slice(4)}`,
  });
}

describe('framing consume', () => {
  it('derives coverage for all four categories and ignores baseline-equal targets', () => {
    const document = {
      metadata: {
        entity: 'change-structural-definition', explorationId: 'explore-1', slug: 'sample',
        semanticModelFingerprint: 'fingerprint',
      },
      payload: {
        elementKinds: [{ identity: 'new-kind', contract: 'optional' }],
        relationshipKinds: [{ identity: 'depends', sourceKinds: ['capability'], targetKinds: ['capability'] }],
        elements: [{ identity: 'old', operation: 'REMOVED' }],
        relationships: [{ source: 'root', kind: 'contains', target: 'old' }],
      },
      baseline: {
        elementKinds: [{ identity: 'new-kind', exists: false }],
        relationshipKinds: [{ identity: 'depends', exists: true, value: { identity: 'depends' } }],
        elements: [{ identity: 'old', exists: true, value: { identity: 'old' } }],
        relationships: [{ source: 'root', kind: 'contains', target: 'old', exists: true,
          value: { source: 'root', kind: 'contains', target: 'old' } }],
      },
    } as ChangeStructuralDefinitionDocument;
    const entries: DeltaEntry[] = [
      { operation: 'ADDED', entity: 'element-kind', identity: 'new-kind',
        target: { identity: 'new-kind', contract: 'optional' } },
      { operation: 'ADDED', entity: 'relationship-kind', identity: 'depends',
        target: { identity: 'depends', sourceKinds: ['capability'], targetKinds: ['capability'] } },
    ];
    expect(verifyStructuralCoverage(document, entries)).toEqual([
      'relationship-kind depends requires MODIFIED',
      'element-declaration old requires REMOVED',
    ]);
    entries[1] = { operation: 'MODIFIED', entity: 'relationship-kind', identity: 'depends',
      target: document.payload.relationshipKinds[0] };
    entries.push({ operation: 'REMOVED', entity: 'element-declaration', identity: 'old' });
    expect(verifyStructuralCoverage(document, entries)).toEqual([]);
  });

  it('normalizes unordered Kind constraints for no-op derivation and Delta matching', () => {
    const document = {
      metadata: {
        entity: 'change-structural-definition', explorationId: 'explore-1', slug: 'sample',
        semanticModelFingerprint: 'fingerprint',
      },
      payload: {
        elementKinds: [{
          identity: 'child', contract: 'optional', parents: ['project', 'domain'], children: ['leaf', 'node'], body: 'new',
        }],
        relationshipKinds: [{
          identity: 'uses', sourceKinds: ['domain', 'capability'], targetKinds: ['project', 'capability'], body: 'same',
        }],
        elements: [], relationships: [],
      },
      baseline: {
        elementKinds: [{
          identity: 'child', exists: true,
          value: { identity: 'child', contract: 'optional', parents: ['domain', 'project'], children: ['node', 'leaf'], body: 'old' },
        }],
        relationshipKinds: [{
          identity: 'uses', exists: true,
          value: { identity: 'uses', sourceKinds: ['capability', 'domain'], targetKinds: ['capability', 'project'], body: 'same' },
        }],
        elements: [], relationships: [],
      },
    } as ChangeStructuralDefinitionDocument;
    expect(verifyStructuralCoverage(document, [{
      operation: 'MODIFIED', entity: 'element-kind', identity: 'child',
      target: { ...document.payload.elementKinds[0], parents: ['domain', 'project'], children: ['node', 'leaf'] },
    }])).toEqual([]);
  });

  it('requires complete structural Delta coverage', async () => {
    const { root, changeName, framing } = await setup();
    await writeChangeDelta(root, changeName, {
      'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add unrelated capability.\n',
      'elements/other.md': `---\noperation: ADDED\n${elementUnit({ identity: 'other', title: 'Other' }).slice(4)}`,
    });
    await expect(consumeFraming(root, framing.document.metadata.explorationId, changeName)).rejects.toMatchObject({
      code: 'STRUCTURAL_COVERAGE_MISMATCH',
    });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
  });

  it('freezes provenance and removes the source only after validation and coverage pass', async () => {
    const { root, changeName, framing } = await setup();
    const changeDir = await validChange(root, changeName);
    const before = await fs.readFile(framing.absolutePath);
    const result = await consumeFraming(root, framing.document.metadata.explorationId, changeName);
    expect(result.path).toBe(`.xirang/changes/${changeName}/change-structural-definition.md`);
    expect(await fs.readFile(path.join(changeDir, 'change-structural-definition.md'))).toEqual(before);
    await expect(fs.access(framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked Change destinations and preserves the source', async () => {
    const { root, changeName, framing } = await setup('linked');
    const changeDir = await validChange(root, changeName);
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-outside-'));
    roots.push(outside);
    await fs.cp(changeDir, outside, { recursive: true });
    await fs.rm(changeDir, { recursive: true });
    await fs.symlink(outside, changeDir, 'dir');
    await expect(consumeFraming(root, framing.document.metadata.explorationId, changeName)).rejects.toMatchObject({
      code: 'INVALID_CHANGE_PATH',
    });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
  });

  it('recovers an identical copy and fails closed on a conflicting copy', async () => {
    const recovered = await setup('recover');
    const recoverDir = await validChange(recovered.root, recovered.changeName);
    const source = await fs.readFile(recovered.framing.absolutePath);
    await fs.writeFile(path.join(recoverDir, 'change-structural-definition.md'), source);
    await consumeFraming(recovered.root, recovered.framing.document.metadata.explorationId, recovered.changeName);
    await expect(fs.access(recovered.framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });

    const conflict = await setup('conflict');
    const conflictDir = await validChange(conflict.root, conflict.changeName);
    await fs.writeFile(path.join(conflictDir, 'change-structural-definition.md'), 'different', 'utf8');
    await expect(consumeFraming(conflict.root, conflict.framing.document.metadata.explorationId, conflict.changeName))
      .rejects.toMatchObject({ code: 'PROVENANCE_CONFLICT' });
    await expect(fs.access(conflict.framing.absolutePath)).resolves.toBeUndefined();
  });
});
