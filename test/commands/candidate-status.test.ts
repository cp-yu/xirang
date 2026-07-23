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
    await fs.mkdir(path.join(root, '.opsx'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('succeeds read-only when no Candidate exists', async () => {
    const before = await fs.readdir(path.join(root, '.opsx'));
    const status = await getCandidateStatus(root);

    expect(status.active).toBe(false);
    expect(status.inventory.architectureFiles).toEqual([]);
    expect(status.inventory.specFiles).toEqual([]);
    expect(status.guidance).toEqual({
      init: 'Run "opsx candidate init" with an explicit starting point.',
    });
    expect(await fs.readdir(path.join(root, '.opsx'))).toEqual(before);
  });

  it('reports baseline, deterministic inventory, readiness, and history usage', async () => {
    await initializeCandidate(root, { kind: 'clean' });
    await fs.mkdir(path.join(root, '.opsx', 'candidate', 'specs', 'z'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'candidate', 'specs', 'a'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'candidate', 'specs', 'z', 'spec.md'), 'z\n');
    await fs.writeFile(path.join(root, '.opsx', 'candidate', 'specs', 'a', 'spec.md'), 'a\n');
    await fs.mkdir(path.join(root, '.opsx', 'history', 'builds', 'one'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'history', 'builds', 'one', 'promotion.yaml'), 'x\n');

    const status = await getCandidateStatus(root);

    expect(status.active).toBe(true);
    expect(status.baseline).toEqual({ kind: 'clean', reference: null });
    expect(status.inventory.specFiles).toEqual(['specs/a/spec.md', 'specs/z/spec.md']);
    expect(status.readiness).toEqual({
      metadata: true,
      build: true,
      specification: true,
      model: true,
      relations: true,
      views: true,
      specsDirectory: true,
    });
    expect(status.history.count).toBe(1);
    expect(status.history.bytes).toBeGreaterThan(0);
    expect(status.guidance).toEqual({
      resume: 'Continue editing the active .opsx/candidate workspace.',
      restart: 'Explicitly remove or archive .opsx/candidate, then run "opsx candidate init" again.',
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
