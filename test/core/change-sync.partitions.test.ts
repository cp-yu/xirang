import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applySemanticDirectoryTransaction,
  applySemanticTreeManifest,
  buildManifest,
  readSemanticTree,
  recoverSemanticDirectoryTransaction,
  semanticTreeFingerprint,
  SEMANTIC_DIRECTORY_JOURNAL,
  SEMANTIC_PARTITIONS,
  type PreparedSyncManifestEntry,
} from '../../src/core/model/transaction.js';
import { PARTITIONS } from '../../src/core/model/types.js';

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function createProject(files: Record<string, string> = {}): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-partitions-'));
  roots.push(root);
  for (const partition of SEMANTIC_PARTITIONS) {
    await fs.mkdir(path.join(root, '.xirang', 'model', partition), { recursive: true });
  }
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
  }
  return root;
}

const MODEL_FILES = {
  '.xirang/model/metamodel/project.md': '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n',
  '.xirang/model/elements/root.md': '---\nentity: element-declaration\nidentity: root\nkind: project\n---\n',
  '.xirang/model/relationships/invokes.yaml': 'relationships: []\n',
  '.xirang/model/views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\n---\n',
};

describe('semantic partitions', () => {
  it('covers the four model partitions', () => {
    for (const partition of PARTITIONS) expect(SEMANTIC_PARTITIONS).toContain(partition);
  });

  it('includes every partition in the fingerprint and the manifest', async () => {
    const root = await createProject(MODEL_FILES);
    const tree = await readSemanticTree(root);
    expect([...tree.keys()].sort()).toEqual(Object.keys(MODEL_FILES).sort());

    const baseline = semanticTreeFingerprint(tree);
    await fs.writeFile(path.join(root, '.xirang', 'model', 'views', 'overview.md'),
      '---\nentity: authored-view\nidentity: overview\ninclude: []\n---\n', 'utf8');
    const changed = await readSemanticTree(root);
    expect(semanticTreeFingerprint(changed)).not.toBe(baseline);
    expect(buildManifest(tree, changed).map(entry => entry.path)).toEqual(['.xirang/model/views/overview.md']);
  });

  it('rejects manifest paths that escape the Semantic Model', async () => {
    const root = await createProject(MODEL_FILES);
    const fingerprint = semanticTreeFingerprint(await readSemanticTree(root));
    for (const bad of ['../outside.md', '/etc/passwd', '.xirang/model/elements/../../escape.md', '.xirang/changes/x/a.md', 'elements/a.md']) {
      const manifest: PreparedSyncManifestEntry[] = [
        { path: bad, action: 'write', preimage: null, postimage: Buffer.from('x') },
      ];
      await expect(applySemanticTreeManifest(root, fingerprint, manifest)).rejects.toThrow();
      await expect(fs.access(path.join(root, '..', 'outside.md'))).rejects.toThrow();
    }
  });

  it('rolls back completely when a write fails midway', async () => {
    const root = await createProject(MODEL_FILES);
    const before = await readSemanticTree(root);
    const fingerprint = semanticTreeFingerprint(before);
    const manifest: PreparedSyncManifestEntry[] = [
      {
        path: '.xirang/model/elements/root.md',
        scope: 'spec',
        action: 'write',
        preimage: before.get('.xirang/model/elements/root.md')!,
        postimage: Buffer.from('---\nentity: element-declaration\nidentity: root\nkind: project\ntitle: New\n---\n'),
      },
      { path: '.xirang/model/views/boom.md', action: 'write', preimage: null, postimage: Buffer.from('x') },
    ];

    await expect(applySemanticTreeManifest(root, fingerprint, manifest, {
      filesystem: {
        writeFile: async (file, data) => {
          if (String(file).includes('boom')) throw new Error('disk full');
          await fs.writeFile(file as string, data as Buffer);
        },
      },
    })).rejects.toThrow('disk full');

    expect(semanticTreeFingerprint(await readSemanticTree(root))).toBe(fingerprint);
  });

  it('recovers a prepared directory transaction across all partitions', async () => {
    const root = await createProject(MODEL_FILES);
    const before = await readSemanticTree(root);
    const fingerprint = semanticTreeFingerprint(before);
    const staging = path.join(root, '.xirang', '.staging');
    for (const partition of SEMANTIC_PARTITIONS) {
      await fs.mkdir(path.join(staging, partition), { recursive: true });
    }
    await fs.writeFile(path.join(staging, 'views', 'overview.md'),
      '---\nentity: authored-view\nidentity: overview\ninclude: []\n---\n', 'utf8');

    await expect(applySemanticDirectoryTransaction(root, fingerprint, staging, {
      cleanup: false,
      postWrite: async () => { throw new Error('post-write rejected'); },
    })).rejects.toThrow('post-write rejected');

    expect(semanticTreeFingerprint(await readSemanticTree(root))).toBe(fingerprint);
  });

  it('rolls back a crashed prepared transaction from its journal', async () => {
    const root = await createProject(MODEL_FILES);
    const before = await readSemanticTree(root);
    const fingerprint = semanticTreeFingerprint(before);
    const staging = path.join(root, '.xirang', '.staging');
    const backup = path.join(staging, '.backup');
    await fs.mkdir(backup, { recursive: true });

    // Simulate a crash after some partitions were swapped out to the backup directory.
    for (const partition of ['elements', 'views']) {
      await fs.rename(path.join(root, '.xirang', 'model', partition), path.join(backup, partition));
    }
    await fs.writeFile(path.join(staging, SEMANTIC_DIRECTORY_JOURNAL), `${JSON.stringify({
      schemaVersion: 1,
      state: 'prepared',
      formalFingerprint: fingerprint,
      targetFingerprint: fingerprint,
      targetFingerprints: Object.fromEntries(SEMANTIC_PARTITIONS.map(name => [name, ''])),
      backupDirectory: '.backup',
      existed: Object.fromEntries(SEMANTIC_PARTITIONS.map(name => [name, true])),
    }, null, 2)}\n`, 'utf8');

    expect(await recoverSemanticDirectoryTransaction(root, staging)).toBe('rolled-back');
    expect(semanticTreeFingerprint(await readSemanticTree(root))).toBe(fingerprint);
  });
});
