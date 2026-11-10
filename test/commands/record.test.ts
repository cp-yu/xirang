import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerRecordCommand } from '../../src/commands/record.js';
import { listRecords, showRecord } from '../../src/core/record/workspace.js';

describe('Record command registration', () => {
  it('keeps read-only lifecycle operations filesystem non-mutating', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-record-readonly-'));
    try {
      expect(await listRecords(root)).toEqual([]);
      await expect(showRecord(root, 'design.md')).rejects.toMatchObject({
        code: 'RECORD_NOT_FOUND',
      });
      await expect(fs.access(path.join(root, '.xirang'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('registers the complete lifecycle surface', () => {
    const program = new Command();
    registerRecordCommand(program);
    const record = program.commands.find(command => command.name() === 'record');
    expect(record?.commands.map(command => command.name())).toEqual([
      'create', 'list', 'show', 'status', 'validate', 'update', 'rename', 'discard', 'coverage', 'consume',
    ]);
    for (const command of record?.commands ?? []) {
      expect(command.options.map(option => option.long)).toContain('--json');
    }
    expect(record?.commands.find(command => command.name() === 'create')?.options.map(option => option.long))
      .toEqual(['--from', '--json']);
    expect(record?.commands.find(command => command.name() === 'update')?.options.map(option => option.long))
      .toEqual(['--from', '--diff', '--json']);
    expect(record?.commands.find(command => command.name() === 'coverage')?.options.map(option => option.long))
      .toEqual(['--change', '--candidate', '--from', '--json']);
    expect(record?.commands.find(command => command.name() === 'consume')?.options.map(option => option.long))
      .toEqual(['--change', '--candidate', '--json']);
  });
});
