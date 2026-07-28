import { describe, expect, it, vi } from 'vitest';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import type { ModelElement, SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, kind: string, parent: string | null, requirements = 0): ModelElement {
  return {
    declaration: { identity, kind, parent, title: identity, definition: '' },
    requirements: Array.from({ length: requirements }, (_, index) => ({
      name: `R${index}`,
      body: 'SHALL hold.',
      scenarios: [{ name: 'S', body: '- **WHEN** checked\n- **THEN** it holds' }],
    })),
  };
}

function model(overrides: Partial<SemanticModel> = {}): SemanticModel {
  return {
    elementKinds: [
      { identity: 'project', contract: 'optional', root: true, body: '' },
      { identity: 'domain', contract: 'optional', parents: ['project'], body: '' },
      { identity: 'capability', contract: 'required', parents: ['domain'], body: '' },
    ],
    relationshipKinds: [{ identity: 'invokes', sourceKinds: ['capability'], targetKinds: ['capability'], body: '' }],
    elements: [
      element('root', 'project', null),
      element('domain.a', 'domain', 'root'),
      element('cap.a', 'capability', 'domain.a', 1),
    ],
    relationships: [],
    views: [],
    ...overrides,
  };
}

function codes(input: SemanticModel): string[] {
  return validateSemanticModel(input).map(item => item.code).sort();
}

describe('validateSemanticModel', () => {
  it('accepts a well-formed model', () => {
    expect(validateSemanticModel(model())).toEqual([]);
  });

  it('rejects identities outside [A-Za-z0-9._-]', () => {
    for (const bad of ['a/b', 'a b', '中文', 'a\tb', 'a#b']) {
      expect(codes(model({ views: [{ identity: bad, include: '*' }] }))).toContain('INVALID_IDENTITY');
    }
    expect(codes(model({ views: [{ identity: 'a.b-c_1', include: '*' }] }))).not.toContain('INVALID_IDENTITY');
  });

  it('detects kind identity collisions across both kind collections', () => {
    const clash = model({ relationshipKinds: [{ identity: 'capability', body: '' }] });
    expect(codes(clash)).toContain('DUPLICATE_KIND_IDENTITY');
    expect(codes(model())).not.toContain('DUPLICATE_KIND_IDENTITY');
  });

  it('detects duplicate element and view identities', () => {
    expect(codes(model({ elements: [...model().elements, element('cap.a', 'capability', 'domain.a', 1)] })))
      .toContain('DUPLICATE_IDENTITY');
  });

  it('requires exactly one Project Root', () => {
    expect(codes(model({ elements: [element('domain.a', 'domain', null)] })))
      .toEqual(expect.arrayContaining(['MISSING_PARENT', 'MISSING_PROJECT_ROOT']));
    expect(codes(model({ elements: [element('a', 'project', null), element('b', 'project', null)] })))
      .toContain('MULTIPLE_PROJECT_ROOTS');
    expect(codes(model({
      elements: [element('root', 'project', null), element('other', 'project', 'root')],
    }))).toContain('INVALID_PROJECT_ROOT');
  });

  it('accepts hierarchies of arbitrary depth', () => {
    const deep = model({
      elementKinds: [
        { identity: 'project', contract: 'optional', root: true, body: '' },
        { identity: 'node', contract: 'optional', body: '' },
      ],
      relationshipKinds: [],
      elements: [
        element('root', 'project', null),
        ...Array.from({ length: 8 }, (_, index) =>
          element(`n${index}`, 'node', index === 0 ? 'root' : `n${index - 1}`)),
      ],
    });
    expect(validateSemanticModel(deep)).toEqual([]);
  });

  it('checks deep acyclic hierarchies with linear Map lookup growth', () => {
    const depth = 128;
    const hierarchy = model({
      elementKinds: [
        { identity: 'project', contract: 'optional', root: true, body: '' },
        { identity: 'node', contract: 'optional', body: '' },
      ],
      relationshipKinds: [],
      elements: [
        element('root', 'project', null),
        ...Array.from({ length: depth }, (_, index) =>
          element(`n${index}`, 'node', index === 0 ? 'root' : `n${index - 1}`)),
      ],
    });
    const mapGet = Map.prototype.get;
    let lookups = 0;
    const getSpy = vi.spyOn(Map.prototype, 'get').mockImplementation(function (key: unknown) {
      lookups += 1;
      return mapGet.call(this, key);
    });

    const diagnostics = validateSemanticModel(hierarchy);
    getSpy.mockRestore();

    expect(diagnostics).toEqual([]);
    expect(lookups).toBeLessThan(depth * 16);
  });

  it('rejects missing parents and preserves the first containment cycle sequence', () => {
    expect(codes(model({ elements: [element('root', 'project', null), element('x', 'domain', 'ghost')] })))
      .toContain('MISSING_PARENT');
    const diagnostics = validateSemanticModel(model({
      elementKinds: [
        { identity: 'project', contract: 'optional', root: true, body: '' },
        { identity: 'node', contract: 'optional', body: '' },
      ],
      relationshipKinds: [],
      elements: [
        element('root', 'project', null),
        element('safe', 'node', 'root'),
        element('prefix', 'node', 'a'),
        element('a', 'node', 'b'),
        element('b', 'node', 'a'),
      ],
    }));
    expect(diagnostics).toContainEqual({
      level: 'ERROR',
      code: 'CONTAINMENT_CYCLE',
      path: '',
      message: 'Containment cycle detected: a → b → a',
      identity: 'a',
    });
  });

  it('enforces declared parents and children constraints', () => {
    expect(codes(model({
      elements: [element('root', 'project', null), element('cap.a', 'capability', 'root', 1)],
    }))).toContain('INVALID_CONTAINMENT');
  });

  it('leaves containment open when the metamodel declares no constraint', () => {
    const open = model({
      elementKinds: [
        { identity: 'project', contract: 'optional', root: true, body: '' },
        { identity: 'free', contract: 'optional', body: '' },
      ],
      relationshipKinds: [],
      elements: [element('root', 'project', null), element('a', 'free', 'root'), element('b', 'free', 'a')],
    });
    expect(validateSemanticModel(open)).toEqual([]);
  });

  it('enforces relationship endpoints and kind constraints', () => {
    expect(codes(model({ relationships: [{ source: 'cap.a', kind: 'invokes', target: 'ghost' }] })))
      .toContain('INVALID_RELATION_ENDPOINT');
    expect(codes(model({ relationships: [{ source: 'domain.a', kind: 'invokes', target: 'cap.a' }] })))
      .toContain('INVALID_RELATION_ENDPOINT');
    const valid = model({
      elements: [...model().elements, element('cap.b', 'capability', 'domain.a', 1)],
      relationships: [{ source: 'cap.a', kind: 'invokes', target: 'cap.b' }],
    });
    expect(validateSemanticModel(valid)).toEqual([]);
  });

  it('deduplicates relationships by source, kind and target', () => {
    const duplicated = model({
      elements: [...model().elements, element('cap.b', 'capability', 'domain.a', 1)],
      relationships: [
        { source: 'cap.a', kind: 'invokes', target: 'cap.b' },
        { source: 'cap.a', kind: 'invokes', target: 'cap.b' },
      ],
    });
    expect(codes(duplicated)).toContain('DUPLICATE_RELATION');
  });

  it('requires a Requirement only when the Element Kind declares contract: required', () => {
    expect(codes(model({
      elements: [element('root', 'project', null), element('domain.a', 'domain', 'root'), element('cap.a', 'capability', 'domain.a', 0)],
    }))).toContain('MISSING_REQUIRED_CONTRACT');
    expect(validateSemanticModel(model({
      elements: [element('root', 'project', null), element('domain.a', 'domain', 'root')],
    }))).toEqual([]);
  });
});
