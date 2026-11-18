import { describeError, diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { constants, promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { hostname } from 'node:os';
import path from 'path';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { applyPreparedChangeSync, assertPreparedDelta, prepareChangeSync } from './change-sync.js';
import { pendingArchivePath } from './archive-paths.js';
import { QualityEngineError, readQualitySeal } from './quality/engine.js';
import { formatQualityGateFailure } from './quality/state.js';
import { selectActiveChange } from './change-utils.js';
import { validateChangeName } from '../utils/change-utils.js';

export interface ArchiveMoveFileSystem {
  rename: typeof fs.rename;
  copyFile: typeof fs.copyFile;
  chmod: typeof fs.chmod;
  symlink: typeof fs.symlink;
  rm: typeof fs.rm;
  rmdir: typeof fs.rmdir;
  mkdir: typeof fs.mkdir;
  mkdtemp: typeof fs.mkdtemp;
}

async function statIfPresent(location: string) {
  return fs.lstat(location).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
}

const execFileAsync = promisify(execFile);

async function readWindowsLinkType(location: string): Promise<'dir' | 'file' | 'junction'> {
  // Windows stores the directory bit on the link, even when its target does not exist.
  const powershell = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const script = "$ErrorActionPreference = 'Stop'; $file = $env:XIRANG_ARCHIVE_LINK; "
    + "$attrs = [IO.File]::GetAttributes($file); $item = Get-Item -LiteralPath $file -Force; "
    + "if ($item.LinkType -eq 'Junction') { 'junction' } elseif ($attrs -band [IO.FileAttributes]::Directory) { 'dir' } else { 'file' }";
  const { stdout } = await execFileAsync(powershell, ['-NoProfile', '-NonInteractive', '-Command', script], {
    env: { ...process.env, XIRANG_ARCHIVE_LINK: location }, windowsHide: true,
  });
  const type = stdout.trim();
  if (type === 'dir' || type === 'file' || type === 'junction') return type;
  throw new Error(`Cannot determine Windows link type: ${location}`);
}

type ArchivePath = string | Buffer;

const posixPathSeparator = Buffer.from('/');

function childPath(directory: ArchivePath, name: ArchivePath): ArchivePath {
  if (typeof directory === 'string') {
    if (typeof name === 'string') return path.join(directory, name);
    const decoded = name.toString();
    if (name.equals(Buffer.from(decoded))) return path.join(directory, decoded);
  }
  return Buffer.concat([Buffer.from(directory), posixPathSeparator, Buffer.from(name)]);
}

/** Install under the archive lock; the source is exclusive until this transaction completes. */
export async function moveDirectory(
  src: string,
  dest: string,
  overrides: Partial<ArchiveMoveFileSystem> = {},
  options: { apply?: (install: () => Promise<void>) => Promise<void>; json?: boolean } = {},
): Promise<void> {
  const filesystem = { ...fs, ...overrides };
  const windows = process.platform === 'win32';
  const finalizedDirectories: ArchivePath[] = [];
  const remove = (directory: string) => filesystem.rm(directory, { recursive: true, force: true });
  const copyContents = async (from: ArchivePath, to: ArchivePath, mode: number): Promise<void> => {
    const names = windows ? await fs.readdir(from) : await fs.readdir(from, { encoding: 'buffer' });
    for (const name of names) {
      const source = childPath(from, name);
      const target = childPath(to, name);
      const entry = await fs.lstat(source);
      if (entry.isDirectory()) {
        await filesystem.mkdir(target, windows ? undefined : 0o700);
        await copyContents(source, target, entry.mode);
      } else if (entry.isSymbolicLink()) {
        if (windows) {
          await filesystem.symlink(await fs.readlink(source), target, await readWindowsLinkType(String(source)));
        } else {
          await filesystem.symlink(await fs.readlink(source, { encoding: 'buffer' }), target);
        }
      } else if (entry.isFile()) {
        await filesystem.copyFile(source, target, constants.COPYFILE_EXCL);
      } else throw new Error(`Unsupported archive entry type: ${source}`);
    }
    if (!windows) {
      await filesystem.chmod(to, mode & 0o7777);
      finalizedDirectories.push(to);
    }
  };

  const pending = pendingArchivePath(dest);
  await fs.mkdir(pending).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') throw new Error(`Archive is incomplete at ${dest}; inspect the workspace before retrying.`);
    throw error;
  });
  let reserved = false;
  let sourceRoot: string | undefined;
  let captured: string | undefined;
  try {
    await filesystem.mkdir(dest, windows ? undefined : 0o700).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') throw new Error(`Archive '${path.basename(dest)}' already exists.`);
      throw error;
    });
    reserved = true;
    const install = async () => {
      // Rename within the source filesystem so rollback can restore the original tree verbatim.
      sourceRoot = await filesystem.mkdtemp(path.join(path.dirname(src), '.archive-source-'));
      const local = path.join(sourceRoot, path.basename(src));
      await filesystem.rename(src, local);
      captured = local;
      await copyContents(captured, dest, (await fs.lstat(captured)).mode);
      await filesystem.rmdir(pending);
    };
    if (options.apply) await options.apply(install);
    else await install();
  } catch (error) {
    const failures: unknown[] = [];
    if (captured) {
      try {
        await filesystem.rename(captured, src);
        captured = undefined;
      } catch (rollbackError) {
        failures.push(rollbackError, new Error(`Original source retained at ${captured}`));
      }
    }
    try {
      // Keep the marker when a partial destination cannot be removed.
      if (reserved) {
        // Reset only our private destination directories, parent first, so read-only modes cannot block rollback.
        for (const directory of finalizedDirectories.reverse()) await filesystem.chmod(directory, 0o700);
        await remove(dest);
      }
      await filesystem.rmdir(pending);
    } catch (rollbackError) { failures.push(rollbackError); }
    if (sourceRoot && !captured) await filesystem.rmdir(sourceRoot).catch(rollbackError => failures.push(rollbackError));
    if (failures.length) throw new AggregateError([error, ...failures], 'Archive installation failed and rollback was incomplete');
    throw error;
  }
  // Disposal is outside the Formal transaction; it cannot undo a committed archive.
  if (sourceRoot) await remove(sourceRoot).catch(error => {
    diagnostic(`Could not clean archive staging ${sourceRoot}: ${describeError(error)}`, 'ARCHIVE_STAGING_CLEANUP', options.json);
  });
}

const CLAIM_PREFIX = '.archive-lock-';
const CLAIM_HOST = createHash('sha256').update(hostname()).digest('hex').slice(0, 16);

function claimIsLive(name: string): boolean {
  const owner = /^\.archive-lock-([\da-f]{16})-([1-9]\d*)-/.exec(name);
  if (!owner) return false;
  if (owner[1] !== CLAIM_HOST) return true;
  try { process.kill(Number(owner[2]), 0); }
  catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
  return true;
}

async function requireNoCompetingArchive(changesDir: string, ownClaim?: string): Promise<void> {
  const competing = (await fs.readdir(changesDir)).find(name => name !== ownClaim && claimIsLive(name));
  if (competing) {
    throw new Error(`An archive is in progress (${path.join(changesDir, competing)}). Retry once it finishes. If this marker is stale, confirm no archive is running and inspect the workspace before removing it.`);
  }
}

async function withArchiveLock(changesDir: string, commit: () => Promise<void>, json?: boolean): Promise<void> {
  // Publish a unique claim before checking for competitors. Overlapping claims cannot both commit.
  const claim = await fs.mkdtemp(path.join(changesDir, `${CLAIM_PREFIX}${CLAIM_HOST}-${process.pid}-`));
  try {
    await requireNoCompetingArchive(changesDir, path.basename(claim));
    await commit();
  } finally {
    try { await fs.rmdir(claim); }
    catch (error) {
      diagnostic(`Could not release archive lock ${claim}: ${describeError(error)}`, 'ARCHIVE_LOCK_CLEANUP', json);
    }
  }
}

async function findArchivedChange(archiveDir: string, changeName: string, abandon: boolean): Promise<string | undefined> {
  const abandonedDir = path.join(archiveDir, 'abandoned');
  const directories = abandon ? [abandonedDir, archiveDir] : [archiveDir, abandonedDir];
  for (const directory of directories) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    const candidates = entries.filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(entry.name) && entry.name.slice(11) === changeName)
      .map(entry => entry.name).sort().reverse();
    if (candidates.length) {
      const location = path.join(directory, candidates[0]);
      if (await statIfPresent(pendingArchivePath(location))) {
        throw new Error(`Archive is incomplete at ${location}; inspect the workspace before retrying.`);
      }
      return location;
    }
  }
  return undefined;
}

function sealGateError(changeName: string, problem: string): Error {
  return new Error(formatQualityGateFailure({ changedFiles: [], details: [problem] }, undefined, { changeName }));
}

async function requireSeal(directory: string, projectRoot: string, changeName: string): Promise<void> {
  let problem = 'a valid Seal commit is required.';
  try {
    const seal = await readQualitySeal(directory, projectRoot);
    if (seal.valid) return;
  } catch (error) {
    problem = error instanceof QualityEngineError ? `${error.code}: ${error.message}` : describeError(error);
  }
  throw sealGateError(changeName, problem);
}

export interface ArchiveOptions {
  json?: boolean;
  yes?: boolean;
  quick?: boolean;
  abandon?: boolean;
}

export class ArchiveCommand {
  constructor(private readonly filesystem: Partial<ArchiveMoveFileSystem> = {}) {}

  async execute(changeName?: string, options: ArchiveOptions = {}): Promise<void> {
    if (options.quick && options.abandon) throw new Error('--quick and --abandon are mutually exclusive.');
    const projectRoot = process.cwd();
    const changesDir = path.join(projectRoot, XIRANG_DIR_NAME, 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    try {
      await fs.access(changesDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      throw new Error("No Xirang changes directory found. Run 'xirang setup' first.");
    }
    const promptContext = options.json ? { output: process.stderr } : undefined;
    if (!changeName) {
      changeName = await selectActiveChange(changesDir, { message: 'Select a change to archive', ...promptContext }) ?? undefined;
      if (!changeName) {
        diagnostic('No change selected. Aborting.', 'ARCHIVE_CANCELLED', options.json);
        return;
      }
    }
    const name = validateChangeName(changeName);
    if (!name.valid || changeName === 'archive') throw new Error(name.error ?? 'Invalid archive Change name.');
    const changeDir = path.join(changesDir, changeName);
    const active = await statIfPresent(changeDir);
    await requireNoCompetingArchive(changesDir);
    const report = (location: string, alreadyArchived = false) => {
      const archive = path.relative(projectRoot, location);
      if (alreadyArchived && !options.json) diagnostic('Already archived.', 'ARCHIVE_ALREADY_ARCHIVED', false);
      console.log(options.json ? JSON.stringify({ archive, ...(alreadyArchived ? { alreadyArchived } : {}) }) : archive);
    };
    if (!active?.isDirectory()) {
      const existing = await findArchivedChange(archiveDir, changeName, options.abandon === true);
      if (!existing) throw new Error(`Change '${changeName}' not found.`);
      report(existing, true);
      return;
    }

    const parent = options.abandon ? path.join(archiveDir, 'abandoned') : archiveDir;
    const archiveName = `${new Date().toISOString().split('T')[0]}-${changeName}`;
    const archivePath = path.join(parent, archiveName);
    const ensureUnoccupied = async () => {
      const existing = await statIfPresent(archivePath);
      if (existing) throw new Error(`Archive '${archiveName}' already exists.`);
    };
    const move = async (installOptions?: Parameters<typeof moveDirectory>[3]) => {
      await withArchiveLock(changesDir, async () => {
        const current = await fs.lstat(changeDir).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return undefined;
        });
        if (!current?.isDirectory() || current.dev !== active.dev || current.ino !== active.ino) {
          throw new Error(`Active Change '${changeName}' changed before archiving; verify and retry.`);
        }
        await fs.mkdir(parent, { recursive: true });
        await moveDirectory(changeDir, archivePath, this.filesystem, { ...installOptions, json: options.json });
      }, options.json);
    };
    const ask = async (message: string) => {
      const { confirm } = await import('@inquirer/prompts');
      const config = { message, default: false };
      if (await (promptContext ? confirm(config, promptContext) : confirm(config))) return true;
      diagnostic('Archive cancelled.', 'ARCHIVE_CANCELLED', options.json);
      return false;
    };
    await ensureUnoccupied();
    if (options.abandon) {
      const { total, completed } = await getTaskProgressForChange(changesDir, changeName);
      if (completed > 0) diagnostic(`tasks.md: ${completed}/${total} goals checked.`, 'ARCHIVE_PROGRESS', options.json);
      if (!options.yes && !(await ask(`Abandon '${changeName}' and archive it without applying its Semantic Delta?`))) return;
      await move();
    } else {
      if (options.quick) {
        diagnostic('Quality Seal check skipped (--quick).', 'QUALITY_SKIPPED', options.json);
      } else {
        await requireSeal(changeDir, projectRoot, changeName);
      }
      const prepared = await prepareChangeSync(projectRoot, changeName);
      for (const warning of prepared.warnings) diagnostic(`${warning.path}: ${warning.code}: ${warning.message}`, warning.code, options.json);
      const { total, completed } = await getTaskProgressForChange(changesDir, changeName);
      const incomplete = total - completed;
      if (incomplete > 0) {
        const message = `Warning: ${incomplete} incomplete goal(s) found.`;
        if (options.yes) diagnostic(`${message} Continuing due to --yes flag.`, 'INCOMPLETE_GOALS', options.json);
        else if (!(await ask(`${message} Continue?`))) return;
      }
      let cleanupWarnings: string[] = [];
      await move({
        apply: async install => {
          if (!options.quick) await requireSeal(changeDir, projectRoot, changeName);
          await assertPreparedDelta(changeDir, prepared);
          ({ cleanupWarnings } = await applyPreparedChangeSync(projectRoot, prepared, { postWrite: install }));
        },
      });
      for (const warning of cleanupWarnings) diagnostic(warning, 'FORMAL_STAGING_CLEANUP', options.json);
    }
    report(archivePath);
  }
}
