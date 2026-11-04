import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  buildCodeManifest,
  compareManifests,
  qualityStateHash,
  readQualityStore,
  transactQuality,
  type CodeManifest,
  type QualityState,
  type SyncCompletionAssociation,
} from './engine.js';
import { evaluateCompletion } from './completion.js';
import { QUALITY_STATE_FILE } from './engine.js';
import type { PreparedSyncManifestEntry } from '../model/transaction.js';

export interface SyncAssociationCapture {
  changeDir: string;
  projectRoot: string;
  sourceVersion: number;
  sourceStateHash: string;
  beforeManifest: CodeManifest;
  planId: string;
  conclusionVersion: number;
  successfulCheckpointId: string;
  outputs: PreparedSyncManifestEntry[];
}

function digest(bytes: Buffer | null): string | null {
  return bytes === null ? null : createHash('sha256').update(bytes).digest('hex');
}

function normalizedPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

export interface SyncAssociationUnavailable {
  unavailable: string;
}

export type SyncAssociationAttempt = SyncAssociationCapture | SyncAssociationUnavailable | null;

export async function captureSyncAssociation(
  changeDir: string,
  projectRoot: string,
  outputs: PreparedSyncManifestEntry[],
): Promise<SyncAssociationAttempt> {
  try {
    await fs.access(path.join(changeDir, QUALITY_STATE_FILE));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    return { unavailable: `QUALITY_STATE_READ_FAILED:${(error as Error).message}` };
  }
  try {
    const store = await readQualityStore(changeDir);
    const evaluation = await evaluateCompletion(changeDir, projectRoot);
    if (evaluation.status !== 'all_done' || evaluation.gaps.length || !evaluation.conclusion || !evaluation.conclusion.complete) {
      return { unavailable: `QUALITY_COMPLETION_NOT_CURRENT:${evaluation.gaps.join(',')}` };
    }
    const successful = evaluation.checkpoints.find(item => item.kind === 'successful' && item.planId === evaluation.conclusion!.planId && item.manifest.hash === evaluation.manifest.hash);
    if (!successful) return { unavailable: 'SUCCESSFUL_CHECKPOINT_NOT_CURRENT' };
    return {
      changeDir,
      projectRoot,
      sourceVersion: store.snapshot.version,
      sourceStateHash: qualityStateHash(store.snapshot.state),
      beforeManifest: evaluation.manifest,
      planId: evaluation.conclusion.planId,
      conclusionVersion: evaluation.conclusion.version,
      successfulCheckpointId: successful.checkpointId,
      outputs: outputs.map(entry => ({ ...entry, path: normalizedPath(entry.path) })),
    };
  } catch (error) {
    return { unavailable: `QUALITY_ASSOCIATION_UNSUPPORTED:${(error as Error).message}` };
  }
}

async function validateOutputs(capture: SyncAssociationCapture, after: CodeManifest): Promise<void> {
  const comparison = await compareManifests(capture.beforeManifest, after);
  const actual = new Set([...comparison.added, ...comparison.deleted, ...comparison.changed]);
  const expected = new Set(capture.outputs.map(item => item.path));
  if (actual.size !== expected.size || [...actual].some(item => !expected.has(item))) {
    throw new Error('SYNC_OUTPUT_MISMATCH');
  }
  const beforeEntries = new Map(capture.beforeManifest.entries.map(item => [item.path, item]));
  const afterEntries = new Map(after.entries.map(item => [item.path, item]));
  for (const output of capture.outputs) {
    const before = beforeEntries.get(output.path);
    const currentAfter = afterEntries.get(output.path);
    if ((before?.contentHash ?? null) !== digest(output.preimage) || (currentAfter?.contentHash ?? null) !== digest(output.postimage) || (currentAfter && currentAfter.mode !== '100644')) {
      throw new Error('SYNC_OUTPUT_MISMATCH');
    }
    if (output.action === 'delete' ? currentAfter !== undefined : currentAfter === undefined) {
      throw new Error('SYNC_OUTPUT_MISMATCH');
    }
  }
}

export async function persistSyncAssociation(attempt: SyncAssociationAttempt): Promise<void> {
  if (!attempt) return;
  if ('unavailable' in attempt) throw new Error(attempt.unavailable);
  const capture = attempt;
  const afterManifest = await buildCodeManifest(capture.projectRoot);
  await validateOutputs(capture, afterManifest);
  const store = await readQualityStore(capture.changeDir);
  if (store.snapshot.version !== capture.sourceVersion || qualityStateHash(store.snapshot.state) !== capture.sourceStateHash) {
    throw new Error('SYNC_SOURCE_STATE_CHANGED');
  }
  const state = store.snapshot.state;
  const association: SyncCompletionAssociation = {
    associationId: `SYN-${randomUUID()}`,
    version: store.snapshot.version + 1,
    createdAt: new Date().toISOString(),
    sourceVersion: capture.sourceVersion,
    sourceStateHash: capture.sourceStateHash,
    planId: capture.planId,
    conclusionVersion: capture.conclusionVersion,
    successfulCheckpointId: capture.successfulCheckpointId,
    beforeManifest: capture.beforeManifest,
    afterManifest,
    outputs: capture.outputs.map(item => ({ path: item.path, action: item.action, preimageHash: digest(item.preimage), postimageHash: digest(item.postimage) })),
  };
  const result = await transactQuality(capture.changeDir, store.snapshot.version, 'sync.associate', { associationId: association.associationId, outputs: association.outputs, association }, {
    ...state,
    syncAssociations: [...(state.syncAssociations ?? []), association],
  });
  association.version = result.snapshot.version;
}

export async function completionManifestForSyncAssociation(state: QualityState, current: CodeManifest): Promise<CodeManifest | undefined> {
  const associations = state.syncAssociations ?? [];
  for (const association of [...associations].reverse()) {
    if (association.sourceStateHash !== qualityStateHash(state)) continue;
    const plan = state.completion?.plan;
    const conclusion = state.completion?.conclusion;
    const successful = state.checkpoints?.find(item => item.checkpointId === association.successfulCheckpointId);
    if (!plan || !conclusion || plan.planId !== association.planId || conclusion.planId !== association.planId || conclusion.version !== association.conclusionVersion || !conclusion.complete || !successful || successful.kind !== 'successful' || successful.planId !== association.planId) continue;
    if (!(await compareManifests(association.afterManifest, current)).equal) continue;
    const beforeAfter = await compareManifests(association.beforeManifest, association.afterManifest);
    const expected = new Set(association.outputs.map(item => normalizedPath(item.path)));
    const changed = new Set([...beforeAfter.added, ...beforeAfter.deleted, ...beforeAfter.changed]);
    if (changed.size !== expected.size || [...changed].some(item => !expected.has(item))) continue;
    return association.beforeManifest;
  }
  return undefined;
}

export const syncAssociationTestHooks = { validateOutputs };
