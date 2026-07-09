import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  fixScenarioLabelsForChange,
  previewScenarioLabelsForChange,
} from '../../src/core/scenario-labels.js';

describe('scenario labels', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-scenario-labels-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeSpecs(changeSpec: string, mainSpec: string): Promise<void> {
    const changeSpecPath = path.join(tempDir, 'openspec', 'changes', 'label-change', 'specs', 'auth', 'spec.md');
    const mainSpecPath = path.join(tempDir, 'openspec', 'specs', 'auth', 'spec.md');
    await fs.mkdir(path.dirname(changeSpecPath), { recursive: true });
    await fs.mkdir(path.dirname(mainSpecPath), { recursive: true });
    await fs.writeFile(changeSpecPath, changeSpec, 'utf-8');
    await fs.writeFile(mainSpecPath, mainSpec, 'utf-8');
  }

  it('derives changed, new, and unchanged scenario labels', async () => {
    await writeSpecs(
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds with audit

#### Scenario: New path
- **WHEN** MFA is required
- **THEN** challenge is shown

#### Scenario: Same path
- **WHEN** remembered device logs in
- **THEN** login succeeds`,
      `# auth Specification

## Purpose
Auth behavior.

## Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: Same path
- **WHEN** remembered device logs in
- **THEN** login succeeds`
    );

    const report = await previewScenarioLabelsForChange(tempDir, 'label-change');
    expect(report.files[0].suggestions).toEqual([
      expect.objectContaining({ scenarioTitle: 'Existing path', operation: 'MODIFIED', label: '[MODIFIED]' }),
      expect.objectContaining({ scenarioTitle: 'New path', operation: 'ADDED', label: '[ADDED]' }),
      expect.objectContaining({ scenarioTitle: 'Same path', operation: 'UNCHANGED', label: null }),
    ]);

    await fixScenarioLabelsForChange(tempDir, 'label-change');
    const updated = await fs.readFile(
      path.join(tempDir, 'openspec', 'changes', 'label-change', 'specs', 'auth', 'spec.md'),
      'utf-8'
    );
    expect(updated).toContain('#### Scenario: [MODIFIED] Existing path');
    expect(updated).toContain('#### Scenario: [ADDED] New path');
    expect(updated).toContain('#### Scenario: Same path');
    expect(updated).not.toContain('[MODIFIED] Same path');
  });

  it('re-derives stale existing labels instead of trusting them', async () => {
    await writeSpecs(
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: [MODIFIED] Same path
- **WHEN** remembered device logs in
- **THEN** login succeeds`,
      `# auth Specification

## Purpose
Auth behavior.

## Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Same path
- **WHEN** remembered device logs in
- **THEN** login succeeds`
    );

    const report = await fixScenarioLabelsForChange(tempDir, 'label-change');
    expect(report.files[0].suggestions).toEqual([
      expect.objectContaining({ scenarioTitle: 'Same path', operation: 'UNCHANGED', label: null }),
    ]);

    const updated = await fs.readFile(
      path.join(tempDir, 'openspec', 'changes', 'label-change', 'specs', 'auth', 'spec.md'),
      'utf-8'
    );
    expect(updated).toContain('#### Scenario: Same path');
    expect(updated).not.toContain('[MODIFIED] Same path');
  });

  it('inserts removed scenarios once and normalizes existing labels', async () => {
    await writeSpecs(
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: [MODIFIED] Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds with audit`,
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
- **THEN** old behavior happens`
    );

    await fixScenarioLabelsForChange(tempDir, 'label-change');
    const changeSpecPath = path.join(tempDir, 'openspec', 'changes', 'label-change', 'specs', 'auth', 'spec.md');
    const first = await fs.readFile(changeSpecPath, 'utf-8');
    expect(first).toContain('#### Scenario: [MODIFIED] Existing path');
    expect(first).toContain('#### Scenario: [REMOVED] Legacy path');
    expect(first).toContain('- **WHEN** legacy flow runs\n- **THEN** old behavior happens');
    expect((first.match(/\[REMOVED\] Legacy path/g) ?? []).length).toBe(1);

    await fixScenarioLabelsForChange(tempDir, 'label-change');
    const second = await fs.readFile(changeSpecPath, 'utf-8');
    expect(second).toBe(first);
  });
});
