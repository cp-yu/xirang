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
