import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFormalSemanticModel } from '../../src/core/change-compiler.js';
import { buildViewRuntimeSnapshot } from '../../src/core/view.js';
import { minimalModel, writeProjectModel } from '../helpers/model-fixture.js';

vi.mock('../../src/core/change-compiler.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/core/change-compiler.js')>();
  return { ...actual, readFormalSemanticModel: vi.fn(actual.readFormalSemanticModel) };
});

describe('buildViewRuntimeSnapshot parse economy', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-view-parse-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('parses the formal Semantic Model exactly once per snapshot build', async () => {
    await writeProjectModel(tempDir, minimalModel());
    const readSpy = vi.mocked(readFormalSemanticModel);

    await buildViewRuntimeSnapshot(tempDir);

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledWith(tempDir);
  });
});
