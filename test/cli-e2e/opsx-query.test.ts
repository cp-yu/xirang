import { describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

describe('active architecture navigation boundary', () => {
  it('does not expose YAML-backed opsx query navigation', async () => {
    const result = await runCLI(['opsx', 'query', 'cap.example'], { cwd: process.cwd() });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown command 'opsx'");
  });
});
