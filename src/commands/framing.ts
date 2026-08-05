import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { parse as parseYaml } from 'yaml';
import { classifyBaselineDrift } from '../core/framing/baseline.js';
import { consumeFraming } from '../core/framing/consume.js';
import { normalizeFramingPayload } from '../core/framing/document.js';
import { validateStructuralDefinition } from '../core/framing/validator.js';
import {
  createFraming,
  discardFraming,
  listFramings,
  renameFraming,
  showFraming,
  updateFraming,
  type FramingSemanticContext,
} from '../core/framing/workspace.js';
import { modelRoot } from '../core/model/paths.js';
import { parseSemanticModel } from '../core/model/parser.js';
import { readSemanticTree, semanticTreeFingerprint } from '../core/model/transaction.js';

export interface FramingEnvelopeDiagnostic {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  identity?: string;
}

export interface FramingEnvelope<T = unknown> {
  version: '1.0';
  command: string;
  status: 'ok' | 'invalid' | 'error';
  result: T | null;
  diagnostics: FramingEnvelopeDiagnostic[];
  error: { code: string; message: string } | null;
}

export function framingOkEnvelope<T>(command: string, result: T): FramingEnvelope<T> {
  return { version: '1.0', command, status: 'ok', result, diagnostics: [], error: null };
}

export function framingInvalidEnvelope<T>(
  command: string,
  result: T,
  diagnostics: FramingEnvelopeDiagnostic[],
): FramingEnvelope<T> {
  return { version: '1.0', command, status: 'invalid', result, diagnostics, error: null };
}

export function framingErrorEnvelope(command: string, code: string, message: string): FramingEnvelope<null> {
  return { version: '1.0', command, status: 'error', result: null, diagnostics: [], error: { code, message } };
}

export function emitFramingEnvelope(
  envelope: FramingEnvelope,
  json: boolean,
  output: (value: string) => void = console.log,
): 0 | 1 {
  output(json ? JSON.stringify(envelope) : JSON.stringify(envelope.result ?? envelope.error, null, 2));
  return envelope.status === 'ok' ? 0 : 1;
}

async function semanticContext(projectRoot: string): Promise<FramingSemanticContext> {
  const parsed = await parseSemanticModel(modelRoot(projectRoot));
  const errors = parsed.diagnostics.filter(item => item.level === 'ERROR');
  if (errors.length > 0) throw Object.assign(new Error('Semantic Model is invalid'), { code: 'SEMANTIC_MODEL_INVALID' });
  return {
    model: parsed.model,
    semanticModelFingerprint: semanticTreeFingerprint(await readSemanticTree(projectRoot)),
  };
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

function publicRecord(record: Awaited<ReturnType<typeof showFraming>>): unknown {
  return { path: record.path, document: record.document };
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code;
  return 'FRAMING_COMMAND_FAILED';
}

async function envelope(
  command: string,
  action: () => Promise<FramingEnvelope>,
): Promise<FramingEnvelope> {
  try {
    return await action();
  } catch (error) {
    return framingErrorEnvelope(command, errorCode(error), error instanceof Error ? error.message : String(error));
  }
}

async function runCreate(projectRoot: string, slug: string, from?: string): Promise<FramingEnvelope> {
  return envelope('framing create', async () => framingOkEnvelope(
    'framing create',
    publicRecord(await createFraming(
      projectRoot,
      slug,
      normalizeFramingPayload(await readInput(from)),
      await semanticContext(projectRoot),
    )),
  ));
}

async function runList(projectRoot: string): Promise<FramingEnvelope> {
  return envelope('framing list', async () => framingOkEnvelope(
    'framing list',
    { explorations: (await listFramings(projectRoot)).map(publicRecord) },
  ));
}

async function runShow(projectRoot: string, explorationId: string): Promise<FramingEnvelope> {
  return envelope('framing show', async () => framingOkEnvelope(
    'framing show', publicRecord(await showFraming(projectRoot, explorationId)),
  ));
}

async function drift(projectRoot: string, explorationId: string) {
  const record = await showFraming(projectRoot, explorationId);
  const context = await semanticContext(projectRoot);
  const result = classifyBaselineDrift(
    record.document.metadata.semanticModelFingerprint,
    context.semanticModelFingerprint,
    record.document.baseline,
    context.model,
    record.document.payload,
  );
  return { record, context, drift: result };
}

async function runStatus(projectRoot: string, explorationId: string): Promise<FramingEnvelope> {
  return envelope('framing status', async () => {
    const current = await drift(projectRoot, explorationId);
    const result = {
      path: current.record.path,
      explorationId,
      slug: current.record.document.metadata.slug,
      drift: current.drift.status,
      changed: current.drift.changed,
    };
    return current.drift.status === 'relevant-drift'
      ? framingInvalidEnvelope('framing status', result, [{
        severity: 'ERROR',
        code: 'RELEVANT_DRIFT',
        message: 'Relevant Semantic Model context changed',
      }])
      : framingOkEnvelope('framing status', result);
  });
}

async function runValidate(projectRoot: string, explorationId: string): Promise<FramingEnvelope> {
  return envelope('framing validate', async () => {
    const current = await drift(projectRoot, explorationId);
    const validation = validateStructuralDefinition(current.context.model, current.record.document.payload);
    const diagnostics: FramingEnvelopeDiagnostic[] = [
      ...(current.drift.status === 'relevant-drift'
        ? [{ severity: 'ERROR' as const, code: 'RELEVANT_DRIFT', message: 'Relevant Semantic Model context changed' }]
        : []),
      ...validation.diagnostics.map(item => ({
        severity: item.level,
        code: item.code,
        message: item.message,
        identity: item.identity,
      })),
    ];
    const result = {
      path: current.record.path,
      drift: current.drift.status,
      changed: current.drift.changed,
      structuralValid: validation.valid,
      impacts: validation.impacts,
    };
    return diagnostics.length > 0
      ? framingInvalidEnvelope('framing validate', result, diagnostics)
      : framingOkEnvelope('framing validate', result);
  });
}

async function runUpdate(projectRoot: string, explorationId: string, from?: string): Promise<FramingEnvelope> {
  return envelope('framing update', async () => {
    const payload = normalizeFramingPayload(await readInput(from));
    const { record, diff } = await updateFraming(projectRoot, explorationId, payload, await semanticContext(projectRoot));
    return framingOkEnvelope('framing update', { path: record.path, document: record.document, diff });
  });
}

async function runRename(projectRoot: string, explorationId: string, slug: string): Promise<FramingEnvelope> {
  return envelope('framing rename', async () => framingOkEnvelope(
    'framing rename', publicRecord(await renameFraming(projectRoot, explorationId, slug)),
  ));
}

async function runDiscard(projectRoot: string, explorationId: string): Promise<FramingEnvelope> {
  return envelope('framing discard', async () => {
    await discardFraming(projectRoot, explorationId);
    return framingOkEnvelope('framing discard', { explorationId, discarded: true });
  });
}

async function dispatch(action: () => Promise<FramingEnvelope>, json: boolean): Promise<void> {
  const result = await action();
  process.exitCode = emitFramingEnvelope(result, json);
}

export function registerFramingCommand(program: Command): void {
  const framing = program.command('framing').description('Manage Change Structural Definition explorations');
  const parentOutput = program.configureOutput();
  const writeOut = parentOutput.writeOut ?? (value => process.stdout.write(value));
  const writeErr = parentOutput.writeErr ?? (value => process.stderr.write(value));
  let parserEnvelopeEmitted = false;
  framing.configureOutput({
    ...parentOutput,
    writeErr: value => {
      const args = process.argv.slice(2);
      if (args[0] !== 'framing' || !args.includes('--json')) {
        writeErr(value);
        return;
      }
      if (parserEnvelopeEmitted) return;
      parserEnvelopeEmitted = true;
      const subcommand = args[1] ?? 'framing';
      const message = value.trim().replace(/^error:\s*/i, '');
      writeOut(`${JSON.stringify(framingErrorEnvelope(
        subcommand === 'framing' ? 'framing' : `framing ${subcommand}`,
        'COMMAND_ARGUMENT_ERROR',
        message,
      ))}\n`);
    },
  });
  framing.command('create')
    .requiredOption('--slug <slug>', 'Mutable framing slug')
    .option('--from <path>', 'Read complete payload from a regular file; defaults to stdin')
    .option('--json', 'Output one JSON envelope')
    .action((options: { slug: string; from?: string; json?: boolean }) =>
      dispatch(() => runCreate(process.cwd(), options.slug, options.from), options.json === true));
  framing.command('list').option('--json', 'Output one JSON envelope')
    .action((options: { json?: boolean }) => dispatch(() => runList(process.cwd()), options.json === true));
  framing.command('show <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runShow(process.cwd(), explorationId), options.json === true));
  framing.command('status <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runStatus(process.cwd(), explorationId), options.json === true));
  framing.command('validate <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runValidate(process.cwd(), explorationId), options.json === true));
  framing.command('update <explorationId>')
    .option('--from <path>', 'Read complete replacement payload from a regular file; defaults to stdin')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { from?: string; json?: boolean }) =>
      dispatch(() => runUpdate(process.cwd(), explorationId, options.from), options.json === true));
  framing.command('rename <explorationId>')
    .requiredOption('--slug <slug>', 'New mutable framing slug')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { slug: string; json?: boolean }) =>
      dispatch(() => runRename(process.cwd(), explorationId, options.slug), options.json === true));
  framing.command('consume <explorationId>')
    .requiredOption('--change <name>', 'Target Change name')
    .option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { change: string; json?: boolean }) => dispatch(
      () => envelope('framing consume', async () => framingOkEnvelope(
        'framing consume', await consumeFraming(process.cwd(), explorationId, options.change),
      )),
      options.json === true,
    ));
  framing.command('discard <explorationId>').option('--json', 'Output one JSON envelope')
    .action((explorationId: string, options: { json?: boolean }) =>
      dispatch(() => runDiscard(process.cwd(), explorationId), options.json === true));
}
