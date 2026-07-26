import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';

async function readTree(root: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.set(path.relative(root, target), await fs.readFile(target));
    }
  };
  await visit(root);
  return files;
}

describe('Candidate validation', () => {
  let root: string;
  let candidate: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-validate-'));
    await new SetupCommand({ tools: 'none', force: true }).execute(root);
    await initializeCandidate(root, { kind: 'current' });
    candidate = path.join(root, '.xirang', 'candidate');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns a deterministic digest and formal diff for a valid Candidate', async () => {
    const first = await validateCandidate(root);
    const second = await validateCandidate(root);

    expect(first.valid).toBe(true);
    expect(first.diagnostics).toEqual([]);
    expect(first.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(second.reviewDigest).toBe(first.reviewDigest);
    expect(first.diff.summary.total).toBe(0);
    expect(first.inventory.partitions).toEqual({
      metamodel: ['metamodel/project.md'],
      elements: ['elements/project.root.md'],
      relationships: [],
      views: [],
    });
  });

  it('excludes candidate metadata from the review digest', async () => {
    const before = await validateCandidate(root);
    const metadataPath = path.join(candidate, 'candidate.yaml');
    const metadata = await fs.readFile(metadataPath, 'utf8');
    await fs.writeFile(metadataPath, metadata.replace(/createdAt: .+/, 'createdAt: 2030-01-01T00:00:00.000Z'));

    const after = await validateCandidate(root);

    expect(after.valid).toBe(true);
    expect(after.reviewDigest).toBe(before.reviewDigest);
  });

  it('rejects malformed or non-canonical lifecycle metadata', async () => {
    await fs.writeFile(path.join(candidate, 'candidate.yaml'), [
      'schemaVersion: 1',
      'createdAt: not-a-date',
      'baseline:',
      '  kind: invalid',
      '  reference: /absolute/source',
      'extra: true',
      '',
    ].join('\n'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'CANDIDATE_METADATA', path: 'candidate.yaml',
    }));
  });

  it('reports canonical text failures without modifying any observed bytes', async () => {
    await fs.writeFile(path.join(candidate, 'build.md'), Buffer.from('scope  \r\n'));
    const before = await readTree(candidate);

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.reviewDigest).toBeUndefined();
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'build.md', code: 'LINE_ENDING_LF', location: { line: 1, column: 8, offset: 7 },
      }),
      expect.objectContaining({
        path: 'build.md', code: 'TRAILING_WHITESPACE', location: { line: 1, column: 6, offset: 5 },
      }),
    ]));
    expect(await readTree(candidate)).toEqual(before);
  });

  it('rejects a unit outside the four partitions', async () => {
    await fs.mkdir(path.join(candidate, 'architecture'), { recursive: true });
    await fs.writeFile(path.join(candidate, 'architecture', 'model.c4'), 'model {}\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CANDIDATE_FILE_UNEXPECTED', path: 'architecture/model.c4' }),
    ]));
  });

  it('rejects an Element whose parent is unknown', async () => {
    await fs.writeFile(path.join(candidate, 'elements', 'orphan.md'),
      '---\nentity: element-declaration\nidentity: orphan\nkind: project\nparent: ghost\ntitle: Orphan\nsummary: S\n---\n');

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toContain('MISSING_PARENT');
  });

  it.runIf(process.platform !== 'win32')('rejects Candidate source symlinks', async () => {
    await fs.symlink(path.join(candidate, 'build.md'), path.join(candidate, 'views', 'linked.md'));

    const result = await validateCandidate(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CANDIDATE_SYMLINK', path: 'views/linked.md' }),
    ]));
  });
});
