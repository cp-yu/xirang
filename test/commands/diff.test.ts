import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { program } from '../../src/cli/index.js';
import { runCLI } from '../helpers/run-cli.js';

describe('removed diff command', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) await fs.rm(root, { recursive: true, force: true });
    root = undefined;
  });

  it('does not register xirang diff or modify the change directory', async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-removed-diff-'));
    const changeDir = path.join(root, '.xirang', 'changes', 'change-a');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), 'unchanged\n', 'utf8');
    const before = await fs.readdir(changeDir);

    const result = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });

    expect(program.commands.map(command => command.name())).not.toContain('diff');
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown command 'diff'");
    expect(await fs.readdir(changeDir)).toEqual(before);
    expect(await fs.readFile(path.join(changeDir, 'proposal.md'), 'utf8')).toBe('unchanged\n');
  });
});
