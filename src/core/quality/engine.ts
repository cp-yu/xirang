import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);
export const QUALITY_FILE = '.quality.json';

export interface QualityReviewOpinion {
  reviewId: string;
  scope: string;
  commit: string;
  result: 'PASS' | 'FAIL';
  summary: string;
  findings: string[];
}

export interface QualityOptOpinion {
  opinionId: string;
  baseCommit: string;
  resultCommit: string;
  summary: string;
  findings: string[];
}

export interface QualitySeal {
  commit: string;
  canRun: boolean;
  testsExpectedToPass: boolean;
  testScope: string;
  assessment: string;
}

export type QualityStatus = 'needs_review' | 'needs_optimize' | 'all_done';

export interface QualityRecord {
  schemaVersion: 3;
  changeId: string;
  revision: number;
  reviews: QualityReviewOpinion[];
  opt: null | { disposition: 'not_performed'; reason: string } | { disposition: 'delivered'; opinions: QualityOptOpinion[] };
  seal: QualitySeal | null;
}

export interface QualityDiagnostic { code: string; path?: string; message: string }

export class QualityEngineError extends Error {
  readonly code: string;
  readonly diagnostics: QualityDiagnostic[];

  constructor(code: string, message: string, pathName?: string) {
    super(message);
    this.name = 'QualityEngineError';
    this.code = code;
    this.diagnostics = [{ code, ...(pathName ? { path: pathName } : {}), message }];
  }
}

export interface QualityRecordWriteOptions {
  beforeReplace?: (temporaryFile: string, targetFile: string) => Promise<void>;
}

const reviewSchema = z.object({
  reviewId: z.string().trim().min(1), scope: z.string().trim().min(1), commit: z.string().min(1),
  result: z.enum(['PASS', 'FAIL']), summary: z.string().trim().min(1), findings: z.array(z.string()),
}).strict();
const optOpinionSchema = z.object({
  opinionId: z.string().trim().min(1), baseCommit: z.string().min(1), resultCommit: z.string().min(1),
  summary: z.string().trim().min(1), findings: z.array(z.string()),
}).strict();
const sealSchema = z.object({
  commit: z.string().min(1), canRun: z.literal(true), testsExpectedToPass: z.literal(true),
  testScope: z.string().trim().min(1), assessment: z.string().trim().min(1),
}).strict();
const qualityRecordSchema = z.object({
  schemaVersion: z.literal(3), changeId: z.string().min(1), revision: z.number().int().nonnegative(),
  reviews: z.array(reviewSchema),
  opt: z.union([
    z.null(),
    z.object({ disposition: z.literal('not_performed'), reason: z.string().trim().min(1) }).strict(),
    z.object({ disposition: z.literal('delivered'), opinions: z.array(optOpinionSchema).min(1) }).strict(),
  ]),
  seal: sealSchema.nullable(),
}).strict();

function fail(code: string, message: string, pathName?: string): never {
  throw new QualityEngineError(code, message, pathName);
}

function emptyRecord(changeDir: string): QualityRecord {
  return { schemaVersion: 3, changeId: path.basename(path.resolve(changeDir)), revision: 0, reviews: [], opt: null, seal: null };
}

async function assertNoSymlinkPath(base: string, target: string): Promise<void> {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedBase, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) fail('UNSAFE_CHANGE_DIR', 'Quality path must remain inside the project change directory.', target);
  let current = resolvedBase;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) fail('UNSAFE_SYMLINK', 'Quality storage paths must not traverse symlinks.', current);
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw cause;
    }
  }
}

async function validateChangeDir(changeDir: string): Promise<void> {
  const resolved = path.resolve(changeDir);
  if (path.basename(path.dirname(resolved)) !== 'changes' || path.basename(path.dirname(path.dirname(resolved))) !== '.xirang') {
    fail('UNSAFE_CHANGE_DIR', 'Quality storage requires a .xirang/changes/<change> directory.', resolved);
  }
  const projectRoot = path.dirname(path.dirname(path.dirname(resolved)));
  await assertNoSymlinkPath(projectRoot, resolved);
  const file = path.join(resolved, QUALITY_FILE);
  await assertNoSymlinkPath(resolved, file);
  try {
    if (!(await fs.lstat(file)).isFile()) fail('UNSAFE_PATH', 'Quality record must be a regular file.', file);
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') throw cause;
  }
}

export async function readQualityRecord(changeDir: string): Promise<QualityRecord> {
  await validateChangeDir(changeDir);
  const file = path.join(changeDir, QUALITY_FILE);
  let text: string;
  try { text = await fs.readFile(file, 'utf8'); }
  catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return emptyRecord(changeDir);
    throw cause;
  }
  let parsedJson: unknown;
  try { parsedJson = JSON.parse(text); }
  catch { return fail('MALFORMED_QUALITY_RECORD', `Malformed JSON in ${QUALITY_FILE}.`, file); }
  const parsed = qualityRecordSchema.safeParse(parsedJson);
  if (!parsed.success) fail('INVALID_QUALITY_RECORD', parsed.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).join('; '), file);
  if (parsed.data.changeId !== path.basename(path.resolve(changeDir))) {
    fail('QUALITY_CHANGE_MISMATCH', 'Quality record Change identity does not match its directory.', file);
  }
  return parsed.data;
}

export async function transactQualityRecord(
  changeDir: string,
  expectedRevision: number,
  update: (current: QualityRecord) => QualityRecord,
  options: QualityRecordWriteOptions = {},
): Promise<QualityRecord> {
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) fail('INVALID_QUALITY_REVISION', 'Expected revision must be a non-negative integer.');
  await validateChangeDir(changeDir);
  await fs.mkdir(changeDir, { recursive: true });
  await validateChangeDir(changeDir);
  const lockPath = path.join(changeDir, `${QUALITY_FILE}.lock`);
  let lock;
  try { lock = await fs.open(lockPath, 'wx'); }
  catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'EEXIST') fail('QUALITY_RECORD_LOCKED', 'A Quality record write is already in progress.', lockPath);
    throw cause;
  }
  let temporaryFile: string | undefined;
  try {
    const current = await readQualityRecord(changeDir);
    if (current.revision !== expectedRevision) fail('STALE_QUALITY_REVISION', `Expected revision ${expectedRevision}, current revision is ${current.revision}.`);
    const proposed = update(structuredClone(current));
    const candidate = { ...proposed, schemaVersion: 3 as const, changeId: current.changeId, revision: current.revision + 1 };
    const parsed = qualityRecordSchema.safeParse(candidate);
    if (!parsed.success) fail('INVALID_QUALITY_RECORD', parsed.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).join('; '));
    const target = path.join(changeDir, QUALITY_FILE);
    temporaryFile = path.join(changeDir, `.${QUALITY_FILE}.${randomUUID()}.tmp`);
    const handle = await fs.open(temporaryFile, 'wx');
    try { await handle.writeFile(`${JSON.stringify(parsed.data, null, 2)}\n`, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    await options.beforeReplace?.(temporaryFile, target);
    await fs.rename(temporaryFile, target);
    temporaryFile = undefined;
    return parsed.data;
  } finally {
    if (temporaryFile) await fs.unlink(temporaryFile).catch(() => {});
    await lock.close();
    await fs.unlink(lockPath);
  }
}

async function requireExistingCommit(projectRoot: string, commit: string): Promise<string> {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(commit)) fail('INVALID_GIT_COMMIT', 'Commit must be a full Git object ID.');
  try {
    const result = await execFileAsync('git', ['rev-parse', '--verify', `${commit}^{commit}`], { cwd: projectRoot });
    return result.stdout.trim();
  } catch {
    fail('GIT_COMMIT_NOT_FOUND', `Git commit does not exist: ${commit}.`);
  }
}

export async function recordQualityReview(input: {
  changeDir: string; projectRoot: string; expectedRevision: number; reviewId: string; scope: string;
  commit: string; result: 'PASS' | 'FAIL'; summary: string; findings: string[];
}): Promise<QualityRecord> {
  const commit = await requireExistingCommit(input.projectRoot, input.commit);
  const current = await readQualityRecord(input.changeDir);
  if (current.revision !== input.expectedRevision) fail('STALE_QUALITY_REVISION', `Expected revision ${input.expectedRevision}, current revision is ${current.revision}.`);
  if (current.reviews.some(review => review.reviewId === input.reviewId)) fail('DUPLICATE_REVIEW_ID', 'Review identity already exists.');
  const opinion = reviewSchema.safeParse({
    reviewId: input.reviewId, scope: input.scope, commit, result: input.result,
    summary: input.summary, findings: input.findings,
  });
  if (!opinion.success) fail('INVALID_REVIEW_OPINION', opinion.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).join('; '));
  const latestForScope = current.reviews.filter(review => review.scope === opinion.data.scope).at(-1);
  if (latestForScope?.result === 'FAIL' && opinion.data.result === 'PASS' && latestForScope.commit === commit) {
    fail('REVIEW_COMMIT_NOT_ADVANCED', 'A passing re-review after failure must bind a different Git commit.');
  }
  return transactQualityRecord(input.changeDir, input.expectedRevision, record => ({
    ...record, reviews: [...record.reviews, opinion.data], seal: null,
  }));
}

export async function recordQualityOpt(input: {
  changeDir: string; projectRoot: string; expectedRevision: number;
  disposition: 'not_performed' | 'delivered'; reason?: string; opinions?: QualityOptOpinion[];
}): Promise<QualityRecord> {
  const current = await readQualityRecord(input.changeDir);
  if (current.revision !== input.expectedRevision) fail('STALE_QUALITY_REVISION', `Expected revision ${input.expectedRevision}, current revision is ${current.revision}.`);
  const baseline = current.reviews.filter(review => review.scope === 'baseline').at(-1);
  if (!baseline || baseline.result !== 'PASS') fail('BASELINE_REVIEW_REQUIRED', 'A passing baseline Review is required before recording Opt disposition.');
  if (input.disposition === 'not_performed') {
    if (!input.reason?.trim()) fail('INVALID_OPT_DISPOSITION', 'not_performed requires a non-empty reason.');
    return transactQualityRecord(input.changeDir, input.expectedRevision, record => ({
      ...record, opt: { disposition: 'not_performed', reason: input.reason!.trim() }, seal: null,
    }));
  }
  if (!input.opinions?.length) fail('INVALID_OPT_OPINION', 'Delivered Opt disposition requires at least one opinion.');
  const prior = current.opt?.disposition === 'delivered' ? current.opt.opinions : [];
  const previousIds = new Set(prior.map(item => item.opinionId));
  let expectedBase = prior.at(-1)?.resultCommit ?? baseline.commit;
  const validated: QualityOptOpinion[] = [];
  for (const raw of input.opinions) {
    const opinion = optOpinionSchema.safeParse(raw);
    if (!opinion.success) fail('INVALID_OPT_OPINION', opinion.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).join('; '));
    if (previousIds.has(opinion.data.opinionId) || validated.some(item => item.opinionId === opinion.data.opinionId)) fail('DUPLICATE_OPT_ID', 'Opt opinion identity already exists.');
    if (opinion.data.baseCommit !== expectedBase) fail('OPT_COMMIT_SEQUENCE_INVALID', 'Each Opt baseCommit must match the prior reviewed or delivered result commit.');
    await requireExistingCommit(input.projectRoot, opinion.data.baseCommit);
    const resultCommit = await requireExistingCommit(input.projectRoot, opinion.data.resultCommit);
    validated.push({ ...opinion.data, resultCommit });
    expectedBase = resultCommit;
  }
  return transactQualityRecord(input.changeDir, input.expectedRevision, record => ({
    ...record,
    opt: { disposition: 'delivered', opinions: [...prior, ...validated] },
    seal: null,
  }));
}

export async function recordQualitySeal(input: {
  changeDir: string; projectRoot: string; expectedRevision: number; seal: QualitySeal;
}): Promise<QualityRecord> {
  const current = await readQualityRecord(input.changeDir);
  if (current.revision !== input.expectedRevision) fail('STALE_QUALITY_REVISION', `Expected revision ${input.expectedRevision}, current revision is ${current.revision}.`);
  const baseline = current.reviews.filter(review => review.scope === 'baseline').at(-1);
  const latestByScope = new Map<string, QualityReviewOpinion>();
  for (const review of current.reviews) latestByScope.set(review.scope, review);
  if (!baseline || baseline.result !== 'PASS' || [...latestByScope.values()].some(review => review.result !== 'PASS')) {
    fail('BASELINE_REVIEW_REQUIRED', 'Every latest Review opinion, including baseline, must pass before Seal.');
  }
  if (!current.opt) fail('OPT_DISPOSITION_REQUIRED', 'Record delivered Opt or not_performed before Seal.');
  const seal = sealSchema.safeParse(input.seal);
  if (!seal.success) fail('SEAL_ASSERTION_REQUIRED', seal.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).join('; '));
  const commit = await requireExistingCommit(input.projectRoot, seal.data.commit);
  return transactQualityRecord(input.changeDir, input.expectedRevision, record => ({ ...record, seal: { ...seal.data, commit } }));
}

export async function readQualityRecordStatus(changeDir: string, projectRoot: string): Promise<{
  status: QualityStatus; qualityStatus: 'valid' | 'missing'; revision: number; record: QualityRecord;
}> {
  const record = await readQualityRecord(changeDir);
  if (record.revision === 0) return { status: 'needs_review', qualityStatus: 'missing', revision: 0, record };
  const latestByScope = new Map<string, QualityReviewOpinion>();
  for (const review of record.reviews) latestByScope.set(review.scope, review);
  const baseline = latestByScope.get('baseline');
  const status: QualityStatus = !baseline || baseline.result !== 'PASS' || [...latestByScope.values()].some(item => item.result !== 'PASS')
    ? 'needs_review'
    : !record.opt || !record.seal ? 'needs_optimize' : 'all_done';
  if (record.seal) await requireExistingCommit(projectRoot, record.seal.commit);
  return { status, qualityStatus: 'valid', revision: record.revision, record };
}

export async function readQualitySeal(changeDir: string, projectRoot: string): Promise<{ valid: boolean; commit?: string }> {
  const record = await readQualityRecord(changeDir);
  if (!record.seal) return { valid: false };
  const commit = await requireExistingCommit(projectRoot, record.seal.commit);
  return { valid: true, commit };
}
