import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { z } from 'zod';
import { XIRANG_DIR_NAME } from '../core/config.js';
import { readProjectConfig } from '../core/project-config.js';
import {
  beginReview,
  executeVerification,
  QualityEngineError,
  readQualityStore,
  readQualityVersion,
  saveDelegation,
  skipDelegation,
  startDelegation,
  submitReview,
  type ReviewIssue,
  type ReviewWriteBackOptions,
} from '../core/quality/engine.js';
import {
  completeOptimization,
  evaluateCompletion,
  planCompletion,
  recordCheckpoint,
} from '../core/quality/completion.js';
import {
  commandSchemas,
  qualityOptionMetadata,
} from '../core/quality/command-schema.js';
import { validateChangeExists } from './workflow/shared.js';
import { renderQualityOverview, renderReviewHelp, renderDelegationHelp, renderVerificationHelp, renderConclusionHelp, renderQualityCheckpointStateMachine, renderQualityErrorRecovery } from '../core/quality/protocol.js';

const QUALITY_VERSION = 2;
const retiredOptimizeCode = 'UNSUPPORTED_OPTIMIZATION_PROTOCOL';

type QualityOptions = {
  input?: string;
  from?: string;
  json?: boolean;
  version?: string;
  begin?: boolean;
  review?: string;
  delegation?: string;
  scope?: string;
  commit?: string;
  kind?: string;
};

type QualityEnvelope = {
  ok: boolean;
  code: string;
  diagnostics: Array<{ code: string; path?: string; message: string }>;
  allowedNextOperations: string[];
  contractVersion?: number;
  version?: number;
  [key: string]: unknown;
};

export function registerQualityCommand(program: Command): void {
  const quality = program.command('quality').description('Record Review, delegated optimization, actual verification and completion evidence')
    .option('--no-color', 'Disable color output')
    .addHelpText('after', () => `\n${renderQualityOverview()}\n${renderQualityErrorRecovery()}`);

  quality.command('review <change-name>')
    .addHelpText('after', () => `\n${renderReviewHelp()}`)
    .option(qualityOptionMetadata.begin.flags, qualityOptionMetadata.begin.label)
    .option(qualityOptionMetadata.review.flags, qualityOptionMetadata.review.label)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runReview(changeName, options)));

  quality.command('delegation <change-name>')
    .addHelpText('after', () => `\n${renderDelegationHelp()}`)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runDelegation(changeName, options)));

  quality.command('optimize <change-name>', { hidden: true }).allowUnknownOption(true).allowExcessArguments(true)
    .option('--json', 'Output JSON')
    .option('--input <json>', 'JSON payload')
    .option('--from <file>', 'Read JSON payload from a file')
    .action(async () => runWithExitCode(async () => invalid(retiredOptimizeCode, 'The direction-ledger optimization protocol is retired.')));

  const verification = quality.command('verification <change-name> [command...]')
    .addHelpText('after', () => `\n${renderVerificationHelp()}`)
    .option(qualityOptionMetadata.delegation.flags, qualityOptionMetadata.delegation.label)
    .option(qualityOptionMetadata.scope.flags, qualityOptionMetadata.scope.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label);
  verification.action(async (changeName: string, argv: string[], options: QualityOptions) =>
    runWithExitCode(() => runVerification(changeName, options, argv)));

  quality.command('conclusion <change-name>')
    .addHelpText('after', () => `\n${renderConclusionHelp()}`)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runConclusion(changeName, options)));

  quality.command('checkpoint <change-name>')
    .addHelpText('after', () => `\n${renderQualityCheckpointStateMachine()}`)
    .option(qualityOptionMetadata.kind.flags, qualityOptionMetadata.kind.label)
    .option(qualityOptionMetadata.commit.flags, qualityOptionMetadata.commit.label)
    .option(qualityOptionMetadata.review.flags, qualityOptionMetadata.review.label)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runCheckpoint(changeName, options)));

  quality.command('status <change-name>')
    .addHelpText('after', '\nRead baseline, delegations, execution evidence, final conclusion, checkpoints and every completion gap. HEAD-only information is not a freshness failure.')
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runStatus(changeName, options)));

  quality.command('seal <change-name>')
    .addHelpText('after', '\nRequire the same full completion gate as status: all_done and no gaps, including final conclusion and successful checkpoint. A baseline PASS alone is insufficient.')
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (changeName: string, options: QualityOptions) => runWithExitCode(() => runSeal(changeName, options)));

  for (const command of quality.commands) {
    command.option('--no-color', 'Disable color output');
  }
}

async function runReview(changeName: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  const input = await readPayload(options);
  if (options.begin) {
    if (options.review) return invalid('INVALID_REVIEW_COMMAND', 'Begin cannot be combined with --review.');
    const payload = parse(commandSchemas.reviewBegin, input);
    if (options.version !== undefined && !payload.revalidation) return invalid('INVALID_REVIEW_COMMAND', 'Begin cannot be combined with --review. --version on begin is reserved for explicit revalidation.');
    const expectedVersion = payload.revalidation ? requiredVersion(options.version) : undefined;
    const result = await beginReview({
      changeDir: context.changeDir, projectRoot: context.projectRoot, scope: payload.scope,
      assignment: payload.assignment, delegationIds: payload.delegationIds, revalidation: payload.revalidation,
      expectedVersion,
    });
    return success('REVIEW_STARTED', result.snapshot.version, { review: result.review });
  }
  if (!options.review) return invalid('INVALID_REVIEW_COMMAND', 'Review requires --begin or --review <id>.');
  const expectedVersion = requiredVersion(options.version);
  const payload = parse(commandSchemas.reviewSubmit, input);
  const writeBackPlan = payload.writeBackPlan ?? [];
  const writeBack: ReviewWriteBackOptions = { writeBack: async (tasksPath, plan) => applyTaskWriteBack(tasksPath, plan) };
  const result = await submitReview({
    changeDir: context.changeDir, projectRoot: context.projectRoot, reviewId: options.review,
    expectedVersion, result: payload.result, issues: payload.issues as ReviewIssue[], evidenceFiles: payload.evidenceFiles,
    summary: payload.summary ?? 'Review submitted.', writeBackPlan,
  }, writeBack);
  return success('REVIEW_SUBMITTED', result.snapshot.version, { review: result.review });
}

async function runDelegation(changeName: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  const version = requiredVersion(options.version);
  const payload = readPayloadSchema(await readPayload(options), [commandSchemas.delegationStart, commandSchemas.delegationSave, commandSchemas.delegationSkip]);
  if (payload.action === 'start') {
    const config = readProjectConfig(context.projectRoot);
    if (config?.optimization?.enabled === false) return blocked('OPTIMIZATION_DISABLED', 'Optimization delegation is disabled; use an explicit skip.');
    const result = await startDelegation({
      changeDir: context.changeDir, projectRoot: context.projectRoot, expectedVersion: version,
      scope: payload.scope, constraints: payload.constraints, baselineReviewId: payload.baselineReviewId,
      recoveryCommit: payload.recoveryCommit,
    });
    return success('DELEGATION_STARTED', result.snapshot.version, { delegation: result.delegation });
  }
  if (payload.action === 'save') {
    const result = await saveDelegation({
      changeDir: context.changeDir, expectedVersion: version, delegationId: payload.delegationId,
      report: payload.report, evidenceIds: payload.evidenceIds, delivery: payload.delivery, unresolved: payload.unresolved,
    });
    return success('DELEGATION_SAVED', result.snapshot.version, { delegation: result.delegation });
  }
  const config = readProjectConfig(context.projectRoot);
  if (payload.basis === 'disabled' && config?.optimization?.enabled !== false) return invalid('INVALID_SKIP_BASIS', 'Disabled skip requires optimization.enabled=false.');
  if (payload.basis === 'user_refusal' && config?.optimization?.enabled === false) return invalid('INVALID_SKIP_BASIS', 'Use disabled skip when optimization.enabled=false.');
  const result = await skipDelegation(context.changeDir, `${payload.basis}: ${payload.reason}`, version);
  return success('DELEGATION_SKIPPED', result.version, { skip: result.state.skip });
}

async function runVerification(changeName: string, options: QualityOptions, argv: string[]): Promise<number> {
  const context = await resolveContext(changeName);
  if (options.input || options.from) return invalid('INVALID_VERIFICATION_COMMAND', 'Verification accepts executable argv after --, not a JSON payload.');
  if (argv.length === 0) return invalid('INVALID_EXECUTABLE_ARGV', 'Verification requires an executable after --.');
  const result = await executeVerification({
    changeDir: context.changeDir, projectRoot: context.projectRoot, argv,
    delegationId: options.delegation, scope: options.scope, expectedVersion: await readQualityVersion(context.changeDir),
  });
  const exitCode = result.verification.success ? 0 : 1;
  return emit({ ok: result.verification.success, code: result.verification.success ? 'VERIFICATION_RECORDED' : 'VERIFICATION_FAILED', diagnostics: result.verification.success ? [] : [{ code: 'VERIFICATION_FAILED', message: 'The captured command did not produce a successful current-state verification.' }], allowedNextOperations: ['delegation', 'conclusion'], version: result.snapshot.version, verification: result.verification }, exitCode);
}

async function runConclusion(changeName: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  const expectedVersion = requiredVersion(options.version);
  const input = await readPayload(options);
  const payload = readPayloadSchema(input, [commandSchemas.completionPlan, commandSchemas.completionComplete]);
  if (payload.action === 'plan') {
    const result = await planCompletion({
      changeDir: context.changeDir, projectRoot: context.projectRoot, expectedVersion,
      delegationIds: payload.delegationIds, verificationPlan: payload.verificationPlan, reasons: payload.reasons,
      requiredEvidenceIds: payload.requiredEvidenceIds, requiredReviewIds: payload.requiredReviewIds,
      baselineDefects: payload.baselineDefects, applicability: payload.applicability,
      recoveryConfirmed: payload.recoveryConfirmed, unresolvedIssues: payload.unresolvedIssues,
    });
    return success('CONCLUSION_PLANNED', result.snapshot.version, { plan: result.plan });
  }
  const result = await completeOptimization({ changeDir: context.changeDir, projectRoot: context.projectRoot, expectedVersion, planId: payload.planId, reasons: payload.reasons });
  return success('CONCLUSION_COMPLETED', result.snapshot.version, { conclusion: result.conclusion });
}

async function runCheckpoint(changeName: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  if (!options.kind || !options.commit) throw new QualityEngineError('INVALID_CHECKPOINT_INPUT', 'Checkpoint requires --kind and --commit.');
  const result = await recordCheckpoint({
    changeDir: context.changeDir, projectRoot: context.projectRoot,
    expectedVersion: options.version === undefined ? await readQualityVersion(context.changeDir) : requiredVersion(options.version),
    kind: options.kind as 'baseline' | 'intermediate' | 'successful', commit: options.commit, reviewId: options.review,
  });
  return success('CHECKPOINT_RECORDED', result.snapshot.version, { checkpoint: result.checkpoint });
}

async function runStatus(changeName: string, _options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  const evaluation = await evaluateCompletion(context.changeDir, context.projectRoot);
  const store = await readQualityStore(context.changeDir);
  const hasCurrentPassingBaseline = store.snapshot.state.reviews.some(review =>
    review.scope === 'baseline'
    && review.valid
    && ['PASS', 'PASS_WITH_WARNINGS'].includes(review.result ?? '')
    && review.afterManifest?.hash === evaluation.manifest.hash,
  );
  const allowedNextOperations = evaluation.status === 'all_done'
    ? ['archive']
    : evaluation.baseline
      ? ['delegation', 'verification', 'conclusion', 'checkpoint', 'status']
      : hasCurrentPassingBaseline
        ? ['checkpoint', 'status']
        : ['review', 'status'];
  return success('QUALITY_STATUS', store.snapshot.version, {
    status: evaluation.status, baseline: evaluation.baseline, delegations: store.snapshot.state.delegations,
    activeAssociationId: store.snapshot.state.activeAssociationId, revalidationHistory: store.snapshot.state.revalidationHistory ?? [],
    verifications: evaluation.verifications, plans: evaluation.plans, conclusion: evaluation.conclusion,
    checkpoints: evaluation.checkpoints, reviews: store.snapshot.state.reviews,
    baselineReview: evaluation.baseline ? store.snapshot.state.reviews.find(review => review.reviewId === evaluation.baseline!.reviewId) : undefined,
    gaps: evaluation.gaps, changedFiles: evaluation.changedFiles,
    information: { headDifference: evaluation.headDifference, head: evaluation.manifest.head },
    allowedNextOperations,
  });
}

async function runSeal(changeName: string, _options: QualityOptions): Promise<number> {
  const context = await resolveContext(changeName);
  const evaluation = await evaluateCompletion(context.changeDir, context.projectRoot);
  const store = await readQualityStore(context.changeDir);
  if (evaluation.status !== 'all_done' || evaluation.gaps.length > 0) {
    return emit({ ok: false, code: 'SEAL_NOT_READY', diagnostics: evaluation.gaps.map(code => ({ code, message: code })), allowedNextOperations: ['status'], version: store.snapshot.version, status: evaluation.status, gaps: evaluation.gaps }, 1);
  }
    const sealHash = hashSeal({ status: evaluation.status, gaps: evaluation.gaps, state: store.snapshot.state, manifest: evaluation.manifest });
  return success('SEALED', store.snapshot.version, { sealHash, status: evaluation.status, gaps: evaluation.gaps });
}

async function resolveContext(changeName: string): Promise<{ projectRoot: string; changeDir: string }> {
  const projectRoot = process.cwd();
  let validated: string;
  try { validated = await validateChangeExists(changeName, projectRoot); }
  catch (cause) { throw new QualityEngineError('INVALID_CHANGE', cause instanceof Error ? cause.message : String(cause)); }
  return { projectRoot, changeDir: path.join(projectRoot, XIRANG_DIR_NAME, 'changes', validated) };
}

async function readPayload(options: QualityOptions): Promise<unknown> {
  if (options.input && options.from) throw new QualityEngineError('INVALID_INPUT_SOURCE', '--input and --from are mutually exclusive.');
  let raw = options.input;
  if (options.from) {
    try { raw = await fs.readFile(path.resolve(process.cwd(), options.from), 'utf8'); }
    catch (cause) { throw new QualityEngineError('INVALID_INPUT_SOURCE', cause instanceof Error ? cause.message : String(cause)); }
  }
  if (raw === undefined) raw = await readStdin();
  if (!raw || raw.trim() === '') throw new QualityEngineError('INVALID_INPUT', 'A JSON payload is required.');
  try { return JSON.parse(raw); } catch { throw new QualityEngineError('INVALID_INPUT', 'Input is not valid JSON.'); }
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  return Buffer.concat(chunks).toString('utf8').trim();
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new QualityEngineError('INVALID_INPUT', result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  return result.data;
}

function readPayloadSchema(value: unknown, schemas: z.ZodType[]): any {
  const parsed = schemas.map(schema => schema.safeParse(value)).find(result => result.success);
  if (!parsed || !parsed.success) throw new QualityEngineError('INVALID_INPUT', 'Payload does not match a supported strict command shape.');
  return parsed.data;
}

function requiredVersion(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value)) throw new QualityEngineError('INVALID_QUALITY_VERSION', 'A non-negative --version is required.');
  return Number(value);
}

async function applyTaskWriteBack(tasksPath: string, plan: Array<{ taskLine?: string | null; action?: string; correctionType?: string; summary?: string; nextAction?: string }>): Promise<void> {
  let content = '';
  try { content = await fs.readFile(tasksPath, 'utf8'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  let updated = content;
  const correctionItems: string[] = [];
  for (const entry of plan) {
    if (entry.action === 'unmark') {
      if (!entry.taskLine?.trim()) throw new QualityEngineError('INVALID_WRITEBACK_PLAN', 'Review result is inconsistent.');
      const matchingLines = updated.split('\n').filter(line => line.trim() === entry.taskLine!.trim());
      if (matchingLines.length !== 1 || !/\[[xX]\]/.test(matchingLines[0])) {
        throw new QualityEngineError('INVALID_WRITEBACK_PLAN', 'Review result is inconsistent.');
      }
      updated = updated.split('\n').map(line => line.trim() === entry.taskLine!.trim() ? line.replace(/\[[xX]\]/, '[ ]') : line).join('\n');
    } else if (entry.action === 'append_correction') {
      const text = (entry.summary ?? entry.nextAction ?? 'Address the required correction.').replace(/[\r\n]+/g, ' ').trim();
      correctionItems.push(`- [ ] [${entry.correctionType}] ${text}`);
    }
  }
  if (correctionItems.length > 0) updated = appendRequiredCorrections(updated, correctionItems);
  if (updated !== content) await fs.writeFile(tasksPath, updated, 'utf8');
}

function appendRequiredCorrections(content: string, items: string[]): string {
  const heading = /^## Required Corrections\s*$/m;
  const match = heading.exec(content);
  if (!match || match.index === undefined) {
    return `${content}${content && !content.endsWith('\n') ? '\n' : ''}\n## Required Corrections\n${items.join('\n')}\n`;
  }
  const sectionStart = match.index + match[0].length;
  const nextHeading = /^## (?!Required Corrections\s*$).+$/m;
  nextHeading.lastIndex = sectionStart;
  const next = nextHeading.exec(content.slice(sectionStart));
  const insertAt = next ? sectionStart + next.index : content.length;
  const prefix = content.slice(0, insertAt);
  const suffix = content.slice(insertAt);
  const separator = prefix.endsWith('\n') ? '' : '\n';
  return `${prefix}${separator}${items.join('\n')}\n${suffix}`;
}


function hashSeal(value: unknown): string {
  return createHash('sha256').update(stableJson(value, true)).digest('hex');
}
function stableJson(value: unknown, omitInformational = false): string {
  if (Array.isArray(value)) return `[${value.map(item => stableJson(item, omitInformational)).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value as Record<string, unknown>).filter(key => !omitInformational || !['head', 'root'].includes(key)).sort().map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key], omitInformational)}`).join(',')}}`;
  return JSON.stringify(value);
}

function success(code: string, version: number, data: Record<string, unknown>): number {
  return emit({ ok: true, code, diagnostics: [], allowedNextOperations: [], version, ...data }, 0);
}
function invalid(code: string, message: string): number {
  return emit({ ok: false, code, diagnostics: [{ code, message }], allowedNextOperations: [] }, 2);
}
function blocked(code: string, message: string): number {
  return emit({ ok: false, code, diagnostics: [{ code, message }], allowedNextOperations: ['delegation'] }, 1);
}
function emit(payload: QualityEnvelope, exitCode: number): number {
  console.log(JSON.stringify({ contractVersion: QUALITY_VERSION, ...payload }));
  return exitCode;
}

async function runWithExitCode(handler: () => Promise<number>): Promise<void> {
  try {
    const code = await handler();
    if (code !== 0) process.exitCode = code;
  } catch (cause) {
    const error = cause instanceof QualityEngineError ? cause : new QualityEngineError('QUALITY_OPERATION_FAILED', cause instanceof Error ? cause.message : String(cause));
    const invalidPayload = error.code.startsWith('INVALID_') || error.code.startsWith('UNSAFE_') || error.code.startsWith('UNSUPPORTED_') || error.code.startsWith('UNKNOWN_') || error.code.startsWith('MALFORMED_') || error.code === 'STALE_QUALITY_VERSION' || error.code === 'GIT_COMMAND_FAILED';
    const exitCode = invalidPayload ? 2 : 1;
    process.exitCode = exitCode;
    emit({ ok: false, code: error.code, diagnostics: error.diagnostics, allowedNextOperations: [], ...(error.code === retiredOptimizeCode ? { retired: true } : {}) }, exitCode);
  }
}

void retiredOptimizeCode;
