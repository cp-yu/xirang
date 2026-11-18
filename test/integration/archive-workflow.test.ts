import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moveDirectory } from '../../src/core/archive.js';

describe('architecture archive workflow', () => {
  let changeDir: string;
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-architecture-archive-'));
    changeDir = path.join(root, '.xirang', 'changes', 'done');
    await fs.mkdir(changeDir, { recursive: true });
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('preserves architecture-delta.c4 as archived history', async () => {
    const delta = path.join(changeDir, 'architecture-delta.c4');
    await fs.writeFile(delta, 'model {}');
    const archived = path.join(root, '.xirang', 'changes', 'archive', 'done');
    await fs.mkdir(path.dirname(archived), { recursive: true });

    await moveDirectory(changeDir, archived);

    await expect(fs.readFile(path.join(archived, 'architecture-delta.c4'), 'utf8')).resolves.toBe('model {}');
  });

  it('does not install into an existing empty destination', async () => {
    const archived = path.join(root, 'occupied');
    await fs.mkdir(archived);
    await fs.writeFile(path.join(changeDir, 'artifact.txt'), 'source');
    await expect(moveDirectory(changeDir, archived)).rejects.toThrow(/already exists/);
    await expect(fs.readdir(archived)).resolves.toEqual([]);
    await expect(fs.readFile(path.join(changeDir, 'artifact.txt'), 'utf8')).resolves.toBe('source');
  });

  it.skipIf(process.platform === 'win32')('preserves relative artifact links across devices', async () => {
    const archived = path.join(root, 'archived');
    await fs.writeFile(path.join(changeDir, 'artifact.txt'), 'source');
    await fs.symlink('artifact.txt', path.join(changeDir, 'relative-link'));
    await moveDirectory(changeDir, archived, { rename: async (from, to) => {
      if (from === changeDir) throw Object.assign(new Error('cross-device'), { code: 'EXDEV' });
      await fs.rename(from, to);
    } });
    await expect(fs.readlink(path.join(archived, 'relative-link'))).resolves.toBe('artifact.txt');
    await expect(fs.readFile(path.join(archived, 'relative-link'), 'utf8')).resolves.toBe('source');
  });

  it('keeps the active source and removes partial fallback output when an EPERM copy fails', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const archived = path.join(root, '.xirang', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model {}');
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const rename = vi.fn().mockRejectedValueOnce(Object.assign(new Error('windows replacement denied'), { code: 'EPERM' }));
    const cp = vi.fn<typeof fs.cp>(async (source, destination) => {
      await fs.cp(source, destination, { recursive: true });
      throw new Error('injected copy failure');
    });

    await expect(moveDirectory(changeDir, archived, { rename, cp, rm: fs.rm })).rejects.toThrow('injected copy failure');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model {}');
    await expect(fs.access(archived)).rejects.toThrow();
    expect((await fs.readdir(path.dirname(archived))).filter(entry => entry !== path.basename(changeDir))).toEqual([]);
  });

  it('installs a staged copy even when rename cannot replace its own empty reservation', async () => {
    const archived = path.join(root, 'reserved');
    await fs.writeFile(path.join(changeDir, 'useful.log'), 'archived content');
    await fs.mkdir(path.join(changeDir, 'empty'));
    const rename = vi.fn<typeof fs.rename>(async (_source, destination) => {
      expect(destination).toBe(archived);
      await fs.access(destination);
      throw Object.assign(new Error('cannot replace a directory'), { code: 'EPERM' });
    });
    await moveDirectory(changeDir, archived, { rename });
    await expect(fs.readFile(path.join(archived, 'useful.log'), 'utf8')).resolves.toBe('archived content');
    await expect(fs.readdir(path.join(archived, 'empty'))).resolves.toEqual([]);
    await expect(fs.access(changeDir)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(rename).toHaveBeenCalledTimes(2);
  });

  it.skipIf(process.platform === 'win32')('restores deleted artifacts without trying to replace surviving absolute symlinks', async () => {
    const archived = path.join(root, 'archived');
    const sourceFile = path.join(changeDir, 'artifact.txt');
    const sourceLink = path.join(changeDir, 'absolute-link');
    const externalTarget = path.join(root, 'external.txt');
    await fs.writeFile(sourceFile, 'restore me');
    await fs.writeFile(externalTarget, 'external');
    await fs.symlink(externalTarget, sourceLink);
    const inode = (await fs.lstat(sourceLink)).ino;
    const interrupted = new Error('partially removed active directory');
    await expect(moveDirectory(changeDir, archived, {
      rename: async (from, to) => {
        if (from === changeDir) throw Object.assign(new Error('cross-device'), { code: 'EXDEV' });
        await fs.rename(from, to);
      },
      rm: async (file, options) => {
        if (file === changeDir) {
          await fs.rm(sourceFile);
          throw interrupted;
        }
        await fs.rm(file, options);
      },
    })).rejects.toBe(interrupted);
    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('restore me');
    await expect(fs.readlink(sourceLink)).resolves.toBe(externalTarget);
    expect((await fs.lstat(sourceLink)).ino).toBe(inode);
    await expect(fs.access(archived)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rolls back an installed fallback destination when active source cleanup fails', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const formalFile = path.join(root, '.xirang', 'architecture', 'model.c4');
    const archived = path.join(root, '.xirang', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model { extend projectRoot {} }');
    await fs.mkdir(path.dirname(formalFile), { recursive: true });
    await fs.writeFile(formalFile, "model { projectRoot = project 'Root' }\n");
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const formalBefore = await fs.readFile(formalFile);
    const rename = vi.fn<typeof fs.rename>(async (source, destination) => {
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

    const cp = vi.fn<typeof fs.cp>(async (source, destination) => {
      await fs.cp(source, destination, { recursive: true, force: true });
    }) as typeof fs.cp;

    await expect(moveDirectory(changeDir, archived, { rename, cp, rm })).rejects.toThrow('source cleanup denied');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model { extend projectRoot {} }');
    await expect(fs.access(archived)).rejects.toThrow();
    await expect(fs.readFile(formalFile)).resolves.toEqual(formalBefore);
  });
});
