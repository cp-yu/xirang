import { describeError, diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { applyPreparedChangeSync, assertPreparedDelta, prepareChangeSync } from './change-sync.js';
import { QualityEngineError, readQualitySeal } from './quality/engine.js';
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
    const existing = await fs.lstat(to).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
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

  let started = false;
  const move = async () => {
    started = true;
    let movedOriginal = false;
    let temporary: string | undefined;
    try {
      movedOriginal = await install(src, dest);
      if (!movedOriginal) {
        temporary = await filesystem.mkdtemp(path.join(path.dirname(dest), `.${path.basename(dest)}-`));
        const staged = path.join(temporary, path.basename(src));
        await copy(src, staged);
        if (!(await install(staged, dest))) await copyIntoReservation(staged, dest);
        await remove(temporary);
        temporary = undefined;
      }
      await options.verify?.(dest);
      if (!movedOriginal) await options.verify?.(src);
    } catch (error) {
      const failures: unknown[] = [];
      if (movedOriginal) {
        try {
          await filesystem.mkdir(src);
          if (!(await install(dest, src))) {
            await copyIntoReservation(dest, src);
            await remove(dest);
          }
        } catch (rollbackError) { failures.push(rollbackError); }
      } else {
        if (temporary) await remove(temporary).catch(cleanupError => failures.push(cleanupError));
        await remove(dest).catch(cleanupError => failures.push(cleanupError));
      }
      if (failures.length) throw new AggregateError([error, ...failures], 'Archive installation failed and rollback was incomplete');
      throw error;
    }
    if (!movedOriginal) {
      try {
        await remove(src);
      } catch (cleanupError) {
        try {
          await restoreMissing(dest, src);
          await remove(dest);
        } catch (rollbackError) {
          throw new AggregateError([cleanupError, rollbackError], 'Failed to clean up the active archive source and roll back the installed destination');
        }
        throw cleanupError;
      }
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
    const active = await fs.lstat(changeDir).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    const report = (location: string, alreadyArchived = false) => {
      const archive = path.relative(projectRoot, location);
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
      const existing = await fs.lstat(archivePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
      });
      if (existing) throw new Error(`Archive '${archiveName}' already exists.`);
    };
    const move = async (installOptions?: Parameters<typeof moveDirectory>[3]) => {
      await fs.mkdir(parent, { recursive: true });
      await moveDirectory(changeDir, archivePath, this.filesystem, installOptions);
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
        let problem: string | undefined;
        try {
          const seal = await readQualitySeal(changeDir, projectRoot);
          if (!seal.valid) problem = 'a valid Seal commit is required.';
        } catch (error) {
          problem = error instanceof QualityEngineError ? `${error.code}: ${error.message}` : describeError(error);
        }
        if (problem) throw new Error(formatQualityGateFailure({ changedFiles: [], details: [problem] }, undefined, { changeName }));
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
      const verifyDelta = (directory: string) => assertPreparedDelta(directory, prepared);
      await verifyDelta(changeDir);
      await move({
        verify: verifyDelta,
        apply: async install => {
          await applyPreparedChangeSync(projectRoot, prepared, {
            postWrite: async () => {
              await verifyDelta(changeDir);
              await install();
            },
          });
        },
      });
    }
    report(archivePath);
  }
}
