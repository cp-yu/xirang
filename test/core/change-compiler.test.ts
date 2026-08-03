import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compileChange } from '../../src/core/change-compiler.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const OLD_CONTRACT = '## Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave.\n\n#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** result';

describe('compileChange', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-change-compiler-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', root: true, children: ['capability'] },
        { identity: 'domain' },
        { identity: 'capability', parents: ['project', 'capability'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Root', definition: 'Root' },
        { identity: 'old.id', parent: 'project.root', title: 'Old', definition: 'Old summary', requirements: OLD_CONTRACT },
        { identity: 'old.child', parent: 'old.id', title: 'Child', definition: 'Child summary' },
        { identity: 'consumer.id', parent: 'project.root', title: 'Consumer', definition: 'Consumer summary' },
      ],
      relationships: [{ source: 'consumer.id', kind: 'invokes', target: 'old.id' }],
    });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('owns the Change title used by Show and List', async () => {
    const titled = await writeChangeDelta(root, 'titled-change', {});
    await fs.mkdir(titled, { recursive: true });
    await fs.writeFile(path.join(titled, 'proposal.md'), '# Change: Compiler title\n\n## Why\nReason.\n');
    const canonical = await writeChangeDelta(root, 'canonical-change', {});
    await fs.mkdir(canonical, { recursive: true });
    await fs.writeFile(path.join(canonical, 'proposal.md'), '## Why\nReason.\n\n## What Changes\nNone.\n');

    expect((await compileChange(root, 'titled-change')).title).toBe('Compiler title');
    expect((await compileChange(root, 'canonical-change')).title).toBe('canonical-change');
  });

  it('compiles Declaration and Contract deltas from one immutable Formal snapshot', async () => {
    await writeChangeDelta(root, 'change-a', {
      'elements/old.id.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: old.id\nkind: capability\nparent: project.root\ntitle: Old\ndefinition: Changed summary\n---\n\n'
        + '## MODIFIED Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave differently.\n\n#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** changed result\n',
    });

    const result = await compileChange(root, 'change-a');

    expect(result.diagnostics).toEqual([]);
    expect(result.valid).toBe(true);
    const compiled = result.target!.elements.find(item => item.declaration.identity === 'old.id')!;
    expect(compiled.declaration.definition).toBe('Changed summary');
    expect(compiled.requirements[0].body).toContain('behave differently');
    expect(result.diff.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'element-declaration', identity: 'old.id', operation: 'MODIFIED', declaredOperation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'requirement', identity: 'old.id#Old behavior', operation: 'MODIFIED' }),
    ]));
  });

  it('reports identity precondition failures against the Formal model', async () => {
    await writeChangeDelta(root, 'broken', {
      'elements/old.id.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: old.id\nkind: capability\nparent: project.root\ntitle: Old duplicate\ndefinition: Duplicate\n---\n',
      'elements/ghost.id.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: ghost.id\n---\n',
    });

    const result = await compileChange(root, 'broken');

    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'ADDED_IDENTITY_EXISTS',
      'REMOVED_IDENTITY_MISSING',
    ]));
  });

  it('locates diagnostics at the actual storage unit, never a fixed partition prefix', async () => {
    await writeChangeDelta(root, 'orphan', {
      'elements/old.id.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: old.id\n---\n',
    });

    const result = await compileChange(root, 'orphan');

    expect(result.valid).toBe(false);
    const missingParent = result.diagnostics.find(item => item.code === 'MISSING_PARENT');
    expect(missingParent?.path).toBe('elements/old.child.md');
    expect(result.diagnostics.every(item => item.path !== 'architecture-delta.c4')).toBe(true);
  });

  it('validates the Expected Semantic Model, not just the delta', async () => {
    await writeProjectModel(root, minimalModel({
      elementKinds: [{ identity: 'contracted', contract: 'required', parents: ['project'] }],
      elements: [{ identity: 'old.id', kind: 'contracted', parent: 'root', requirements: OLD_CONTRACT }],
    }));
    await writeChangeDelta(root, 'remove-contract', {
      'elements/old.id.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: old.id\nkind: contracted\nparent: root\ntitle: Old\ndefinition: Old summary\n---\n\n'
        + '## REMOVED Requirements\n\n### Requirement: Old behavior\n',
    });

    const result = await compileChange(root, 'remove-contract');

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REQUIRED_CONTRACT', identity: 'old.id' }),
    ]));
  });

  it('removes an Element together with its Contract in one Expected model', async () => {
    await writeChangeDelta(root, 'remove-obsolete', {
      'elements/old.child.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: old.child\n---\n',
    });

    const result = await compileChange(root, 'remove-obsolete');

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.target!.elements.map(item => item.declaration.identity))
      .toEqual(['consumer.id', 'old.id', 'project.root']);
  });

  it('derives property and Scenario entries from Formal versus Expected comparison', async () => {
    await writeChangeDelta(root, 'detail', {
      'elements/old.id.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: old.id\nkind: capability\nparent: project.root\ntitle: Old\ndefinition: Changed summary\n---\n\n'
        + '## MODIFIED Requirements\n\n### Requirement: Old behavior\nThe system SHALL behave differently.\n\n'
        + '#### Scenario: Existing scenario\n- **WHEN** old\n- **THEN** changed result\n\n'
        + '#### Scenario: New scenario\n- **WHEN** new\n- **THEN** result\n',
    });

    const result = await compileChange(root, 'detail');

    const element = result.diff.entries.find(entry => entry.kind === 'element-declaration' && entry.identity === 'old.id');
    expect(element?.children).toEqual([
      expect.objectContaining({ kind: 'property', identity: 'old.id.definition', operation: 'MODIFIED' }),
    ]);
    const requirement = result.diff.entries.find(entry => entry.kind === 'requirement' && entry.identity === 'old.id#Old behavior');
    expect(requirement?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'scenario', identity: 'old.id#Old behavior#Existing scenario', operation: 'MODIFIED' }),
      expect.objectContaining({ kind: 'scenario', identity: 'old.id#Old behavior#New scenario', operation: 'ADDED' }),
    ]));
  });

  it('treats an already-synced change as applied when allowAlreadyApplied is set', async () => {
    await writeChangeDelta(root, 'applied', {
      'elements/old.id.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: old.id\nkind: capability\nparent: project.root\ntitle: Old\ndefinition: Old summary\n---\n',
    });

    expect((await compileChange(root, 'applied')).diagnostics.map(item => item.code))
      .toContain('ADDED_IDENTITY_EXISTS');
    expect((await compileChange(root, 'applied', { allowAlreadyApplied: true })).valid).toBe(true);
  });
});
