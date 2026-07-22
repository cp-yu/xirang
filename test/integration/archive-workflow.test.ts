import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moveDirectory } from '../../src/core/archive.js';

describe('architecture archive workflow', () => {
  let changeDir: string;
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-architecture-archive-'));
    changeDir = path.join(root, '.opsx', 'changes', 'done');
    await fs.mkdir(changeDir, { recursive: true });
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('preserves architecture-delta.c4 as archived history', async () => {
    const delta = path.join(changeDir, 'architecture-delta.c4');
    await fs.writeFile(delta, 'model {}');
    const archived = path.join(root, '.opsx', 'changes', 'archive', 'done');
    await fs.mkdir(path.dirname(archived), { recursive: true });

    await moveDirectory(changeDir, archived);

    await expect(fs.readFile(path.join(archived, 'architecture-delta.c4'), 'utf8')).resolves.toBe('model {}');
  });

  it('keeps the active source and removes partial fallback output when an EPERM copy fails', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const archived = path.join(root, '.opsx', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model {}');
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const rename = vi.fn().mockRejectedValueOnce(Object.assign(new Error('windows replacement denied'), { code: 'EPERM' }));
    const cp = vi.fn(async (source: string, destination: string) => {
      await fs.cp(source, destination, { recursive: true });
      throw new Error('injected copy failure');
    });

    await expect(moveDirectory(changeDir, archived, { rename, cp, rm: fs.rm })).rejects.toThrow('injected copy failure');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model {}');
    await expect(fs.access(archived)).rejects.toThrow();
    expect((await fs.readdir(path.dirname(archived))).filter(entry => entry !== path.basename(changeDir))).toEqual([]);
  });

  it('rolls back an installed fallback destination when active source cleanup fails', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const formalFile = path.join(root, '.opsx', 'architecture', 'model.c4');
    const archived = path.join(root, '.opsx', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model { extend projectRoot {} }');
    await fs.mkdir(path.dirname(formalFile), { recursive: true });
    await fs.writeFile(formalFile, "model { projectRoot = project 'Root' }\n");
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const formalBefore = await fs.readFile(formalFile);
    const rename = vi.fn(async (source: string, destination: string) => {
      if (source === changeDir) throw Object.assign(new Error('cross-device move'), { code: 'EXDEV' });
      await fs.rename(source, destination);
    });
    const rm = vi.fn(async (target: string, options?: Parameters<typeof fs.rm>[1]) => {
      if (target === changeDir) {
        await fs.rm(sourceFile);
        throw Object.assign(new Error('source cleanup denied'), { code: 'EPERM' });
      }
      await fs.rm(target, options);
    }) as typeof fs.rm;

    const cp = vi.fn(async (source: string, destination: string) => {
      await fs.cp(source, destination, { recursive: true, force: true });
    }) as typeof fs.cp;

    await expect(moveDirectory(changeDir, archived, { rename, cp, rm })).rejects.toThrow('source cleanup denied');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model { extend projectRoot {} }');
    await expect(fs.access(archived)).rejects.toThrow();
    await expect(fs.readFile(formalFile)).resolves.toEqual(formalBefore);
  });
});
