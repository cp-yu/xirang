import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateLikeC4 } from '../../src/core/likec4/generator.js';
import { deriveLocalNames } from '../../src/core/likec4/local-names.js';
import { buildViewRuntimeSnapshot } from '../../src/core/view.js';
import { minimalModel, writeModel, writeProjectModel } from '../helpers/model-fixture.js';

vi.mock('../../src/core/likec4/generator.js', () => ({
  generateLikeC4: vi.fn(() => [['model.c4', 'model {}']]),
}));
vi.mock('../../src/core/likec4/local-names.js', () => ({
  deriveLocalNames: vi.fn(() => ({ pathOf: (identity: string) => identity })),
}));

describe('buildViewRuntimeSnapshot candidate source economy', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-likec4-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('generates the candidate LikeC4 sources exactly once per candidate and union derivation (three total, no duplicate)', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const candidateRoot = path.join(tempDir, '.xirang', 'candidate');
    await fs.mkdir(candidateRoot, { recursive: true });
    await fs.writeFile(
      path.join(candidateRoot, 'candidate.yaml'),
      'schemaVersion: 1\ncreatedAt: "2025-01-01T00:00:00.000Z"\nbaseline:\n  kind: current\n  reference: .xirang\n',
      'utf8',
    );
    await fs.writeFile(path.join(candidateRoot, 'build.md'), '# Build\n', 'utf8');
    await writeModel(candidateRoot, minimalModel());

    await buildViewRuntimeSnapshot(tempDir);

    expect(vi.mocked(generateLikeC4)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(deriveLocalNames)).toHaveBeenCalledTimes(3);
  });
});
