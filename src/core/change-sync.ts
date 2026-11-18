import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileChangeDelta } from './change-compiler.js';
import { modelRoot } from './model/paths.js';
import { parseSemanticModelFiles } from './model/parser.js';
import { writeMinimal } from './model/sync-writer.js';
import type { ChangeDiagnostic } from './semantic-diff.js';
import { PARTITIONS, type Partition } from './model/types.js';
import {
  applySemanticTreeManifest,
  buildManifest,
  readSemanticTree,
  semanticTreeFingerprint,
  MODEL_PATH_PREFIX,
  type PreparedSyncManifestEntry,
  type SyncTransactionFileSystem,
} from './model/transaction.js';

export type PartitionCounts = Record<Partition, number>;

export interface PreparedChangeSync {
  formalFingerprint: string;
  partitions: PartitionCounts;
  manifest: PreparedSyncManifestEntry[];
  warnings: ChangeDiagnostic[];
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

export async function prepareChangeSync(projectRoot: string, changeName: string): Promise<PreparedChangeSync> {
  const before = await readSemanticTree(projectRoot);
  const units = new Map([...before].flatMap(([file, bytes]): [string, Buffer][] => {
    const unit = file.slice(MODEL_PATH_PREFIX.length + 1);
    return unit.split('/').some(part => part.startsWith('.')) ? [] : [[unit, bytes]];
  }));
  const base = parseSemanticModelFiles([...units].map(([file, bytes]) => [file, bytes.toString('utf8')] as const));
  const { compiled } = await compileChangeDelta(projectRoot, changeName, { base, allowAlreadyApplied: true });
  if (!compiled.valid || !compiled.target) {
    throw new Error(compiled.diagnostics.filter(item => item.level === 'ERROR')
      .map(item => `${item.path}: ${item.code}: ${item.message}`).join('\n'));
  }

  const after = await writeMinimal(modelRoot(projectRoot), base, compiled.target, units);
  const manifest = buildManifest(units, after).map(entry => ({ ...entry, path: `${MODEL_PATH_PREFIX}/${entry.path}` }));
  return {
    formalFingerprint: semanticTreeFingerprint(before),
    partitions: countPartitions(manifest),
    manifest,
    warnings: compiled.diagnostics.filter(item => item.level === 'WARNING'),
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
    filesystem?: Partial<SyncTransactionFileSystem>;
    postWrite?: () => Promise<void>;
  } = {},
): Promise<{ partitions: PartitionCounts; files: string[] }> {
  await applySemanticTreeManifest(projectRoot, prepared.formalFingerprint, prepared.manifest, {
    filesystem: options.filesystem,
    postWrite: async () => {
      await pruneEmptyDirectories(projectRoot, prepared.manifest);
      await options.postWrite?.();
    },
  });
  return { partitions: prepared.partitions, files: prepared.manifest.map(entry => entry.path) };
}
