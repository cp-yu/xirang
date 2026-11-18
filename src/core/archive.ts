import { describeError, diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import { createHash } from 'node:crypto';
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
  cp: typeof fs.cp;
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

/** Move the source only into a destination reserved by this invocation. */
export async function moveDirectory(
  src: string,
  dest: string,
  overrides: Partial<ArchiveMoveFileSystem> = {},
  options: { verify?: (directory: string) => Promise<void>; apply?: (install: () => Promise<void>) => Promise<void> } = {},
): Promise<void> {
  const filesystem: ArchiveMoveFileSystem = {
    rename: overrides.rename ?? fs.rename.bind(fs),
    cp: overrides.cp ?? fs.cp.bind(fs),
    rm: overrides.rm ?? fs.rm.bind(fs),
    rmdir: overrides.rmdir ?? fs.rmdir.bind(fs),
    mkdir: overrides.mkdir ?? fs.mkdir.bind(fs),
    mkdtemp: overrides.mkdtemp ?? fs.mkdtemp.bind(fs),
  };
  const remove = (directory: string) => filesystem.rm(directory, { recursive: true, force: true });
  const copy = (from: string, to: string) => filesystem.cp(from, to, {
    recursive: true, force: false, errorOnExist: true, verbatimSymlinks: true,
  });
  const copyIntoReservation = async (from: string, reserved: string) => {
    for (const name of await fs.readdir(from)) await copy(path.join(from, name), path.join(reserved, name));
  };
  const restoreMissing = async (from: string, to: string): Promise<void> => {
    const existing = await statIfPresent(to);
    if (!existing) {
      await copy(from, to);
    } else if (existing.isDirectory() && (await fs.lstat(from)).isDirectory()) {
      for (const name of await fs.readdir(from)) await restoreMissing(path.join(from, name), path.join(to, name));
    }
  };
  const install = async (from: string, reserved: string): Promise<boolean> => {
    try {
      await filesystem.rename(from, reserved);
      return true;
    } catch (error) {
      // Windows can reject replacement of our empty directory even on the same device.
      if (!['EPERM', 'EXDEV', 'EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      return false;
    }
  };
  try {
    await filesystem.mkdir(dest);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`Archive '${path.basename(dest)}' already exists.`);
    throw error;
  }

  const restoreSource = async (from: string): Promise<boolean> => {
    try { await filesystem.mkdir(src); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw error;
    }
    if (!(await install(from, src))) {
      await copyIntoReservation(from, src);
      await remove(from);
    }
    return true;
  };
  let started = false;
  const move = async () => {
    started = true;
    let movedOriginal = false;
    let sourceRoot: string | undefined;
    let captured: string | undefined;
    let temporary: string | undefined;
    let removingCapture = false;
    try {
      movedOriginal = await install(src, dest);
      if (!movedOriginal) {
        // Detach the original on its own filesystem so deleting it cannot delete late edits at src.
        sourceRoot = await filesystem.mkdtemp(path.join(path.dirname(src), '.archive-source-'));
        const local = path.join(sourceRoot, path.basename(src));
        await filesystem.rename(src, local);
        captured = local;
        await options.verify?.(captured);

        temporary = await filesystem.mkdtemp(path.join(path.dirname(dest), `.${path.basename(dest)}-`));
        const staged = path.join(temporary, path.basename(src));
        await copy(captured, staged);
        if (!(await install(staged, dest))) await copyIntoReservation(staged, dest);
        await remove(temporary);
        temporary = undefined;
      }
      await options.verify?.(dest);
      if (captured) await options.verify?.(captured);
      if (await statIfPresent(src)) throw new Error(`Active Change was recreated at ${src} during archiving.`);
      if (captured) {
        removingCapture = true;
        await remove(captured);
      }
    } catch (error) {
      const failures: unknown[] = [];
      let conflict: Error | undefined;
      try {
        const original = movedOriginal ? dest : captured;
        if (captured && removingCapture) await restoreMissing(dest, captured);
        if (original && !(await restoreSource(original))) {
          let retained = original;
          if (movedOriginal) {
            sourceRoot = await filesystem.mkdtemp(path.join(path.dirname(src), '.archive-source-'));
            retained = path.join(sourceRoot, path.basename(src));
            await filesystem.rename(dest, retained);
          }
          conflict = new Error(`Active Change was recreated at ${src}; the original is retained at ${retained}.`, { cause: error });
        }
        if (!movedOriginal) await remove(dest);
      } catch (rollbackError) { failures.push(rollbackError); }
      if (temporary) await remove(temporary).catch(cleanupError => failures.push(cleanupError));
      if (failures.length) throw new AggregateError([conflict ?? error, ...failures], 'Archive installation failed and rollback was incomplete');
      throw conflict ?? error;
    } finally {
      // Never recursively remove the holding directory: it may still contain the only original.
      if (sourceRoot) await filesystem.rmdir(sourceRoot).catch(() => undefined);
    }
  };
  try {
    if (options.apply) await options.apply(move);
    else await move();
  } catch (error) {
    if (!started) {
      try { await filesystem.rmdir(dest); }
      catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Archive failed and the empty reservation could not be removed'); }
    }
    throw error;
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
    const latest = entries.filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(entry.name) && entry.name.slice(11) === changeName)
      .map(entry => entry.name).sort().at(-1);
    if (latest) return path.join(directory, latest);
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
        await moveDirectory(changeDir, archivePath, this.filesystem, installOptions);
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
