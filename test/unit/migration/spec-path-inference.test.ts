import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inferSpecPaths } from '../../../src/migration/utils/spec-path-inference.js';

describe('spec path inference', () => {
  let root: string;
  beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-spec-inference-')); });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should find old format spec.md', async () => {
    const dir = path.join(root, 'openspec', 'specs', 'skill-generation');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'spec.md'), 'spec');
    expect(await inferSpecPaths(root, 'cap.ai.skill-generation')).toEqual([
      path.join('openspec', 'specs', 'skill-generation', 'spec.md'),
    ]);
  });

  it('should find new format multiple md files', async () => {
    const dir = path.join(root, 'openspec', 'specs', 'task-executor');
    await fs.mkdir(dir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(dir, 'phase1.md'), 'one'),
      fs.writeFile(path.join(dir, 'phase0.md'), 'zero'),
      fs.writeFile(path.join(dir, 'ignore.txt'), 'ignore'),
    ]);
    expect(await inferSpecPaths(root, 'cap.apply.task-executor')).toEqual([
      path.join('openspec', 'specs', 'task-executor', 'phase0.md'),
      path.join('openspec', 'specs', 'task-executor', 'phase1.md'),
    ]);
  });

  it('should return empty array if spec dir does not exist', async () => {
    expect(await inferSpecPaths(root, 'cap.none.missing')).toEqual([]);
  });
});
