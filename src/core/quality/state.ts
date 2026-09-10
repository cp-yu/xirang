import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { QUALITY_LOG_FILE, QUALITY_RECORD_FILES, QUALITY_STATE_FILE, readQualityLog, readQualitySnapshot, writeQualityRecord } from './log.js';
import type {
  ArchiveCompatibility,
  EvidenceFingerprint,
  EvidenceFingerprintEntry,
  OptimizationLedger,
  OptimizationTerminal,
  QualityRecord,
  QualityState,
} from './types.js';

const execFileAsync = promisify(execFile);

export const CONTRACT_VERSION = '1.0';
export const REVIEW_PASS_RESULTS = new Set(['PASS', 'PASS_WITH_WARNINGS']);
export const ARCHIVE_COMPATIBLE_TERMINALS = new Set<OptimizationTerminal>([
  'SKIPPED',
  'NOT_NEEDED',
  'IMPROVED',
  'DEGRADED',
]);

interface QualityGateFailureContext {
  changeName?: string;
  command?: 'sync' | 'archive';
}

export async function computeTasksFileHash(tasksPath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(tasksPath);
    return createHash('sha256').update(content).digest('hex');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function computeEvidenceFingerprint(
  evidenceFiles: string[],
  projectRoot: string
): Promise<EvidenceFingerprint> {
  const root = path.resolve(projectRoot);
  const skippedFiles: string[] = [];
  const entries: EvidenceFingerprintEntry[] = [];

  for (const original of [...evidenceFiles].sort()) {
    const filePath = resolveEvidencePath(root, original);
    const relativePath = toPosixRelative(root, filePath);
    if (QUALITY_RECORD_FILES.includes(path.basename(filePath))) {
      skippedFiles.push(relativePath);
      continue;
    }

    try {
      const content = await fs.readFile(filePath);
      entries.push({
        path: relativePath,
        hash: createHash('sha256').update(content).digest('hex'),
      });
    } catch (error: any) {
      if (error?.code === 'ENOENT' || error?.code === 'EISDIR') {
        skippedFiles.push(relativePath);
        continue;
      }
      throw error;
    }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    hash: computeEntriesFingerprint(entries),
    skippedFiles,
    entries,
  };
}

export function normalizeLedger(ledger: OptimizationLedger): OptimizationLedger {
  return {
    ...ledger,
    directions: Array.isArray(ledger.directions) ? ledger.directions : [],
    histories: Array.isArray(ledger.histories) ? ledger.histories : [],
    directionsUsed: typeof ledger.directionsUsed === 'number' ? ledger.directionsUsed : 0,
  };
}

function normalizeRecord(record: QualityRecord): QualityRecord {
  return record.optimization
    ? { ...record, optimization: normalizeLedger(record.optimization) }
    : record;
}

export async function checkQualityState(
  changeDir: string,
  projectRoot: string
): Promise<QualityState> {
  const snapshot = await readQualitySnapshot(changeDir);
  if (!snapshot) {
    return {
      status: 'dirty',
      changedFiles: [],
      details: [`${QUALITY_STATE_FILE} is missing`],
      information: {},
    };
  }

  const log = await readQualityLog(changeDir);
  if (!log.some((entry) => isSameRecord(entry, snapshot))) {
    return {
      status: 'dirty',
      record: normalizeRecord(snapshot),
      changedFiles: [],
      details: [
        `${QUALITY_STATE_FILE} has no matching entry in ${QUALITY_LOG_FILE} — refusing to trust a partially written record`,
      ],
      information: await gitHeadInformation(snapshot, projectRoot),
    };
  }

  for (const candidate of [snapshot, ...log.slice().reverse()]) {
    if (!REVIEW_PASS_RESULTS.has(candidate.result)) {
      continue;
    }
    if (candidate.verificationContext?.contractVersion !== CONTRACT_VERSION) {
      continue;
    }
    const fingerprint = await computeEvidenceFingerprint(
      candidate.verificationContext?.evidenceFiles ?? [],
      projectRoot
    );
    if (fingerprint.entries.length === 0) {
      continue;
    }
    if (fingerprint.hash !== candidate.verificationContext?.evidenceFingerprint) {
      continue;
    }
    return {
      status: 'clean',
      record: normalizeRecord(candidate),
      changedFiles: [],
      details: [],
      information: await gitHeadInformation(candidate, projectRoot),
    };
  }

  const fingerprint = await computeEvidenceFingerprint(
    snapshot.verificationContext?.evidenceFiles ?? [],
    projectRoot
  );
  return {
    status: 'dirty',
    record: normalizeRecord(snapshot),
    changedFiles: collectChangedFiles(snapshot, fingerprint),
    details: ['the current workspace does not match any passing review record'],
    information: await gitHeadInformation(snapshot, projectRoot),
  };
}

export function checkArchiveCompatibility(record: QualityRecord): ArchiveCompatibility {
  const terminal = record.optimization?.terminal;
  if (!terminal) {
    return { compatible: false, blockReason: 'NOT_FINALIZED' };
  }
  if (terminal === 'ABORTED_UNSAFE') {
    return { compatible: false, blockReason: 'ABORTED_UNSAFE' };
  }
  if (!ARCHIVE_COMPATIBLE_TERMINALS.has(terminal)) {
    return { compatible: false, blockReason: 'NOT_FINALIZED' };
  }
  return { compatible: true };
}

export function formatQualityGateFailure(
  state: QualityState,
  archiveCompatibility?: ArchiveCompatibility,
  context: QualityGateFailureContext = {}
): string {
  const changeName = context.changeName ?? '<change-name>';
  const command = context.command ?? 'sync';
  const lines = [`✗ Quality gate failed — ${summarizeFailure(state, archiveCompatibility)}`];

  if (state.changedFiles.length > 0) {
    lines.push('', '  Evidence file fingerprint mismatch:');
    for (const file of state.changedFiles) {
      lines.push(`    - ${file}`);
    }
  }

  if (archiveCompatibility && !archiveCompatibility.compatible) {
    lines.push('', '  Archive compatibility:', `    ${archiveCompatibility.blockReason}`);
  }

  if (state.details.length > 0) {
    lines.push('', '  Other diagnostics:');
    for (const detail of state.details) {
      lines.push(`    - ${detail}`);
    }
  }

  lines.push(
    '',
    '  Suggested actions:',
    `    xirang quality review ${changeName}`,
    `    xirang ${command} ${changeName} --no-verify`
  );
  return lines.join('\n');
}

export async function refreshQualityEvidenceAfterSync(
  changeDir: string,
  projectRoot: string,
  syncedFiles: string[]
): Promise<void> {
  if (syncedFiles.length === 0) {
    return;
  }

  const snapshot = await readQualitySnapshot(changeDir);
  const recordedEntries = snapshot?.verificationContext?.evidenceFingerprintEntries;
  if (!snapshot || !Array.isArray(recordedEntries) || recordedEntries.length === 0) {
    return;
  }

  const root = path.resolve(projectRoot);
  const syncedPaths = new Set(syncedFiles.map((filePath) => normalizeEvidencePath(root, filePath)));

  let changed = false;
  const refreshedEntries = await Promise.all(
    recordedEntries.map(async (entry) => {
      if (!syncedPaths.has(normalizeEvidencePath(root, entry.path))) {
        return entry;
      }
      const nextHash = await hashEvidenceFile(root, entry.path);
      if (nextHash !== entry.hash) {
        changed = true;
      }
      return { ...entry, hash: nextHash };
    })
  );

  if (!changed) {
    return;
  }

  refreshedEntries.sort((a, b) => a.path.localeCompare(b.path));
  const refreshed: QualityRecord = {
    ...snapshot,
    verificationContext: {
      ...snapshot.verificationContext,
      evidenceFingerprintEntries: refreshedEntries,
      evidenceFingerprint: computeEntriesFingerprint(refreshedEntries),
    },
  };
  await writeQualityRecord(changeDir, refreshed);
}

function isSameRecord(left: QualityRecord, right: QualityRecord): boolean {
  return (
    left.kind === right.kind &&
    left.timestamp === right.timestamp &&
    left.verificationContext?.evidenceFingerprint === right.verificationContext?.evidenceFingerprint
  );
}

async function gitHeadInformation(
  record: QualityRecord,
  projectRoot: string
): Promise<QualityState['information']> {
  const recorded = record.verificationContext?.gitHeadCommit;
  const current = await getCurrentGitHead(projectRoot);
  return {
    gitHeadCommit: {
      matches: !recorded || !current || current === recorded,
      ...(recorded ? { recorded } : {}),
      ...(current ? { current } : {}),
    },
  };
}

export async function getCurrentGitHead(projectRoot: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

function collectChangedFiles(record: QualityRecord, fingerprint: EvidenceFingerprint): string[] {
  const modifiedFiles = new Set<string>();
  const recordedEntries = record.verificationContext?.evidenceFingerprintEntries ?? [];
  const currentEntries = new Map(fingerprint.entries.map((entry) => [entry.path, entry.hash]));

  const recordedMap = new Map(recordedEntries.map((entry) => [entry.path, entry.hash]));
  for (const [filePath, recordedHash] of recordedMap) {
    if (currentEntries.get(filePath) !== recordedHash) {
      modifiedFiles.add(filePath);
    }
  }
  for (const filePath of currentEntries.keys()) {
    if (!recordedMap.has(filePath)) {
      modifiedFiles.add(filePath);
    }
  }

  for (const skippedFile of fingerprint.skippedFiles) {
    modifiedFiles.add(skippedFile);
  }

  if (modifiedFiles.size === 0 && recordedEntries.length === 0) {
    for (const filePath of record.verificationContext?.evidenceFiles ?? []) {
      modifiedFiles.add(toPosixPath(filePath));
    }
  }

  return [...modifiedFiles].sort();
}

function summarizeFailure(
  state: QualityState,
  archiveCompatibility?: ArchiveCompatibility
): string {
  if (archiveCompatibility && !archiveCompatibility.compatible) {
    return 'the recorded review is stale or optimization is not ready for archive';
  }
  return state.details[0] ?? 'the workspace changed since the last review';
}

function computeEntriesFingerprint(entries: EvidenceFingerprintEntry[]): string {
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

async function hashEvidenceFile(projectRoot: string, filePath: string): Promise<string> {
  const content = await fs.readFile(resolveEvidencePath(projectRoot, filePath));
  return createHash('sha256').update(content).digest('hex');
}

function normalizeEvidencePath(projectRoot: string, filePath: string): string {
  return toPosixRelative(projectRoot, resolveEvidencePath(projectRoot, filePath));
}

function resolveEvidencePath(projectRoot: string, filePath: string): string {
  const platformPath = toPlatformPath(filePath);
  return path.isAbsolute(platformPath)
    ? path.normalize(platformPath)
    : path.resolve(projectRoot, platformPath);
}

function toPosixRelative(projectRoot: string, filePath: string): string {
  return toPosixPath(path.relative(projectRoot, filePath));
}

function toPlatformPath(filePath: string): string {
  return filePath.split(/[/\\]+/).join(path.sep);
}

function toPosixPath(filePath: string): string {
  return filePath.split(/[/\\]+/).join('/');
}
