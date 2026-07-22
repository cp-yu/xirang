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

const legacyGraph = `model {
  core = domain 'Core' {
    run = capability 'Run' {
      description 'Runs work'
      metadata { capabilityId 'cap.core.run' specs ['.opsx/specs/run/spec.md'] }
    }
  }
}
`;

const validSpec = `---\ncapabilities:\n  - cap.core.run\n---\n\n# Run\n\n## Purpose\nRun work.\n\n## Requirements\n\n### Requirement: Run work\nThe system SHALL run work.\n\n#### Scenario: Run succeeds\n- **WHEN** run is requested\n- **THEN** work runs\n`;

describe('migrate opsx-to-likec4 command', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-migrate-command-'));
    await fs.mkdir(path.join(root, '.opsx'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'project.opsx.yaml'), main);
    await fs.writeFile(path.join(root, '.opsx', 'project.opsx.relations.yaml'), relations);
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
    expect(result.stdout).toContain('"skill": "opsx-verify-migration"');
    expect(result.stdout).toContain('"valid": true');
    const report = JSON.parse(await fs.readFile(path.join(root, '.opsx', 'architecture', 'migration-report.json'), 'utf8'));
    expect(report).toMatchObject({
      skill: 'opsx-verify-migration',
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
    await expect(fs.readFile(path.join(root, '.opsx', 'project.opsx.yaml.backup'), 'utf8')).resolves.toBe(main);
    await expect(fs.readFile(path.join(root, '.opsx', 'project.opsx.relations.yaml.backup'), 'utf8')).resolves.toBe(relations);
  });
});

describe('migrate semantic-model command', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-semantic-migrate-'));
    await fs.mkdir(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.mkdir(path.join(root, '.opsx', 'specs', 'run'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), legacyGraph);
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), validSpec);
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('generates an auditable v1 candidate without changing formal source', async () => {
    const beforeGraph = await fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8');
    const beforeSpec = await fs.readFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), 'utf8');
    const result = await runCLI(['migrate', 'semantic-model', '--json'], { cwd: root });
    expect(result.exitCode).toBe(0);
    const candidate = path.join(root, '.opsx', 'migration-candidate');
    const report = JSON.parse(await fs.readFile(path.join(candidate, 'migration-report.json'), 'utf8'));
    expect(report).toMatchObject({ sourceVersion: 'legacy', targetVersion: '1', gaps: [] });
    expect(report.resolvedMappings).toEqual(expect.arrayContaining([
      expect.objectContaining({ legacyId: 'cap.core.run', elementId: 'project.root/domain.core/cap.core.run' }),
    ]));
    await expect(fs.readFile(path.join(candidate, '.opsx', 'architecture', 'specification.c4'), 'utf8')).resolves.toContain("languageVersion '1'");
    await expect(fs.readFile(path.join(candidate, '.opsx', 'specs', 'run', 'spec.md'), 'utf8')).resolves.toContain('element: project.root/domain.core/cap.core.run');
    await expect(fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8')).resolves.toBe(beforeGraph);
    await expect(fs.readFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), 'utf8')).resolves.toBe(beforeSpec);
  });

  it('blocks promotion without yes and reports review gaps', async () => {
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), validSpec.replace('cap.core.run', 'cap.unknown'));
    const beforeGraph = await fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8');
    const result = await runCLI(['migrate', 'semantic-model', '--promote', '--yes', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('UNKNOWN');
    await expect(fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8')).resolves.toBe(beforeGraph);
  });

  it('blocks promotion when candidate contract validation fails', async () => {
    await fs.writeFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), validSpec.replace('SHALL run work', 'runs work'));
    const beforeGraph = await fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8');
    const result = await runCLI(['migrate', 'semantic-model', '--promote', '--yes', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('VALIDATION_FAILURE');
    await expect(fs.readFile(path.join(root, '.opsx', 'architecture', 'legacy.c4'), 'utf8')).resolves.toBe(beforeGraph);
  });

  it('requires explicit authorization for promotion', async () => {
    const result = await runCLI(['migrate', 'semantic-model', '--promote', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Promotion requires --yes');
    await expect(fs.access(path.join(root, '.opsx', 'architecture', 'legacy.c4'))).resolves.toBeUndefined();
  });

  it('documents the explicit migration options in help', async () => {
    const result = await runCLI(['migrate', 'semantic-model', '--help'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--candidate <path>');
    expect(result.stdout).toContain('--promote');
    expect(result.stdout).toContain('--yes');
    expect(result.stdout).toContain('--json');
  });

  it('promotes an independently validated candidate only with explicit authorization', async () => {
    const result = await runCLI(['migrate', 'semantic-model', '--promote', '--yes', '--json'], { cwd: root });
    expect(result.exitCode).toBe(0);
    const specification = await fs.readFile(path.join(root, '.opsx', 'architecture', 'specification.c4'), 'utf8');
    expect(specification).toContain("languageVersion '1'");
    expect(specification).toMatch(/element project[\s\S]*contract required/);
    expect(specification).toMatch(/element capability[\s\S]*contract required/);
    await expect(fs.readFile(path.join(root, '.opsx', 'specs', 'run', 'spec.md'), 'utf8')).resolves.toContain('element: project.root/domain.core/cap.core.run');
    await expect(fs.readFile(path.join(root, '.opsx', 'specs', 'project-contract', 'spec.md'), 'utf8')).resolves.toContain('element: project.root');
    await expect(fs.access(path.join(root, '.opsx', 'migration-candidate', 'migration-report.json'))).resolves.toBeUndefined();
  });
});
