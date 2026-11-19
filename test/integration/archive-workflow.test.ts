import { execFile, fork } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pendingArchivePath } from '../../src/core/archive-paths.js';
import { moveDirectory } from '../../src/core/archive.js';
import { elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

function archiveProcess(cwd: string, name: string, phase: 'claim' | 'write') {
  const cli = fileURLToPath(new URL('../../bin/xirang.js', import.meta.url));
  const preload = new URL('../fixtures/archive-commit-barrier.fixture.mjs', import.meta.url).href;
  const child = fork(cli, ['archive', name, '--quick', '--yes', '--json'], {
    cwd, execArgv: ['--import', preload], stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    env: { ...process.env, XIRANG_TEST_ARCHIVE_PAUSE: phase, XIRANG_TELEMETRY: '0' },
  });
  let stderr = '';
  child.stderr?.on('data', data => { stderr += data; });
  const done = new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => resolve({ code, stderr }));
  });
  const paused = Promise.race([
    new Promise(resolve => child.once('message', resolve)),
    done.then(result => { throw new Error(`Archive '${name}' exited before ${phase}: ${result.stderr}`); }),
  ]);
  return { child, done, paused };
}

async function windowsLinkType(location: string): Promise<string> {
  const powershell = path.join(process.env.SystemRoot!, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const { stdout } = await promisify(execFile)(powershell, ['-NoProfile', '-NonInteractive', '-Command',
    '(Get-Item -LiteralPath $env:XIRANG_TEST_LINK -Force).LinkType'], {
    env: { ...process.env, XIRANG_TEST_LINK: location }, windowsHide: true,
  });
  return stdout.trim();
}

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

  it('excludes a second CLI process after both passed archive preflight', async () => {
    const unit = 'elements/existing.id.md';
    await writeProjectModel(root, minimalModel({ elements: [{ identity: 'existing.id' }] }));
    const change = (definition: string) => '---\noperation: MODIFIED\n' + elementUnit({ identity: 'existing.id', definition }).slice(4);
    const winningSource = await writeChangeDelta(root, 'first-process', { [unit]: change('Winner') });
    const contenderSource = await writeChangeDelta(root, 'contending-process', { [unit]: change('Contender') });
    const contender = archiveProcess(root, 'contending-process', 'claim');
    let winner: ReturnType<typeof archiveProcess> | undefined;
    try {
      expect(await contender.paused).toBe('claim');
      winner = archiveProcess(root, 'first-process', 'write');
      expect(await winner.paused).toBe('write');
      expect(winner.child.pid).not.toBe(contender.child.pid);
      contender.child.send('continue');
      const refused = await contender.done;
      expect(refused.code).toBe(1);
      expect(refused.stderr).toContain('An archive is in progress');
      winner.child.send('continue');
      expect((await winner.done).code).toBe(0);
    } finally {
      const processes = [contender, ...(winner ? [winner] : [])];
      for (const { child } of processes) if (child.exitCode === null && child.signalCode === null) child.kill();
      await Promise.allSettled(processes.map(({ done }) => done));
    }

    const formal = path.join(root, '.xirang', 'model', unit);
    await expect(fs.readFile(formal, 'utf8')).resolves.toContain('definition: Winner');
    await expect(fs.readFile(path.join(contenderSource, unit), 'utf8')).resolves.toBe(change('Contender'));
    await expect(fs.access(winningSource)).rejects.toMatchObject({ code: 'ENOENT' });
    const archive = path.join(path.dirname(winningSource), 'archive');
    const [entry, ...others] = await fs.readdir(archive);
    expect(entry).toMatch(/^\d{4}-\d{2}-\d{2}-first-process$/);
    expect(others).toEqual([]);
    await expect(fs.readFile(path.join(archive, entry, unit), 'utf8')).resolves.toBe(change('Winner'));
  });

  it('can read completed history during another CLI commit without reporting pending history as completed', async () => {
    const unit = 'elements/existing.id.md';
    await writeProjectModel(root, minimalModel({ elements: [{ identity: 'existing.id' }] }));
    const delta = '---\noperation: MODIFIED\n' + elementUnit({ identity: 'existing.id', definition: 'In flight' }).slice(4);
    await writeChangeDelta(root, 'in-flight', { [unit]: delta });
    const history = path.join(root, '.xirang', 'changes', 'archive');
    const delivered = path.join(history, '2026-01-01-finished');
    const abandoned = path.join(history, 'abandoned', '2026-01-02-finished');
    const pending = path.join(history, '2026-01-03-partial');
    for (const destination of [delivered, abandoned, pending]) await fs.mkdir(destination, { recursive: true });
    await fs.mkdir(pendingArchivePath(pending));
    const cli = fileURLToPath(new URL('../../bin/xirang.js', import.meta.url));
    const lookup = (name: string, ...flags: string[]) => promisify(execFile)(process.execPath,
      [cli, 'archive', name, '--json', ...flags], { cwd: root, env: { ...process.env, XIRANG_TELEMETRY: '0' } });

    const running = archiveProcess(root, 'in-flight', 'write');
    try {
      expect(await running.paused).toBe('write');
      for (const [destination, flags] of [[delivered, []], [abandoned, ['--abandon']]] as const) {
        const { stdout } = await lookup('finished', ...flags);
        expect(JSON.parse(stdout)).toEqual({ archive: path.relative(root, destination), alreadyArchived: true });
      }
      await expect(lookup('partial')).rejects.toMatchObject({
        code: 1, stdout: '', stderr: expect.stringContaining('Archive is incomplete'),
      });
      running.child.send('continue');
      expect((await running.done).code).toBe(0);
    } finally {
      if (running.child.exitCode === null && running.child.signalCode === null) running.child.kill();
      await Promise.allSettled([running.done]);
    }
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

  it.skipIf(process.platform === 'win32')('preserves non-UTF-8 POSIX symlink targets byte for byte', async () => {
    const archived = path.join(root, 'archived');
    const target = Buffer.from([0x66, 0x80]);
    await fs.symlink(target, path.join(changeDir, 'raw-link'));

    await moveDirectory(changeDir, archived);

    await expect(fs.readlink(path.join(archived, 'raw-link'), { encoding: 'buffer' })).resolves.toEqual(target);
  });

  it.skipIf(process.platform === 'win32')('preserves non-UTF-8 POSIX artifact names, including nested directories', async context => {
    const archived = path.join(root, 'archived');
    const name = Buffer.from([0x66, 0x80]);
    const relative = Buffer.concat([Buffer.from('/'), name]);
    const source = Buffer.concat([Buffer.from(changeDir), relative]);
    try { await fs.mkdir(source); }
    catch (error) {
      if (['EILSEQ', 'EINVAL'].includes((error as NodeJS.ErrnoException).code ?? '')) {
        return context.skip('Temporary filesystem cannot represent non-UTF-8 filenames');
      }
      throw error;
    }
    await fs.writeFile(Buffer.concat([source, relative]), 'original');

    await moveDirectory(changeDir, archived);

    const target = Buffer.concat([Buffer.from(archived), relative]);
    await expect(fs.readdir(archived, { encoding: 'buffer' })).resolves.toEqual([name]);
    await expect(fs.readdir(target, { encoding: 'buffer' })).resolves.toEqual([name]);
    await expect(fs.readFile(Buffer.concat([target, relative]), 'utf8')).resolves.toBe('original');
    await expect(fs.access(changeDir)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.skipIf(process.platform === 'win32')('preserves restrictive archive directory modes on commit and during rollback', async () => {
    const archived = path.join(root, 'archived');
    const sourceDir = path.join(changeDir, 'private');
    const targetDir = path.join(archived, 'private');
    await fs.chmod(changeDir, 0o710);
    await fs.mkdir(sourceDir, 0o700);
    await fs.writeFile(path.join(sourceDir, 'notes.txt'), 'restricted');
    await fs.chmod(sourceDir, 0o500);
    const interrupted = new Error('fail after directory modes are installed');
    const modeOf = async (location: string) => (await fs.stat(location)).mode & 0o777;
    try {
      await expect(moveDirectory(changeDir, archived, {
        rmdir: async (location, options) => {
          if (location === pendingArchivePath(archived) && await fs.access(targetDir).then(() => true, () => false)) {
            expect(await modeOf(archived)).toBe(0o710);
            expect(await modeOf(targetDir)).toBe(0o500);
            throw interrupted;
          }
          await fs.rmdir(location, options);
        },
      })).rejects.toBe(interrupted);
      await expect(fs.access(archived)).rejects.toMatchObject({ code: 'ENOENT' });
      expect(await modeOf(changeDir)).toBe(0o710);
      expect(await modeOf(sourceDir)).toBe(0o500);
    } finally {
      await fs.chmod(sourceDir, 0o700);
    }

    await moveDirectory(changeDir, archived);

    expect(await modeOf(archived)).toBe(0o710);
    expect(await modeOf(targetDir)).toBe(0o700);
    await expect(fs.readFile(path.join(targetDir, 'notes.txt'), 'utf8')).resolves.toBe('restricted');
  });

  it.skipIf(process.platform !== 'win32')('keeps an unresolved Windows junction as a junction', async () => {
    const archived = path.join(root, 'archived');
    const target = path.join(root, 'missing-directory');
    const original = path.join(changeDir, 'junction');
    await fs.symlink(target, original, 'junction');
    await expect(fs.stat(original)).rejects.toMatchObject({ code: 'ENOENT' });
    const linkText = await fs.readlink(original);
    const linkType = await windowsLinkType(original);
    expect(linkType).toBe('Junction');

    await moveDirectory(changeDir, archived);

    const moved = path.join(archived, 'junction');
    expect((await fs.lstat(moved)).isSymbolicLink()).toBe(true);
    await expect(windowsLinkType(moved)).resolves.toBe(linkType);
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
    const linkType = await windowsLinkType(original);
    expect(linkType).toBe('SymbolicLink');
    await moveDirectory(changeDir, archived);
    const moved = path.join(archived, 'dir-link');
    await expect(windowsLinkType(moved)).resolves.toBe(linkType);
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

  it.skipIf(process.platform === 'win32')('fails without writing through a symlink occupying an archive child path', async () => {
    const archived = path.join(root, 'archived');
    const external = path.join(root, 'external.txt');
    const source = path.join(changeDir, 'artifact.txt');
    await fs.writeFile(external, 'do not overwrite');
    await fs.writeFile(source, 'active content');

    await expect(moveDirectory(changeDir, archived, {
      mkdir: (async (directory, options) => {
        await fs.mkdir(directory, options);
        // Fault injection: the next ordinary copy must refuse an occupied child path.
        if (directory === archived) await fs.symlink(external, path.join(archived, 'artifact.txt'));
      }) as typeof fs.mkdir,
    })).rejects.toMatchObject({ code: 'EEXIST' });

    await expect(fs.readFile(source, 'utf8')).resolves.toBe('active content');
    await expect(fs.readFile(external, 'utf8')).resolves.toBe('do not overwrite');
    await expect(fs.access(archived)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.access(pendingArchivePath(archived))).rejects.toMatchObject({ code: 'ENOENT' });
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

  it.skipIf(process.platform === 'win32')('restores the original tree and absolute symlink when commit fails', async () => {
    const archived = path.join(root, 'archived');
    const sourceFile = path.join(changeDir, 'artifact.txt');
    const sourceLink = path.join(changeDir, 'absolute-link');
    const externalTarget = path.join(root, 'external.txt');
    await fs.writeFile(sourceFile, 'restore me');
    await fs.writeFile(externalTarget, 'external');
    await fs.symlink(externalTarget, sourceLink);
    const originalLink = await fs.lstat(sourceLink);
    const interrupted = new Error('cannot commit archive');
    const pending = pendingArchivePath(archived);
    let denied = false;
    await expect(moveDirectory(changeDir, archived, {
      rmdir: async (target, options) => {
        if (target === pending && !denied) {
          await expect(fs.readlink(path.join(archived, 'absolute-link'))).resolves.toBe(externalTarget);
          denied = true;
          throw interrupted;
        }
        await fs.rmdir(target, options);
      },
    })).rejects.toBe(interrupted);
    await expect(fs.readFile(sourceFile, 'utf8')).resolves.toBe('restore me');
    await expect(fs.readlink(sourceLink)).resolves.toBe(externalTarget);
    expect((await fs.lstat(sourceLink)).ino).toBe(originalLink.ino);
    await expect(fs.access(archived)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.access(pending)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
