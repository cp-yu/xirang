import { describe, expect, it } from 'vitest';
import { validateStructuralDefinition } from '../../../src/core/framing/validator.js';
import type { ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';
import type { SemanticModel } from '../../../src/core/model/types.js';

function model(): SemanticModel {
  return {
    elementKinds: [
      { identity: 'project', contract: 'optional', root: true, body: '' },
      { identity: 'capability', contract: 'required', parents: ['project', 'capability'], body: '' },
    ],
    relationshipKinds: [{ identity: 'uses', sourceKinds: ['capability'], targetKinds: ['capability'], body: '' }],
    elements: [
      { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, requirements: [] },
      {
        declaration: { identity: 'existing', kind: 'capability', parent: 'root', title: 'Existing', definition: 'Existing.' },
        requirements: [{ name: 'Works', body: 'SHALL work.', scenarios: [{ name: 'Works', body: '- **WHEN** used\n- **THEN** works' }] }],
      },
    ],
    relationships: [],
    views: [{ identity: 'overview', include: ['existing'] }],
  };
}

function emptyPayload(overrides: Partial<ChangeStructuralDefinitionPayload> = {}): ChangeStructuralDefinitionPayload {
  return { elementKinds: [], relationshipKinds: [], elements: [], relationships: [], ...overrides };
}

describe('structural framing validation', () => {
  it('keeps required Contracts and Authored View effects as non-blocking impacts', () => {
    const result = validateStructuralDefinition(model(), emptyPayload({
      elements: [
        { identity: 'new', kind: 'capability', parent: 'root', title: 'New', definition: 'New.' },
        { identity: 'existing', kind: 'capability', parent: 'root', title: 'Existing 2', definition: 'Existing changed.' },
      ],
    }));
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.impacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'REQUIRED_CONTRACT', identity: 'new' }),
      expect.objectContaining({ code: 'AFFECTED_CONTRACT', identity: 'existing' }),
      expect.objectContaining({ code: 'AUTHORED_VIEW_REFERENCE', identity: 'overview' }),
    ]));
  });

  it('preserves first-match updates and Contract impacts for duplicate source identities', () => {
    const input = model();
    input.elementKinds.push(
      { identity: 'duplicate-kind', contract: 'optional', body: 'first' },
      { identity: 'duplicate-kind', contract: 'optional', body: 'second' },
    );
    input.relationshipKinds.push(
      { identity: 'duplicate-relation', body: 'first' },
      { identity: 'duplicate-relation', body: 'second' },
    );
    input.elements.push(
      { declaration: { identity: 'duplicate', kind: 'capability', parent: 'root', title: 'First', definition: 'First.' }, requirements: [] },
      {
        declaration: { identity: 'duplicate', kind: 'capability', parent: 'root', title: 'Second', definition: 'Second.' },
        requirements: [{ name: 'Later', body: 'SHALL remain.', scenarios: [{ name: 'Later', body: '- **WHEN** used\n- **THEN** remains' }] }],
      },
    );
    const before = structuredClone(input);
    const result = validateStructuralDefinition(input, emptyPayload({
      elementKinds: [{ identity: 'duplicate-kind', contract: 'optional', body: 'changed' }],
      relationshipKinds: [{ identity: 'duplicate-relation', body: 'changed' }],
      elements: [{ identity: 'duplicate', kind: 'capability', parent: 'root', title: 'Changed', definition: 'Changed.' }],
    }));

    expect(result.targetModel.elementKinds.filter(item => item.identity === 'duplicate-kind').map(item => item.body))
      .toEqual(['changed', 'second']);
    expect(result.targetModel.relationshipKinds.filter(item => item.identity === 'duplicate-relation').map(item => item.body))
      .toEqual(['changed', 'second']);
    const duplicates = result.targetModel.elements.filter(item => item.declaration.identity === 'duplicate');
    expect(duplicates.map(item => item.declaration.title)).toEqual(['Changed', 'Second']);
    expect(duplicates[0].requirements).toEqual([]);
    expect(duplicates[1].requirements).toEqual(input.elements.at(-1)?.requirements);
    expect(result.impacts).not.toContainEqual(expect.objectContaining({ code: 'AFFECTED_CONTRACT', identity: 'duplicate' }));
    expect(result.diagnostics.map(item => item.code)).toContain('DUPLICATE_IDENTITY');
    expect(input).toEqual(before);
  });

  it('removes every duplicate source identity', () => {
    const input = model();
    input.elementKinds.push(
      { identity: 'duplicate-kind', contract: 'optional', body: 'first' },
      { identity: 'duplicate-kind', contract: 'optional', body: 'second' },
    );
    input.elements.push(
      { declaration: { identity: 'duplicate', kind: 'capability', parent: 'root', title: 'First', definition: 'First.' }, requirements: [] },
      { declaration: { identity: 'duplicate', kind: 'capability', parent: 'root', title: 'Second', definition: 'Second.' }, requirements: [] },
    );
    const result = validateStructuralDefinition(input, emptyPayload({
      elementKinds: [{ operation: 'REMOVED', identity: 'duplicate-kind' }],
      elements: [{ operation: 'REMOVED', identity: 'duplicate' }],
    }));
    expect(result.targetModel.elementKinds.some(item => item.identity === 'duplicate-kind')).toBe(false);
    expect(result.targetModel.elements.some(item => item.declaration.identity === 'duplicate')).toBe(false);
  });

  it.each([
    ['missing parent', emptyPayload({ elements: [{ identity: 'new', kind: 'capability', parent: 'ghost', title: 'New', definition: 'New.' }] }), 'MISSING_PARENT'],
    ['hierarchy cycle', emptyPayload({ elements: [
      { identity: 'a', kind: 'capability', parent: 'b', title: 'A', definition: 'A.' },
      { identity: 'b', kind: 'capability', parent: 'a', title: 'B', definition: 'B.' },
    ] }), 'CONTAINMENT_CYCLE'],
    ['undeclared Kind', emptyPayload({ elements: [{ identity: 'new', kind: 'ghost', parent: 'root', title: 'New', definition: 'New.' }] }), 'UNDECLARED_ELEMENT_KIND'],
    ['missing endpoint', emptyPayload({ relationships: [{ source: 'existing', kind: 'uses', target: 'ghost' }] }), 'INVALID_RELATION_ENDPOINT'],
  ] as const)('blocks %s', (_label, payload, code) => {
    const result = validateStructuralDefinition(model(), payload);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toContain(code);
  });

  it('blocks removal that leaves structural references dangling', () => {
    const input = model();
    input.relationships.push({ source: 'existing', kind: 'uses', target: 'existing' });
    const result = validateStructuralDefinition(input, emptyPayload({
      elements: [{ operation: 'REMOVED', identity: 'existing' }],
    }));
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(item => item.code)).toContain('INVALID_RELATION_ENDPOINT');
  });
});
