import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';
import { createSemanticDiff } from '../../src/core/semantic-diff.js';
import type { TargetSemanticModel } from '../../src/utils/semantic-model.js';

describe('complete target delta Specs', () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('accepts canonical unlabeled Scenarios as the complete MODIFIED target set', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-delta-validation-'));
    const changeDir = path.join(tempDir, '.xirang', 'changes', 'change');
    const mainPath = path.join(tempDir, '.xirang', 'specs', 'auth', 'spec.md');
    const deltaPath = path.join(changeDir, 'specs', 'auth', 'spec.md');
    await fs.mkdir(path.dirname(mainPath), { recursive: true });
    await fs.mkdir(path.dirname(deltaPath), { recursive: true });
    await fs.writeFile(mainPath, `## Purpose\nAuth behavior.\n\n## Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n#### Scenario: Existing path\n- **WHEN** credentials are valid\n- **THEN** login succeeds\n\n#### Scenario: Legacy path\n- **WHEN** legacy flow runs\n- **THEN** old behavior happens\n`);
    await fs.writeFile(deltaPath, `## MODIFIED Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n#### Scenario: Existing path\n- **WHEN** valid credentials are supplied\n- **THEN** login succeeds\n\n#### Scenario: MFA path\n- **WHEN** MFA is required\n- **THEN** a challenge is shown\n`);

    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

    expect(report.issues.filter(issue => issue.level === 'ERROR')).toEqual([]);
  });

  it('derives Scenario add, modify, and remove operations from Formal versus Target', () => {
    const model = (scenarios: Array<{ title: string; body: string }>): TargetSemanticModel => ({
      architecture: {
        languageVersion: '1', metamodel: { elements: {}, relationships: {} }, elements: [], relations: [],
      },
      contracts: [{
        specId: 'auth', elementId: 'auth.id',
        requirements: [{ title: 'Login', body: 'The system SHALL support login.', scenarios }],
      }],
    });
    const formal = model([
      { title: 'Existing path', body: 'old body' },
      { title: 'Legacy path', body: 'legacy body' },
    ]);
    const target = model([
      { title: 'Existing path', body: 'new body' },
      { title: 'MFA path', body: 'mfa body' },
    ]);

    const diff = createSemanticDiff(formal, target, {
      change: 'change', valid: true, formalFingerprint: 'formal', changeFingerprint: 'change', diagnostics: [],
    });
    const requirement = diff.entries.find(entry => entry.kind === 'requirement');

    expect(requirement?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'scenario', identity: 'auth#Login#Existing path', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'auth#Login#Legacy path', operation: 'REMOVED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'auth#Login#MFA path', operation: 'ADDED' }),
    ]));
  });
});
