import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

describe('schema command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-schema-command-'));
  });

  afterEach(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  it('reports a built-in package schema', async () => {
    const result = await runCLI(['schema', 'which', 'semantic-model', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      name: 'semantic-model',
      source: 'package',
      path: expect.stringContaining(path.join('schemas', 'semantic-model')),
    });
  });

  it('lists exactly the fixed built-in schema', async () => {
    const result = await runCLI(['schema', 'which', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).map(({ name, source }: { name: string; source: string }) => ({ name, source }))).toEqual([
      { name: 'semantic-model', source: 'package' },
    ]);
  });

  it('rejects unknown schemas with the valid IDs', async () => {
    const result = await runCLI(['schema', 'which', 'custom'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Available schemas: semantic-model');
  });

  it('validates one built-in schema', async () => {
    const result = await runCLI(['schema', 'validate', 'semantic-model', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it('preserves explicitly requested check stages in text and JSON', async () => {
    const json = await runCLI(['schema', 'validate', 'semantic-model', '--verbose', '--json'], { cwd: tempDir });
    const text = await runCLI(['schema', 'validate', 'semantic-model', '--verbose'], { cwd: tempDir });
    expect(json).toMatchObject({ exitCode: 0, stderr: '' });
    expect(text).toMatchObject({ exitCode: 0, stderr: '' });
    const [details] = JSON.parse(json.stdout);
    expect(details.name).toBe('semantic-model');
    expect(details.stages).toEqual(['YAML parsing', 'Zod validation', 'File definitions', 'Template existence', 'Dependency graph', 'File references']);
    for (const stage of details.stages) expect(text.stdout).toContain(stage);
  });

  it('validates every built-in schema', async () => {
    const result = await runCLI(['schema', 'validate', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result).toMatchObject({ stdout: '', stderr: '' });
  });

  it('does not register init or fork', async () => {
    for (const command of ['init', 'fork']) {
      const result = await runCLI(['schema', command], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain(`unknown command '${command}'`);
    }
  });
});
