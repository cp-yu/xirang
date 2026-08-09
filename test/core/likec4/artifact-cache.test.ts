import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateLikeC4Artifacts } from '../../../src/core/likec4/artifact-cache.js';
import { likec4CacheDir } from '../../../src/core/likec4/paths.js';
import { emptySemanticModel, type SemanticModel } from '../../../src/core/model/types.js';

const model: SemanticModel = {
  ...emptySemanticModel(),
  elementKinds: [{ identity: 'project', contract: 'required', root: true, body: '' }],
  elements: [{ declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, requirements: [] }],
};

describe('transactional LikeC4 artifact cache', () => {
  it('validates staging before replacing the live cache', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-cache-'));
    const target = likec4CacheDir(root);
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, 'old.txt'), 'old');
    try {
      await generateLikeC4Artifacts(root, model, async args => {
        expect(args[0]).toBe('validate');
        expect(await fs.readFile(path.join(args[1]!, 'model.c4'), 'utf8')).toContain('root = project');
      });
      await expect(fs.stat(path.join(target, 'old.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
      expect(await fs.readFile(path.join(target, 'model.c4'), 'utf8')).toContain('root = project');
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('retains the live cache when validation fails', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-cache-'));
    const target = likec4CacheDir(root);
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, 'old.txt'), 'old');
    try {
      await expect(generateLikeC4Artifacts(root, model, async () => {
        throw new Error('invalid');
      })).rejects.toThrow('invalid');
      expect(await fs.readFile(path.join(target, 'old.txt'), 'utf8')).toBe('old');
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
