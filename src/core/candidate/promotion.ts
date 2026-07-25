import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { XIRANG_DIR_NAME } from '../config.js';
import { compareUtf8Bytes } from './canonical.js';
import {
  applySemanticDirectoryTransaction,
  buildManifest,
  readSemanticDirectoryTree,
  readSemanticTree,
  recoverSemanticDirectoryTransaction,
  semanticTreeFingerprint,
  SEMANTIC_DIRECTORY_JOURNAL,
  type SemanticDirectoryTransactionFileSystem,
} from '../change-sync.js';
import { readFormalSemanticModel, validateTargetSemanticModel } from '../change-compiler.js';
import {
  createCandidateHistoryRelativePath,
  reserveCandidateHistory,
  type CandidateHistoryReservation,
} from './history.js';
import {
  validateCandidateDirectory,
  validateCandidateSnapshot,
  type CandidateSnapshot,
} from './validator.js';

export interface CandidatePromotionOptions {
  now?: () => Date;
  transactionFilesystem?: Partial<SemanticDirectoryTransactionFileSystem>;
}

export interface CandidatePromotionResult {
  reviewDigest: string;
  historyPath: string;
  files: string[];
}

interface CandidatePromotionMarker {
  schemaVersion: 1;
  historyPath: string;
  reviewDigest: string;
}

const CANDIDATE_PROMOTION_MARKER = 'candidate-promotion.json';

function snapshotTargetTree(snapshot: CandidateSnapshot): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  for (const file of snapshot.files) {
    if (!file.path.startsWith('architecture/') && !file.path.startsWith('specs/')) continue;
    files.set(`${XIRANG_DIR_NAME}/${file.path}`, Buffer.from(file.bytes));
  }
  return files;
}

function buildBytes(snapshot: CandidateSnapshot): Buffer {
  const file = snapshot.files.find(entry => entry.path === 'build.md');
  if (!file) throw new Error('Candidate validation failed: build.md is missing.');
  return Buffer.from(file.bytes);
}

async function stageCandidateTarget(stagingRoot: string, snapshot: CandidateSnapshot): Promise<void> {
  await fs.mkdir(path.join(stagingRoot, 'architecture'), { recursive: true });
  await fs.mkdir(path.join(stagingRoot, 'specs'), { recursive: true });
  for (const file of snapshot.files) {
    if (!file.path.startsWith('architecture/') && !file.path.startsWith('specs/')) continue;
    const target = path.join(stagingRoot, ...file.path.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.bytes);
  }
}

async function exists(target: string): Promise<boolean> {
  return fs.lstat(target).then(() => true, () => false);
}

async function setCandidateWritable(root: string): Promise<void> {
  if (!await exists(root)) return;
  const stat = await fs.lstat(root);
  await fs.chmod(root, stat.isDirectory() ? 0o755 : 0o644);
  if (!stat.isDirectory()) return;
  for (const entry of await fs.readdir(root)) await setCandidateWritable(path.join(root, entry));
}

async function setCandidateReadOnly(root: string): Promise<void> {
  const stat = await fs.lstat(root);
  if (stat.isDirectory()) {
    for (const entry of await fs.readdir(root)) await setCandidateReadOnly(path.join(root, entry));
    await fs.chmod(root, 0o555);
  } else {
    await fs.chmod(root, 0o444);
  }
}

async function preserveRecoveredCandidate(
  projectRoot: string,
  stagingRoot: string,
  source: string,
): Promise<void> {
  const recoveryRoot = path.join(
    projectRoot,
    XIRANG_DIR_NAME,
    'history',
    'recovery',
    path.basename(stagingRoot),
  );
  await fs.mkdir(recoveryRoot, { recursive: true });
  const target = path.join(recoveryRoot, 'candidate');
  if (await exists(target)) {
    await fs.rm(target, { recursive: true, force: true });
  }
  await setCandidateWritable(source);
  await fs.rename(source, target);
}

async function restoreFrozenCandidate(
  projectRoot: string,
  stagingRoot: string,
  activeCandidate: string,
  frozenCandidate: string,
): Promise<void> {
  if (!await exists(frozenCandidate)) return;
  const source = frozenCandidate;
  if (await exists(activeCandidate)) {
    await preserveRecoveredCandidate(projectRoot, stagingRoot, source);
    return;
  }
  await setCandidateWritable(source);
  await fs.rename(source, activeCandidate);
}

async function writePromotionMarker(stagingRoot: string, marker: CandidatePromotionMarker): Promise<void> {
  const target = path.join(stagingRoot, CANDIDATE_PROMOTION_MARKER);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, target);
}

async function recoverCandidatePromotion(projectRoot: string, stagingRoot: string): Promise<void> {
  const markerSource = await fs.readFile(path.join(stagingRoot, CANDIDATE_PROMOTION_MARKER), 'utf8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (markerSource === null) {
    await fs.rm(stagingRoot, { recursive: true, force: true });
    return;
  }
  const marker = JSON.parse(markerSource) as CandidatePromotionMarker;
  if (marker.schemaVersion !== 1 || !/^\.xirang\/history\/builds\/[^/]+$/.test(marker.historyPath)) {
    throw new Error(`Invalid Candidate promotion recovery marker: ${stagingRoot}`);
  }

  const semanticJournal = path.join(stagingRoot, SEMANTIC_DIRECTORY_JOURNAL);
  const semanticState = await exists(semanticJournal)
    ? await recoverSemanticDirectoryTransaction(projectRoot, stagingRoot)
    : 'rolled-back';
  const historyDirectory = path.join(projectRoot, ...marker.historyPath.split('/'));
  try {
    if (semanticState === 'rolled-back') {
      await restoreFrozenCandidate(
        projectRoot,
        stagingRoot,
        path.join(projectRoot, XIRANG_DIR_NAME, 'candidate'),
        path.join(stagingRoot, 'candidate'),
      );
      await fs.rm(historyDirectory, { recursive: true, force: true });
    }
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }
}

export async function recoverPendingCandidatePromotions(projectRootInput: string): Promise<void> {
  const projectRoot = path.resolve(projectRootInput);
  const xirangRoot = path.join(projectRoot, XIRANG_DIR_NAME);
  const entries = await fs.readdir(xirangRoot, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const entry of entries.sort((left, right) => compareUtf8Bytes(left.name, right.name))) {
    if (!entry.isDirectory() || !entry.name.startsWith('.candidate-promotion-')) continue;
    await recoverCandidatePromotion(projectRoot, path.join(xirangRoot, entry.name));
  }
}

function validationError(prefix: string, validation: Awaited<ReturnType<typeof validateCandidateSnapshot>>): Error {
  const detail = validation.result.diagnostics[0];
  return new Error(`${prefix}${detail ? `: ${detail.code}: ${detail.message}` : '.'}`);
}

export async function promoteCandidate(
  projectRootInput: string,
  suppliedDigest: string,
  options: CandidatePromotionOptions = {},
): Promise<CandidatePromotionResult> {
  const projectRoot = path.resolve(projectRootInput);
  await recoverPendingCandidatePromotions(projectRoot);
  const initial = await validateCandidateSnapshot(projectRoot);
  if (!initial.result.valid) throw validationError('Candidate validation failed', initial);
  if (initial.snapshot.reviewDigest !== suppliedDigest) {
    throw new Error(`Candidate review digest mismatch: expected ${suppliedDigest}, received ${initial.snapshot.reviewDigest}.`);
  }

  const xirangRoot = path.join(projectRoot, XIRANG_DIR_NAME);
  const activeCandidate = path.join(xirangRoot, 'candidate');
  const promotedAt = (options.now ?? (() => new Date()))();
  const plannedHistoryPath = createCandidateHistoryRelativePath(promotedAt, suppliedDigest);
  const stagingRoot = path.join(xirangRoot, `.candidate-promotion-${randomUUID()}`);
  const frozenCandidate = path.join(stagingRoot, 'candidate');
  let history: CandidateHistoryReservation | undefined;
  let promotionSucceeded = false;

  await fs.mkdir(stagingRoot, { recursive: false });
  try {
    await writePromotionMarker(stagingRoot, {
      schemaVersion: 1,
      historyPath: plannedHistoryPath,
      reviewDigest: suppliedDigest,
    });
    await fs.rename(activeCandidate, frozenCandidate);
    await setCandidateReadOnly(frozenCandidate);
    const frozen = await validateCandidateDirectory(projectRoot, frozenCandidate);
    if (!frozen.result.valid) throw validationError('Candidate validation failed after snapshot', frozen);
    if (frozen.snapshot.reviewDigest !== suppliedDigest) {
      throw new Error(`Candidate review digest mismatch: expected ${suppliedDigest}, received ${frozen.snapshot.reviewDigest}.`);
    }

    const previousTree = await readSemanticTree(projectRoot);
    const previousFormalFingerprint = semanticTreeFingerprint(previousTree);
    const targetTree = snapshotTargetTree(frozen.snapshot);
    const manifest = buildManifest(previousTree, targetTree);
    await stageCandidateTarget(stagingRoot, frozen.snapshot);
    history = await reserveCandidateHistory(
      projectRoot,
      suppliedDigest,
      buildBytes(frozen.snapshot),
      promotedAt,
      plannedHistoryPath,
    );
    await history.finalize({
      schemaVersion: 1,
      reviewDigest: suppliedDigest,
      promotedAt: promotedAt.toISOString(),
      previousFormalFingerprint,
      previous: {
        architecture: 'previous/architecture',
        specs: 'previous/specs',
      },
    });

    await applySemanticDirectoryTransaction(projectRoot, previousFormalFingerprint, stagingRoot, {
      cleanup: false,
      filesystem: options.transactionFilesystem,
      verifyPrevious: async () => {
        const historyFingerprint = semanticTreeFingerprint(
          await readSemanticDirectoryTree(path.join(history!.directory, 'previous')),
        );
        if (historyFingerprint !== previousFormalFingerprint) {
          throw new Error('Promotion history does not match the complete formal preimage.');
        }
      },
      postWrite: async () => {
        const formal = await readFormalSemanticModel(projectRoot);
        const diagnostics = validateTargetSemanticModel(formal);
        if (diagnostics.some(item => item.level === 'ERROR')) {
          const issue = diagnostics.find(item => item.level === 'ERROR')!;
          throw new Error(`Post-write validation failed: ${issue.code}: ${issue.message}`);
        }

        const current = await validateCandidateDirectory(projectRoot, frozenCandidate);
        if (!current.result.valid) throw validationError('Candidate changed during promotion', current);
        if (current.snapshot.reviewDigest !== suppliedDigest) {
          throw new Error(`Candidate review digest mismatch during promotion: expected ${suppliedDigest}, received ${current.snapshot.reviewDigest}.`);
        }
      },
    });
    promotionSucceeded = true;

    return {
      reviewDigest: suppliedDigest,
      historyPath: history.relativePath,
      files: manifest.map(entry => entry.path),
    };
  } catch (error) {
    try {
      await restoreFrozenCandidate(
        projectRoot,
        stagingRoot,
        activeCandidate,
        frozenCandidate,
      );
    } finally {
      if (!(error instanceof AggregateError)) {
        await history?.discard().catch(() => undefined);
        await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
      }
    }
    throw error;
  } finally {
    if (promotionSucceeded) {
      await setCandidateWritable(frozenCandidate).catch(() => undefined);
      await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
