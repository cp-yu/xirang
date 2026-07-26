import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { XIRANG_DIR_NAME } from '../config.js';
import { MODEL_DIR_NAME } from '../model/paths.js';
import type { ChangeDiagnostic, ChangeDiff } from '../semantic-diff.js';
import { parseSemanticModelFiles } from '../model/parser.js';
import { validateSemanticModel } from '../model/validator.js';
import { PARTITIONS, type Partition } from '../model/types.js';
import { computeCandidateDigest, type CandidateDigestEntry } from './digest.js';
import { compareUtf8Bytes, inspectCanonicalText, type CanonicalTextIssue } from './canonical.js';

const ROOT_FILES = new Set(['candidate.yaml', 'build.md']);

function isPartitionFile(relativePath: string): boolean {
  return PARTITIONS.some(partition => relativePath.startsWith(`${partition}/`));
}

export interface CandidateInventory {
  files: string[];
  partitions: Record<Partition, string[]>;
  bytes: number;
}

export interface CandidateValidationResult {
  valid: boolean;
  diagnostics: ChangeDiagnostic[];
  inventory: CandidateInventory;
  diff: ChangeDiff;
  reviewDigest?: string;
}

export interface CandidateSnapshotFile {
  path: string;
  bytes: Buffer;
}

export interface CandidateSnapshot {
  root: string;
  files: CandidateSnapshotFile[];
  digestEntries: CandidateDigestEntry[];
  reviewDigest: string;
}

export interface CandidateSnapshotValidation {
  result: CandidateValidationResult;
  snapshot: CandidateSnapshot;
}

function location(): { line: number; column: number; offset: number } {
  return { line: 1, column: 1, offset: 0 };
}

function diagnostic(
  code: string,
  file: string,
  message: string,
  sourceLocation = location(),
): ChangeDiagnostic {
  return { level: 'ERROR', code, path: file, message, location: sourceLocation };
}

function sourceLocation(text: string, characterOffset: number): { line: number; column: number; offset: number } {
  const prefix = text.slice(0, characterOffset);
  const lines = prefix.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
    offset: Buffer.byteLength(prefix, 'utf8'),
  };
}

function canonicalIssueLocation(bytes: Buffer, issue: CanonicalTextIssue): { line: number; column: number; offset: number } {
  const text = bytes.toString('utf8');
  if (issue === 'utf8-bom' || issue === 'utf8') return location();
  if (issue === 'line-ending-lf') {
    const offset = text.indexOf('\r');
    if (offset >= 0) return sourceLocation(text, offset);
  }
  if (issue === 'trailing-whitespace') {
    const offset = text.search(/[ \t]+(?=\r?\n|$)/);
    if (offset >= 0) return sourceLocation(text, offset);
  }
  if (issue === 'unicode-nfc') {
    const normalized = text.normalize('NFC');
    let offset = 0;
    while (offset < text.length && text[offset] === normalized[offset]) offset += 1;
    return sourceLocation(text, offset);
  }
  if (issue === 'final-newline') return sourceLocation(text, text.length);
  return location();
}

function canonicalDiagnostic(issue: CanonicalTextIssue, file: string, bytes: Buffer): ChangeDiagnostic {
  const details: Record<CanonicalTextIssue, [string, string]> = {
    utf8: ['UTF8_REQUIRED', 'Expected valid UTF-8 text without replacement bytes.'],
    'utf8-bom': ['UTF8_BOM', 'Expected UTF-8 without BOM.'],
    'unicode-nfc': ['UNICODE_NFC', 'Expected Unicode NFC normalization.'],
    'line-ending-lf': ['LINE_ENDING_LF', 'Expected LF line endings only.'],
    'final-newline': ['FINAL_NEWLINE', 'Expected exactly one final newline.'],
    'trailing-whitespace': ['TRAILING_WHITESPACE', 'Expected no trailing spaces or tabs.'],
  };
  const [code, message] = details[issue];
  return diagnostic(code, file, message, canonicalIssueLocation(bytes, issue));
}

function normalizeDiagnostic(item: ChangeDiagnostic): ChangeDiagnostic {
  let normalizedPath = item.path.split(path.sep).join('/');
  if (normalizedPath.startsWith(`${XIRANG_DIR_NAME}/`)) normalizedPath = normalizedPath.slice(XIRANG_DIR_NAME.length + 1);
  if (normalizedPath.startsWith(`${MODEL_DIR_NAME}/`)) normalizedPath = normalizedPath.slice(MODEL_DIR_NAME.length + 1);
  return { ...item, path: normalizedPath };
}

function dedupeDiagnostics(items: ChangeDiagnostic[]): ChangeDiagnostic[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.level}\0${item.code}\0${item.path}\0${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => compareUtf8Bytes(left.path, right.path) || compareUtf8Bytes(left.code, right.code));
}

function emptyDiff(
  formalFingerprint: string,
  changeFingerprint: string,
  diagnostics: ChangeDiagnostic[],
): ChangeDiff {
  return {
    schemaVersion: '1',
    change: 'candidate',
    valid: false,
    formalFingerprint,
    changeFingerprint,
    summary: { total: 0, ADDED: 0, MODIFIED: 0, REMOVED: 0 },
    entries: [],
    diagnostics,
  };
}

async function validateRequiredDirectories(candidateRoot: string, diagnostics: ChangeDiagnostic[]): Promise<void> {
  for (const name of PARTITIONS) {
    const target = path.join(candidateRoot, name);
    const stat = await fs.lstat(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!stat) {
      diagnostics.push(diagnostic('CANDIDATE_DIRECTORY_MISSING', name, `Expected Candidate ${name}/ directory.`));
    } else if (stat.isSymbolicLink() || !stat.isDirectory()) {
      diagnostics.push(diagnostic('CANDIDATE_DIRECTORY_INVALID', name, `Expected Candidate ${name}/ to be a real directory.`));
    }
  }
}

async function readSnapshot(candidateRoot: string, diagnostics: ChangeDiagnostic[]): Promise<CandidateSnapshotFile[]> {
  const files: CandidateSnapshotFile[] = [];

  const visit = async (absolute: string, relative: string): Promise<void> => {
    const stat = await fs.lstat(absolute).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!stat) return;
    if (stat.isSymbolicLink()) {
      diagnostics.push(diagnostic('CANDIDATE_SYMLINK', relative || '.', 'Candidate source SHALL NOT contain symlinks.'));
      return;
    }
    if (stat.isDirectory()) {
      const entries = await fs.readdir(absolute);
      entries.sort(compareUtf8Bytes);
      for (const entry of entries) {
        await visit(path.join(absolute, entry), relative ? `${relative}/${entry}` : entry);
      }
      return;
    }
    if (!stat.isFile()) {
      diagnostics.push(diagnostic('CANDIDATE_FILE_TYPE', relative, 'Candidate source entries must be regular files or directories.'));
      return;
    }
    files.push({ path: relative, bytes: await fs.readFile(absolute) });
  };

  await visit(candidateRoot, '');
  files.sort((left, right) => compareUtf8Bytes(left.path, right.path));
  return files;
}

function validateLayout(files: CandidateSnapshotFile[], diagnostics: ChangeDiagnostic[]): void {
  const paths = new Set(files.map(file => file.path));
  for (const required of ROOT_FILES) {
    if (!paths.has(required)) diagnostics.push(diagnostic('CANDIDATE_FILE_MISSING', required, `Expected canonical Candidate file ${required}.`));
  }

  for (const file of files) {
    if (!file.path.includes('/')) {
      if (!ROOT_FILES.has(file.path)) diagnostics.push(diagnostic('CANDIDATE_FILE_UNEXPECTED', file.path, 'Only candidate.yaml and build.md are allowed at Candidate root.'));
      continue;
    }
    if (isPartitionFile(file.path)) continue;
    diagnostics.push(diagnostic(
      'CANDIDATE_FILE_UNEXPECTED',
      file.path,
      `Candidate source paths must be candidate.yaml, build.md, or one of: ${PARTITIONS.join('/, ')}/.`,
    ));
  }
}

function validateText(files: CandidateSnapshotFile[], diagnostics: ChangeDiagnostic[]): void {
  for (const file of files) {
    for (const issue of inspectCanonicalText(file.bytes)) diagnostics.push(canonicalDiagnostic(issue, file.path, file.bytes));
  }
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort(compareUtf8Bytes);
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort(compareUtf8Bytes)[index]);
}

function isCanonicalBaselineReference(value: string): boolean {
  const normalized = path.posix.normalize(value);
  return value !== ''
    && !value.includes('\\')
    && !path.posix.isAbsolute(value)
    && !/^[A-Za-z]:/.test(value)
    && normalized === value;
}

function validateMetadata(files: CandidateSnapshotFile[], diagnostics: ChangeDiagnostic[]): void {
  const metadata = files.find(file => file.path === 'candidate.yaml');
  if (!metadata) return;
  try {
    const parsed = parseYaml(metadata.bytes.toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      diagnostics.push(diagnostic('CANDIDATE_METADATA', 'candidate.yaml', 'Expected Candidate metadata mapping.'));
      return;
    }
    const value = parsed as Record<string, unknown>;
    const baseline = value.baseline;
    const timestamp = value.createdAt;
    const validTimestamp = typeof timestamp === 'string'
      && !Number.isNaN(Date.parse(timestamp))
      && new Date(timestamp).toISOString() === timestamp;
    let validBaseline = false;
    if (baseline && typeof baseline === 'object' && !Array.isArray(baseline)) {
      const item = baseline as Record<string, unknown>;
      if (hasExactKeys(item, ['kind', 'reference'])) {
        validBaseline = (item.kind === 'clean' && item.reference === null)
          || (item.kind === 'current' && item.reference === '.xirang')
          || (item.kind === 'path' && typeof item.reference === 'string' && isCanonicalBaselineReference(item.reference));
      }
    }
    if (!hasExactKeys(value, ['schemaVersion', 'createdAt', 'baseline'])
      || value.schemaVersion !== 1
      || !validTimestamp
      || !validBaseline) {
      diagnostics.push(diagnostic(
        'CANDIDATE_METADATA',
        'candidate.yaml',
        'Expected canonical schemaVersion 1, ISO createdAt, and clean/current/path baseline metadata.',
      ));
    }
  } catch (error) {
    diagnostics.push(diagnostic('CANDIDATE_METADATA', 'candidate.yaml', `Invalid Candidate metadata: ${(error as Error).message}`));
  }
}

function digestEntries(files: CandidateSnapshotFile[]): CandidateDigestEntry[] {
  return files
    .filter(file => file.path === 'build.md' || isPartitionFile(file.path))
    .map(file => ({ path: file.path, bytes: file.bytes }));
}

/** Validates the Candidate partitions as an in-memory Semantic Model; no staging to disk. */
export function validateCandidateSemanticModel(files: CandidateSnapshotFile[]): ChangeDiagnostic[] {
  const parsed = parseSemanticModelFiles(
    files.filter(file => isPartitionFile(file.path)).map(file => [file.path, file.bytes.toString('utf8')] as const),
  );
  return [...parsed.diagnostics, ...validateSemanticModel(parsed.model)].map(normalizeDiagnostic);
}

export async function validateCandidateDirectory(
  projectRootInput: string,
  candidateRootInput: string,
): Promise<CandidateSnapshotValidation> {
  const projectRoot = path.resolve(projectRootInput);
  const candidateRoot = path.resolve(candidateRootInput);
  const diagnostics: ChangeDiagnostic[] = [];
  const rootStat = await fs.lstat(candidateRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) {
    diagnostics.push(diagnostic('CANDIDATE_NOT_FOUND', '.', 'Active .xirang/candidate directory not found.'));
  }

  if (rootStat?.isDirectory() && !rootStat.isSymbolicLink()) {
    await validateRequiredDirectories(candidateRoot, diagnostics);
  }
  const files = rootStat?.isDirectory() && !rootStat.isSymbolicLink()
    ? await readSnapshot(candidateRoot, diagnostics)
    : [];
  validateLayout(files, diagnostics);
  validateText(files, diagnostics);
  validateMetadata(files, diagnostics);

  const entries = digestEntries(files);
  const reviewDigest = computeCandidateDigest(entries);

  if (files.some(file => isPartitionFile(file.path))) {
    try {
      diagnostics.push(...validateCandidateSemanticModel(files));
    } catch (error) {
      diagnostics.push(diagnostic('CANDIDATE_SEMANTIC_MODEL', 'elements', (error as Error).message));
    }
  }

  const normalizedDiagnostics = dedupeDiagnostics(diagnostics.map(normalizeDiagnostic));
  const valid = normalizedDiagnostics.every(item => item.level !== 'ERROR');
  const diff = emptyDiff('', reviewDigest, normalizedDiagnostics);

  const inventory: CandidateInventory = {
    files: files.map(file => file.path),
    partitions: Object.fromEntries(PARTITIONS.map(partition => [
      partition,
      files.filter(file => file.path.startsWith(`${partition}/`)).map(file => file.path),
    ])) as Record<Partition, string[]>,
    bytes: files.reduce((total, file) => total + file.bytes.length, 0),
  };
  const snapshot: CandidateSnapshot = { root: candidateRoot, files, digestEntries: entries, reviewDigest };
  return {
    result: {
      valid,
      diagnostics: normalizedDiagnostics,
      inventory,
      diff,
      ...(valid ? { reviewDigest } : {}),
    },
    snapshot,
  };
}

export async function validateCandidateSnapshot(projectRootInput: string): Promise<CandidateSnapshotValidation> {
  const projectRoot = path.resolve(projectRootInput);
  return validateCandidateDirectory(projectRoot, path.join(projectRoot, XIRANG_DIR_NAME, 'candidate'));
}

export async function validateCandidate(projectRoot: string): Promise<CandidateValidationResult> {
  return (await validateCandidateSnapshot(projectRoot)).result;
}
