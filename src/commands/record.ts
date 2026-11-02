import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { parse as parseYaml } from 'yaml';
import { classifyBaselineDrift } from '../core/record/baseline.js';
import { consumeRecord } from '../core/record/consume.js';
import { recordCoverage, RecordGateError, type RecordTarget } from '../core/record/coverage.js';
import { normalizeRecordPayload } from '../core/record/document.js';
import { compareStructure, RecordStructureError, summarizeRecord, validateRecordStructure } from '../core/record/structure.js';
import { readRecordSemanticContext } from '../core/record/validator.js';
import {
  createRecord,
  discardRecord,
  listRecords,
  RecordWorkspaceError,
  renameRecord,
  showRecord,
  updateRecord,
} from '../core/record/workspace.js';

export interface RecordEnvelopeDiagnostic {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  identity?: string;
}

export interface RecordEnvelope<T = unknown> {
  version: '1.0';
  command: string;
  status: 'ok' | 'invalid' | 'error';
  result: T | null;
  diagnostics: RecordEnvelopeDiagnostic[];
  error: { code: string; message: string } | null;
}

export function recordOkEnvelope<T>(command: string, result: T): RecordEnvelope<T> {
  return { version: '1.0', command, status: 'ok', result, diagnostics: [], error: null };
}

export function recordInvalidEnvelope<T>(
  command: string,
  result: T,
  diagnostics: RecordEnvelopeDiagnostic[],
): RecordEnvelope<T> {
  return { version: '1.0', command, status: 'invalid', result, diagnostics, error: null };
}

export function recordErrorEnvelope(command: string, code: string, message: string): RecordEnvelope<null> {
  return { version: '1.0', command, status: 'error', result: null, diagnostics: [], error: { code, message } };
}

export function emitRecordEnvelope(
  envelope: RecordEnvelope,
  json: boolean,
  output: (value: string) => void = console.log,
): 0 | 1 {
  output(json ? JSON.stringify(envelope) : JSON.stringify(envelope.result ?? envelope.error, null, 2));
  return envelope.status === 'ok' ? 0 : 1;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function readInput(from?: string): Promise<unknown> {
  if (!from) return parseYaml(await readStdin());
  const target = path.resolve(from);
  const stat = await fs.lstat(target);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw Object.assign(new Error(`Input is not a non-symlink regular file: ${from}`), { code: 'INVALID_INPUT_PATH' });
  }
  return parseYaml(await fs.readFile(target, 'utf8'));
}

function publicRecord(record: Awaited<ReturnType<typeof showRecord>>) {
  return {
    path: record.path,
    sourceVersion: record.sourceVersion,
    document: { metadata: record.document.metadata, payload: record.document.payload },
  };
}

function publicReceipt(record: Awaited<ReturnType<typeof showRecord>>) {
  return {
    path: record.path,
    explorationId: record.document.metadata.explorationId,
    slug: record.document.metadata.slug,
    sourceVersion: record.sourceVersion,
    summary: summarizeRecord(record.document.payload),
  };
}

function publicSummary(record: Awaited<ReturnType<typeof showRecord>>) {
  return summarizeRecord(record.document.payload);
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code;
  return 'RECORD_COMMAND_FAILED';
}

async function envelope(
  command: string,
  action: () => Promise<RecordEnvelope>,
): Promise<RecordEnvelope> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof RecordStructureError || (error instanceof RecordGateError && error.diagnostics.length)) {
      return recordInvalidEnvelope(command, null, error.diagnostics);
    }
    if (error instanceof RecordWorkspaceError && error.code === 'SOURCE_VERSION_STALE') {
      return recordInvalidEnvelope(command, error.details ?? null, [{ severity: 'ERROR', code: error.code, message: error.message }]);
    }
    return recordErrorEnvelope(command, errorCode(error), error instanceof Error ? error.message : String(error));
  }
}

async function runCreate(projectRoot: string, slug: string, from?: string): Promise<RecordEnvelope> {
  return envelope('record create', async () => {
    const payload = normalizeRecordPayload(await readInput(from));
    const context = await readRecordSemanticContext(projectRoot, payload.context);
    return recordOkEnvelope('record create', publicReceipt(await createRecord(projectRoot, slug, payload, context)));
  });
}

async function runList(projectRoot: string): Promise<RecordEnvelope> {
  return envelope('record list', async () => {
    const records = await listRecords(projectRoot);
    const explorations = await Promise.all(records.map(async record => {
      const context = await readRecordSemanticContext(projectRoot, record.document.payload.context);
      const currentDrift = classifyBaselineDrift(
        record.document.metadata.semanticModelFingerprint,
        context.semanticModelFingerprint,
        record.document.baseline,
        context.model,
        record.document.payload,
      );
      return {
        path: record.path,
        explorationId: record.document.metadata.explorationId,
        slug: record.document.metadata.slug,
        sourceVersion: record.sourceVersion,
        status: currentDrift.status,
        summary: publicSummary(record),
      };
    }));
    return recordOkEnvelope('record list', { explorations });
  });
}

async function runShow(projectRoot: string, explorationId: string, selected?: string[]): Promise<RecordEnvelope> {
  return envelope('record show', async () => {
    const record = await showRecord(projectRoot, explorationId);
    if (!selected?.length) return recordOkEnvelope('record show', publicRecord(record));
    const entries = [...new Set(selected)].map(identity => {
      const entry = record.document.payload.entries.find(item => item.identity === identity);
      if (!entry) throw Object.assign(new Error(`Record entry not found: ${identity}`), { code: 'RECORD_ENTRY_NOT_FOUND' });
      return entry;
    });
    return recordOkEnvelope('record show', {
      path: record.path, explorationId, slug: record.document.metadata.slug, sourceVersion: record.sourceVersion, entries,
    });
  });
}

async function drift(projectRoot: string, explorationId: string) {
  const record = await showRecord(projectRoot, explorationId);
  const context = await readRecordSemanticContext(projectRoot, record.document.payload.context);
  const result = classifyBaselineDrift(
    record.document.metadata.semanticModelFingerprint,
    context.semanticModelFingerprint,
    record.document.baseline,
    context.model,
    record.document.payload,
  );
  return { record, context, drift: result };
}

async function runStatus(projectRoot: string, explorationId: string): Promise<RecordEnvelope> {
  return envelope('record status', async () => {
    const current = await drift(projectRoot, explorationId);
    const result = {
      path: current.record.path,
      explorationId,
      sourceVersion: current.record.sourceVersion,
      slug: current.record.document.metadata.slug,
      drift: current.drift.status,
      changed: current.drift.changed,
      summary: summarizeRecord(current.record.document.payload),
    };
    return current.drift.status === 'relevant-drift'
      ? recordInvalidEnvelope('record status', result, [{
        severity: 'ERROR',
        code: 'RELEVANT_DRIFT',
        message: 'Relevant Semantic Model context changed',
      }])
      : recordOkEnvelope('record status', result);
  });
}

async function runValidate(projectRoot: string, explorationId: string): Promise<RecordEnvelope> {
  return envelope('record validate', async () => {
    const current = await drift(projectRoot, explorationId);
    const { structure } = current.record.document.payload;
    const diagnostics: RecordEnvelopeDiagnostic[] = [
      ...(current.drift.status === 'relevant-drift'
        ? [{ severity: 'ERROR' as const, code: 'RELEVANT_DRIFT', message: 'Relevant Semantic Model context changed' }]
        : []),
      ...validateRecordStructure(structure, current.context.model),
    ];
    const result = {
      path: current.record.path,
      drift: current.drift.status,
      changed: current.drift.changed,
      sourceVersion: current.record.sourceVersion,
      formatValid: true,
      derived: compareStructure(structure, current.context.model),
      summary: summarizeRecord(current.record.document.payload),
      semanticCoverage: 'not-evaluated',
    };
    return diagnostics.length > 0
      ? recordInvalidEnvelope('record validate', result, diagnostics)
      : recordOkEnvelope('record validate', result);
  });
}

async function runUpdate(projectRoot: string, explorationId: string, sourceVersion: string, from?: string): Promise<RecordEnvelope> {
  return envelope('record update', async () => {
    const patch = await readInput(from);
    const current = await showRecord(projectRoot, explorationId);
    const context = await readRecordSemanticContext(projectRoot, current.document.payload.context);
    const { record, diff, derived, summary } = await updateRecord(projectRoot, explorationId, patch, sourceVersion, context);
    return recordOkEnvelope('record update', { path: record.path, sourceVersion: record.sourceVersion, diff, derived, summary });
  });
}

async function runRename(projectRoot: string, explorationId: string, slug: string): Promise<RecordEnvelope> {
  return envelope('record rename', async () => recordOkEnvelope(
    'record rename', publicReceipt(await renameRecord(projectRoot, explorationId, slug)),
  ));
}

async function runDiscard(projectRoot: string, explorationId: string): Promise<RecordEnvelope> {
  return envelope('record discard', async () => {
    await discardRecord(projectRoot, explorationId);
    return recordOkEnvelope('record discard', { explorationId, discarded: true });
  });
}

async function dispatch(action: () => Promise<RecordEnvelope>, json: boolean): Promise<void> {
  const result = await action();
  process.exitCode = emitRecordEnvelope(result, json);
}

export function registerRecordCommand(program: Command): void {
  const record = program.command('record').description('Manage confirmed design records');
  const parentOutput = program.configureOutput();
  const writeOut = parentOutput.writeOut ?? (value => process.stdout.write(value));
  const writeErr = parentOutput.writeErr ?? (value => process.stderr.write(value));
  let parserEnvelopeEmitted = false;
  record.configureOutput({
    ...parentOutput,
    writeErr: value => {
      const args = process.argv.slice(2);
      if (args[0] !== 'record' || !args.includes('--json')) {
        writeErr(value);
        return;
      }
      if (parserEnvelopeEmitted) return;
      parserEnvelopeEmitted = true;
      const subcommand = args[1] ?? 'record';
      const message = value.trim().replace(/^error:\s*/i, '');
      writeOut(`${JSON.stringify(recordErrorEnvelope(
        subcommand === 'record' ? 'record' : `record ${subcommand}`,
        'COMMAND_ARGUMENT_ERROR',
        message,
      ))}\n`);
    },
  });
  record.command('create')
    .requiredOption('--slug <slug>', 'Mutable record slug')
    .option('--from <path>', 'Read complete payload from a regular file; defaults to stdin')
    .option('--json', 'Output one JSON envelope')
    .action((options: { slug: string; from?: string; json?: boolean }) =>
      dispatch(() => runCreate(process.cwd(), options.slug, options.from), options.json === true));
  record.command('list').option('--json', 'Output one JSON envelope')
    .action((options: { json?: boolean }) => dispatch(() => runList(process.cwd()), options.json === true));
  record.command('show <explorationId>')
    .option('--entry <identity>', 'Read only the selected entry; repeat to select multiple entries', (value: string, previous: string[]) => [...previous, value], [])
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { entry: string[]; json?: boolean }) =>
      dispatch(() => runShow(process.cwd(), explorationId, options.entry), options.json === true));
  record.command('status <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runStatus(process.cwd(), explorationId), options.json === true));
  record.command('validate <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runValidate(process.cwd(), explorationId), options.json === true));
  record.command('update <explorationId>')
    .option('--from <path>', 'Read a partial update patch from a regular file; defaults to stdin')
    .requiredOption('--source-version <digest>', 'Exact current source version of the record')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { from?: string; sourceVersion: string; json?: boolean }) =>
      dispatch(() => runUpdate(process.cwd(), explorationId, options.sourceVersion, options.from), options.json === true));
  record.command('rename <explorationId>')
    .requiredOption('--slug <slug>', 'New mutable record slug')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { slug: string; json?: boolean }) =>
      dispatch(() => runRename(process.cwd(), explorationId, options.slug), options.json === true));
  record.command('coverage <explorationId>')
    .option('--change <name>', 'Explicit target Change name')
    .option('--candidate', 'Explicit active Candidate target')
    .requiredOption('--source-version <digest>', 'Exact current source version of the record')
    .option('--from <path>', 'Read the coverage result from a regular file; defaults to stdin')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { change?: string; candidate?: boolean; sourceVersion: string; from?: string; json?: boolean }) => dispatch(
      () => envelope('record coverage', async () => recordOkEnvelope(
        'record coverage', await recordCoverage(process.cwd(), explorationId, { change: options.change, candidate: options.candidate } as RecordTarget, options.sourceVersion, await readInput(options.from)),
      )),
      options.json === true,
    ));
  record.command('consume <explorationId>')
    .option('--change <name>', 'Explicit target Change name')
    .option('--candidate', 'Explicit active Candidate target')
    .requiredOption('--source-version <digest>', 'Exact source version returned by record show')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { change?: string; candidate?: boolean; sourceVersion: string; json?: boolean }) => dispatch(
      () => envelope('record consume', async () => recordOkEnvelope(
        'record consume', await consumeRecord(process.cwd(), explorationId, { change: options.change, candidate: options.candidate } as RecordTarget, options.sourceVersion),
      )),
      options.json === true,
    ));
  record.command('discard <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runDiscard(process.cwd(), explorationId), options.json === true));
}
