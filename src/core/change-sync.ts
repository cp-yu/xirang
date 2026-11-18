import { compileChangeDelta } from './change-compiler.js';
import { changeRoot, modelRoot } from './model/paths.js';
import { parseSemanticModelFiles, readDeltaTree, readModelTree } from './model/parser.js';
import { Validator } from './validation/validator.js';
import { writeMinimal } from './model/sync-writer.js';
import { semanticModelFingerprint, type ChangeDiagnostic } from './semantic-diff.js';
import { PARTITIONS, type Partition } from './model/types.js';
import {
  applySemanticTreeManifest,
  archiveSnapshotFingerprint,
  buildManifest,
  readSyncModelTree,
  MODEL_PATH_PREFIX,
  type PreparedSyncManifestEntry,
  type SyncTransactionFileSystem,
} from './model/transaction.js';

export type PartitionCounts = Record<Partition, number>;

export interface PreparedChangeSync {
  formalFingerprint: string;
  targetFingerprint: string;
  targetModelFingerprint: string;
  verifyPaths: () => Promise<void>;
  deltaFingerprint: string;
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

function parseModelTree(files: ReadonlyMap<string, Buffer>) {
  return parseSemanticModelFiles([...files].map(([file, bytes]) => [file, bytes.toString('utf8')] as const));
}

function verifyTargetModel(files: ReadonlyMap<string, Buffer>, fingerprint: string): void {
  const { model, diagnostics } = parseModelTree(files);
  const errors = diagnostics.filter(item => item.level === 'ERROR');
  if (errors.length) throw new Error(errors.map(item => `${item.path}: ${item.code}: ${item.message}`).join('\n'));
  if (semanticModelFingerprint(model) !== fingerprint) {
    throw new Error('Formal units do not reconstruct the Expected Semantic Model; verify the Delta and its Section boundaries.');
  }
}

export async function prepareChangeSync(projectRoot: string, changeName: string): Promise<PreparedChangeSync> {
  const before = await readSyncModelTree(projectRoot);
  const units = new Map([...before].map(([file, bytes]) => [file.slice(MODEL_PATH_PREFIX.length + 1), bytes]));
  const base = parseModelTree(units);
  const changeDir = changeRoot(projectRoot, changeName);
  const deltaSnapshot = await readDeltaTree(changeDir);
  const files = new Map([...deltaSnapshot].map(([file, bytes]) => [file, bytes.toString('utf8')]));
  const { compiled, delta, sources } = await compileChangeDelta(projectRoot, changeName, {
    base, deltaFiles: files, allowAlreadyApplied: true,
  });
  if (base.model.elements.length === 0 && delta.entries.length > 0) {
    const unit = sources.find(source => source.entities.length > 0);
    throw new Error(`${unit?.path ?? MODEL_PATH_PREFIX}: MISSING_FORMAL_MODEL: cannot apply a Semantic Delta without a Formal model`);
  }
  if (!compiled.valid || !compiled.target) {
    throw new Error(compiled.diagnostics.filter(item => item.level === 'ERROR')
      .map(item => `${item.path}: ${item.code}: ${item.message}`).join('\n'));
  }

  const notation = await new Validator().validateChangeDeltaSpecs(changeDir, { files, allowAlreadyApplied: true });
  if (!notation.valid) {
    throw new Error(notation.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  }
  let verifyPaths!: () => Promise<void>;
  const after = await writeMinimal(modelRoot(projectRoot), base, compiled.target, units, check => { verifyPaths = check; });
  const targetModelFingerprint = semanticModelFingerprint(compiled.target);
  verifyTargetModel(after, targetModelFingerprint);
  const manifest = buildManifest(units, after).map(entry => ({ ...entry, path: `${MODEL_PATH_PREFIX}/${entry.path}` }));
  return {
    formalFingerprint: archiveSnapshotFingerprint(before),
    targetFingerprint: archiveSnapshotFingerprint(after),
    targetModelFingerprint,
    verifyPaths,
    deltaFingerprint: archiveSnapshotFingerprint(deltaSnapshot),
    partitions: countPartitions(manifest),
    manifest,
    warnings: compiled.diagnostics.filter(item => item.level === 'WARNING'),
  };
}

export async function assertPreparedDelta(changeDir: string, prepared: PreparedChangeSync): Promise<void> {
  if (archiveSnapshotFingerprint(await readDeltaTree(changeDir)) !== prepared.deltaFingerprint) {
    throw new Error(`Semantic Delta changed after validation at ${changeDir}; verify the Change and retry`);
  }
}

export async function applyPreparedChangeSync(
  projectRoot: string,
  prepared: PreparedChangeSync,
  options: {
    filesystem?: Partial<SyncTransactionFileSystem>;
    postWrite?: () => Promise<void>;
  } = {},
): Promise<{ partitions: PartitionCounts; files: string[]; cleanupWarnings: string[] }> {
  const cleanupWarnings = await applySemanticTreeManifest(projectRoot, prepared.formalFingerprint, prepared.manifest, {
    filesystem: options.filesystem,
    preWrite: prepared.verifyPaths,
    postWrite: async () => {
      const installed = await readModelTree(modelRoot(projectRoot));
      if (archiveSnapshotFingerprint(installed) !== prepared.targetFingerprint) {
        throw new Error('Installed Formal model does not match the prepared target; verify the model paths and retry');
      }
      verifyTargetModel(installed, prepared.targetModelFingerprint);
      await options.postWrite?.();
    },
  });
  return { partitions: prepared.partitions, files: prepared.manifest.map(entry => entry.path), cleanupWarnings };
}
