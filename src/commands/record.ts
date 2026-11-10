import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { classifyBaselineDrift } from '../core/record/baseline.js';
import { consumeRecord } from '../core/record/consume.js';
import { recordCoverage, RecordGateError, type RecordTarget } from '../core/record/coverage.js';
import { normalizeRecordPayload } from '../core/record/document.js';
import { compareStructure, RecordStructureError, validateRecordStructure } from '../core/record/structure.js';
import { readRecordSemanticContext } from '../core/record/validator.js';
import { createRecord, discardRecord, listRecords, renameRecord, showRecord, updateRecord } from '../core/record/workspace.js';

type Options = { json?: boolean; from?: string; entry?: string[]; diff?: boolean; details?: boolean; change?: string; candidate?: boolean };

async function readInput(from?: string): Promise<unknown> {
  if (from) {
    const stat = await fs.lstat(path.resolve(from));
    if (!stat.isFile() || stat.isSymbolicLink()) throw Object.assign(new Error('Input must be a non-symlink regular file'), { code: 'INVALID_INPUT_PATH' });
    return parseYaml(await fs.readFile(from, 'utf8'));
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return parseYaml(Buffer.concat(chunks).toString('utf8'));
}

async function currentState(root: string, filename: string) {
  const record = await showRecord(root, filename);
  const context = await readRecordSemanticContext(root, record.document.payload.context);
  const drift = classifyBaselineDrift(record.document.metadata.semanticModelFingerprint, context.semanticModelFingerprint, record.document.baseline, context.model, record.document.payload);
  return { record, context, drift };
}

async function execute(options: Options, action: () => Promise<unknown>): Promise<void> {
  try {
    const result = await action();
    if (result !== undefined) console.log(options.json ? JSON.stringify(result) : stringifyYaml(result, { lineWidth: 0 }).trimEnd());
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'RECORD_COMMAND_FAILED';
    const message = error instanceof Error ? error.message : String(error);
    const diagnostics = error instanceof RecordGateError || error instanceof RecordStructureError ? error.diagnostics : undefined;
    console.error(options.json ? JSON.stringify({ code, message, ...(diagnostics?.length ? { diagnostics } : {}) }) : `${code}: ${message}${diagnostics?.length ? '\n' + diagnostics.map(d => d.message).join('\n') : ''}`);
    process.exitCode = 1;
  }
}

export function registerRecordCommand(program: Command): void {
  const record = program.command('record').description('Manage confirmed design records by filename');
  record.command('create <filename>').option('--from <path>', 'Read complete payload; defaults to stdin').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      const payload = normalizeRecordPayload(await readInput(options.from));
      const context = await readRecordSemanticContext(process.cwd(), payload.context);
      await createRecord(process.cwd(), filename, payload, context);
    }));
  record.command('list').option('--json', 'Output as JSON')
    .action((options: Options) => execute(options, async () => ({ records: (await listRecords(process.cwd())).map(r => ({ filename: path.basename(r.path), context: r.document.payload.context })) })));
  record.command('show <filename>').option('--entry <identity>', 'Select complete entries (repeatable)', (value: string, previous: string[]) => [...previous, value], []).option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      const r = await showRecord(process.cwd(), filename);
      if (!options.entry?.length) return { filename, ...r.document.payload };
      const entries = [...new Set(options.entry)].map(identity => {
        const entry = r.document.payload.entries.find(e => e.identity === identity);
        if (!entry) throw Object.assign(new Error(`Record entry not found: ${identity}`), { code: 'RECORD_ENTRY_NOT_FOUND' });
        return entry;
      });
      return { filename, entries };
    }));
  record.command('status <filename>').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      const current = await currentState(process.cwd(), filename);
      return { filename, drift: current.drift.status, ...(current.drift.changed.length ? { changed: current.drift.changed } : {}) };
    }));
  record.command('validate <filename>').option('--details', 'Include structure comparison').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      const { record: r, context, drift } = await currentState(process.cwd(), filename);
      const diagnostics = validateRecordStructure(r.document.payload.structure, context.model);
      if (drift.status === 'relevant-drift') diagnostics.push({ severity: 'ERROR', code: 'RELEVANT_DRIFT', message: 'Relevant Semantic Model context changed', identity: filename, field: 'baseline' });
      if (diagnostics.length) throw new RecordGateError('INVALID_RECORD', 'Record validation failed', diagnostics);
      if (options.details) return { filename, derived: compareStructure(r.document.payload.structure, context.model) };
    }));
  record.command('update <filename>').option('--from <path>', 'Read patch; defaults to stdin').option('--diff', 'Return this update’s differences').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      const root = process.cwd();
      const current = await showRecord(root, filename);
      const context = await readRecordSemanticContext(root, current.document.payload.context);
      const updated = await updateRecord(root, filename, await readInput(options.from), context);
      if (options.diff) return { diff: updated.diff, derived: updated.derived };
    }));
  record.command('rename <filename> <new-filename>').option('--json', 'Output as JSON')
    .action((filename: string, next: string, options: Options) => execute(options, async () => { await renameRecord(process.cwd(), filename, next); }));
  record.command('discard <filename>').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, () => discardRecord(process.cwd(), filename)));
  record.command('coverage <filename>').option('--change <name>', 'Explicit target Change').option('--candidate', 'Active Candidate').option('--from <path>', 'Coverage input; defaults to stdin').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      await recordCoverage(process.cwd(), filename, { change: options.change, candidate: options.candidate } as RecordTarget, await readInput(options.from));
    }));
  record.command('consume <filename>').option('--change <name>', 'Explicit target Change').option('--candidate', 'Active Candidate').option('--json', 'Output as JSON')
    .action((filename: string, options: Options) => execute(options, async () => {
      await consumeRecord(process.cwd(), filename, { change: options.change, candidate: options.candidate } as RecordTarget);
    }));
}
