import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';

describe('fix-scenario-labels command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-fix-labels-'));
    await fs.mkdir(path.join(tempDir, 'openspec', 'changes', 'archive'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeFixture(changeName = 'label-change'): Promise<string> {
    const changeSpecPath = path.join(tempDir, 'openspec', 'changes', changeName, 'specs', 'auth', 'spec.md');
    const mainSpecPath = path.join(tempDir, 'openspec', 'specs', 'auth', 'spec.md');
    await fs.mkdir(path.dirname(changeSpecPath), { recursive: true });
    await fs.mkdir(path.dirname(mainSpecPath), { recursive: true });
    await fs.writeFile(
      mainSpecPath,
      `# auth Specification

## Purpose
Auth behavior.

## Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: Legacy path
- **WHEN** legacy flow runs
- **THEN** old behavior happens`,
      'utf-8'
    );
    await fs.writeFile(
      changeSpecPath,
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds with audit

#### Scenario: MFA path
- **WHEN** MFA is required
- **THEN** a challenge is shown`,
      'utf-8'
    );
    return changeSpecPath;
  }

  it('prints preview rows and leaves files unchanged', async () => {
    const changeSpecPath = await writeFixture();
    const before = await fs.readFile(changeSpecPath, 'utf-8');

    const result = await runCLI(['fix-scenario-labels', 'label-change', '--preview'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('auth');
    expect(result.stdout).toContain('Login');
    expect(result.stdout).toContain('Existing path');
    expect(result.stdout).toContain('MODIFIED');
    expect(result.stdout).toContain('[MODIFIED]');
    expect(result.stdout).toContain('MFA path');
    expect(result.stdout).toContain('ADDED');
    expect(result.stdout).toContain('Legacy path');
    expect(result.stdout).toContain('REMOVED');
    expect(await fs.readFile(changeSpecPath, 'utf-8')).toBe(before);
  });

  it('emits machine-readable JSON preview', async () => {
    await writeFixture();

    const result = await runCLI(['fix-scenario-labels', 'label-change', '--preview', '--json'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({ changeName: 'label-change' });
    expect(report.files[0].suggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ specId: 'auth', requirementTitle: 'Login', scenarioTitle: 'Existing path', operation: 'MODIFIED', label: '[MODIFIED]' }),
      expect.objectContaining({ specId: 'auth', requirementTitle: 'Login', scenarioTitle: 'MFA path', operation: 'ADDED', label: '[ADDED]' }),
      expect.objectContaining({ specId: 'auth', requirementTitle: 'Login', scenarioTitle: 'Legacy path', operation: 'REMOVED', label: '[REMOVED]' }),
    ]));
  });

  it('writes labels, fails for missing changes, and is idempotent', async () => {
    const changeSpecPath = await writeFixture();

    const missing = await runCLI(['fix-scenario-labels', 'missing-change', '--preview'], { cwd: tempDir });
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toContain("Change 'missing-change' not found");

    const written = await runCLI(['fix-scenario-labels', 'label-change', '--write'], { cwd: tempDir });
    expect(written.exitCode).toBe(0);
    expect(written.stdout).toContain('Updated');
    const first = await fs.readFile(changeSpecPath, 'utf-8');
    expect(first).toContain('#### Scenario: [MODIFIED] Existing path');
    expect(first).toContain('#### Scenario: [ADDED] MFA path');
    expect(first).toContain('#### Scenario: [REMOVED] Legacy path');

    const secondRun = await runCLI(['fix-scenario-labels', 'label-change', '--write'], { cwd: tempDir });
    expect(secondRun.exitCode).toBe(0);
    expect(secondRun.stdout).toContain('No scenario label updates are needed.');
    expect(await fs.readFile(changeSpecPath, 'utf-8')).toBe(first);
  });
});
