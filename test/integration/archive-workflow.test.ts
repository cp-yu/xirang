import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { removeArchitectureDeltaBeforeArchive } from '../../src/core/archive.js';

describe('architecture archive workflow', () => {
  let changeDir: string;
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-architecture-archive-'));
    changeDir = path.join(root, '.opsx', 'changes', 'done');
    await fs.mkdir(changeDir, { recursive: true });
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should delete architecture-delta.c4', async () => {
    const delta = path.join(changeDir, 'architecture-delta.c4');
    await fs.writeFile(delta, 'model {}');
    await removeArchitectureDeltaBeforeArchive(changeDir);
    await expect(fs.access(delta)).rejects.toThrow();
  });
});
