import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerFramingCommand } from '../../src/commands/framing.js';
import { listFramings, showFraming } from '../../src/core/framing/workspace.js';

describe('Framing command registration', () => {
  it('keeps read-only lifecycle operations filesystem non-mutating', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-framing-readonly-'));
    try {
      expect(await listFramings(root)).toEqual([]);
      await expect(showFraming(root, '20260729T120000Z-a1b2c3d4')).rejects.toMatchObject({
        code: 'FRAMING_NOT_FOUND',
      });
      await expect(fs.access(path.join(root, '.xirang'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('registers the complete lifecycle surface', () => {
    const program = new Command();
    registerFramingCommand(program);
    const framing = program.commands.find(command => command.name() === 'framing');
    expect(framing?.commands.map(command => command.name())).toEqual([
      'create', 'list', 'show', 'status', 'validate', 'update', 'rename', 'consume', 'discard',
    ]);
    for (const command of framing?.commands ?? []) {
      expect(command.options.map(option => option.long)).toContain('--json');
    }
    expect(framing?.commands.find(command => command.name() === 'create')?.options.map(option => option.long))
      .toEqual(['--slug', '--from', '--json']);
    expect(framing?.commands.find(command => command.name() === 'consume')?.options.map(option => option.long))
      .toEqual(['--change', '--json']);
  });
});
