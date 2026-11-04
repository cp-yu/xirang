import { spawn, execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

export const QUALITY_CONTRACT_VERSION = 2 as const;
export const QUALITY_STATE_FILE = '.quality-state.json';
export const QUALITY_LOG_FILE = '.quality-log.jsonl';
export const QUALITY_EVIDENCE_DIR = '.quality-evidence';
export const QUALITY_LOCK_FILE = '.quality-lock';

export type ReviewScope = 'baseline' | 'incremental' | 'defect-repair';
export type ReviewResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL_NEEDS_CORRECTIONS';
export type DelegationDelivery = 'progress' | 'delivered';
export type CheckpointKind = 'baseline' | 'intermediate' | 'successful';

export interface QualityCheckpoint {
  checkpointId: string;
  kind: CheckpointKind;
  commit: string;
  manifest: CodeManifest;
  createdVersion: number;
  reviewId?: string;
  planId?: string;
}

export interface QualityApplicability {
  evidenceId?: string;
  reviewId?: string;
  scope: string;
  differenceBasis: string;
  reason: string;
  affected: false;
  currentManifestHash: string;
  planId: string;
}

export interface QualityCompletionPlan {
  planId: string;
  version: number;
  manifest: CodeManifest;
  delegationIds: string[];
  delegationVersions: Array<{ delegationId: string; saveVersion: number }>;
  verificationPlan: Array<{ scope: string; reason: string }>;
  reasons: string;
  requiredEvidenceIds: string[];
  requiredReviewIds: string[];
  baselineDefects: Array<{ problem: string; repairScope: string; repairEvidenceIds: string[]; reviewId: string }>;
  applicability: QualityApplicability[];
  recoveryConfirmed: boolean;
  unresolvedIssues: string[];
}

export interface QualityConclusion {
  planId: string;
  version: number;
  manifest: CodeManifest;
  reasons: string;
  complete: true;
}

export type CompletionStatus = 'needs_review' | 'needs_optimize' | 'all_done';

export interface SyncAssociationOutput {
  path: string;
  action: 'write' | 'delete';
  preimageHash: string | null;
  postimageHash: string | null;
}

export interface SyncCompletionAssociation {
  associationId: string;
  version: number;
  createdAt: string;
  sourceVersion: number;
  sourceStateHash: string;
  planId: string;
  conclusionVersion: number;
  successfulCheckpointId: string;
  beforeManifest: CodeManifest;
  afterManifest: CodeManifest;
  outputs: SyncAssociationOutput[];
}

export interface QualityState {
  reviews: ReviewRecord[];
  delegations: DelegationRecord[];
  verifications: VerificationRecord[];
  checkpoints?: QualityCheckpoint[];
  completion?: { plan?: QualityCompletionPlan; conclusion?: QualityConclusion };
  syncAssociations?: SyncCompletionAssociation[];
  skip?: { reason: string; version: number };
  activeAssociationId?: string;
  revalidationHistory?: QualityRevalidationHistory[];
}

export interface QualityRevalidationHistory {
  associationId: string;
  reason: string;
  archivedVersion: number;
  archivedAt: string;
  snapshot: {
    contractVersion: typeof QUALITY_CONTRACT_VERSION;
    version: number;
    sequence: number;
    updatedAt: string;
    state: Omit<QualityState, 'revalidationHistory'>;
  };
}


export interface QualityDiagnostic {
  code: string;
  path?: string;
  message: string;
}

export class QualityEngineError extends Error {
  readonly code: string;
  readonly diagnostics: QualityDiagnostic[];

  constructor(code: string, message: string, diagnostics: QualityDiagnostic[] = []) {
    super(message);
    this.name = 'QualityEngineError';
    this.code = code;
    this.diagnostics = diagnostics.length > 0 ? diagnostics : [{ code, message }];
  }
}

export interface ManifestEntry {
  path: string;
  contentHash: string;
  comparisonHash: string;
  size: number;
  mode: '100644' | '100755' | '120000';
}

export interface CodeManifest {
  contractVersion: typeof QUALITY_CONTRACT_VERSION;
  root: string;
  entries: ManifestEntry[];
  hash: string;
  head?: string;
}

export interface ManifestComparison {
  equal: boolean;
  added: string[];
  deleted: string[];
  changed: string[];
  leftHash: string;
  rightHash: string;
}

export interface QualityEvent {
  contractVersion: typeof QUALITY_CONTRACT_VERSION;
  sequence: number;
  version: number;
  timestamp: string;
  operation: string;
  payload: unknown;
  stateHash: string;
}

export interface QualityState {
  reviews: ReviewRecord[];
  delegations: DelegationRecord[];
  verifications: VerificationRecord[];
  syncAssociations?: SyncCompletionAssociation[];
  skip?: { reason: string; version: number };
}

export interface QualitySnapshot {
  contractVersion: typeof QUALITY_CONTRACT_VERSION;
  version: number;
  sequence: number;
  updatedAt: string;
  state: QualityState;
}

export interface QualityStore {
  snapshot: QualitySnapshot;
  log: QualityEvent[];
}

export interface StoreWriteOptions {
  appendLog?: (file: string, data: string) => Promise<void>;
  writeSnapshot?: (file: string, data: string) => Promise<void>;
}

export interface ReviewIssue {
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION' | string;
  message: string;
  [key: string]: unknown;
}

export interface WriteBackPlanEntry {
  taskLine?: string | null;
  action?: string;
  correctionType?: string;
  section?: string;
  summary?: string;
  nextAction?: string;
}

export type ReviewSummary = string | Record<string, unknown>;

export interface ReviewRecord {
  reviewId: string;
  associationId?: string;
  scope: ReviewScope;
  assignment: string;
  delegationIds: string[];
  startedVersion: number;
  submittedVersion?: number;
  beforeManifest: CodeManifest;
  afterManifest?: CodeManifest;
  changedDuringReview?: boolean;
  valid?: boolean;
  result?: ReviewResult;
  issues?: ReviewIssue[];
  evidenceFiles?: string[];
  summary?: ReviewSummary;
  writeBackPlan?: WriteBackPlanEntry[];
  tasksFileHash?: string | null;
}

export interface DelegationRecord {
  delegationId: string;
  scope: string;
  constraints?: string[];
  baselineReviewId: string;
  recoveryCommit: string;
  startedVersion: number;
  startManifest: CodeManifest;
  saves: DelegationSave[];
}

export interface DelegationSave {
  version: number;
  report: string;
  evidenceIds: string[];
  delivery: DelegationDelivery;
  unresolved: boolean;
}

export interface VerificationRecord {
  evidenceId: string;
  delegationId?: string;
  scope: string;
  argv: string[];
  cwd: string;
  startedVersion: number;
  beforeManifest: CodeManifest;
  afterManifest: CodeManifest;
  changedDuringRun: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  spawnError?: string;
  stdout: string;
  stderr: string;
  evidenceFile: string;
  success: boolean;
}

export interface ReviewBeginInput {
  changeDir: string;
  projectRoot: string;
  scope: ReviewScope;
  assignment: string;
  delegationIds?: string[];
  expectedVersion?: number;
  revalidation?: { reason: string; previousFlowStopped: true };
}

export interface ReviewSubmitInput {
  changeDir: string;
  projectRoot: string;
  reviewId: string;
  expectedVersion: number;
  result: ReviewResult;
  issues: ReviewIssue[];
  evidenceFiles: string[];
  summary: ReviewSummary;
  writeBackPlan: WriteBackPlanEntry[];
}

export interface ReviewWriteBackOptions extends StoreWriteOptions {
  writeBack?: (tasksPath: string, plan: WriteBackPlanEntry[]) => Promise<void>;
}

export interface DelegationStartInput {
  changeDir: string;
  projectRoot: string;
  scope: string;
  constraints?: string[];
  baselineReviewId: string;
  recoveryCommit: string;
  expectedVersion?: number;
}

export interface DelegationSaveInput {
  changeDir: string;
  delegationId: string;
  expectedVersion: number;
  report: string;
  evidenceIds: string[];
  delivery: DelegationDelivery;
  unresolved: boolean;
}

export interface VerificationInput {
  changeDir: string;
  projectRoot: string;
  argv: string[];
  delegationId?: string;
  expectedVersion?: number;
  cwd?: string;
  scope?: string;
}

function error(code: string, message: string, pathName?: string): QualityEngineError {
  return new QualityEngineError(code, message, [{ code, path: pathName, message }]);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => isObject(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
}

function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function id(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function normalizeRelativePath(input: string): string {
  if (typeof input !== 'string' || input.length === 0 || input.includes('\0')) {
    throw error('UNSAFE_PATH', 'Path must be a non-empty string without NUL.', 'path');
  }
  const normalized = input.replaceAll('\\', '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    throw error('UNSAFE_PATH', 'Absolute paths are not allowed.', input);
  }
  const parts = normalized.split('/');
  if (parts.some((part) => part === '..' || part === '.') || parts.some((part) => part === '')) {
    throw error('UNSAFE_PATH', 'Path must remain within the project root.', input);
  }
  return parts.join('/');
}

function resolveInside(root: string, relative: string): string {
  const normalized = normalizeRelativePath(relative);
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, ...normalized.split('/'));
  const relativeToRoot = path.relative(rootPath, resolved);
  if (relativeToRoot === '..' || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
    throw error('UNSAFE_PATH', 'Path escapes the project root.', relative);
  }
  return resolved;
}

async function assertNoSymlinkParents(root: string, relative: string): Promise<string> {
  const resolved = resolveInside(root, relative);
  const rootPath = path.resolve(root);
  // The OS-level prefix may traverse symlinks (macOS /var, /tmp links); only
  // components below the resolved project root are required to be real.
  const realRoot = await realAncestorBoundary(rootPath);
  let current = realRoot;
  for (const part of path.relative(rootPath, resolved).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (cause) {
      const code = (cause as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw error('PATH_NOT_FOUND', `Path does not exist: ${relative}`, relative);
      }
      throw cause;
    }
    if (stat.isSymbolicLink()) {
      throw error('UNSAFE_SYMLINK', `Symlink traversal is not allowed: ${relative}`, relative);
    }
  }
  return resolved;
}

function isQualityRuntimePath(relative: string): boolean {
  const parts = relative.split('/');
  if (parts.length < 4 || parts[0] !== '.xirang' || parts[1] !== 'changes' || !parts[2]) return false;
  return (parts.length === 4 && [QUALITY_STATE_FILE, QUALITY_LOG_FILE, QUALITY_LOCK_FILE].includes(parts[3]))
    || (parts.length > 4 && parts[3] === QUALITY_EVIDENCE_DIR);
}

function normalizeTaskContent(relative: string, content: Buffer): Buffer {
  if (!/^\.xirang\/changes\/[^/]+\/tasks\.md$/.test(relative)) return content;
  const text = content.toString('utf8');
  return Buffer.from(text.replace(/^(\s*[-*+]\s+)\[[ xX]\](?=\s)/gm, '$1[ ]'), 'utf8');
}

async function git(root: string, args: string[]): Promise<string> {
  try {
    const result = await execFileAsync('git', args, { cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
    return Buffer.from(result.stdout as unknown as Uint8Array).toString('utf8');
  } catch (cause) {
    throw error('GIT_COMMAND_FAILED', `Git command failed: git ${args.join(' ')}`);
  }
}

async function gitBytes(root: string, args: string[]): Promise<Buffer> {
  try {
    const result = await execFileAsync('git', args, { cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
    return Buffer.from(result.stdout as unknown as Uint8Array);
  } catch {
    throw error('GIT_COMMAND_FAILED', `Git command failed: git ${args.join(' ')}`);
  }
}

async function gitHead(root: string): Promise<string | undefined> {
  try {
    return (await git(root, ['rev-parse', 'HEAD'])).trim() || undefined;
  } catch {
    return undefined;
  }
}

async function fileManifestEntry(root: string, relative: string): Promise<ManifestEntry> {
  const file = resolveInside(root, relative);
  const rootPath = path.resolve(root);
  const parts = path.relative(rootPath, file).split(path.sep).filter(Boolean);
  let parent = rootPath;
  for (const part of parts.slice(0, -1)) {
    parent = path.join(parent, part);
    const parentStat = await fs.lstat(parent);
    if (parentStat.isSymbolicLink()) throw error('UNSAFE_SYMLINK', `Manifest path traverses a symlink: ${relative}`, relative);
  }
  try {
    const stat = await fs.lstat(file);
    let content: Buffer;
    let mode: ManifestEntry['mode'];
    if (stat.isSymbolicLink()) {
      content = Buffer.from(await fs.readlink(file));
      mode = '120000';
    } else if (stat.isFile()) {
      content = await fs.readFile(file);
      mode = stat.mode & 0o111 ? '100755' : '100644';
    } else {
      throw error('UNSAFE_PATH', `Manifest path is not a regular file or symlink: ${relative}`, relative);
    }
    const contentHash = hash(content);
    return {
      path: relative,
      contentHash,
      comparisonHash: hash(Buffer.concat([Buffer.from(`${mode}\\0`), mode === '120000' ? content : normalizeTaskContent(relative, content)])),
      size: content.byteLength,
      mode,
    };
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') throw error('PATH_NOT_FOUND', `Manifest path does not exist: ${relative}`, relative);
    throw cause;
  }
}

function manifestHash(entries: ManifestEntry[]): string {
  return hash(stableJson(entries.map((entry) => ({ path: entry.path, comparisonHash: entry.comparisonHash }))));
}

async function trackedWorkspacePaths(root: string): Promise<string[]> {
  const output = await git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  return output.split('\0').filter(Boolean).map(normalizeRelativePath);
}

export async function buildCodeManifest(projectRoot: string): Promise<CodeManifest> {
  const root = path.resolve(projectRoot);
  try {
    await fs.realpath(root);
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') throw error('PATH_NOT_FOUND', 'Project root does not exist.', root);
    throw cause;
  }
  const unique = new Set(await trackedWorkspacePaths(root));
  const paths = [...unique].filter((relative) => !isQualityRuntimePath(relative)).sort();
  const entries: ManifestEntry[] = [];
  for (const relative of paths) {
    try {
      entries.push(await fileManifestEntry(root, relative));
    } catch (cause) {
      if (cause instanceof QualityEngineError && cause.code === 'PATH_NOT_FOUND') continue;
      throw cause;
    }
  }
  return { contractVersion: QUALITY_CONTRACT_VERSION, root, entries, hash: manifestHash(entries), head: await gitHead(root) };
}

export const captureCodeManifest = buildCodeManifest;

async function validateCommit(root: string, commit: string): Promise<string> {
  if (typeof commit !== 'string' || !/^[0-9a-f]{7,64}$/i.test(commit)) throw error('INVALID_COMMIT', 'recoveryCommit must be a Git commit id.');
  const resolved = (await git(root, ['rev-parse', '--verify', `${commit}^{commit}`])).trim();
  if (!/^[0-9a-f]{40}$/i.test(resolved)) throw error('INVALID_COMMIT', 'recoveryCommit is not a recoverable commit.');
  return resolved;
}

async function commitManifest(projectRoot: string, commit: string): Promise<CodeManifest> {
  const root = path.resolve(projectRoot);
  const resolved = await validateCommit(root, commit);
  const output = await git(root, ['ls-tree', '-r', '-z', '--full-tree', resolved, '--']);
  const entries: ManifestEntry[] = [];
  for (const record of output.split('\0').filter(Boolean)) {
    const tab = record.indexOf('\t');
    if (tab < 0) throw error('MALFORMED_GIT_TREE', 'Git tree output is malformed.');
    const header = record.slice(0, tab).split(' ');
    const relative = normalizeRelativePath(record.slice(tab + 1));
    if (isQualityRuntimePath(relative)) continue;
    const mode = header[0] as ManifestEntry['mode'];
    if (header[1] !== 'blob' || !['100644', '100755', '120000'].includes(mode)) throw error('UNSAFE_PATH', `Commit contains an unsupported file type: ${relative}`, relative);
    const content = await gitBytes(root, ['show', `${resolved}:${relative}`]);
    entries.push({
      path: relative, contentHash: hash(content),
      comparisonHash: hash(Buffer.concat([Buffer.from(`${mode}\\0`), mode === '120000' ? content : normalizeTaskContent(relative, content)])),
      size: content.byteLength, mode,
    });
  }
  entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return { contractVersion: QUALITY_CONTRACT_VERSION, root, entries, hash: manifestHash(entries), head: resolved };
}

export async function compareManifests(left: CodeManifest, right: CodeManifest): Promise<ManifestComparison> {
  const leftMap = new Map(left.entries.map((entry) => [entry.path, entry]));
  const rightMap = new Map(right.entries.map((entry) => [entry.path, entry]));
  const added: string[] = [];
  const deleted: string[] = [];
  const changed: string[] = [];
  for (const [entryPath, entry] of leftMap) {
    const other = rightMap.get(entryPath);
    if (!other) deleted.push(entryPath);
    else if (entry.comparisonHash !== other.comparisonHash) changed.push(entryPath);
  }
  for (const entryPath of rightMap.keys()) if (!leftMap.has(entryPath)) added.push(entryPath);
  added.sort(); deleted.sort(); changed.sort();
  return { equal: added.length === 0 && deleted.length === 0 && changed.length === 0, added, deleted, changed, leftHash: left.hash, rightHash: right.hash };
}

export async function compareRecoverableCommit(projectRoot: string, commit: string): Promise<ManifestComparison & { commit: CodeManifest; workspace: CodeManifest }> {
  const [commitManifestValue, workspace] = await Promise.all([commitManifest(projectRoot, commit), buildCodeManifest(projectRoot)]);
  const comparison = await compareManifests(commitManifestValue, workspace);
  return { ...comparison, commit: commitManifestValue, workspace };
}

const textSchema = z.string().trim().min(1);
const stringsSchema = z.array(textSchema);
const versionSchema = z.number().int().nonnegative();
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const summarySchema = z.union([textSchema, z.record(z.string(), z.unknown()).refine(value => Object.keys(value).length > 0)]);
const issueSchema = z.object({ severity: z.enum(['CRITICAL', 'WARNING', 'SUGGESTION']), message: textSchema }).passthrough();
const writeBackSchema = z.object({
  taskLine: z.string().nullable().optional(), action: textSchema.optional(),
  correctionType: textSchema.optional(), section: z.string().optional(),
  summary: textSchema.optional(), nextAction: textSchema.optional(),
}).strict().refine(value => Boolean(value.action && (value.summary || value.nextAction)), 'A writeback entry requires action and summary or nextAction.');
const manifestSchema = z.object({
  contractVersion: z.literal(2), root: textSchema,
  entries: z.array(z.object({ path: textSchema, contentHash: digestSchema, comparisonHash: digestSchema, size: versionSchema, mode: z.enum(['100644', '100755', '120000']) }).strict()),
  hash: digestSchema, head: z.string().optional(),
}).strict().superRefine((manifest, context) => {
  const paths = manifest.entries.map(entry => entry.path);
  if (new Set(paths).size !== paths.length || paths.some((entry, index) => index > 0 && entry <= paths[index - 1]) || manifest.hash !== manifestHash(manifest.entries)) {
    context.addIssue({ code: 'custom', message: 'Manifest identity or order is invalid.' });
  }
  for (const entry of paths) {
    try { if (normalizeRelativePath(entry) !== entry) throw new Error(); }
    catch { context.addIssue({ code: 'custom', message: 'Unsafe manifest path.' }); }
  }
});
const reviewSchema = z.object({
  reviewId: textSchema, associationId: textSchema.optional(), scope: z.enum(['baseline', 'incremental', 'defect-repair']), assignment: textSchema,
  delegationIds: stringsSchema, startedVersion: versionSchema, submittedVersion: versionSchema.optional(),
  beforeManifest: manifestSchema, afterManifest: manifestSchema.optional(), changedDuringReview: z.boolean().optional(),
  valid: z.boolean().optional(), result: z.enum(['PASS', 'PASS_WITH_WARNINGS', 'FAIL_NEEDS_CORRECTIONS']).optional(),
  issues: z.array(issueSchema).optional(), evidenceFiles: stringsSchema.optional(), summary: summarySchema.optional(),
  writeBackPlan: z.array(writeBackSchema).optional(), tasksFileHash: digestSchema.nullable().optional(),
}).strict().superRefine((review, context) => {
  if (review.result !== undefined) {
    if (!review.submittedVersion || !review.afterManifest || !review.issues || !review.evidenceFiles?.length || !review.summary || !review.writeBackPlan || typeof review.valid !== 'boolean' || typeof review.changedDuringReview !== 'boolean' || review.tasksFileHash === undefined) {
      context.addIssue({ code: 'custom', message: 'Incomplete submitted Review.' });
    } else {
      const changed = review.beforeManifest.hash !== review.afterManifest.hash;
      if (review.changedDuringReview !== changed || review.valid !== !changed) context.addIssue({ code: 'custom', message: 'Review state association is invalid.' });
      try { validateReviewResult(review.result, review.issues, review.writeBackPlan); }
      catch { context.addIssue({ code: 'custom', message: 'Review result is inconsistent.' }); }
    }
  } else if (review.submittedVersion !== undefined || review.afterManifest !== undefined || review.valid !== undefined) {
    context.addIssue({ code: 'custom', message: 'Unsubmitted Review has submission fields.' });
  }
});
const delegationSchema = z.object({
  delegationId: textSchema, scope: textSchema, constraints: stringsSchema.optional(), baselineReviewId: textSchema,
  recoveryCommit: z.string().regex(/^[a-f0-9]{40}$/), startedVersion: versionSchema, startManifest: manifestSchema,
  saves: z.array(z.object({ version: versionSchema, report: textSchema, evidenceIds: stringsSchema,
    delivery: z.enum(['progress', 'delivered']), unresolved: z.boolean() }).strict()),
}).strict();
const verificationSchema = z.object({
  evidenceId: textSchema, delegationId: textSchema.optional(), scope: textSchema, argv: z.array(z.string()).min(1), cwd: textSchema,
  startedVersion: versionSchema, beforeManifest: manifestSchema, afterManifest: manifestSchema,
  changedDuringRun: z.boolean(), exitCode: z.number().int().nullable(), signal: z.string().nullable(),
  spawnError: z.string().optional(), stdout: z.string(), stderr: z.string(), evidenceFile: textSchema, success: z.boolean(),
}).strict().superRefine((record, context) => {
  const changed = record.beforeManifest.hash !== record.afterManifest.hash;
  if (changed !== record.changedDuringRun || record.success !== (!changed && record.exitCode === 0 && record.signal === null && record.spawnError === undefined)) {
    context.addIssue({ code: 'custom', message: 'Verification result is inconsistent.' });
  }
});
const applicabilitySchema = z.object({
  evidenceId: textSchema.optional(), reviewId: textSchema.optional(), scope: textSchema, differenceBasis: textSchema, reason: textSchema,
  affected: z.literal(false), currentManifestHash: digestSchema, planId: textSchema,
}).strict().refine(value => Boolean(value.evidenceId) !== Boolean(value.reviewId));
const completionPlanSchema = z.object({
  planId: textSchema, version: versionSchema, manifest: manifestSchema, delegationIds: stringsSchema,
  delegationVersions: z.array(z.object({ delegationId: textSchema, saveVersion: z.number().int() }).strict()),
  verificationPlan: z.array(z.object({ scope: textSchema, reason: textSchema }).strict()), reasons: textSchema,
  requiredEvidenceIds: stringsSchema, requiredReviewIds: stringsSchema,
  baselineDefects: z.array(z.object({ problem: textSchema, repairScope: textSchema, repairEvidenceIds: stringsSchema, reviewId: textSchema }).strict()),
  applicability: z.array(applicabilitySchema), recoveryConfirmed: z.boolean(), unresolvedIssues: stringsSchema,
}).strict();
const conclusionSchema = z.object({ planId: textSchema, version: versionSchema, manifest: manifestSchema, reasons: textSchema, complete: z.literal(true) }).strict();
const activeStateSchema = z.object({
  reviews: z.array(reviewSchema), delegations: z.array(delegationSchema), verifications: z.array(verificationSchema),
  checkpoints: z.array(z.object({
    checkpointId: textSchema, kind: z.enum(['baseline', 'intermediate', 'successful']), commit: z.string().regex(/^[a-f0-9]{40}$/),
    manifest: manifestSchema, createdVersion: versionSchema, reviewId: textSchema.optional(), planId: textSchema.optional(),
  }).strict()).optional(),
  completion: z.object({ plan: completionPlanSchema.optional(), conclusion: conclusionSchema.optional() }).strict().optional(),
  syncAssociations: z.array(z.object({
    associationId: textSchema, version: versionSchema, createdAt: textSchema, sourceVersion: versionSchema,
    sourceStateHash: digestSchema, planId: textSchema, conclusionVersion: versionSchema, successfulCheckpointId: textSchema,
    beforeManifest: manifestSchema, afterManifest: manifestSchema,
    outputs: z.array(z.object({ path: textSchema, action: z.enum(['write', 'delete']), preimageHash: digestSchema.nullable(), postimageHash: digestSchema.nullable() }).strict()),
  }).strict()).optional(),
  activeAssociationId: textSchema.optional(),
  skip: z.object({ reason: textSchema, version: versionSchema }).strict().optional(),
}).strict();
const archivedAssociationSchema = z.object({
  associationId: textSchema, reason: textSchema, archivedVersion: versionSchema, archivedAt: textSchema,
  snapshot: z.object({
    contractVersion: z.literal(QUALITY_CONTRACT_VERSION), version: versionSchema, sequence: versionSchema, updatedAt: textSchema,
    state: activeStateSchema,
  }).strict(),
}).strict();
const stateSchema = activeStateSchema.extend({
  revalidationHistory: z.array(archivedAssociationSchema).optional(),
}).strict();

function requireShape(schema: z.ZodType, value: unknown, code: string): void {
  const result = schema.safeParse(value);
  if (!result.success) throw error(code, result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
}

// The OS-level path prefix may legitimately traverse symlinks (macOS /var, /tmp
// links); symlink protection applies strictly below the deepest existing ancestor.
// A missing tail is allowed so initialization never requires precreated runtime files.
async function realAncestorBoundary(target: string): Promise<string> {
  let current = path.resolve(target);
  for (;;) {
    try { return await fs.realpath(current); }
    catch (cause) {
      if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') throw cause;
      const parent = path.dirname(current);
      if (parent === current) throw error('PATH_NOT_FOUND', 'Path does not exist.', target);
      current = parent;
    }
  }
}

async function assertNoInteriorSymlinks(base: string, target: string): Promise<void> {
  const baseReal = await realAncestorBoundary(base);
  let current = baseReal;
  for (const part of path.relative(path.resolve(base), path.resolve(target)).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) throw error('UNSAFE_SYMLINK', 'Storage paths must not traverse symlinks.', current);
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw cause;
    }
  }
}

async function assertSafeStoragePath(file: string): Promise<void> {
  const resolved = path.resolve(file);
  await assertNoInteriorSymlinks(path.dirname(resolved), resolved);
}

async function validateStorage(changeDir: string): Promise<void> {
  const resolved = path.resolve(changeDir);
  if (path.basename(path.dirname(resolved)) !== 'changes' || path.basename(path.dirname(path.dirname(resolved))) !== '.xirang') {
    throw error('UNSAFE_CHANGE_DIR', 'Quality storage requires a real .xirang/changes/<change> root.');
  }
  await assertNoInteriorSymlinks(path.dirname(resolved), resolved);
  for (const name of [QUALITY_STATE_FILE, QUALITY_LOG_FILE, QUALITY_LOCK_FILE]) {
    const file = path.join(resolved, name);
    await assertNoInteriorSymlinks(path.dirname(resolved), file);
    try { if (!(await fs.lstat(file)).isFile()) throw error('UNSAFE_PATH', 'Quality storage must be a regular file.', file); }
    catch (cause) { if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') throw cause; }
  }
}

function validateChangeRoot(projectRoot: string, changeDir: string): void {
  const relative = path.relative(path.resolve(projectRoot), path.resolve(changeDir)).split(path.sep).join('/');
  if (!/^\.xirang\/changes\/[^/]+$/.test(relative)) throw error('UNSAFE_CHANGE_DIR', 'changeDir must be a managed root within projectRoot.');
}

async function readTextIfPresent(file: string): Promise<string | null> {
  try { return await fs.readFile(file, 'utf8'); }
  catch (cause) { if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return null; throw cause; }
}

function parseJson<T>(text: string, source: string): T {
  try { return JSON.parse(text) as T; }
  catch { throw error('MALFORMED_QUALITY_RECORD', `Malformed JSON in ${source}.`); }
}

function validateEvent(value: unknown, expectedSequence: number): asserts value is QualityEvent {
  if (!isObject(value) || value.contractVersion !== QUALITY_CONTRACT_VERSION || !isInteger(value.sequence) || value.sequence !== expectedSequence || !isInteger(value.version) || value.version !== expectedSequence || typeof value.timestamp !== 'string' || typeof value.operation !== 'string' || !('payload' in value) || !digestSchema.safeParse(value.stateHash).success) {
    throw error('INVALID_QUALITY_RECORD', 'Quality log contains an unsupported or invalid event.');
  }
}

function validateSnapshot(value: unknown): asserts value is QualitySnapshot {
  if (!isObject(value) || value.contractVersion !== QUALITY_CONTRACT_VERSION || !isInteger(value.version) || !isInteger(value.sequence) || value.version !== value.sequence || typeof value.updatedAt !== 'string') {
    throw error('UNSUPPORTED_QUALITY_VERSION', 'Quality snapshot is not a supported contractVersion 2 snapshot.');
  }
  requireShape(stateSchema, value.state, 'INVALID_QUALITY_STATE');
}

export function qualityStateHash(state: QualityState): string {
  const { syncAssociations: _associations, ...source } = state;
  return hash(stableJson(source));
}

export async function readQualityStore(changeDir: string): Promise<QualityStore> {
  await validateStorage(changeDir);
  const statePath = path.join(changeDir, QUALITY_STATE_FILE);
  const logPath = path.join(changeDir, QUALITY_LOG_FILE);
  const [snapshotText, logText] = await Promise.all([readTextIfPresent(statePath), readTextIfPresent(logPath)]);
  if (snapshotText === null && logText === null) {
    return { snapshot: { contractVersion: QUALITY_CONTRACT_VERSION, version: 0, sequence: 0, updatedAt: new Date(0).toISOString(), state: { reviews: [], delegations: [], verifications: [] } }, log: [] };
  }
  if (snapshotText === null || logText === null) throw error('QUALITY_STORE_INCOMPLETE', 'Snapshot and append-only log must exist together.');
  const snapshot = parseJson<unknown>(snapshotText, QUALITY_STATE_FILE);
  validateSnapshot(snapshot);
  const log: QualityEvent[] = [];
  const lines = logText.split('\n');
  if (!logText.endsWith('\n')) throw error('MALFORMED_QUALITY_LOG', 'Quality log is truncated (missing record delimiter).');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() === '') throw error('MALFORMED_QUALITY_LOG', 'Quality log contains an empty record.');
    let event: unknown;
    try {
      event = parseJson<unknown>(lines[index], `${QUALITY_LOG_FILE}:${index + 1}`);
    } catch (cause) {
      if (cause instanceof QualityEngineError && cause.code === 'MALFORMED_QUALITY_RECORD') throw error('MALFORMED_QUALITY_LOG', `Malformed JSON in ${QUALITY_LOG_FILE}:${index + 1}.`);
      throw cause;
    }
    validateEvent(event, index + 1);
    log.push(event);
  }
  if (log.length !== snapshot.sequence || !log.length || log[log.length - 1].stateHash !== hash(stableJson(snapshot.state)) || snapshot.updatedAt !== log[log.length - 1].timestamp) throw error('QUALITY_STORE_MISMATCH', 'Snapshot and append-only log do not describe the same history.');
  return { snapshot, log };
}

export async function transactQuality(
  changeDir: string,
  expectedVersion: number,
  operation: string,
  payload: unknown,
  nextState: QualityState,
  options: StoreWriteOptions = {},
): Promise<{ snapshot: QualitySnapshot; event: QualityEvent }> {
  if (!isInteger(expectedVersion)) throw error('INVALID_QUALITY_VERSION', 'Expected quality version must be a non-negative integer.');
  requireShape(textSchema, operation, 'INVALID_QUALITY_OPERATION');
  const safeState = clone(nextState);
  requireShape(stateSchema, safeState, 'INVALID_QUALITY_STATE');
  const safePayload = clone(payload);
  await validateStorage(changeDir);
  await fs.mkdir(changeDir, { recursive: true });
  const lockPath = path.join(changeDir, QUALITY_LOCK_FILE);
  await fs.mkdir(changeDir, { recursive: true });
  await validateStorage(changeDir);
  let lock;
  try { lock = await fs.open(lockPath, 'wx'); }
  catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'EEXIST') throw error('QUALITY_STORE_LOCKED', 'Quality operation lock exists; confirm the writer stopped before manual recovery.');
    throw cause;
  }
  try {
    const current = await readQualityStore(changeDir);
    if (current.snapshot.version !== expectedVersion) throw error('STALE_QUALITY_VERSION', `Expected quality version ${expectedVersion}, current version is ${current.snapshot.version}.`);
    const event: QualityEvent = { contractVersion: QUALITY_CONTRACT_VERSION, sequence: current.snapshot.sequence + 1, version: current.snapshot.version + 1, timestamp: new Date().toISOString(), operation, payload: safePayload, stateHash: hash(stableJson(safeState)) };
    const snapshot: QualitySnapshot = { contractVersion: QUALITY_CONTRACT_VERSION, version: event.version, sequence: event.sequence, updatedAt: event.timestamp, state: safeState };
    const appendLog = options.appendLog ?? ((file, data) => fs.appendFile(file, data, 'utf8'));
    const writeSnapshot = options.writeSnapshot ?? ((file, data) => fs.writeFile(file, data, 'utf8'));
    await validateStorage(changeDir);
    await appendLog(path.join(changeDir, QUALITY_LOG_FILE), `${JSON.stringify(event)}\n`);
    await writeSnapshot(path.join(changeDir, QUALITY_STATE_FILE), `${JSON.stringify(snapshot, null, 2)}\n`);
    return { snapshot, event };
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
}

async function currentState(changeDir: string): Promise<{ store: QualityStore; state: QualityState }> {
  const store = await readQualityStore(changeDir);
  return { store, state: clone(store.snapshot.state) };
}

async function safeEvidenceFiles(projectRoot: string, files: string[]): Promise<string[]> {
  if (!Array.isArray(files) || files.length === 0) throw error('MISSING_REVIEW_EVIDENCE', 'At least one evidenceFiles path is required.');
  const normalized: string[] = [];
  for (const file of files) {
    const relative = normalizeRelativePath(file);
    if (isQualityRuntimePath(relative)) throw error('UNSAFE_EVIDENCE_PATH', 'Quality runtime files cannot be review evidence.', relative);
    const resolved = await assertNoSymlinkParents(projectRoot, relative);
    if (!(await fs.lstat(resolved)).isFile()) throw error('INVALID_EVIDENCE_PATH', 'Review evidence must be a regular file.', relative);
    normalized.push(relative);
  }
  return [...new Set(normalized)].sort();
}

async function tasksHash(changeDir: string): Promise<string | null> {
  const file = path.join(changeDir, 'tasks.md');
  await assertSafeStoragePath(file);
  try { return hash(await fs.readFile(file)); }
  catch (cause) { if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return null; throw cause; }
}

export async function beginReview(input: ReviewBeginInput, writeOptions: StoreWriteOptions = {}): Promise<{ review: ReviewRecord; snapshot: QualitySnapshot }> {
  validateChangeRoot(input.projectRoot, input.changeDir);
  if (!['baseline', 'incremental', 'defect-repair'].includes(input.scope)) throw error('INVALID_REVIEW_SCOPE', 'Review scope must be baseline, incremental, or defect-repair.');
  if (typeof input.assignment !== 'string' || input.assignment.trim() === '') throw error('INVALID_REVIEW_ASSIGNMENT', 'Review assignment must be non-empty.');
  requireShape(stringsSchema.optional(), input.delegationIds, 'INVALID_DELEGATION_REFERENCES');
  if (input.revalidation) {
    if (input.scope !== 'baseline' || input.delegationIds !== undefined) throw error('INVALID_REVALIDATION_SCOPE', 'Revalidation requires baseline scope without delegationIds.');
    if (typeof input.revalidation.reason !== 'string' || input.revalidation.reason.trim() === '') throw error('INVALID_REVALIDATION_REASON', 'Explicit revalidation requires a nonempty reason.');
    if (input.revalidation.previousFlowStopped !== true) throw error('INVALID_REVALIDATION_STOP_DECLARATION', 'Confirm the original flow and pending writes or recovery have stopped before declaring previousFlowStopped=true. The CLI does not detect external processes.');
    if (input.expectedVersion === undefined || !isInteger(input.expectedVersion)) throw error('INVALID_QUALITY_VERSION', 'Explicit revalidation requires the current quality --version from reconciled status.');
  }
  const beforeManifest = await buildCodeManifest(input.projectRoot);
  const current = await currentState(input.changeDir);
  const expected = input.expectedVersion ?? current.store.snapshot.version;
  if (expected !== current.store.snapshot.version) throw error('STALE_QUALITY_VERSION', 'Review begin version is stale.');
  for (const delegationId of input.delegationIds ?? []) {
    if (!current.state.delegations.some(record => record.delegationId === delegationId)) throw error('UNKNOWN_DELEGATION', 'Review delegation identity is unknown.');
  }
  const associationId = input.revalidation ? id('REVFLOW') : undefined;
  const review: ReviewRecord = { reviewId: id('REV'), associationId, scope: input.scope, assignment: input.assignment, delegationIds: [...(input.delegationIds ?? [])], startedVersion: expected + 1, beforeManifest };
  let nextState: QualityState;
  let operation = 'review.begin';
  let payload: unknown = { reviewId: review.reviewId, scope: review.scope, review };
  if (input.revalidation) {
    const { revalidationHistory: history = [], ...archivedState } = current.state;
    const archived = {
      associationId: associationId!, reason: input.revalidation.reason.trim(), archivedVersion: current.store.snapshot.version,
      archivedAt: new Date().toISOString(),
      snapshot: { ...current.store.snapshot, state: archivedState },
    };
    nextState = {
      reviews: [review], delegations: [], verifications: [], checkpoints: [],
      activeAssociationId: associationId,
      revalidationHistory: [...history, archived],
    };
    operation = 'review.revalidate';
    payload = { associationId, reason: archived.reason, review };
  } else {
    nextState = { ...current.state, reviews: [...current.state.reviews, review] };
  }
  const result = await transactQuality(input.changeDir, expected, operation, payload, nextState, writeOptions);
  review.startedVersion = result.snapshot.version;
  return { review, snapshot: result.snapshot };
}

function validateReviewResult(result: ReviewResult, issues: ReviewIssue[], plan: WriteBackPlanEntry[]): void {
  if (!['PASS', 'PASS_WITH_WARNINGS', 'FAIL_NEEDS_CORRECTIONS'].includes(result)) throw error('INVALID_REVIEW_RESULT', 'Unsupported review result.');
  requireShape(z.array(issueSchema), issues, 'INVALID_REVIEW_ISSUES');
  const critical = issues.filter((issue) => issue && issue.severity === 'CRITICAL');
  if (result !== 'FAIL_NEEDS_CORRECTIONS' && critical.length > 0) throw error('REVIEW_RESULT_INCONSISTENT', 'A passing review cannot contain CRITICAL issues.');
  if (result === 'FAIL_NEEDS_CORRECTIONS' && critical.length === 0) throw error('REVIEW_RESULT_INCONSISTENT', 'A failing review requires a CRITICAL issue.');
  if (!Array.isArray(plan)) throw error('MISSING_WRITEBACK_PLAN', 'writeBackPlan must be an array.');
  if (critical.length > 0 && plan.length === 0) throw error('MISSING_WRITEBACK_PLAN', 'CRITICAL review issues require writeBackPlan entries.');
  if (critical.length === 0 && plan.length > 0) throw error('UNEXPECTED_WRITEBACK_PLAN', 'writeBackPlan must be empty when no CRITICAL issue exists.');
  requireShape(z.array(writeBackSchema), plan, 'INVALID_WRITEBACK_PLAN');
}

export async function submitReview(input: ReviewSubmitInput, writeBack: ReviewWriteBackOptions = {}): Promise<{ review: ReviewRecord; snapshot: QualitySnapshot }> {
  validateChangeRoot(input.projectRoot, input.changeDir);
  validateReviewResult(input.result, input.issues, input.writeBackPlan);
  requireShape(summarySchema, input.summary, 'INVALID_REVIEW_SUMMARY');
  const preflight = await currentState(input.changeDir);
  if (preflight.store.snapshot.version !== input.expectedVersion) throw error('STALE_QUALITY_VERSION', 'Review submission version is stale.');
  const preflightReview = preflight.state.reviews.find((review) => review.reviewId === input.reviewId);
  if (!preflightReview) throw error('UNKNOWN_REVIEW', 'Review identity is unknown.');
  if (preflightReview.result) throw error('REVIEW_ALREADY_SUBMITTED', 'Review has already been submitted.');
  if (input.writeBackPlan.length > 0) {
    if (!writeBack.writeBack) throw error('WRITEBACK_REQUIRED', 'CRITICAL review writeback must complete before Review submission.');
    const tasksPath = path.join(input.changeDir, 'tasks.md');
    await assertSafeStoragePath(tasksPath);
    await writeBack.writeBack(tasksPath, clone(input.writeBackPlan));
  }
  const evidenceFiles = await safeEvidenceFiles(input.projectRoot, input.evidenceFiles);
  const afterManifest = await buildCodeManifest(input.projectRoot);
  const current = await currentState(input.changeDir);
  if (current.store.snapshot.version !== input.expectedVersion) throw error('STALE_QUALITY_VERSION', 'Review submission version is stale.');
  const index = current.state.reviews.findIndex((review) => review.reviewId === input.reviewId);
  if (index < 0) throw error('UNKNOWN_REVIEW', 'Review identity is unknown.');
  const existing = current.state.reviews[index];
  if (existing.result) throw error('REVIEW_ALREADY_SUBMITTED', 'Review has already been submitted.');
  const comparison = await compareManifests(existing.beforeManifest, afterManifest);
  if (existing.scope === 'baseline' && existing.delegationIds.length > 0) throw error('INVALID_BASELINE_SCOPE', 'Baseline Review cannot be scoped to delegation IDs.');
  const review: ReviewRecord = { ...existing, submittedVersion: input.expectedVersion + 1, afterManifest, changedDuringReview: !comparison.equal, valid: comparison.equal, result: input.result, issues: clone(input.issues), evidenceFiles, summary: input.summary, writeBackPlan: clone(input.writeBackPlan), tasksFileHash: await tasksHash(input.changeDir) };
  const reviews = [...current.state.reviews];
  reviews[index] = review;
  const result = await transactQuality(input.changeDir, input.expectedVersion, 'review.submit', { reviewId: review.reviewId, result: review.result, changedDuringReview: review.changedDuringReview, review }, { ...current.state, reviews }, writeBack);
  review.submittedVersion = result.snapshot.version;
  return { review, snapshot: result.snapshot };
}

function passingBaseline(state: QualityState, reviewId: string, currentVersion: number): ReviewRecord {
  const review = state.reviews.find((candidate) => candidate.reviewId === reviewId);
  if (!review || review.scope !== 'baseline' || !review.valid || !review.submittedVersion || review.submittedVersion >= currentVersion || !['PASS', 'PASS_WITH_WARNINGS'].includes(review.result ?? '')) throw error('BASELINE_REVIEW_REQUIRED', 'A stable passing baseline Review predating optimization is required.');
  return review;
}

export async function startDelegation(input: DelegationStartInput): Promise<{ delegation: DelegationRecord; snapshot: QualitySnapshot }> {
  validateChangeRoot(input.projectRoot, input.changeDir);
  if (typeof input.scope !== 'string' || input.scope.trim() === '') throw error('INVALID_DELEGATION_SCOPE', 'Delegation scope must be non-empty.');
  requireShape(stringsSchema.optional(), input.constraints, 'INVALID_DELEGATION_CONSTRAINTS');
  const current = await currentState(input.changeDir);
  const expected = input.expectedVersion ?? current.store.snapshot.version;
  if (expected !== current.store.snapshot.version) throw error('STALE_QUALITY_VERSION', 'Delegation start version is stale.');
  const baseline = passingBaseline(current.state, input.baselineReviewId, expected + 1);
  const resolvedCommit = await validateCommit(input.projectRoot, input.recoveryCommit);
  const currentManifest = await buildCodeManifest(input.projectRoot);
  const first = current.state.delegations[0];
  if (first) {
    if (baseline.reviewId !== first.baselineReviewId || baseline.submittedVersion! >= first.startedVersion) {
      throw error('BASELINE_REVIEW_REQUIRED', 'Delegations must reuse the established preoptimization baseline.');
    }
  } else if (!baseline.afterManifest || !(await compareManifests(baseline.afterManifest, currentManifest)).equal) {
    throw error('BASELINE_STATE_MISMATCH', 'The passing baseline does not match the initial optimization state.');
  }
  const recoveryManifest = await commitManifest(input.projectRoot, resolvedCommit);
  const matchingCurrent = (await compareManifests(recoveryManifest, currentManifest)).equal;
  if (!matchingCurrent && (!first || resolvedCommit !== first.recoveryCommit)) {
    throw error('RECOVERY_COMMIT_MISMATCH', 'Recovery must match current CODE or the original established baseline recovery commit.');
  }
  const baselineCheckpoint = (current.state.checkpoints ?? []).find(checkpoint => checkpoint.kind === 'baseline' && checkpoint.reviewId === baseline.reviewId);
  if (!baselineCheckpoint || (!first && (baselineCheckpoint.commit !== resolvedCommit || baselineCheckpoint.manifest.hash !== currentManifest.hash))) {
    throw error('BASELINE_CHECKPOINT_REQUIRED', 'A recorded recoverable baseline checkpoint matching the passing baseline Review is required before optimization.');
  }
  const delegation: DelegationRecord = { delegationId: id('DEL'), scope: input.scope, constraints: input.constraints ? [...input.constraints] : undefined, baselineReviewId: baseline.reviewId, recoveryCommit: resolvedCommit, startedVersion: expected + 1, startManifest: currentManifest, saves: [] };
  const result = await transactQuality(input.changeDir, expected, 'delegation.start', { delegationId: delegation.delegationId, baselineReviewId: baseline.reviewId, recoveryCommit: resolvedCommit, delegation }, { ...current.state, delegations: [...current.state.delegations, delegation] });
  delegation.startedVersion = result.snapshot.version;
  return { delegation, snapshot: result.snapshot };
}

export async function saveDelegation(input: DelegationSaveInput): Promise<{ delegation: DelegationRecord; snapshot: QualitySnapshot }> {
  if (typeof input.report !== 'string' || input.report.trim() === '') throw error('INVALID_DELEGATION_REPORT', 'Delegation report must be non-empty.');
  if (!['progress', 'delivered'].includes(input.delivery)) throw error('INVALID_DELEGATION_DELIVERY', 'Delivery must be progress or delivered.');
  requireShape(stringsSchema, input.evidenceIds, 'INVALID_EVIDENCE_REFERENCES');
  requireShape(z.boolean(), input.unresolved, 'INVALID_UNRESOLVED');
  const current = await currentState(input.changeDir);
  if (current.store.snapshot.version !== input.expectedVersion) throw error('STALE_QUALITY_VERSION', 'Delegation save version is stale.');
  const index = current.state.delegations.findIndex((delegation) => delegation.delegationId === input.delegationId);
  if (index < 0) throw error('UNKNOWN_DELEGATION', 'Delegation identity is unknown.');
  for (const evidenceId of input.evidenceIds) if (!current.state.verifications.some((verification) => verification.evidenceId === evidenceId)) throw error('UNKNOWN_EVIDENCE', `Unknown verification evidence: ${evidenceId}`);
  const save: DelegationSave = { version: input.expectedVersion + 1, report: input.report, evidenceIds: [...input.evidenceIds], delivery: input.delivery, unresolved: input.unresolved };
  const delegation = clone(current.state.delegations[index]);
  delegation.saves.push(save);
  const delegations = [...current.state.delegations];
  delegations[index] = delegation;
  const result = await transactQuality(input.changeDir, input.expectedVersion, 'delegation.save', { delegationId: delegation.delegationId, delivery: save.delivery, unresolved: save.unresolved, save }, { ...current.state, delegations });
  save.version = result.snapshot.version;
  delegation.saves[delegation.saves.length - 1] = save;
  return { delegation, snapshot: result.snapshot };
}

export async function skipDelegation(changeDir: string, reason: string, expectedVersion?: number): Promise<QualitySnapshot> {
  if (typeof reason !== 'string' || reason.trim() === '') throw error('INVALID_SKIP_REASON', 'Skip requires an explicit reason.');
  const current = await currentState(changeDir);
  const expected = expectedVersion ?? current.store.snapshot.version;
  if (expected !== current.store.snapshot.version) throw error('STALE_QUALITY_VERSION', 'Skip version is stale.');
  const result = await transactQuality(changeDir, expected, 'delegation.skip', { reason, skip: { reason, version: expected + 1 } }, { ...current.state, skip: { reason, version: expected + 1 } });
  return result.snapshot;
}

function runProcess(argv: string[], cwd: string): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null; spawnError?: string; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const [executable, ...args] = argv;
    const child = spawn(executable, args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let spawnError: string | undefined;
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr?.on('data', (chunk: string) => { stderr += chunk; });
    child.once('error', (cause) => { spawnError = cause.message; });
    child.once('close', (exitCode, signal) => resolve({ exitCode, signal, spawnError, stdout, stderr }));
  });
}

export async function executeVerification(input: VerificationInput): Promise<{ verification: VerificationRecord; snapshot: QualitySnapshot }> {
  if (!Array.isArray(input.argv) || input.argv.length === 0 || typeof input.argv[0] !== 'string' || input.argv[0].length === 0 || input.argv.some((value) => typeof value !== 'string' || value.includes('\0'))) throw error('INVALID_EXECUTABLE_ARGV', 'Verification argv must be a non-empty executable-plus-arguments array.');
  await validateStorage(input.changeDir);
  const projectRoot = path.resolve(input.projectRoot);
  const safeChangeRelative = path.relative(projectRoot, path.resolve(input.changeDir)).split(path.sep).join('/');
  if (!/^\.xirang\/changes\/[^/]+$/.test(safeChangeRelative)) throw error('UNSAFE_CHANGE_DIR', 'Verification changeDir must be a managed root within projectRoot.');
  const evidenceDir = path.join(input.changeDir, QUALITY_EVIDENCE_DIR);
  await assertSafeStoragePath(evidenceDir);
  const current = await currentState(input.changeDir);
  const expected = input.expectedVersion ?? current.store.snapshot.version;
  if (expected !== current.store.snapshot.version) throw error('STALE_QUALITY_VERSION', 'Verification start version is stale.');
  await fs.mkdir(evidenceDir, { recursive: true });
  if (input.delegationId && !current.state.delegations.some((delegation) => delegation.delegationId === input.delegationId)) throw error('UNKNOWN_DELEGATION', 'Verification delegation identity is unknown.');
  const beforeManifest = await buildCodeManifest(input.projectRoot);
  const root = path.resolve(input.projectRoot);
  const cwd = input.cwd ? (path.isAbsolute(input.cwd) ? path.resolve(input.cwd) : resolveInside(root, input.cwd)) : root;
  const relativeCwd = path.relative(root, cwd);
  if (relativeCwd === '..' || relativeCwd.startsWith(`..${path.sep}`) || path.isAbsolute(relativeCwd)) throw error('UNSAFE_CWD', 'Verification cwd must remain inside projectRoot.');
  if (relativeCwd !== '') await assertNoSymlinkParents(root, relativeCwd.split(path.sep).join('/'));
  const cwdStat = await fs.lstat(cwd);
  if (!cwdStat.isDirectory() || cwdStat.isSymbolicLink()) throw error('UNSAFE_CWD', 'Verification cwd must be a real directory.');
  const run = await runProcess(input.argv, cwd);
  const afterManifest = await buildCodeManifest(input.projectRoot);
  const comparison = await compareManifests(beforeManifest, afterManifest);
  const evidenceId = id('EVD');
  const changeRelative = path.relative(root, path.resolve(input.changeDir)).split(path.sep).join('/');
  if (changeRelative === '..' || changeRelative.startsWith('../') || path.isAbsolute(changeRelative)) throw error('UNSAFE_CHANGE_DIR', 'changeDir must remain inside projectRoot.');
  const evidenceRelative = `${changeRelative}/${QUALITY_EVIDENCE_DIR}/${evidenceId}.json`;
  const evidenceFile = path.join(input.changeDir, QUALITY_EVIDENCE_DIR, `${evidenceId}.json`);
  const success = run.spawnError === undefined && run.exitCode === 0 && run.signal === null && comparison.equal;
  const verification: VerificationRecord = { evidenceId, delegationId: input.delegationId, scope: input.scope?.trim() || 'verification', argv: [...input.argv], cwd, startedVersion: expected + 1, beforeManifest, afterManifest, changedDuringRun: !comparison.equal, exitCode: run.exitCode, signal: run.signal, spawnError: run.spawnError, stdout: run.stdout, stderr: run.stderr, evidenceFile: evidenceRelative, success };
  await assertSafeStoragePath(evidenceFile);
  await fs.writeFile(evidenceFile, `${JSON.stringify({ ...verification, capturedAt: new Date().toISOString() }, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  const latest = await currentState(input.changeDir);
  const result = await transactQuality(input.changeDir, expected, 'verification.execute', { evidenceId, success, evidenceFile: evidenceRelative, verification }, { ...latest.state, verifications: [...latest.state.verifications, verification] });
  verification.startedVersion = expected + 1;
  return { verification, snapshot: result.snapshot };
}

export async function readQualityVersion(changeDir: string): Promise<number> {
  return (await readQualityStore(changeDir)).snapshot.version;
}

export const qualityEngine = {
  buildCodeManifest,
  captureCodeManifest,
  compareManifests,
  compareRecoverableCommit,
  readQualityStore,
  transactQuality,
  beginReview,
  submitReview,
  startDelegation,
  saveDelegation,
  skipDelegation,
  executeVerification,
  readQualityVersion,
};
