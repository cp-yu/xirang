import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';
import { createSemanticDiff } from '../../src/core/semantic-diff.js';
import { emptySemanticModel, type Scenario, type SemanticModel } from '../../src/core/model/types.js';
import { writeChangeDelta } from '../helpers/model-fixture.js';

describe('complete target delta Specs', () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('accepts canonical unlabeled Scenarios as the complete MODIFIED target set', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-delta-validation-'));
    const changeDir = await writeChangeDelta(tempDir, 'change', {
      'elements/auth.id.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: auth.id\nkind: capability\nparent: root\ntitle: Auth\nsummary: Auth\n---\n\n'
        + '## MODIFIED Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n'
        + '#### Scenario: Existing path\n- **WHEN** valid credentials are supplied\n- **THEN** login succeeds\n\n'
        + '#### Scenario: MFA path\n- **WHEN** MFA is required\n- **THEN** a challenge is shown\n',
    });

    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

    expect(report.issues.filter(issue => issue.level === 'ERROR')).toEqual([]);
  });

  it('reports notation issues at the Element delta unit path', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-delta-validation-'));
    const changeDir = await writeChangeDelta(tempDir, 'change', {
      'elements/auth.id.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: auth.id\nkind: capability\nparent: root\ntitle: Auth\nsummary: Auth\n---\n\n'
        + '## ADDED Requirements\n\n### Requirement: Login\nThis text has no normative keyword.\n\n'
        + '#### Scenario: Existing path\n- **WHEN** x\n- **THEN** y\n',
    });

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues).toEqual([
      { level: 'ERROR', path: 'elements/auth.id.md', message: 'ADDED "Login" must contain SHALL or MUST' },
    ]);
  });

  it('derives Scenario add, modify, and remove operations from Formal versus Expected', () => {
    const model = (scenarios: Scenario[]): SemanticModel => ({
      ...emptySemanticModel(),
      elements: [{
        declaration: { identity: 'auth.id', kind: 'capability', parent: 'root', title: 'Auth', summary: 'Auth' },
        requirements: [{ name: 'Login', body: 'The system SHALL support login.', scenarios }],
      }],
    });
    const formal = model([
      { name: 'Existing path', body: 'old body' },
      { name: 'Legacy path', body: 'legacy body' },
    ]);
    const target = model([
      { name: 'Existing path', body: 'new body' },
      { name: 'MFA path', body: 'mfa body' },
    ]);

    const diff = createSemanticDiff(formal, target, {
      change: 'change', valid: true, formalFingerprint: 'formal', changeFingerprint: 'change', diagnostics: [],
    });
    const requirement = diff.entries.find(entry => entry.kind === 'requirement');

    expect(requirement?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'scenario', identity: 'auth.id#Login#Existing path', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'auth.id#Login#Legacy path', operation: 'REMOVED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'auth.id#Login#MFA path', operation: 'ADDED' }),
    ]));
  });
});
