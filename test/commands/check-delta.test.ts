import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';

describe('check-delta command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-check-delta-'));
    await writeSpec('database-handler-resolver', [
      '计算 handler 文件路径',
      '解析 handler 缓存键',
    ]);
    await writeSpec('cli-validate', [
      'Artifact-scoped change validation',
      'Bulk validation output',
    ]);
    await writeSpec('propose-workflow', [
      'Existing propose behavior',
    ]);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeSpec(specId: string, requirements: string[]): Promise<void> {
    const specDir = path.join(tempDir, 'openspec', 'specs', specId);
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), [
      '## Purpose',
      `Spec fixture for ${specId}.`,
      '',
      '## Requirements',
      '',
      ...requirements.flatMap((name) => [
        `### Requirement: ${name}`,
        `The system SHALL support ${name}.`,
        '',
        `#### Scenario: ${name} scenario`,
        '- **WHEN** the behavior is exercised',
        '- **THEN** the behavior is observable',
        '',
      ]),
    ].join('\n'), 'utf-8');
  }

  it('prints project-relative main spec path and available requirements', async () => {
    const result = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`Main spec: ${path.join('openspec', 'specs', 'database-handler-resolver', 'spec.md')}`);
    expect(result.stdout).toContain('Available requirements:');
    expect(result.stdout).toContain('计算 handler 文件路径');
    expect(result.stdout).not.toContain(tempDir);
  });

  it('fails helpfully when --caps is missing or points to a missing spec id', async () => {
    const missingCaps = await runCLI(['check-delta', '--change', 'my-change'], { cwd: tempDir });
    expect(missingCaps.exitCode).toBe(1);
    expect(missingCaps.stderr).toContain('--caps is required');

    const missingSpec = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'missing-spec'], { cwd: tempDir });
    expect(missingSpec.exitCode).toBe(1);
    expect(missingSpec.stderr).toContain(`${path.join('openspec', 'specs', 'missing-spec', 'spec.md')} was not found`);
    expect(missingSpec.stderr).toContain('--caps expects spec ids / spec directory names');
  });

  it('classifies operation-specific requirement checks', async () => {
    const validModified = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver', '--modified', '计算 handler 文件路径'], { cwd: tempDir });
    expect(validModified.exitCode).toBe(0);
    expect(validModified.stdout).toContain('OK: MODIFIED 计算 handler 文件路径');

    const invalidExistingRefs = await runCLI([
      'check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver',
      '--modified', '不存在的 Requirement',
      '--removed', '旧路径推导逻辑',
      '--renamed-from', '旧名称',
    ], { cwd: tempDir });
    expect(invalidExistingRefs.exitCode).toBe(1);
    expect(invalidExistingRefs.stdout).toContain('Missing: MODIFIED 不存在的 Requirement');
    expect(invalidExistingRefs.stdout).toContain('Missing: REMOVED 旧路径推导逻辑');
    expect(invalidExistingRefs.stdout).toContain('Missing: RENAMED_FROM 旧名称');

    const validAdded = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver', '--added', '新的 handler 缓存策略'], { cwd: tempDir });
    expect(validAdded.exitCode).toBe(0);
    expect(validAdded.stdout).toContain('OK: ADDED 新的 handler 缓存策略');

    const conflictingAdded = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver', '--added', '计算 handler 文件路径'], { cwd: tempDir });
    expect(conflictingAdded.exitCode).toBe(1);
    expect(conflictingAdded.stdout).toContain('Conflict: ADDED 计算 handler 文件路径');
    expect(conflictingAdded.stdout).toContain('Use MODIFIED instead.');
  });

  it('aggregates mixed results for repeatable flags and multiple caps', async () => {
    const result = await runCLI([
      'check-delta', '--change', 'my-change', '--caps', 'cli-validate,propose-workflow',
      '--modified', 'Artifact-scoped change validation',
      '--modified', 'Missing requirement',
      '--added', '新的 guidance',
      '--added', 'Existing propose behavior',
    ], { cwd: tempDir });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Spec: cli-validate');
    expect(result.stdout).toContain('Spec: propose-workflow');
    expect(result.stdout).toContain('OK: MODIFIED Artifact-scoped change validation');
    expect(result.stdout).toContain('Missing: MODIFIED Missing requirement');
    expect(result.stdout).toContain('OK: ADDED 新的 guidance');
    expect(result.stdout).toContain('Conflict: ADDED Existing propose behavior');
    expect((result.stdout.match(/ADDED 新的 guidance/g) ?? []).length).toBe(2);
  });

  it('emits stable JSON with aggregate validity and grouped results', async () => {
    const invalid = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver', '--modified', 'Ghost', '--json'], { cwd: tempDir });
    expect(invalid.exitCode).toBe(1);
    const invalidJson = JSON.parse(invalid.stdout.trim());
    expect(invalidJson).toMatchObject({ change: 'my-change', valid: false });
    expect(invalidJson.items[0]).toMatchObject({
      cap: 'database-handler-resolver',
      mainSpec: path.join('openspec', 'specs', 'database-handler-resolver', 'spec.md'),
      available: ['计算 handler 文件路径', '解析 handler 缓存键'],
      ok: [],
      conflicts: [],
    });
    expect(invalidJson.items[0].missing).toEqual([{ operation: 'MODIFIED', requirement: 'Ghost' }]);

    const valid = await runCLI(['check-delta', '--change', 'my-change', '--caps', 'database-handler-resolver', '--added', 'Ghost', '--json'], { cwd: tempDir });
    expect(valid.exitCode).toBe(0);
    const validJson = JSON.parse(valid.stdout.trim());
    expect(validJson.valid).toBe(true);
    expect(validJson.items[0].ok).toEqual([{ operation: 'ADDED', requirement: 'Ghost' }]);
  });
});
