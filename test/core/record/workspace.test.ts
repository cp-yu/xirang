import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createRecord,
  discardRecord,
  listRecords,
  renameRecord,
  showRecord,
  updateRecord,
} from '../../../src/core/record/workspace.js';
import type { DesignRecordPayload } from '../../../src/core/record/types.js';

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function workspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-'));
  roots.push(root);
  return root;
}

function payload(identity = 'a'): DesignRecordPayload {
  return {
    schemaVersion: 4, context: 'build', relatedIdentities: [],
    entries: [{ identity, nature: 'normative', decision: 'accepted' as const, content: `${identity} 的确认内容` }],
    structure: { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] },
  };
}

const context = { model: null, semanticModelFingerprint: 'f'.repeat(64) };
const identity = 'first.md';

describe('record workspace', () => {
  it('creates, shows, partially updates, renames and discards by filename', async () => {
    const root = await workspace();
    const created = await createRecord(root, 'first.md', payload(), context);
    expect(path.basename(created.path)).toBe(identity);
    expect(created.sourceVersion).toMatch(/^[a-f0-9]{64}$/);
    expect(created.path).toBe('.xirang/records/first.md');
    expect((await listRecords(root)).map(item => path.basename(item.path))).toEqual(['first.md']);

    const updated = await updateRecord(root, identity, {
      entries: { upsert: [{ identity: 'b', nature: 'informative', decision: 'accepted' as const, content: 'b 的确认内容' }] },
      structure: { upsert: { elements: [{ identity: 'root', parent: null }] } },
    }, context);
    expect(updated.record.document.payload.entries).toEqual([...created.document.payload.entries, { identity: 'b', nature: 'informative', decision: 'accepted' as const, content: 'b 的确认内容' }]);
    expect(updated.diff.entries).toEqual({ added: [expect.objectContaining({ identity: 'b' })], modified: [], removed: [] });
    expect(updated.diff.structure.added).toEqual([{ ref: { element: 'root' }, after: { identity: 'root', parent: null } }]);
    expect(updated.derived).toEqual([{ ref: { element: 'root' }, status: 'added' }]);
    expect(updated.summary).toEqual({ entries: 2, normativeEntries: 1, decisions: { pending: 0, accepted: 2, excluded: 0 }, elements: 1, relationships: 0, elementKinds: 0, relationshipKinds: 0 });

    const renamed = await renameRecord(root, identity, 'renamed.md');
    expect(path.basename(renamed.path)).toBe('renamed.md');
    expect(renamed.sourceVersion).toBe(updated.record.sourceVersion);
    expect(renamed.document.payload).toEqual(updated.record.document.payload);
    expect(renamed.document.metadata).not.toHaveProperty('slug');
    expect(renamed.path).toContain('renamed.md');
    expect((await showRecord(root, 'renamed.md')).path).toBe(renamed.path);

    await discardRecord(root, 'renamed.md');
    await expect(showRecord(root, identity)).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
  });

  it('rejects invalid structure without changing the record', async () => {
    const root = await workspace();
    const created = await createRecord(root, 'first.md', payload(), context);
    await expect(updateRecord(root, identity, { structure: { upsert: { elements: [{ identity: 'a', parent: 'ghost' }] } } }, context))
      .rejects.toMatchObject({ code: 'INVALID_STRUCTURE', diagnostics: [expect.objectContaining({ code: 'UNRESOLVED_PARENT', identity: 'a' })] });
    await expect(createRecord(root, 'second.md', { ...payload('c'), structure: { ...payload().structure, elements: [{ identity: 'a', kind: 'ghost' }] } }, context))
      .rejects.toMatchObject({ code: 'INVALID_STRUCTURE' });
    expect((await showRecord(root, identity)).bytes.equals(created.bytes)).toBe(true);
    expect(await listRecords(root)).toHaveLength(1);
  });

  it('rejects empty payloads and duplicate filenames', async () => {
    const root = await workspace();
    const empty: DesignRecordPayload = { ...payload(), entries: [] };
    await expect(createRecord(root, 'empty.md', empty, context)).rejects.toMatchObject({ code: 'EMPTY_PAYLOAD' });
    const created = await createRecord(root, 'first.md', payload(), context);
    await expect(updateRecord(root, identity, { entries: { remove: ['a'] } }, context)).rejects.toMatchObject({ code: 'EMPTY_PAYLOAD' });
    await expect(createRecord(root, 'first.md', payload('b'), context)).rejects.toMatchObject({
      code: 'MANAGED_PATH_CONFLICT',
    });
  });

  it.runIf(process.platform !== 'win32')('fails closed on symlinked managed files and roots', async () => {
    const root = await workspace();
    const outside = path.join(await workspace(), 'outside.md');
    await fs.writeFile(outside, 'outside', 'utf8');
    const changes = path.join(root, '.xirang', 'records');
    await fs.mkdir(changes, { recursive: true });
    await fs.symlink(outside, path.join(changes, `linked-${identity}.md`));
    await expect(listRecords(root)).rejects.toMatchObject({ code: 'UNSAFE_MANAGED_PATH' });

    const root2 = await workspace();
    const outsideDir = await workspace();
    await fs.mkdir(path.join(root2, '.xirang'), { recursive: true });
    await fs.symlink(outsideDir, path.join(root2, '.xirang', 'records'));
    await expect(createRecord(root2, 'first.md', payload(), context)).rejects.toMatchObject({
      code: 'UNSAFE_MANAGED_PATH',
    });
  });
});
