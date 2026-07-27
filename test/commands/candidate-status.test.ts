import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getCandidateStatus,
  initializeCandidate,
  toCanonicalProjectRelativePath,
} from '../../src/core/candidate/workspace.js';

describe('Candidate status', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-status-'));
    await fs.mkdir(path.join(root, '.xirang'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('succeeds read-only when no Candidate exists', async () => {
    const before = await fs.readdir(path.join(root, '.xirang'));
    const status = await getCandidateStatus(root);

    expect(status.active).toBe(false);
    expect(status.inventory.partitions).toEqual({ metamodel: [], elements: [], relationships: [], views: [] });
    expect(status.guidance).toEqual({
      init: 'Run "xirang candidate init" with an explicit starting point.',
    });
    expect(await fs.readdir(path.join(root, '.xirang'))).toEqual(before);
  });

  it('reports baseline, deterministic inventory, readiness, and history usage', async () => {
    await initializeCandidate(root, { kind: 'clean' });
    await fs.writeFile(path.join(root, '.xirang', 'candidate', 'views', 'z.md'), 'z\n');
    await fs.writeFile(path.join(root, '.xirang', 'candidate', 'views', 'a.md'), 'a\n');
    await fs.mkdir(path.join(root, '.xirang', 'history', 'builds', 'one'), { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'history', 'builds', 'one', 'promotion.yaml'), 'x\n');

    const status = await getCandidateStatus(root);

    expect(status.active).toBe(true);
    expect(status.baseline).toEqual({ kind: 'clean', reference: null });
    expect(status.inventory.partitions.views).toEqual(['views/a.md', 'views/z.md']);
    expect(status.inventory.partitions.elements).toEqual(['elements/project.root.md']);
    expect(status.readiness).toEqual({
      metadata: true,
      build: true,
      metamodel: true,
      elements: true,
      relationships: true,
      views: true,
    });
    expect(status.history.count).toBe(1);
    expect(status.history.bytes).toBeGreaterThan(0);
    expect(status.guidance).toEqual({
      resume: 'Continue editing the active .xirang/candidate workspace.',
      restart: 'Explicitly remove or archive .xirang/candidate, then run "xirang candidate init" again.',
    });
  });

  it('normalizes Windows Candidate references and rejects cross-drive paths', () => {
    expect(toCanonicalProjectRelativePath(
      'C:\\work\\project',
      'C:\\work\\project\\baseline',
      path.win32,
    )).toBe('baseline');
    expect(toCanonicalProjectRelativePath(
      'C:\\work\\project',
      'C:\\work\\shared\\baseline',
      path.win32,
    )).toBe('../shared/baseline');
    expect(() => toCanonicalProjectRelativePath(
      'C:\\work\\project',
      'D:\\baseline',
      path.win32,
    )).toThrow(/same filesystem root/);
  });
});
