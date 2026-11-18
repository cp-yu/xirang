import { diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { applyPreparedChangeSync, prepareChangeSync } from './change-sync.js';
import { readQualitySeal } from './quality/engine.js';
import { selectActiveChange } from './change-utils.js';
import { validateChangeName } from '../utils/change-utils.js';

/**
 * Recursively copy a directory. Used when fs.rename fails (e.g. EPERM on Windows).
 */
export interface ArchiveMoveFileSystem {
  rename: typeof fs.rename;
  cp: typeof fs.cp;
  rm: typeof fs.rm;
  mkdtemp?: typeof fs.mkdtemp;
}

/** Move a change directory without deleting the active source until copy is complete. */
export async function moveDirectory(
  src: string,
  dest: string,
  overrides: Partial<ArchiveMoveFileSystem> = {},
): Promise<void> {
  const filesystem: ArchiveMoveFileSystem = {
    rename: overrides.rename ?? fs.rename.bind(fs),
    cp: overrides.cp ?? fs.cp.bind(fs),
    rm: overrides.rm ?? fs.rm.bind(fs),
    mkdtemp: overrides.mkdtemp ?? fs.mkdtemp.bind(fs),
  };
  try {
    await filesystem.rename(src, dest);
    return;
  } catch (error: any) {
    if (error?.code !== 'EPERM' && error?.code !== 'EXDEV') throw error;
  }

  const temporary = await filesystem.mkdtemp!(path.join(path.dirname(dest), `.${path.basename(dest)}-`));
  try {
    await filesystem.cp(src, temporary, { recursive: true, force: true });
    await filesystem.rename(temporary, dest);
  } catch (error) {
    await filesystem.rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
  try {
    await filesystem.rm(src, { recursive: true, force: true });
  } catch (cleanupError) {
    try {
      await filesystem.cp(dest, src, { recursive: true, force: true });
      await filesystem.rm(dest, { recursive: true, force: true });
    } catch (rollbackError) {
      throw new AggregateError(
        [cleanupError, rollbackError],
        'Failed to clean up the active archive source and roll back the installed destination'
      );
    }
    throw cleanupError;
  }
}

async function findArchivedChange(archiveDir: string, changeName: string): Promise<string | undefined> {
  const candidates = (await Promise.all([archiveDir, path.join(archiveDir, 'abandoned')].map(async directory => {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    return entries.filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(entry.name) && entry.name.slice(11) === changeName)
      .map(entry => ({ name: entry.name, path: path.join(directory, entry.name) }));
  }))).flat();
  return candidates.sort((a, b) => b.name.localeCompare(a.name))[0]?.path;
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
    if (!changeName) {
      changeName = await selectActiveChange(changesDir, { message: 'Select a change to archive' }) ?? undefined;
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
      const existing = await findArchivedChange(archiveDir, changeName);
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
    const move = async () => {
      await fs.mkdir(parent, { recursive: true });
      await ensureUnoccupied();
      await moveDirectory(changeDir, archivePath, this.filesystem);
    };
    const ask = async (message: string) => {
      const { confirm } = await import('@inquirer/prompts');
      if (await confirm({ message, default: false })) return true;
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
        const seal = await readQualitySeal(changeDir, projectRoot);
        if (!seal.valid) throw new Error('Quality gate failed: a valid Seal commit is required.');
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
      await applyPreparedChangeSync(projectRoot, prepared, { postWrite: move });
    }
    report(archivePath);
  }
}
