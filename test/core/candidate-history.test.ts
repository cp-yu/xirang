import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SetupCommand } from '../../src/core/setup.js';
import { initializeCandidate } from '../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../src/core/candidate/validator.js';
import { promoteCandidate } from '../../src/core/candidate/promotion.js';

describe('Candidate build history', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-candidate-history-'));
    await new SetupCommand({ tools: 'none', force: true }).execute(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('retains every successful build history entry', async () => {
    await initializeCandidate(root, { kind: 'current' });
    const first = await validateCandidate(root);
    await promoteCandidate(root, first.reviewDigest!, {
      now: () => new Date('2030-01-01T00:00:00.000Z'),
    });

    await initializeCandidate(root, { kind: 'current' });
    const second = await validateCandidate(root);
    await promoteCandidate(root, second.reviewDigest!, {
      now: () => new Date('2030-01-01T00:00:01.000Z'),
    });

    const entries = await fs.readdir(path.join(root, '.xirang', 'history', 'builds'));
    expect(entries).toHaveLength(2);
    expect(entries[0]).not.toBe(entries[1]);
    for (const entry of entries) {
      expect((await fs.stat(path.join(root, '.xirang', 'history', 'builds', entry, 'previous', 'elements'))).isDirectory())
        .toBe(true);
      await expect(fs.readFile(path.join(root, '.xirang', 'history', 'builds', entry, 'promotion.yaml'), 'utf8'))
        .resolves.toContain('reviewDigest:');
    }
  });
});
