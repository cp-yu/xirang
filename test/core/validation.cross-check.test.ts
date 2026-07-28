import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { compileChange } from '../../src/core/change-compiler.js';
import { Validator } from '../../src/core/validation/validator.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n#### Scenario: Existing path\n- **WHEN** credentials are valid\n- **THEN** login succeeds';

function deltaUnit(operation: string, body: string): string {
  return `---\noperation: ${operation}\nentity: element-declaration\nidentity: auth.id\nkind: capability\nparent: root\ntitle: Auth\ndefinition: Auth\n---\n\n${body}`;
}

/**
 * Requirement identity preconditions are resolved against the Formal model by `applySemanticDelta`;
 * the Validator only checks the notation carried by the change's Element units.
 */
describe('Requirement delta cross-check against the Formal Semantic Model', () => {
  const testDir = path.join(process.cwd(), 'test-cross-check-tmp');

  beforeEach(async () => {
    await writeProjectModel(testDir, minimalModel({
      elements: [{ identity: 'auth.id', parent: 'root', title: 'Auth', definition: 'Auth', requirements: CONTRACT }],
    }));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('reports MODIFIED on a Requirement that does not exist', async () => {
    await writeChangeDelta(testDir, 'test-change', {
      'elements/auth.id.md': deltaUnit('MODIFIED',
        '## MODIFIED Requirements\n\n### Requirement: Ghost\nThe system SHALL do nothing.\n\n#### Scenario: S\n- **WHEN** x\n- **THEN** y\n'),
    });

    const compiled = await compileChange(testDir, 'test-change');

    expect(compiled.valid).toBe(false);
    expect(compiled.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MODIFIED_IDENTITY_MISSING',
        identity: 'auth.id#Ghost',
        path: 'elements/auth.id.md',
      }),
    ]));
  });

  it('reports ADDED on a Requirement that already exists', async () => {
    await writeChangeDelta(testDir, 'test-change', {
      'elements/auth.id.md': deltaUnit('MODIFIED',
        '## ADDED Requirements\n\n### Requirement: Login\nThe system SHALL support login.\n\n#### Scenario: S\n- **WHEN** x\n- **THEN** y\n'),
    });

    const compiled = await compileChange(testDir, 'test-change');

    expect(compiled.valid).toBe(false);
    expect(compiled.diagnostics.map(item => item.code)).toContain('ADDED_IDENTITY_EXISTS');
  });

  it('reports REMOVED on a Requirement that does not exist', async () => {
    await writeChangeDelta(testDir, 'test-change', {
      'elements/auth.id.md': deltaUnit('MODIFIED', '## REMOVED Requirements\n\n### Requirement: Ghost\n'),
    });

    const compiled = await compileChange(testDir, 'test-change');

    expect(compiled.valid).toBe(false);
    expect(compiled.diagnostics.map(item => item.code)).toContain('REMOVED_IDENTITY_MISSING');
  });

  it('reports a Requirement whose host Element does not exist', async () => {
    await writeChangeDelta(testDir, 'test-change', {
      'elements/ghost.md': '---\nentity: element-declaration\nidentity: ghost.id\n---\n\n'
        + '## ADDED Requirements\n\n### Requirement: New\nThe system SHALL do it.\n\n#### Scenario: S\n- **WHEN** x\n- **THEN** y\n',
    });

    const compiled = await compileChange(testDir, 'test-change');

    expect(compiled.valid).toBe(false);
    expect(compiled.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ADDED_IDENTITY_MISSING', identity: 'ghost.id#New' }),
    ]));
  });

  it('accepts a MODIFIED Requirement that restates its complete target set', async () => {
    const changeDir = await writeChangeDelta(testDir, 'test-change', {
      'elements/auth.id.md': deltaUnit('MODIFIED',
        '## MODIFIED Requirements\n\n### Requirement: Login\nThe system SHALL support login with MFA.\n\n#### Scenario: MFA path\n- **WHEN** MFA is required\n- **THEN** a challenge is shown\n'),
    });

    const compiled = await compileChange(testDir, 'test-change');
    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.valid).toBe(true);
    expect(report.issues.filter(issue => issue.level === 'ERROR')).toEqual([]);
    expect(compiled.target!.elements.find(item => item.declaration.identity === 'auth.id')!.requirements[0].scenarios)
      .toEqual([{ name: 'MFA path', body: '- **WHEN** MFA is required\n- **THEN** a challenge is shown' }]);
  });

  it('rejects RENAMED Requirements before any identity resolution', async () => {
    const changeDir = await writeChangeDelta(testDir, 'test-change', {
      'elements/auth.id.md': deltaUnit('MODIFIED', '## RENAMED Requirements\n\n- FROM: `### Requirement: Login`\n- TO: `### Requirement: Sign in`\n'),
    });

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'elements/auth.id.md',
        message: expect.stringContaining('RENAMED Requirements is unsupported'),
      }),
    ]));
  });
});
