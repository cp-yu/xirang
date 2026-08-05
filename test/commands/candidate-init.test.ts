import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { PARTITIONS } from '../../src/core/model/types.js';
import { minimalModel, writeModel } from '../helpers/model-fixture.js';

async function exists(target: string): Promise<boolean> {
  return fs.stat(target).then(() => true, () => false);
}

describe('Candidate initialization', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-candidate-init-'));
    await fs.mkdir(path.join(root, '.xirang'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('creates a clean Candidate atomically', async () => {
    const result = await initializeCandidate(root, { kind: 'clean' });
    const candidate = path.join(root, '.xirang', 'candidate');

    expect(result.active).toBe(true);
    expect(await exists(path.join(candidate, 'candidate.yaml'))).toBe(true);
    expect(await exists(path.join(candidate, 'build.md'))).toBe(true);
    expect(await fs.readdir(path.join(candidate, 'metamodel'))).toEqual([
      'project.md',
    ]);
    expect(await fs.readdir(path.join(candidate, 'elements'))).toEqual(['project.root.md']);
    expect(await fs.readdir(path.join(candidate, 'relationships'))).toEqual([]);
    expect(await fs.readdir(path.join(candidate, 'views'))).toEqual([]);
    expect(await exists(path.join(root, '.xirang', 'model'))).toBe(false);
  });

  it('copies the current formal partitions byte-for-byte', async () => {
    const modelRoot = path.join(root, '.xirang', 'model');
    await writeModel(modelRoot, minimalModel());
    const before = await fs.readFile(path.join(modelRoot, 'elements', 'root.md'));

    await initializeCandidate(root, { kind: 'current' });

    for (const partition of PARTITIONS) {
      expect(await exists(path.join(root, '.xirang', 'candidate', partition))).toBe(true);
    }
    expect(await fs.readFile(path.join(root, '.xirang', 'candidate', 'elements', 'root.md'))).toEqual(before);
  });

  it('copies an explicitly specified four-partition source', async () => {
    const source = path.join(root, 'baseline');
    await writeModel(source, minimalModel());

    await initializeCandidate(root, { kind: 'path', path: source });

    const metadata = await fs.readFile(path.join(root, '.xirang', 'candidate', 'candidate.yaml'), 'utf8');
    expect(metadata).toContain('kind: path');
    expect(metadata).toContain('reference: baseline');
  });

  it('refuses to overwrite an active Candidate', async () => {
    await initializeCandidate(root, { kind: 'clean' });
    await expect(initializeCandidate(root, { kind: 'clean' })).rejects.toThrow(/already exists/);
  });

  it('rejects symlinks in a specified source', async () => {
    const source = path.join(root, 'baseline');
    await writeModel(source, minimalModel());
    await fs.symlink(path.join(root, 'outside'), path.join(source, 'elements', 'linked.md'));

    await expect(initializeCandidate(root, { kind: 'path', path: source })).rejects.toThrow(/symlink/i);
    expect(await exists(path.join(root, '.xirang', 'candidate'))).toBe(false);
  });

  it('rejects a symlinked partition root', async () => {
    const source = path.join(root, 'baseline');
    await writeModel(source, minimalModel());
    const outside = path.join(root, 'outside-elements');
    await fs.mkdir(outside, { recursive: true });
    await fs.rm(path.join(source, 'elements'), { recursive: true, force: true });
    await fs.symlink(outside, path.join(source, 'elements'));

    await expect(initializeCandidate(root, { kind: 'path', path: source })).rejects.toThrow(/symlink/i);
    expect(await exists(path.join(root, '.xirang', 'candidate'))).toBe(false);
  });
});
