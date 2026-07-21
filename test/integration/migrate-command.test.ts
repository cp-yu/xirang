import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

const main = `schema_version: 2
project:
  id: test
  name: Test
domains:
  - id: dom.core
    type: domain
    intent: Core
capabilities:
  - id: cap.core.run
    type: capability
    intent: Run
  - id: cap.core.stop
    type: capability
    intent: Stop
`;
const relations = `schema_version: 2
relations:
  - from: cap.core.run
    type: belongs_to
    to: dom.core
  - from: cap.core.stop
    type: belongs_to
    to: dom.core
  - from: cap.core.run
    type: invokes
    to: cap.core.stop
    note: Run invokes stop
`;

describe('migrate opsx-to-likec4 command', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-migrate-command-'));
    await fs.mkdir(path.join(root, 'openspec'), { recursive: true });
    await fs.writeFile(path.join(root, 'openspec', 'project.opsx.yaml'), main);
    await fs.writeFile(path.join(root, 'openspec', 'project.opsx.relations.yaml'), relations);
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should migrate complete project structure', async () => {
    const result = await runCLI(['migrate', 'opsx-to-likec4'], { cwd: root });
    expect(result.exitCode).toBe(0);
    await expect(fs.access(path.join(root, '.opsx', 'architecture', 'domains', 'core.c4'))).resolves.toBeUndefined();
  });

  it('should expose migrated relations through arch query', async () => {
    const migrated = await runCLI(['migrate', 'opsx-to-likec4'], { cwd: root });
    expect(migrated.exitCode).toBe(0);
    const result = await runCLI(['arch', 'query', 'cap.core.run', '--relations'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('cap.core.run --invokes--> cap.core.stop - Run invokes stop');
  });

  it('should generate valid LikeC4 model', async () => {
    const result = await runCLI(['migrate', 'opsx-to-likec4'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✓ LikeC4 validation passed');
  });

  it('should handle dry-run without writing files', async () => {
    const result = await runCLI(['migrate', 'opsx-to-likec4', '--dry-run'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Preview of generated files');
    await expect(fs.access(path.join(root, '.opsx', 'architecture'))).rejects.toThrow();
  });

  it('should generate a structured agent verification handoff report', async () => {
    const result = await runCLI(['migrate', 'opsx-to-likec4', '--agent-verify'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"skill": "openspec-verify-migration"');
    expect(result.stdout).toContain('"valid": true');
    const report = JSON.parse(await fs.readFile(path.join(root, '.opsx', 'architecture', 'migration-report.json'), 'utf8'));
    expect(report).toMatchObject({
      skill: 'openspec-verify-migration',
      scope: 'opsx-source-to-generated-likec4',
      baseline: 'pre-formal-reconciliation',
      valid: true,
      expected: { domains: 1, capabilities: 2, relations: 1 },
      actual: { domains: 1, capabilities: 2, relations: 1 },
    });
  });

  it('should preserve original OPSX as backup', async () => {
    const result = await runCLI(['migrate', 'opsx-to-likec4'], { cwd: root });
    expect(result.exitCode).toBe(0);
    await expect(fs.readFile(path.join(root, 'openspec', 'project.opsx.yaml.backup'), 'utf8')).resolves.toBe(main);
    await expect(fs.readFile(path.join(root, 'openspec', 'project.opsx.relations.yaml.backup'), 'utf8')).resolves.toBe(relations);
  });
});
