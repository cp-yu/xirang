import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRecord, showRecord, updateRecord } from '../../src/core/record/workspace.js';
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
      expect((await show()).result).toEqual({
        path: record.path,
        sourceVersion: record.sourceVersion,
        document: { metadata: record.document.metadata, payload: record.document.payload },
      });
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

  it('returns minimal lifecycle projections without exposing the persisted baseline', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-projection-'));
    const previousCwd = process.cwd();
    const previousExitCode = process.exitCode;
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const context = await readRecordSemanticContext(root, 'build');
      const payloadPath = path.join(root, 'payload.json');
      const patchPath = path.join(root, 'patch.json');
      await fs.writeFile(payloadPath, JSON.stringify({
        schemaVersion: 4,
        context: 'build',
        entries: [{ identity: 'A', nature: 'normative', decision: 'accepted', content: 'Confirmed' }],
      }));
      await fs.writeFile(patchPath, JSON.stringify({
        entries: { upsert: [{ identity: 'A', nature: 'normative', decision: 'accepted', content: 'Updated' }] },
      }));
      process.chdir(root);
      const run = async (...args: string[]) => {
        const program = new Command();
        registerRecordCommand(program);
        await program.parseAsync(['record', ...args], { from: 'user' });
        return JSON.parse(output.mock.calls.at(-1)![0]);
      };

      const created = await run('create', '--slug', 'projection', '--from', payloadPath, '--json');
      expect(Object.keys(created.result).sort()).toEqual(['explorationId', 'path', 'slug', 'sourceVersion', 'summary']);
      expect(created.result.summary).toMatchObject({ entries: 1, normativeEntries: 1 });
      expect(created.result).not.toHaveProperty('document');
      expect(created.result).not.toHaveProperty('baseline');
      const id = created.result.explorationId as string;
      const sourceVersion = created.result.sourceVersion as string;

      const listed = await run('list', '--json');
      expect(Object.keys(listed.result.explorations[0]).sort()).toEqual([
        'explorationId', 'path', 'slug', 'sourceVersion', 'status', 'summary',
      ]);
      expect(listed.result.explorations[0].status).toBeTypeOf('string');
      expect(listed.result.explorations[0]).not.toHaveProperty('document');
      expect(listed.result.explorations[0]).not.toHaveProperty('baseline');

      const shown = await run('show', id, '--json');
      expect(shown.result.document.payload.entries).toEqual([{ identity: 'A', nature: 'normative', decision: 'accepted', content: 'Confirmed' }]);
      expect(shown.result.document).not.toHaveProperty('baseline');
      expect(shown.result).not.toHaveProperty('baseline');
      for (const command of ['status', 'validate'] as const) {
        const result = await run(command, id, '--json');
        expect(result.result).not.toHaveProperty('document');
        expect(result.result).not.toHaveProperty('baseline');
        if (command === 'status') {
          expect(result.result.summary).toMatchObject({ entries: 1, normativeEntries: 1 });
        }
      }

      const updated = await run('update', id, '--source-version', sourceVersion, '--from', patchPath, '--json');
      expect(Object.keys(updated.result).sort()).toEqual(['derived', 'diff', 'path', 'sourceVersion', 'summary']);
      expect(updated.result.summary).toMatchObject({ entries: 1, normativeEntries: 1 });
      expect(updated.result).not.toHaveProperty('document');
      expect(updated.result).not.toHaveProperty('baseline');

      const renamed = await run('rename', id, '--slug', 'renamed', '--json');
      expect(Object.keys(renamed.result).sort()).toEqual(['explorationId', 'path', 'slug', 'sourceVersion', 'summary']);
      expect(renamed.result.slug).toBe('renamed');
      expect(renamed.result).not.toHaveProperty('document');
      expect(renamed.result).not.toHaveProperty('baseline');
      const persisted = await showRecord(root, id);
      expect(persisted.document.baseline).toBeDefined();
      expect(persisted.document.payload.entries[0].content).toBe('Updated');
      await expect(updateRecord(root, id, { entries: { remove: ['A'] } }, sourceVersion, context))
        .rejects.toMatchObject({ code: 'SOURCE_VERSION_STALE' });
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
