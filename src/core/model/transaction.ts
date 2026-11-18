import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { XIRANG_DIR_NAME } from '../config.js';
import { describeError } from '../../utils/output.js';
import { MODEL_DIR_NAME, modelRoot } from './paths.js';
import { readModelTree } from './parser.js';
import { PARTITIONS } from './types.js';

export const SEMANTIC_PARTITIONS: readonly string[] = PARTITIONS;

/** Project-relative POSIX prefix every Semantic Model file shares. */
export const MODEL_PATH_PREFIX = `${XIRANG_DIR_NAME}/${MODEL_DIR_NAME}`;

export interface PreparedSyncManifestEntry {
  path: string;
  action: 'write' | 'delete';
  preimage: Buffer | null;
  postimage: Buffer | null;
}

export type SyncTransactionFileSystem = Pick<
  typeof fs,
  'mkdir' | 'mkdtemp' | 'lstat' | 'readFile' | 'rename' | 'rm' | 'rmdir' | 'writeFile' | 'chmod'
>;

interface StagedModelUnit {
  entry: PreparedSyncManifestEntry;
  directory: string;
  backup?: string;
  written?: Buffer | null;
}

export interface SemanticTreeTransactionOptions {
  filesystem?: Partial<SyncTransactionFileSystem>;
  preWrite?: () => Promise<void>;
  postWrite?: () => Promise<void>;
}

export type SemanticDirectoryTransactionFileSystem = Pick<
  typeof fs,
  'mkdir' | 'rename' | 'rm' | 'stat'
>;

export interface SemanticDirectoryTransactionOptions {
  filesystem?: Partial<SemanticDirectoryTransactionFileSystem>;
  cleanup?: boolean;
  verifyPrevious?: (previousRoot: string) => Promise<void>;
  postWrite?: () => Promise<void>;
}

interface SemanticDirectoryTransactionJournal {
  schemaVersion: 1;
  state: 'prepared' | 'committed';
  formalFingerprint: string;
  targetFingerprint: string;
  targetFingerprints: Record<string, string>;
  backupDirectory: string;
  existed: Record<string, boolean>;
}

export const SEMANTIC_DIRECTORY_JOURNAL = 'semantic-transaction.json';

async function writeSemanticDirectoryJournal(
  stagingRoot: string,
  journal: SemanticDirectoryTransactionJournal,
): Promise<void> {
  const target = path.join(stagingRoot, SEMANTIC_DIRECTORY_JOURNAL);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(journal, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, target);
}

async function pathExists(target: string): Promise<boolean> {
  return fs.lstat(target).then(() => true, () => false);
}

async function semanticSubtreeFingerprint(semanticRoot: string, name: string): Promise<string> {
  const prefix = `${MODEL_PATH_PREFIX}/${name}/`;
  const tree = await readSemanticDirectoryTree(semanticRoot);
  return semanticTreeFingerprint(new Map([...tree].filter(([file]) => file.startsWith(prefix))));
}

async function preserveConcurrentFormalDirectory(
  projectRoot: string,
  stagingRoot: string,
  name: string,
): Promise<void> {
  const source = path.join(modelRoot(projectRoot), name);
  if (!await pathExists(source)) return;
  const recoveryRoot = path.join(
    projectRoot,
    XIRANG_DIR_NAME,
    'history',
    'recovery',
    path.basename(stagingRoot),
  );
  await fs.mkdir(recoveryRoot, { recursive: true });
  await fs.rename(source, path.join(recoveryRoot, name));
}

export async function recoverSemanticDirectoryTransaction(
  projectRoot: string,
  stagingRoot: string,
): Promise<'committed' | 'rolled-back'> {
  const journal = JSON.parse(
    await fs.readFile(path.join(stagingRoot, SEMANTIC_DIRECTORY_JOURNAL), 'utf8'),
  ) as SemanticDirectoryTransactionJournal;
  if (journal.schemaVersion !== 1 || !['prepared', 'committed'].includes(journal.state)) {
    throw new Error(`Invalid semantic transaction journal: ${stagingRoot}`);
  }
  if (journal.state === 'committed') return 'committed';

  const formalRoot = modelRoot(projectRoot);
  const backupRoot = path.join(stagingRoot, journal.backupDirectory);
  for (const name of SEMANTIC_PARTITIONS) {
    const formal = path.join(formalRoot, name);
    const backup = path.join(backupRoot, name);
    const staged = path.join(stagingRoot, name);
    if (await pathExists(backup)) {
      if (await pathExists(formal)) {
        const actual = await semanticSubtreeFingerprint(formalRoot, name);
        if (actual === journal.targetFingerprints[name]) {
          await fs.rm(formal, { recursive: true, force: true });
        } else {
          await preserveConcurrentFormalDirectory(projectRoot, stagingRoot, name);
        }
      }
      await fs.rename(backup, formal);
      continue;
    }
    if (journal.existed[name]) {
      if (!await pathExists(formal)) {
        throw new Error(`Cannot recover semantic transaction: previous ${name} directory is missing.`);
      }
      continue;
    }
    if (!await pathExists(staged) && await pathExists(formal)) {
      const actual = await semanticSubtreeFingerprint(formalRoot, name);
      if (actual === journal.targetFingerprints[name]) {
        await fs.rm(formal, { recursive: true, force: true });
      } else {
        await preserveConcurrentFormalDirectory(projectRoot, stagingRoot, name);
      }
    }
  }
  return 'rolled-back';
}

export async function applySemanticDirectoryTransaction(
  projectRoot: string,
  formalFingerprint: string,
  stagingRoot: string,
  options: SemanticDirectoryTransactionOptions = {},
): Promise<void> {
  const filesystem: SemanticDirectoryTransactionFileSystem = {
    mkdir: fs.mkdir,
    rename: fs.rename,
    rm: fs.rm,
    stat: fs.stat,
    ...options.filesystem,
  };
  const currentFingerprint = semanticTreeFingerprint(await readSemanticTree(projectRoot));
  if (currentFingerprint !== formalFingerprint) {
    throw new Error('Prepared sync is stale: Semantic Model changed after validation');
  }

  const formalRoot = modelRoot(projectRoot);
  const backupDirectory = `.backup-${randomUUID()}`;
  const backupRoot = path.join(stagingRoot, backupDirectory);
  const names = SEMANTIC_PARTITIONS;
  const existed = new Map<string, boolean>();
  const backedUp = new Set<string>();
  const installed = new Set<string>();
  await filesystem.mkdir(backupRoot, { recursive: true });
  await filesystem.mkdir(formalRoot, { recursive: true });
  for (const name of names) {
    const source = path.join(stagingRoot, name);
    if (!(await filesystem.stat(source)).isDirectory()) {
      throw new Error(`Semantic directory staging is missing ${name}.`);
    }
    const destination = path.join(formalRoot, name);
    existed.set(name, await filesystem.stat(destination).then(() => true, () => false));
  }
  const targetFingerprint = semanticTreeFingerprint(await readSemanticDirectoryTree(stagingRoot));
  const targetFingerprints: Record<string, string> = {};
  for (const name of names) targetFingerprints[name] = await semanticSubtreeFingerprint(stagingRoot, name);
  const journal: SemanticDirectoryTransactionJournal = {
    schemaVersion: 1,
    state: 'prepared',
    formalFingerprint,
    targetFingerprint,
    targetFingerprints,
    backupDirectory,
    existed: Object.fromEntries(names.map(name => [name, existed.get(name) ?? false])),
  };
  await writeSemanticDirectoryJournal(stagingRoot, journal);

  try {
    for (const name of names) {
      if (!existed.get(name)) continue;
      await filesystem.rename(path.join(formalRoot, name), path.join(backupRoot, name));
      backedUp.add(name);
    }
    const verifyPrevious = async (): Promise<void> => {
      const backupFingerprint = semanticTreeFingerprint(await readSemanticDirectoryTree(backupRoot));
      if (backupFingerprint !== formalFingerprint) {
        throw new Error('Semantic Model changed while promotion was preparing its preimage.');
      }
      await options.verifyPrevious?.(backupRoot);
    };
    await verifyPrevious();
    for (const name of names) {
      await filesystem.rename(path.join(stagingRoot, name), path.join(formalRoot, name));
      installed.add(name);
    }
    const assertInstalledTarget = async (): Promise<void> => {
      const installedFingerprint = semanticTreeFingerprint(await readSemanticTree(projectRoot));
      if (installedFingerprint !== targetFingerprint) {
        throw new Error('Installed Semantic Model does not exactly match the staged target.');
      }
    };
    await assertInstalledTarget();
    await options.postWrite?.();
    await assertInstalledTarget();
    await verifyPrevious();
    await writeSemanticDirectoryJournal(stagingRoot, { ...journal, state: 'committed' });
  } catch (error) {
    const rollbackErrors: Error[] = [];
    for (const name of [...names].reverse()) {
      if (!installed.has(name)) continue;
      try {
        const formal = path.join(formalRoot, name);
        if (!await pathExists(formal)) continue;
        const actual = await semanticSubtreeFingerprint(formalRoot, name);
        if (actual === targetFingerprints[name]) {
          await filesystem.rm(formal, { recursive: true, force: true });
        } else {
          await preserveConcurrentFormalDirectory(projectRoot, stagingRoot, name);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError as Error);
      }
    }
    for (const name of names) {
      if (!backedUp.has(name)) continue;
      try {
        const formal = path.join(formalRoot, name);
        if (await pathExists(formal)) {
          await preserveConcurrentFormalDirectory(projectRoot, stagingRoot, name);
        }
        await filesystem.rename(path.join(backupRoot, name), formal);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError as Error);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error as Error, ...rollbackErrors],
        `Semantic directory sync failed and rollback was incomplete: ${(error as Error).message}`,
      );
    }
    if (options.cleanup !== false) {
      await filesystem.rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
    }
    throw error;
  }

  if (options.cleanup !== false) {
    await filesystem.rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function applySemanticTreeManifest(
  projectRoot: string,
  formalFingerprint: string,
  manifest: PreparedSyncManifestEntry[],
  options: SemanticTreeTransactionOptions = {},
): Promise<string[]> {
  const filesystem = transactionFileSystem(options.filesystem);
  const currentFingerprint = semanticTreeFingerprint(await readSyncModelTree(projectRoot));
  if (currentFingerprint !== formalFingerprint) {
    throw new Error('Prepared sync is stale: Semantic Model changed after validation');
  }
  await options.preWrite?.();
  await assertManifestPreimages(projectRoot, manifest, filesystem);

  const staged: StagedModelUnit[] = [];
  const createdDirectories: string[] = [];
  try {
    for (const entry of manifest) await applyManifestEntry(projectRoot, entry, filesystem, createdDirectories, staged);
    await options.postWrite?.();
  } catch (error) {
    const rollbackErrors = await rollbackManifest(projectRoot, staged, filesystem);
    for (const directory of createdDirectories.reverse()) {
      try {
        await filesystem.rmdir(directory);
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') rollbackErrors.push(cause as Error);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], 'Semantic sync failed and rollback was incomplete');
    }
    throw error;
  }

  const warnings: string[] = [];
  for (const unit of staged) {
    await removeModelStaging(unit, filesystem).catch(error => {
      warnings.push(`Could not clean Formal staging ${unit.directory}: ${describeError(error)}`);
    });
  }
  return warnings;
}

export async function readSemanticDirectoryTree(semanticRoot: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const visit = async (directory: string, relative: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(file, child);
      else files.set(`${MODEL_PATH_PREFIX}/${child}`, await fs.readFile(file));
    }
  };
  for (const partition of SEMANTIC_PARTITIONS) await visit(path.join(semanticRoot, partition), partition);
  return files;
}

export async function readSemanticTree(projectRoot: string): Promise<Map<string, Buffer>> {
  return readSemanticDirectoryTree(modelRoot(projectRoot));
}

/** The patch transaction uses exactly the units visible to a Formal model reader. */
export async function readSyncModelTree(projectRoot: string): Promise<Map<string, Buffer>> {
  const units = await readModelTree(modelRoot(projectRoot));
  return new Map([...units].map(([file, bytes]) => [`${MODEL_PATH_PREFIX}/${file}`, bytes]));
}

export function semanticTreeFingerprint(files: Map<string, Buffer>): string {
  const hash = createHash('sha256');
  for (const [file, content] of [...files].sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))) {
    hash.update(file);
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function buildManifest(
  before: Map<string, Buffer>,
  after: Map<string, Buffer>,
): PreparedSyncManifestEntry[] {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  return paths.flatMap(relativePath => {
    const preimage = before.get(relativePath) ?? null;
    const postimage = after.get(relativePath) ?? null;
    if (preimage !== null && postimage !== null && preimage.equals(postimage)) return [];
    if (preimage === null && postimage === null) return [];
    return [{
      path: relativePath,
      action: postimage === null ? 'delete' as const : 'write' as const,
      preimage,
      postimage,
    }];
  });
}

function transactionFileSystem(overrides?: Partial<SyncTransactionFileSystem>): SyncTransactionFileSystem {
  return {
    mkdir: overrides?.mkdir ?? fs.mkdir.bind(fs),
    mkdtemp: overrides?.mkdtemp ?? fs.mkdtemp.bind(fs),
    lstat: overrides?.lstat ?? fs.lstat.bind(fs),
    readFile: overrides?.readFile ?? fs.readFile.bind(fs),
    rename: overrides?.rename ?? fs.rename.bind(fs),
    rm: overrides?.rm ?? fs.rm.bind(fs),
    rmdir: overrides?.rmdir ?? fs.rmdir.bind(fs),
    writeFile: overrides?.writeFile ?? fs.writeFile.bind(fs),
    chmod: overrides?.chmod ?? fs.chmod.bind(fs),
  };
}

async function assertManifestPreimages(
  projectRoot: string,
  manifest: PreparedSyncManifestEntry[],
  filesystem: SyncTransactionFileSystem,
): Promise<void> {
  for (const entry of manifest) await assertManifestPreimage(projectRoot, entry, filesystem);
}

function sameBytes(left: Buffer | null, right: Buffer | null): boolean {
  return left === null || right === null ? left === right : left.equals(right);
}

async function assertManifestPreimage(projectRoot: string, entry: PreparedSyncManifestEntry, filesystem: SyncTransactionFileSystem) {
  const current = await readOptionalBuffer(resolveManifestPath(projectRoot, entry.path), filesystem);
  if (!sameBytes(current, entry.preimage)) throw new Error(`Prepared sync is stale: ${entry.path} changed after validation`);
}

async function applyManifestEntry(
  projectRoot: string,
  entry: PreparedSyncManifestEntry,
  filesystem: SyncTransactionFileSystem,
  createdDirectories: string[],
  staged: StagedModelUnit[],
): Promise<void> {
  const target = resolveManifestPath(projectRoot, entry.path);
  const parent = path.dirname(target);
  const missing: string[] = [];
  for (let directory = parent; ; directory = path.dirname(directory)) {
    try { await filesystem.lstat(directory); break; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    missing.push(directory);
    if (directory === path.dirname(directory)) throw new Error(`Cannot find an existing parent of ${target}`);
  }
  for (const directory of missing.reverse()) {
    await filesystem.mkdir(directory);
    createdDirectories.push(directory);
  }
  const directory = await filesystem.mkdtemp(path.join(parent, '.xirang-sync-'));
  const unit: StagedModelUnit = { entry, directory };
  staged.push(unit);
  const replacement = path.join(directory, 'unit');
  if (entry.postimage !== null) {
    await filesystem.writeFile(replacement, entry.postimage, { flag: 'wx' });
    if (entry.preimage !== null) await filesystem.chmod(replacement, (await filesystem.lstat(target)).mode & 0o777);
  }
  await assertManifestPreimage(projectRoot, entry, filesystem);
  if (entry.preimage !== null) {
    // Keep the original inode so rollback restores metadata as well as bytes.
    const backup = path.join(directory, 'original');
    await filesystem.rename(target, backup);
    unit.backup = backup;
    unit.written = null;
  }
  if (entry.postimage !== null) {
    await filesystem.rename(replacement, target);
    unit.written = entry.postimage;
  }
}

function removeModelStaging(unit: StagedModelUnit, filesystem: SyncTransactionFileSystem): Promise<void> {
  return filesystem.rm(unit.directory, { force: true, recursive: true });
}

async function rollbackManifest(
  projectRoot: string,
  staged: StagedModelUnit[],
  filesystem: SyncTransactionFileSystem,
): Promise<Error[]> {
  const errors: Error[] = [];
  for (const unit of [...staged].reverse()) {
    const { entry, backup, written } = unit;
    const target = resolveManifestPath(projectRoot, entry.path);
    try {
      if (written !== undefined) {
        if (!sameBytes(await readOptionalBuffer(target, filesystem), written)) {
          throw new Error(`Cannot roll back ${entry.path}: the installed model unit changed outside this transaction`);
        }
        if (written !== null) await filesystem.rm(target, { force: true });
        if (backup) await filesystem.rename(backup, target);
      }
      await removeModelStaging(unit, filesystem);
    } catch (error) {
      errors.push(new AggregateError([error], `Could not restore or clean up ${entry.path}; inspect ${unit.directory}`));
    }
  }
  return errors;
}

function resolveManifestPath(projectRoot: string, relativePath: string): string {
  if (path.posix.isAbsolute(relativePath) || path.posix.normalize(relativePath) !== relativePath) {
    throw new Error(`Invalid prepared sync path: ${relativePath}`);
  }
  const allowed = SEMANTIC_PARTITIONS.some(partition => relativePath.startsWith(`${MODEL_PATH_PREFIX}/${partition}/`));
  if (!allowed) throw new Error(`Prepared sync path is outside Semantic Model: ${relativePath}`);
  return path.resolve(projectRoot, ...relativePath.split('/'));
}

async function readOptionalBuffer(
  filePath: string,
  filesystem: Pick<SyncTransactionFileSystem, 'lstat' | 'readFile'>,
): Promise<Buffer | null> {
  try {
    if (!(await filesystem.lstat(filePath)).isFile()) throw new Error(`Sync target path collision: ${filePath} is not a regular model file`);
    return await filesystem.readFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return null;
    throw error;
  }
}
