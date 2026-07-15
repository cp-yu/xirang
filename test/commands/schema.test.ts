import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

describe('schema command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-schema-command-'));
  });

  afterEach(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  it('reports a built-in package schema', async () => {
    const result = await runCLI(['schema', 'which', 'spec-driven', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      name: 'spec-driven',
      source: 'package',
      path: expect.stringContaining(path.join('schemas', 'spec-driven')),
    });
  });

  it('lists exactly both built-in schemas', async () => {
    const result = await runCLI(['schema', 'which', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).map(({ name, source }: { name: string; source: string }) => ({ name, source }))).toEqual([
      { name: 'spec-driven', source: 'package' },
      { name: 'bootstrap', source: 'package' },
    ]);
  });

  it('rejects unknown schemas with the valid IDs', async () => {
    const result = await runCLI(['schema', 'which', 'custom'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('spec-driven, bootstrap');
  });

  it('validates one built-in schema', async () => {
    const result = await runCLI(['schema', 'validate', 'spec-driven', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      name: 'spec-driven',
      path: expect.stringContaining(path.join('schemas', 'spec-driven')),
      valid: true,
      issues: [],
    });
  });

  it('validates every built-in schema', async () => {
    const result = await runCLI(['schema', 'validate', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.valid).toBe(true);
    expect(output.schemas.map((schema: { name: string }) => schema.name)).toEqual(['spec-driven', 'bootstrap']);
  });

  it('does not register init or fork', async () => {
    for (const command of ['init', 'fork']) {
      const result = await runCLI(['schema', command], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain(`unknown command '${command}'`);
    }
  });
});
