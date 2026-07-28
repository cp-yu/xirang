import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { promoteCandidate } from '../../../src/core/candidate/promotion.js';
import { validateCandidate } from '../../../src/core/candidate/validator.js';
import { PARTITIONS } from '../../../src/core/model/types.js';

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

const CANDIDATE_FILES: Record<string, string> = {
  'candidate.yaml': 'schemaVersion: 1\ncreatedAt: 2030-01-02T03:04:05.000Z\nbaseline:\n  kind: clean\n  reference: null\n',
  'build.md': '# Build\n\nAuthority: tests.\n',
  'metamodel/project.md': '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n',
  'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n',
  'metamodel/invokes.md': '---\nentity: relationship-kind\nidentity: invokes\n---\n',
  'elements/root.md': '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Project root\n---\n',
  'elements/cap.a.md': '---\nentity: element-declaration\nidentity: cap.a\nkind: capability\nparent: root\ntitle: A\ndefinition: A capability\n---\n',
  'relationships/invokes.yaml': 'relationships: []\n',
  'views/overview.md': '---\nentity: authored-view\nidentity: overview\ninclude: "*"\n---\n',
};

async function createProject(
  candidateFiles: Record<string, string> = CANDIDATE_FILES,
  formalFiles: Record<string, string> = {},
): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-candidate-'));
  roots.push(root);
  for (const partition of PARTITIONS) {
    await fs.mkdir(path.join(root, '.xirang', 'model', partition), { recursive: true });
  }
  for (const [relative, content] of Object.entries(formalFiles)) {
    const target = path.join(root, '.xirang', 'model', ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
  }
  for (const [relative, content] of Object.entries(candidateFiles)) {
    const target = path.join(root, '.xirang', 'candidate', ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
  }
  for (const partition of PARTITIONS) {
    await fs.mkdir(path.join(root, '.xirang', 'candidate', partition), { recursive: true });
  }
  return root;
}

async function listPartitionFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (directory: string, relative: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(() => [])) {
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), child);
      else files.push(child);
    }
  };
  for (const partition of PARTITIONS) await visit(path.join(root, '.xirang', 'model', partition), partition);
  return files.sort();
}

describe('four-partition Candidate', () => {
  it('validates a Candidate that uses the model partitions', async () => {
    const result = await validateCandidate(await createProject());
    expect(result.diagnostics).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.reviewDigest).toBeTruthy();
    expect(result.comparison).toEqual({
      baseline: 'absent',
      diff: 'unavailable',
      reason: 'formal-model-absent',
    });
    expect(result.diff).toBeUndefined();
  });

  it('reports semantic model errors found in the Candidate partitions', async () => {
    const broken = { ...CANDIDATE_FILES };
    delete broken['elements/root.md'];
    const result = await validateCandidate(await createProject(broken));
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toContain('MISSING_PROJECT_ROOT');
  });

  it('promotes every partition without dropping files', async () => {
    const root = await createProject();
    const validation = await validateCandidate(root);
    await promoteCandidate(root, validation.reviewDigest!, { now: () => new Date('2030-01-02T03:04:05.000Z') });

    expect(await listPartitionFiles(root)).toEqual([
      'elements/cap.a.md',
      'elements/root.md',
      'metamodel/capability.md',
      'metamodel/invokes.md',
      'metamodel/project.md',
      'relationships/invokes.yaml',
      'views/overview.md',
    ]);
  });

  it('replaces the model wholesale so units absent from the Candidate are removed', async () => {
    const root = await createProject(CANDIDATE_FILES, {
      'elements/legacy.md': '---\nentity: element-declaration\nidentity: legacy\nkind: capability\nparent: root\n---\n',
      'views/legacy.md': '---\nentity: authored-view\nidentity: legacy\ninclude: []\n---\n',
    });
    const validation = await validateCandidate(root);
    await promoteCandidate(root, validation.reviewDigest!, { now: () => new Date('2030-01-02T03:04:05.000Z') });

    const files = await listPartitionFiles(root);
    expect(files).not.toContain('elements/legacy.md');
    expect(files).not.toContain('views/legacy.md');
    expect(files).toContain('elements/root.md');
  });

  it('refuses to promote when the review digest does not match', async () => {
    const root = await createProject();
    await expect(promoteCandidate(root, 'deadbeef')).rejects.toThrow(/review digest mismatch/);
    expect(await fs.lstat(path.join(root, '.xirang', 'candidate')).then(item => item.isDirectory())).toBe(true);
  });

  it('restores the Candidate and the model when promotion fails', async () => {
    const root = await createProject(CANDIDATE_FILES, {
      'elements/legacy.md': '---\nentity: element-declaration\nidentity: legacy\nkind: capability\nparent: root\n---\n',
    });
    const before = await listPartitionFiles(root);
    const validation = await validateCandidate(root);

    await expect(promoteCandidate(root, validation.reviewDigest!, {
      transactionFilesystem: {
        rename: async (from, to) => {
          if (String(to).endsWith(path.join('.xirang', 'model', 'views'))) throw new Error('rename failed');
          await fs.rename(from as string, to as string);
        },
      },
    })).rejects.toThrow('rename failed');

    expect(await listPartitionFiles(root)).toEqual(before);
    expect(await fs.lstat(path.join(root, '.xirang', 'candidate')).then(item => item.isDirectory())).toBe(true);
  });
});
