import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from './change-compiler.js';
import { changeRoot, modelRoot } from './model/paths.js';
import { parseSemanticDelta, type DeltaEntry } from './model/delta.js';
import { writeMinimal } from './model/sync-writer.js';
import type { ParsedModel } from './model/parser.js';
import { PARTITIONS, type Partition, type SemanticModel } from './model/types.js';
import {
  applySemanticTreeManifest,
  buildManifest,
  readSemanticTree,
  semanticTreeFingerprint,
  MODEL_PATH_PREFIX,
  type PreparedSyncManifestEntry,
  type SyncTransactionFileSystem,
} from './model/transaction.js';
import { refreshVerifyEvidenceAfterSync } from './verify/freshness.js';

export type PartitionCounts = Record<Partition, number>;

export interface ChangeSyncState {
  changeName: string;
  changeDir: string;
  entries: DeltaEntry[];
  requiresSync: boolean;
}

export interface PreparedChangeSync {
  state: ChangeSyncState;
  formalFingerprint: string;
  partitions: PartitionCounts;
  manifest: PreparedSyncManifestEntry[];
}

export interface AppliedChangeSyncSummary {
  partitions: PartitionCounts;
  files: string[];
}

export interface PendingChangeSync {
  pending: number;
}

function emptyCounts(): PartitionCounts {
  return Object.fromEntries(PARTITIONS.map(partition => [partition, 0])) as PartitionCounts;
}

function countPartitions(manifest: PreparedSyncManifestEntry[]): PartitionCounts {
  const counts = emptyCounts();
  for (const entry of manifest) {
    const partition = entry.path.slice(MODEL_PATH_PREFIX.length + 1).split('/')[0] as Partition;
    if (partition in counts) counts[partition] += 1;
  }
  return counts;
}

function projectRelative(files: Map<string, Buffer>): Map<string, Buffer> {
  return new Map([...files].map(([file, bytes]) => [`${MODEL_PATH_PREFIX}/${file}`, bytes]));
}

async function targetTree(projectRoot: string, base: ParsedModel, expected: SemanticModel): Promise<Map<string, Buffer>> {
  return projectRelative(await writeMinimal(modelRoot(projectRoot), base, expected));
}

export async function assessChangeSyncState(
  projectRoot: string,
  changeName: string,
): Promise<ChangeSyncState> {
  const changeDir = changeRoot(projectRoot, changeName);
  const parsed = await parseSemanticDelta(changeDir);
  const blocking = parsed.diagnostics.find(item => item.level === 'ERROR');
  if (blocking && parsed.delta.entries.length === 0) {
    throw new Error(`${blocking.code}: ${blocking.message}`);
  }
  return {
    changeName,
    changeDir,
    entries: parsed.delta.entries,
    requiresSync: parsed.delta.entries.length > 0,
  };
}

export async function getPendingChangeSync(
  projectRoot: string,
  state: ChangeSyncState,
): Promise<PendingChangeSync> {
  const { base, compiled } = await compileChangeDelta(projectRoot, state.changeName, { allowAlreadyApplied: true });
  if (!compiled.target) return { pending: state.entries.length };
  const before = await readSemanticTree(projectRoot);
  const after = await targetTree(projectRoot, base, compiled.target);
  return { pending: buildManifest(before, after).length };
}

export async function prepareChangeSync(
  projectRoot: string,
  state: ChangeSyncState,
  options: { skipValidation?: boolean } = {},
): Promise<PreparedChangeSync> {
  const { base, compiled } = await compileChangeDelta(projectRoot, state.changeName);
  if (!compiled.target) {
    throw new Error(compiled.diagnostics.map(item => `${item.code}: ${item.message}`).join('\n'));
  }
  if (!options.skipValidation && !compiled.valid) {
    throw new Error(compiled.diagnostics
      .filter(item => item.level === 'ERROR')
      .map(item => `${item.code}: ${item.message}`)
      .join('\n'));
  }

  const before = await readSemanticTree(projectRoot);
  const after = await targetTree(projectRoot, base, compiled.target);
  const manifest = buildManifest(before, after);
  return {
    state,
    formalFingerprint: semanticTreeFingerprint(before),
    partitions: countPartitions(manifest),
    manifest,
  };
}

/** Unit removal can empty its containing directory; the partition root itself always stays. */
async function pruneEmptyDirectories(projectRoot: string, manifest: PreparedSyncManifestEntry[]): Promise<void> {
  const directories = new Set<string>();
  for (const entry of manifest) {
    if (entry.action !== 'delete') continue;
    const segments = entry.path.split('/');
    for (let depth = segments.length - 1; depth > 3; depth -= 1) {
      directories.add(segments.slice(0, depth).join('/'));
    }
  }
  for (const directory of [...directories].sort((left, right) => right.length - left.length)) {
    await fs.rmdir(path.resolve(projectRoot, ...directory.split('/'))).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY' && error.code !== 'EEXIST') throw error;
    });
  }
}

export async function applyPreparedChangeSync(
  projectRoot: string,
  prepared: PreparedChangeSync,
  options: {
    silent?: boolean;
    filesystem?: Partial<SyncTransactionFileSystem>;
    refreshEvidence?: typeof refreshVerifyEvidenceAfterSync;
  } = {},
): Promise<AppliedChangeSyncSummary> {
  await applySemanticTreeManifest(projectRoot, prepared.formalFingerprint, prepared.manifest, {
    filesystem: options.filesystem,
    postWrite: () => pruneEmptyDirectories(projectRoot, prepared.manifest),
  });

  const files = prepared.manifest.map(entry => entry.path);
  if (!(options.silent ?? false) && files.length > 0) {
    console.log('Semantic Model updated successfully.');
  }

  try {
    await (options.refreshEvidence ?? refreshVerifyEvidenceAfterSync)(
      prepared.state.changeDir,
      projectRoot,
      files,
    );
  } catch (error) {
    throw new Error(
      `Semantic sync committed, but evidence refresh failed; run verify to refresh evidence: ${(error as Error).message}`,
      { cause: error },
    );
  }

  return { partitions: prepared.partitions, files };
}
