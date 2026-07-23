import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  buildUpdatedSpec,
  isDeltaSpecAlreadyApplied,
  type SpecUpdate,
} from '../../src/core/specs-apply.js';

describe('specs apply complete target state', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-specs-apply-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeUpdate(changeSpec: string, mainSpec: string): Promise<SpecUpdate> {
    const source = path.join(tempDir, '.opsx', 'changes', 'c1', 'specs', 'auth', 'spec.md');
    const target = path.join(tempDir, '.opsx', 'specs', 'auth', 'spec.md');
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(source, changeSpec, 'utf-8');
    await fs.writeFile(target, mainSpec, 'utf-8');
    return { source, target, exists: true };
  }

  it('preserves singular element frontmatter when creating a formal spec', async () => {
    const source = path.join(tempDir, '.opsx', 'changes', 'c1', 'specs', 'browser', 'spec.md');
    const target = path.join(tempDir, '.opsx', 'specs', 'browser', 'spec.md');
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.writeFile(source, `---\nelement: presentation.spec_content_panel\n---\n## ADDED Requirements\n\n### Requirement: Browse Specs\n\nThe UI SHALL display indexed Specs.\n\n#### Scenario: Open details\n\n- **WHEN** details open\n- **THEN** indexed Specs are displayed\n`);

    const { rebuilt } = await buildUpdatedSpec({ source, target, exists: false }, 'c1', tempDir);

    expect(rebuilt).toMatch(/^---\nelement: presentation\.spec_content_panel\n---\n/);
    expect(rebuilt).not.toContain('capabilities:');
  });

  it('keeps legacy capability frontmatter on the legacy read path', async () => {
    const source = path.join(tempDir, '.opsx', 'changes', 'c1', 'specs', 'legacy', 'spec.md');
    const target = path.join(tempDir, '.opsx', 'specs', 'legacy', 'spec.md');
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.writeFile(source, `---\ncapabilities: [cap.legacy.run]\n---\n## ADDED Requirements\n\n### Requirement: Run\n\nThe system SHALL run.\n\n#### Scenario: Run\n\n- **WHEN** invoked\n- **THEN** it runs\n`);

    const { rebuilt } = await buildUpdatedSpec({ source, target, exists: false }, 'c1', tempDir);

    expect(rebuilt).toContain('capabilities:\n  - cap.legacy.run');
  });

  it('treats a MODIFIED Requirement block as the complete target Scenario set', async () => {
    const update = await writeUpdate(
      `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: MFA path
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
    expect(rebuilt).not.toContain('Scenario: [');
    expect(rebuilt).not.toContain('legacy flow runs');
  });

  it('compares canonical target blocks against formal specs for idempotency', () => {
    const changeContent = `## MODIFIED Requirements

### Requirement: Login
The system SHALL support login.

#### Scenario: Existing path
- **WHEN** credentials are valid
- **THEN** login succeeds

#### Scenario: MFA path
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
