import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { z } from 'zod';
import { XIRANG_DIR_NAME } from '../core/config.js';
import {
  QualityEngineError,
  readQualityRecordStatus,
  recordQualityOpt,
  recordQualityReview,
  recordQualitySeal,
} from '../core/quality/engine.js';
import { commandSchemas, qualityOptionMetadata } from '../core/quality/command-schema.js';
import { renderQualityOverview, renderQualityErrorRecovery, renderReviewHelp, renderOptHelp, renderSealHelp } from '../core/quality/protocol.js';
import { validateChangeExists } from './workflow/shared.js';

type QualityOptions = { input?: string; from?: string; json?: boolean; version?: string };

export function registerQualityCommand(program: Command): void {
  const quality = program.command('quality').description('Record commit-bound Review, Opt disposition and Seal opinions')
    .option('--no-color', 'Disable color output')
    .addHelpText('after', () => `\n${renderQualityOverview()}\n${renderQualityErrorRecovery()}`);

  quality.command('review <change-name>').addHelpText('after', () => `\n${renderReviewHelp()}`)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (name: string, options: QualityOptions) => run(() => review(name, options)));

  quality.command('opt <change-name>').addHelpText('after', () => `\n${renderOptHelp()}`)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (name: string, options: QualityOptions) => run(() => opt(name, options)));

  quality.command('seal <change-name>').addHelpText('after', () => `\n${renderSealHelp()}`)
    .option(qualityOptionMetadata.version.flags, qualityOptionMetadata.version.label)
    .option(qualityOptionMetadata.input.flags, qualityOptionMetadata.input.label)
    .option(qualityOptionMetadata.from.flags, qualityOptionMetadata.from.label)
    .option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .action(async (name: string, options: QualityOptions) => run(() => seal(name, options)));

  quality.command('status <change-name>').option(qualityOptionMetadata.json.flags, qualityOptionMetadata.json.label)
    .option('--history', 'Include full opinion history')
    .action(async (name: string, options: QualityOptions & { history?: boolean }) => run(() => status(name, options)));
  for (const command of quality.commands) command.option('--no-color', 'Disable color output');
}

async function review(name: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(name);
  const payload = parse(commandSchemas.review, await readPayload(options));
  const record = await recordQualityReview({ ...context, expectedRevision: requiredRevision(options.version), ...payload });
  return success(record.revision);
}

async function opt(name: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(name);
  const payload = parse(commandSchemas.opt, await readPayload(options));
  const record = await recordQualityOpt({ ...context, expectedRevision: requiredRevision(options.version), ...payload });
  return success(record.revision);
}

async function seal(name: string, options: QualityOptions): Promise<number> {
  const context = await resolveContext(name);
  const payload = parse(commandSchemas.seal, await readPayload(options));
  const record = await recordQualitySeal({ ...context, expectedRevision: requiredRevision(options.version), seal: payload });
  return success(record.revision);
}

async function status(name: string, options: { history?: boolean }): Promise<number> {
  const context = await resolveContext(name);
  const result = await readQualityRecordStatus(context.changeDir, context.projectRoot);
  const { record, ...summary } = result;
  const reviews = Object.fromEntries(['full-change', 'incremental', 'supplemental'].flatMap(kind => {
    const last = record.reviews.filter(r => r.reviewKind === kind).at(-1);
    return last ? [[kind, { result: last.result, commit: last.commit }]] : [];
  }));
  const latestOpt = record.opt?.disposition === 'delivered' ? record.opt.opinions.at(-1) : undefined;
  console.log(JSON.stringify({ ...summary, reviews, opt: record.opt ? { disposition: record.opt.disposition, ...(latestOpt ? { baseCommit: latestOpt.baseCommit, resultCommit: latestOpt.resultCommit } : {}) } : null, seal: record.seal ? { commit: record.seal.commit } : null, ...(options.history ? { record } : {}) }));
  return 0;
}

async function resolveContext(name: string): Promise<{ projectRoot: string; changeDir: string }> {
  const projectRoot = process.cwd();
  let validated: string;
  try { validated = await validateChangeExists(name, projectRoot); }
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
  if (raw === undefined && !process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (!raw?.trim()) throw new QualityEngineError('INVALID_INPUT', 'A JSON payload is required.');
  try { return JSON.parse(raw); } catch { throw new QualityEngineError('INVALID_INPUT', 'Input is not valid JSON.'); }
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new QualityEngineError('INVALID_INPUT', result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  return result.data;
}

function requiredRevision(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value)) throw new QualityEngineError('INVALID_QUALITY_REVISION', 'A non-negative --version revision is required.');
  return Number(value);
}

function success(revision: number): number {
  console.log(JSON.stringify({ revision }));
  return 0;
}
async function run(handler: () => Promise<number>): Promise<void> {
  try { const code = await handler(); if (code !== 0) process.exitCode = code; }
  catch (cause) {
    const error = cause instanceof QualityEngineError ? cause : new QualityEngineError('QUALITY_OPERATION_FAILED', cause instanceof Error ? cause.message : String(cause));
    const code = error.code.startsWith('INVALID_') || error.code.startsWith('UNSAFE_') || error.code.startsWith('MALFORMED_') ? 2 : 1;
    process.exitCode = code;
    console.error(JSON.stringify({ code: error.code, message: error.message, diagnostics: error.diagnostics }));
  }
}

void XIRANG_DIR_NAME;
