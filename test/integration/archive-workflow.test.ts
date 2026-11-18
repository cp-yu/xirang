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

  it.skipIf(process.platform === 'win32')('preserves relative artifact links in an exclusive copy', async () => {
    const archived = path.join(root, 'archived');
    await fs.writeFile(path.join(changeDir, 'artifact.txt'), 'source');
    await fs.symlink('artifact.txt', path.join(changeDir, 'relative-link'));
    await moveDirectory(changeDir, archived);
    await expect(fs.readlink(path.join(archived, 'relative-link'))).resolves.toBe('artifact.txt');
    await expect(fs.readFile(path.join(archived, 'relative-link'), 'utf8')).resolves.toBe('source');
  });

  it.skipIf(process.platform !== 'win32')('keeps an unresolved Windows junction as a junction', async () => {
    const archived = path.join(root, 'archived');
    const target = path.join(root, 'missing-directory');
    const original = path.join(changeDir, 'junction');
    await fs.symlink(target, original, 'junction');
    await expect(fs.stat(original)).rejects.toMatchObject({ code: 'ENOENT' });
    const linkText = await fs.readlink(original);

    await moveDirectory(changeDir, archived);

    const moved = path.join(archived, 'junction');
    expect((await fs.lstat(moved)).isSymbolicLink()).toBe(true);
    await expect(fs.readlink(moved)).resolves.toBe(linkText);
    await fs.mkdir(target);
    await expect(fs.stat(moved).then(entry => entry.isDirectory())).resolves.toBe(true);
  });

  it.skipIf(process.platform !== 'win32')('keeps a relative Windows directory symlink when capturing makes it unresolved', async context => {
    const archived = path.join(path.dirname(changeDir), 'archived');
    const target = path.join(path.dirname(changeDir), 'sibling');
    await fs.mkdir(target);
    const original = path.join(changeDir, 'dir-link');
    try { await fs.symlink(path.join('..', 'sibling'), original, 'dir'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') return context.skip('Windows runner cannot create directory symlinks');
      throw error;
    }
    const linkText = await fs.readlink(original);
    await moveDirectory(changeDir, archived);
    const moved = path.join(archived, 'dir-link');
    await expect(fs.readlink(moved)).resolves.toBe(linkText);
    await expect(fs.stat(moved).then(entry => entry.isDirectory())).resolves.toBe(true);
  });

  it('keeps the active source and removes partial output when a copy is denied', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const archived = path.join(root, '.xirang', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model {}');
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const copyFile = vi.fn<typeof fs.copyFile>(fs.copyFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('injected copy failure'), { code: 'EPERM' });
    });
    await expect(moveDirectory(changeDir, archived, { copyFile })).rejects.toThrow('injected copy failure');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model {}');
    await expect(fs.access(archived)).rejects.toThrow();
    expect((await fs.readdir(path.dirname(archived))).filter(entry => entry !== path.basename(changeDir))).toEqual([]);
  });

  it('never renames onto the reserved archive directory', async () => {
    const archived = path.join(root, 'reserved');
    await fs.writeFile(path.join(changeDir, 'useful.log'), 'archived content');
    await fs.mkdir(path.join(changeDir, 'empty'));
    const rename = vi.fn<typeof fs.rename>(fs.rename);
    await moveDirectory(changeDir, archived, { rename });
    await expect(fs.readFile(path.join(archived, 'useful.log'), 'utf8')).resolves.toBe('archived content');
    await expect(fs.readdir(path.join(archived, 'empty'))).resolves.toEqual([]);
    await expect(fs.access(changeDir)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(rename.mock.calls.some(([, destination]) => destination === archived)).toBe(false);
  });

  it.skipIf(process.platform === 'win32')('restores deleted artifacts without trying to replace surviving absolute symlinks', async () => {
    const archived = path.join(root, 'archived');
    const sourceFile = path.join(changeDir, 'artifact.txt');
    const sourceLink = path.join(changeDir, 'absolute-link');
    const externalTarget = path.join(root, 'external.txt');
    await fs.writeFile(sourceFile, 'restore me');
    await fs.writeFile(externalTarget, 'external');
    await fs.symlink(externalTarget, sourceLink);
    const interrupted = new Error('partially removed active directory');
    let removed = false;
    await expect(moveDirectory(changeDir, archived, {
      rm: async (file, options) => {
        if (!removed && path.basename(String(file)) === path.basename(changeDir) && path.basename(path.dirname(String(file))).startsWith('.archive-source-')) {
          removed = true;
          await fs.rm(path.join(String(file), path.basename(sourceFile)));
          throw interrupted;
        }
        await fs.rm(file, options);
      },
    })).rejects.toBe(interrupted);
    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('restore me');
    await expect(fs.readlink(sourceLink)).resolves.toBe(externalTarget);
    await expect(fs.access(archived)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rolls back an installed destination when active source cleanup fails', async () => {
    const sourceFile = path.join(changeDir, 'architecture-delta.c4');
    const formalFile = path.join(root, '.xirang', 'architecture', 'model.c4');
    const archived = path.join(root, '.xirang', 'changes', 'archive', 'done');
    await fs.writeFile(sourceFile, 'model { extend projectRoot {} }');
    await fs.mkdir(path.dirname(formalFile), { recursive: true });
    await fs.writeFile(formalFile, "model { projectRoot = project 'Root' }\n");
    await fs.mkdir(path.dirname(archived), { recursive: true });
    const formalBefore = await fs.readFile(formalFile);
    let cleanupInterrupted = false;
    const rm = vi.fn(async (target: string, options?: Parameters<typeof fs.rm>[1]) => {
      if (!cleanupInterrupted && path.basename(target) === path.basename(changeDir) && path.basename(path.dirname(target)).startsWith('.archive-source-')) {
        cleanupInterrupted = true;
        await fs.rm(path.join(target, path.basename(sourceFile)));
        throw Object.assign(new Error('source cleanup denied'), { code: 'EPERM' });
      }
      await fs.rm(target, options);
    }) as typeof fs.rm;

    await expect(moveDirectory(changeDir, archived, { rm })).rejects.toThrow('source cleanup denied');

    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('model { extend projectRoot {} }');
    await expect(fs.access(archived)).rejects.toThrow();
    await expect(fs.readFile(formalFile)).resolves.toEqual(formalBefore);
  });
});
