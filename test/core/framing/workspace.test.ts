import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createFraming,
  discardFraming,
  listFramings,
  renameFraming,
  showFraming,
  updateFraming,
} from '../../../src/core/framing/workspace.js';
import type { ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';
import { emptySemanticModel } from '../../../src/core/model/types.js';

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function workspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-framing-'));
  roots.push(root);
  return root;
}

function payload(identity = 'a'): ChangeStructuralDefinitionPayload {
  return {
    elementKinds: [],
    relationshipKinds: [],
    elements: [{ identity, kind: 'capability', parent: 'root', title: identity, definition: `${identity}.` }],
    relationships: [],
  };
}

const context = { model: emptySemanticModel(), semanticModelFingerprint: 'f'.repeat(64) };
const identity = '20260729T120000Z-a1b2c3d4';
const generation = { now: new Date('2026-07-29T12:00:00Z'), randomHex: 'a1b2c3d4' };

describe('framing workspace', () => {
  it('creates, shows, fully updates, renames and discards by stable identity', async () => {
    const root = await workspace();
    const created = await createFraming(root, 'first', payload(), context, generation);
    expect(created.document.metadata.explorationId).toBe(identity);
    expect(created.path).toBe(`.xirang/changes/.explore-first-${identity}.md`);
    expect((await listFramings(root)).map(item => item.document.metadata.slug)).toEqual(['first']);

    const updated = await updateFraming(root, identity, payload('replacement'), context);
    expect(updated.document.payload.elements.map(item => item.identity)).toEqual(['replacement']);
    expect(updated.document.payload.elements).not.toContainEqual(expect.objectContaining({ identity: 'a' }));

    const renamed = await renameFraming(root, identity, 'renamed');
    expect(renamed.document.metadata.explorationId).toBe(identity);
    expect(renamed.document.metadata.slug).toBe('renamed');
    expect(renamed.path).toContain(`.explore-renamed-${identity}.md`);
    expect((await showFraming(root, identity)).path).toBe(renamed.path);

    await discardFraming(root, identity);
    await expect(showFraming(root, identity)).rejects.toMatchObject({ code: 'FRAMING_NOT_FOUND' });
  });

  it('rejects empty create payloads and duplicate exploration identities', async () => {
    const root = await workspace();
    const empty: ChangeStructuralDefinitionPayload = {
      elementKinds: [], relationshipKinds: [], elements: [], relationships: [],
    };
    await expect(createFraming(root, 'empty', empty, context, generation)).rejects.toMatchObject({ code: 'EMPTY_PAYLOAD' });
    await createFraming(root, 'first', payload(), context, generation);
    await expect(updateFraming(root, identity, empty, context)).rejects.toMatchObject({ code: 'EMPTY_PAYLOAD' });
    await expect(createFraming(root, 'second', payload('b'), context, generation)).rejects.toMatchObject({
      code: 'DUPLICATE_EXPLORATION_ID',
    });
  });

  it.runIf(process.platform !== 'win32')('fails closed on symlinked managed files and roots', async () => {
    const root = await workspace();
    const outside = path.join(await workspace(), 'outside.md');
    await fs.writeFile(outside, 'outside', 'utf8');
    const changes = path.join(root, '.xirang', 'changes');
    await fs.mkdir(changes, { recursive: true });
    await fs.symlink(outside, path.join(changes, `.explore-linked-${identity}.md`));
    await expect(listFramings(root)).rejects.toMatchObject({ code: 'UNSAFE_MANAGED_PATH' });

    const root2 = await workspace();
    const outsideDir = await workspace();
    await fs.mkdir(path.join(root2, '.xirang'), { recursive: true });
    await fs.symlink(outsideDir, path.join(root2, '.xirang', 'changes'));
    await expect(createFraming(root2, 'first', payload(), context, generation)).rejects.toMatchObject({
      code: 'UNSAFE_MANAGED_PATH',
    });
  });
});
