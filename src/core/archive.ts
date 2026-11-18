import { describeError, diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { constants, promises as fs, type Stats } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { hostname } from 'node:os';
import path from 'path';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { applyPreparedChangeSync, assertPreparedDelta, prepareChangeSync } from './change-sync.js';
import { QUALITY_FILE, QualityEngineError, readQualitySeal } from './quality/engine.js';
import { formatQualityGateFailure } from './quality/state.js';
import { selectActiveChange } from './change-utils.js';
import { validateChangeName } from '../utils/change-utils.js';

export interface ArchiveMoveFileSystem {
  rename: typeof fs.rename;
  copyFile: typeof fs.copyFile;
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

function pendingArchivePath(destination: string): string {
  return path.join(path.dirname(destination), `.${path.basename(destination)}.pending`);
}

const execFileAsync = promisify(execFile);

async function readLinkType(location: string): Promise<'dir' | 'file' | 'junction' | undefined> {
  if (process.platform !== 'win32') return undefined;
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

async function fingerprintChangeTree(root: string): Promise<string> {
  const digest = createHash('sha256');
  const visit = async (directory: string, parent: string): Promise<void> => {
    for (const name of (await fs.readdir(directory)).sort()) {
      const location = path.join(directory, name);
      const relative = parent ? `${parent}/${name}` : name;
      const entry = await fs.lstat(location);
      if (entry.isDirectory()) {
        digest.update(JSON.stringify([relative, 'directory']) + '\n');
        await visit(location, relative);
      } else if (entry.isSymbolicLink()) {
        digest.update(JSON.stringify([relative, 'link', await fs.readlink(location), await readLinkType(location)]) + '\n');
      } else if (entry.isFile()) {
        const bytes = createHash('sha256').update(await fs.readFile(location)).digest('hex');
        digest.update(JSON.stringify([relative, 'file', bytes]) + '\n');
      } else throw new Error(`Unsupported archive entry type: ${location}`);
    }
  };
  await visit(root, '');
  return digest.digest('hex');
}

/** Move the source only into a destination reserved by this invocation. */
export async function moveDirectory(
  src: string,
  dest: string,
  overrides: Partial<ArchiveMoveFileSystem> = {},
  options: { verify?: (directory: string) => Promise<void>; apply?: (install: () => Promise<void>) => Promise<void>; json?: boolean } = {},
): Promise<void> {
  const filesystem: ArchiveMoveFileSystem = {
    rename: overrides.rename ?? fs.rename.bind(fs),
    copyFile: overrides.copyFile ?? fs.copyFile.bind(fs),
    symlink: overrides.symlink ?? fs.symlink.bind(fs),
    rm: overrides.rm ?? fs.rm.bind(fs),
    rmdir: overrides.rmdir ?? fs.rmdir.bind(fs),
    mkdir: overrides.mkdir ?? fs.mkdir.bind(fs),
    mkdtemp: overrides.mkdtemp ?? fs.mkdtemp.bind(fs),
  };
  const remove = (directory: string) => filesystem.rm(directory, { recursive: true, force: true });
  const owned = new Map<string, Stats>();
  const copyEntry = async (source: string, target: string, track = false): Promise<void> => {
    const entry = await fs.lstat(source);
    if (entry.isDirectory()) await filesystem.mkdir(target);
    else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(source);
      await filesystem.symlink(link, target, await readLinkType(source));
    } else if (entry.isFile()) await filesystem.copyFile(source, target, constants.COPYFILE_EXCL);
    else throw new Error(`Unsupported archive entry type: ${source}`);
    if (track) owned.set(target, await fs.lstat(target));
    if (entry.isDirectory()) await copyContents(source, target, track);
  };
  const copyContents = async (from: string, reserved: string, track = false): Promise<void> => {
    for (const name of await fs.readdir(from)) {
      await copyEntry(path.join(from, name), path.join(reserved, name), track);
    }
  };
  const isOwned = (location: string, current: Stats): boolean => {
    const expected = owned.get(location);
    return !!expected && current.ino === expected.ino && current.dev === expected.dev
      && (current.isDirectory() || (current.mtimeMs === expected.mtimeMs && current.size === expected.size));
  };
  const assertOwnedDestination = async () => {
    let observed = 0;
    const visit = async (location: string): Promise<void> => {
      const entry = await statIfPresent(location);
      if (!entry || !isOwned(location, entry)) throw new Error(`Archive destination was populated or changed: ${location}`);
      observed++;
      if (entry.isDirectory()) {
        for (const name of await fs.readdir(location)) await visit(path.join(location, name));
      }
    };
    await visit(dest);
    if (observed !== owned.size) throw new Error(`Archive destination was changed: ${dest}`);
  };
  const clearOwnedDestination = async (location: string): Promise<void> => {
    const entry = await statIfPresent(location);
    if (!entry || !isOwned(location, entry)) return;
    if (entry.isDirectory()) {
      for (const name of await fs.readdir(location)) await clearOwnedDestination(path.join(location, name));
      await filesystem.rmdir(location).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY' && error.code !== 'EEXIST') throw error;
      });
    } else await filesystem.rm(location, { force: true });
  };
  const restoreMissing = async (from: string, to: string): Promise<void> => {
    const existing = await statIfPresent(to);
    if (!existing) {
      await copyEntry(from, to);
    } else if (existing.isDirectory() && (await fs.lstat(from)).isDirectory()) {
      for (const name of await fs.readdir(from)) await restoreMissing(path.join(from, name), path.join(to, name));
    }
  };
  const pending = pendingArchivePath(dest);
  await fs.mkdir(pending).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') throw new Error(`Archive is incomplete at ${dest}; inspect the workspace before retrying.`);
    throw error;
  });
  try {
    await filesystem.mkdir(dest);
  } catch (error) {
    const cause = (error as NodeJS.ErrnoException).code === 'EEXIST'
      ? new Error(`Archive '${path.basename(dest)}' already exists.`) : error;
    try { await fs.rmdir(pending); }
    catch (cleanupError) { throw new AggregateError([cause, cleanupError], 'Could not release the archive reservation marker'); }
    throw cause;
  }

  owned.set(dest, await fs.lstat(dest));
  const clearReservation = async () => {
    await clearOwnedDestination(dest);
    // If anything remains, never let a retry report that path as a successful archive.
    if (!(await statIfPresent(dest))) await fs.rmdir(pending);
  };

  const restoreSource = async (from: string): Promise<boolean> => {
    try { await filesystem.mkdir(src); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw error;
    }
    await copyContents(from, src);
    await remove(from);
    return true;
  };
  let started = false;
  let committedStage: string | undefined;
  const move = async () => {
    started = true;
    let sourceRoot: string | undefined;
    let captured: string | undefined;
    let temporary: string | undefined;
    let staged: string | undefined;
    let removingCapture = false;
    try {
      await assertOwnedDestination();
      // Rename only to a private, absent path on the source filesystem.
      sourceRoot = await filesystem.mkdtemp(path.join(path.dirname(src), '.archive-source-'));
      const local = path.join(sourceRoot, path.basename(src));
      await filesystem.rename(src, local);
      captured = local;
      await options.verify?.(captured);
      const originalFingerprint = await fingerprintChangeTree(captured);

      temporary = await filesystem.mkdtemp(path.join(path.dirname(dest), `.${path.basename(dest)}-`));
      staged = path.join(temporary, path.basename(src));
      await copyEntry(captured, staged);
      await assertOwnedDestination();
      await copyContents(staged, dest, true);
      await options.verify?.(dest);
      await options.verify?.(captured);
      await assertOwnedDestination();
      if (await fingerprintChangeTree(dest) !== originalFingerprint || await fingerprintChangeTree(captured) !== originalFingerprint) {
        throw new Error(`Change artifacts changed during archiving at ${src}; verify the Change and retry.`);
      }
      await assertOwnedDestination();
      if (await statIfPresent(src)) throw new Error(`Active Change was recreated at ${src} during archiving.`);
      removingCapture = true;
      await remove(captured);
      await assertOwnedDestination();
      if (await statIfPresent(src)) throw new Error(`Active Change was recreated at ${src} during archiving.`);
      await fs.rmdir(pending);
    } catch (error) {
      const failures: unknown[] = [];
      let conflict: Error | undefined;
      try {
        if (captured && removingCapture) await restoreMissing(staged!, captured);
        if (captured && !(await restoreSource(captured))) {
          conflict = new Error(`Active Change was recreated at ${src}; the original is retained at ${captured}.`);
        }
      } catch (rollbackError) { failures.push(rollbackError); }
      await clearReservation().catch(rollbackError => failures.push(rollbackError));
      if (temporary && failures.length === 0) await remove(temporary).catch(cleanupError => failures.push(cleanupError));
      else if (staged && removingCapture) failures.push(new Error(`Original backup retained at ${staged}`));
      if (captured && failures.length && await statIfPresent(captured).catch(() => undefined)) {
        failures.push(new Error(`Original source retained at ${captured}`));
      }
      if (failures.length) throw new AggregateError([error, ...(conflict ? [conflict] : []), ...failures], 'Archive installation failed and rollback was incomplete');
      if (conflict) throw new AggregateError([error], conflict.message);
      throw error;
    } finally {
      // Never recursively remove the holding directory: it may still contain the only original.
      if (sourceRoot) await filesystem.rmdir(sourceRoot).catch(() => undefined);
    }
    committedStage = temporary;
  };
  try {
    if (options.apply) await options.apply(move);
    else await move();
  } catch (error) {
    if (!started) {
      try { await clearReservation(); }
      catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Archive failed and the empty reservation could not be removed'); }
    }
    throw error;
  }
  // The verified archive is now committed. Failure to remove its private copy is not rollback.
  if (committedStage) {
    await remove(committedStage).catch(error => {
      diagnostic(`Could not clean archive staging ${committedStage}: ${describeError(error)}`, 'ARCHIVE_STAGING_CLEANUP', options.json);
    });
  }
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

async function requireSealBytes(directory: string, projectRoot: string, changeName: string): Promise<Buffer> {
  let problem = 'a valid Seal commit is required.';
  try {
    const seal = await readQualitySeal(directory, projectRoot);
    if (seal.valid) return seal.bytes;
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
    const report = (location: string, alreadyArchived = false) => {
      const archive = path.relative(projectRoot, location);
      if (alreadyArchived && !options.json) diagnostic('Already archived.', 'ARCHIVE_ALREADY_ARCHIVED', false);
      console.log(options.json ? JSON.stringify({ archive, ...(alreadyArchived ? { alreadyArchived } : {}) }) : archive);
    };
    if (!active?.isDirectory()) {
      await requireNoCompetingArchive(changesDir);
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
        await requireSealBytes(changeDir, projectRoot, changeName);
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
      let sealBytes: Buffer | undefined;
      const verify = async (directory: string) => {
        await assertPreparedDelta(directory, prepared);
        if (!options.quick) {
          const file = path.join(directory, QUALITY_FILE);
          if (!(await statIfPresent(file))?.isFile() || !sealBytes?.equals(await fs.readFile(file))) {
            throw sealGateError(changeName, 'Quality Seal changed after validation.');
          }
        }
      };
      await move({
        verify,
        apply: async install => {
          if (!options.quick) sealBytes = await requireSealBytes(changeDir, projectRoot, changeName);
          await verify(changeDir);
          await applyPreparedChangeSync(projectRoot, prepared, {
            postWrite: async () => {
              await verify(changeDir);
              await install();
            },
          });
        },
      });
    }
    report(archivePath);
  }
}
