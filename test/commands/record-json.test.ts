import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRecord, updateRecord } from '../../src/core/record/workspace.js';
import { readRecordSemanticContext } from '../../src/core/record/validator.js';
import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import {
  emitRecordEnvelope,
  recordErrorEnvelope,
  recordInvalidEnvelope,
  recordOkEnvelope,
  registerRecordCommand,
} from '../../src/commands/record.js';

describe('Record JSON envelope', () => {
  it.each([
    recordOkEnvelope('record list', { explorations: [] }),
    recordInvalidEnvelope('record validate', { drift: 'relevant-drift' }, [{
      severity: 'ERROR', code: 'RELEVANT_DRIFT', message: 'changed',
    }]),
    recordErrorEnvelope('record show', 'RECORD_NOT_FOUND', 'missing'),
  ])('emits one versioned JSON document for $status', envelope => {
    const output = vi.fn();
    const exit = emitRecordEnvelope(envelope, true, output);
    expect(output).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0])).toEqual(envelope);
    expect(exit).toBe(envelope.status === 'ok' ? 0 : 1);
    expect(output.mock.calls[0][0]).not.toContain('\u001b');
  });

  it.each([
    ['create', ['record', 'create', '--json']],
    ['show', ['record', 'show', '--json']],
    ['consume', ['record', 'consume', '20260729T120000Z-a1b2c3d4', '--json']],
  ])('envelopes %s parser failures in JSON mode', async (_name, args) => {
    const output: string[] = [];
    const errors: string[] = [];
    const program = new Command().name('xirang').exitOverride();
    program.configureOutput({ writeOut: value => output.push(value), writeErr: value => errors.push(value) });
    registerRecordCommand(program);
    const originalArgv = process.argv;
    process.argv = ['node', 'xirang', ...args];
    try {
      await expect(program.parseAsync(process.argv)).rejects.toBeDefined();
    } finally {
      process.argv = originalArgv;
    }
    expect(errors).toEqual([]);
    expect(output).toHaveLength(1);
    expect(JSON.parse(output[0])).toMatchObject({
      version: '1.0',
      command: `record ${args[1]}`,
      status: 'error',
      diagnostics: [],
      error: { code: 'COMMAND_ARGUMENT_ERROR' },
    });
  });

  it('选择读取只返回所选完整条目及整记录版本，未知条目拒绝且读取不写入', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-select-'));
    const previousCwd = process.cwd();
    const previousExitCode = process.exitCode;
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const context = await readRecordSemanticContext(root, 'build');
      const entries = ['A', 'B', 'C'].map((identity, index) => ({
        identity, nature: 'normative' as const,
        decision: (['accepted', 'excluded', 'pending'] as const)[index], content: `${identity} 第一行\n第二行`,
      }));
      const record = await createRecord(root, 'selection', { schemaVersion: 4, context: 'build', entries }, context);
      const id = record.document.metadata.explorationId;
      process.chdir(root);
      const show = async (...selectors: string[]) => {
        const program = new Command();
        registerRecordCommand(program);
        await program.parseAsync(['record', 'show', id, ...selectors, '--json'], { from: 'user' });
        return JSON.parse(output.mock.calls.at(-1)![0]);
      };
      const selected = await show('--entry', 'A', '--entry', 'C');
      expect(selected).toMatchObject({ status: 'ok', result: {
        explorationId: id, sourceVersion: record.sourceVersion, entries: [entries[0], entries[2]],
      } });
      expect(Object.keys(selected.result).sort()).toEqual(['entries', 'explorationId', 'path', 'slug', 'sourceVersion']);
      expect(await show('--entry', 'missing')).toMatchObject({ status: 'error', error: { code: 'RECORD_ENTRY_NOT_FOUND' } });
      expect((await show()).result).toEqual({ path: record.path, sourceVersion: record.sourceVersion, document: record.document });
      expect(await fs.readFile(record.absolutePath)).toEqual(record.bytes);
      const updated = await updateRecord(root, id, { entries: { upsert: [{ ...entries[1], content: 'B changed' }] } }, record.sourceVersion, context);
      expect((await show('--entry', 'A')).result).toMatchObject({ entries: [entries[0]], sourceVersion: updated.record.sourceVersion });
      await expect(updateRecord(root, id, { entries: { remove: ['A'] } }, selected.result.sourceVersion, context))
        .rejects.toMatchObject({ code: 'SOURCE_VERSION_STALE' });
      expect(await fs.readFile(record.absolutePath)).toEqual(updated.record.bytes);
    } finally {
      output.mockRestore();
      process.chdir(previousCwd);
      process.exitCode = previousExitCode;
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('requires stable diagnostic severity values', () => {
    const invalid = recordInvalidEnvelope('record validate', {}, [
      { severity: 'ERROR', code: 'INVALID', message: 'invalid' },
      { severity: 'WARNING', code: 'WARNING', message: 'warning' },
      { severity: 'INFO', code: 'INFO', message: 'info' },
    ]);
    expect(invalid.diagnostics.map(item => item.severity)).toEqual(['ERROR', 'WARNING', 'INFO']);
  });

  it('keeps the stable envelope shape', () => {
    expect(recordOkEnvelope('record list', {})).toEqual({
      version: '1.0',
      command: 'record list',
      status: 'ok',
      result: {},
      diagnostics: [],
      error: null,
    });
  });
});
