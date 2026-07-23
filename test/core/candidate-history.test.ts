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
    const projectSpec = path.join(root, '.opsx', 'specs', 'project-contract', 'spec.md');
    await fs.mkdir(path.dirname(projectSpec), { recursive: true });
    await fs.writeFile(projectSpec, `---\nelement: project.root\n---\n\n# Project Contract Specification\n\n## Purpose\nDefines the project contract used by Candidate history tests.\n\n## Requirements\n\n### Requirement: Project contract\nThe project SHALL retain valid build history.\n\n#### Scenario: Retain history\n- **WHEN** promotion succeeds\n- **THEN** previous formal source is retained\n`);
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

    const entries = await fs.readdir(path.join(root, '.opsx', 'history', 'builds'));
    expect(entries).toHaveLength(2);
    expect(entries[0]).not.toBe(entries[1]);
    for (const entry of entries) {
      expect((await fs.stat(path.join(root, '.opsx', 'history', 'builds', entry, 'previous', 'architecture'))).isDirectory())
        .toBe(true);
      await expect(fs.readFile(path.join(root, '.opsx', 'history', 'builds', entry, 'promotion.yaml'), 'utf8'))
        .resolves.toContain('reviewDigest:');
    }
  });
});
