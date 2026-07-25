import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';

async function exists(target: string): Promise<boolean> {
  return fs.stat(target).then(() => true, () => false);
}

describe('Candidate initialization', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-init-'));
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
    expect(await fs.readdir(path.join(candidate, 'architecture'))).toEqual([
      'model.c4', 'relations.c4', 'specification.c4', 'views.c4',
    ]);
    expect(await fs.readdir(path.join(candidate, 'specs'))).toEqual([]);
    expect(await exists(path.join(root, '.xirang', 'architecture'))).toBe(false);
  });

  it('copies current formal Architecture and Specs byte-for-byte', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    const spec = path.join(root, '.xirang', 'specs', 'sample', 'spec.md');
    await fs.mkdir(architecture, { recursive: true });
    await fs.mkdir(path.dirname(spec), { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), Buffer.from([0x6d, 0x0a]));
    await fs.mkdir(path.join(architecture, '.likec4'), { recursive: true });
    await fs.writeFile(path.join(architecture, '.likec4', 'cache'), 'generated');
    await fs.writeFile(spec, Buffer.from([0x73, 0x0a]));

    await initializeCandidate(root, { kind: 'current' });

    expect(await fs.readFile(path.join(root, '.xirang', 'candidate', 'architecture', 'model.c4')))
      .toEqual(Buffer.from([0x6d, 0x0a]));
    expect(await fs.readFile(path.join(root, '.xirang', 'candidate', 'specs', 'sample', 'spec.md')))
      .toEqual(Buffer.from([0x73, 0x0a]));
    expect(await exists(path.join(root, '.xirang', 'candidate', 'architecture', '.likec4'))).toBe(false);
  });

  it('copies an explicitly specified Xirang source', async () => {
    const source = path.join(root, 'baseline');
    await fs.mkdir(path.join(source, 'architecture'), { recursive: true });
    await fs.mkdir(path.join(source, 'specs'), { recursive: true });
    await fs.writeFile(path.join(source, 'architecture', 'model.c4'), 'model {}\n');

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
    await fs.mkdir(path.join(source, 'architecture'), { recursive: true });
    await fs.mkdir(path.join(source, 'specs'), { recursive: true });
    await fs.symlink(path.join(root, 'outside'), path.join(source, 'architecture', 'linked.c4'));

    await expect(initializeCandidate(root, { kind: 'path', path: source })).rejects.toThrow(/symlink/i);
    expect(await exists(path.join(root, '.xirang', 'candidate'))).toBe(false);
  });

  it('rejects a symlinked source root', async () => {
    const source = path.join(root, 'baseline');
    const architecture = path.join(root, 'outside-architecture');
    await fs.mkdir(architecture, { recursive: true });
    await fs.mkdir(path.join(source, 'specs'), { recursive: true });
    await fs.symlink(architecture, path.join(source, 'architecture'));

    await expect(initializeCandidate(root, { kind: 'path', path: source })).rejects.toThrow(/symlink/i);
    expect(await exists(path.join(root, '.xirang', 'candidate'))).toBe(false);
  });
});
