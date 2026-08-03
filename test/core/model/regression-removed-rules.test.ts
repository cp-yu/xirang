import { describe, expect, it } from 'vitest';
import { applySemanticDelta, parseSemanticDelta } from '../../../src/core/model/delta.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { serializeElementUnit } from '../../../src/core/model/serializer.js';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import type { SemanticModel } from '../../../src/core/model/types.js';
import { createModelRoot } from './fixtures.js';

const MODEL: Record<string, string> = {
  'metamodel/project.md': '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n',
  'metamodel/domain.md': '---\nentity: element-kind\nidentity: domain\ncontract: optional\n---\n',
  'metamodel/capability.md': '---\nentity: element-kind\nidentity: capability\ncontract: optional\n---\n',
  'elements/root.md': '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Root\n---\n',
  'elements/cap.a.md': '---\nentity: element-declaration\nidentity: cap.a\nkind: capability\nparent: root\ntitle: A\ndefinition: A\n---\n',
};

describe('rules removed by the kernel rebuild', () => {
  it('allows MODIFIED to change an Element Kind while the identity stays', async () => {
    const model = (await parseSemanticModel(await createModelRoot(MODEL))).model;
    const change = await parseSemanticDelta(await createModelRoot({
      'elements/cap.a.md': '---\noperation: MODIFIED\nentity: element-declaration\nidentity: cap.a\nkind: project\nparent: null\ntitle: A\ndefinition: A\n---\n',
    }));

    expect(change.diagnostics).toEqual([]);
    const applied = applySemanticDelta(model, change.delta);
    expect(applied.diagnostics).toEqual([]);
    expect(applied.expected.elements.find(item => item.declaration.identity === 'cap.a')!.declaration.kind).toBe('project');
    expect(validateSemanticModel(applied.expected).map(item => item.code)).toEqual(['MULTIPLE_PROJECT_ROOTS']);
  });

  it('cannot express a second Contract for one Element', async () => {
    const root = await createModelRoot({
      ...MODEL,
      'elements/cap.a.md': [
        '---', 'entity: element-declaration', 'identity: cap.a', 'kind: capability', 'parent: root', '---', '',
        '## Requirements', '', '### Requirement: One', '', 'SHALL hold.', '',
      ].join('\n'),
      'elements/cap.a.second.md': [
        '---', 'entity: element-declaration', 'identity: cap.a', 'kind: capability', 'parent: root', '---', '',
        '## Requirements', '', '### Requirement: Two', '', 'SHALL also hold.', '',
      ].join('\n'),
    });

    const parsed = await parseSemanticModel(root);
    // Two units claiming one identity is a duplicate identity, not a second contract binding.
    expect(validateSemanticModel(parsed.model).map(item => item.code)).toContain('DUPLICATE_IDENTITY');
    for (const element of parsed.model.elements.filter(item => item.declaration.identity === 'cap.a')) {
      expect(element.requirements).toHaveLength(1);
      expect(serializeElementUnit(element).match(/^## Requirements$/gm)).toHaveLength(1);
    }
  });

  it('leaves no place to declare a relationship description', async () => {
    const root = await createModelRoot({
      'relationships/invokes.yaml': [
        'relationships:',
        '  - source: cap.a',
        '    kind: invokes',
        '    target: root',
        '    description: why it exists',
        '',
      ].join('\n'),
    });
    const parsed = await parseSemanticModel(root);
    expect(parsed.diagnostics.map(item => item.code)).toEqual(['UNSUPPORTED_RELATIONSHIP_FIELD']);
    expect(parsed.model.relationships).toEqual([]);
  });

  it('rejects MODIFIED on a relationship', async () => {
    const change = await parseSemanticDelta(await createModelRoot({
      'relationships/invokes.yaml': 'relationships:\n  - operation: MODIFIED\n    source: cap.a\n    kind: invokes\n    target: root\n',
    }));
    expect(change.diagnostics.map(item => item.code)).toEqual(['RELATIONSHIP_MODIFIED_UNSUPPORTED']);
  });

  it('carries no ownership, capabilityId or spec binding rules', async () => {
    const parsed = await parseSemanticModel(await createModelRoot(MODEL));
    const empty: SemanticModel = parsed.model;
    const codes = [...parsed.diagnostics, ...validateSemanticModel(empty)].map(item => item.code);
    expect(codes).toEqual([]);
    expect(JSON.stringify(empty)).not.toMatch(/capabilityId|metadata|specs/);
  });
});
