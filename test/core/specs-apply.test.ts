import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  buildUpdatedSpec,
  isDeltaSpecAlreadyApplied,
  type SpecUpdate,
} from '../../src/core/specs-apply.js';

describe('specs apply scenario operation labels', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-specs-apply-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeUpdate(changeSpec: string, mainSpec: string): Promise<SpecUpdate> {
    const source = path.join(tempDir, 'openspec', 'changes', 'c1', 'specs', 'auth', 'spec.md');
    const target = path.join(tempDir, 'openspec', 'specs', 'auth', 'spec.md');
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(source, changeSpec, 'utf-8');
    await fs.writeFile(target, mainSpec, 'utf-8');
    return { source, target, exists: true };
  }

  it('writes clean formal scenario headings and omits removed scenario blocks', async () => {
    const update = await writeUpdate(
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: [MODIFIED] Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: [REMOVED] Legacy path
- **WHEN** legacy flow runs
- **THEN** old behavior happens

#### Scenario: [ADDED] MFA path
- **WHEN** MFA is required
- **THEN** a challenge is shown`,
      `# auth Specification

## Purpose
Auth behavior.

## Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds`
    );

    const { rebuilt } = await buildUpdatedSpec(update, 'c1', tempDir);

    expect(rebuilt).toContain('#### Scenario: Existing path');
    expect(rebuilt).toContain('#### Scenario: MFA path');
    expect(rebuilt).not.toContain('Scenario: [MODIFIED]');
    expect(rebuilt).not.toContain('Scenario: [ADDED]');
    expect(rebuilt).not.toContain('Scenario: [REMOVED]');
    expect(rebuilt).not.toContain('legacy flow runs');
  });

  it('compares labeled deltas against normalized formal specs for idempotency', () => {
    const changeContent = `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: [MODIFIED] Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: [REMOVED] Legacy path
- **WHEN** legacy flow runs
- **THEN** old behavior happens

#### Scenario: [ADDED] MFA path
- **WHEN** MFA is required
- **THEN** a challenge is shown`;
    const targetContent = `# auth Specification

## Purpose
Auth behavior.

## Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: MFA path
- **WHEN** MFA is required
- **THEN** a challenge is shown`;

    expect(isDeltaSpecAlreadyApplied(changeContent, targetContent)).toBe(true);
  });
});
