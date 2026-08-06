import { describe, expect, it } from 'vitest';
import { computeProjectionKey, createRuntimeProjection } from '../../../src/core/likec4/runtime-projection.js';
import { emptySemanticModel, type SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null, kind = 'capability', title = identity): SemanticModel['elements'][number] {
  return { declaration: { identity, kind, parent, title, definition: `${identity} definition.` }, requirements: [] };
}

describe('createRuntimeProjection', () => {
  const model: SemanticModel = {
    ...emptySemanticModel(),
    elementKinds: [
      { identity: 'project', contract: 'required', root: true, children: ['domain'], body: '' },
      { identity: 'domain', contract: 'required', parents: ['project'], children: ['capability'], body: '' },
      { identity: 'capability', contract: 'required', parents: ['domain'], body: '' },
    ],
    relationshipKinds: [
      { identity: 'invokes', body: '' },
    ],
    elements: [
      element('root', null, 'project'),
      element('domain-a', 'root', 'domain'),
      element('cap-a1', 'domain-a', 'capability'),
      element('cap-a2', 'domain-a', 'capability'),
      element('domain-b', 'root', 'domain'),
      element('cap-b1', 'domain-b', 'capability'),
    ],
    relationships: [
      { source: 'cap-a1', kind: 'invokes', target: 'cap-b1' },
    ],
  };

  it('generates Model View projection including all elements', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: { type: 'model' },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });
    
    expect(projection.likec4Model).toBeDefined();
    expect(projection.likec4View).toBeDefined();
    expect(projection.likec4View.include).toHaveLength(6);
  });

  it('generates Authored View projection with include list', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: {
        type: 'authored',
        view: { identity: 'partial', include: ['domain-a'], title: 'Domain A' },
      },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });

    const included = projection.likec4View.include;
    expect(included).toContain('domain-a');
    expect(included).toContain('cap-a1');
    expect(included).toContain('cap-a2');
    expect(included).toHaveLength(3);
  });

  it('applies exclude to prune entire subtree', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: {
        type: 'authored',
        view: { identity: 'excluded', include: ['root'], exclude: ['domain-b'] },
      },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });

    const included = projection.likec4View.include;
    expect(included).toContain('root');
    expect(included).toContain('domain-a');
    expect(included).not.toContain('domain-b');
    expect(included).not.toContain('cap-b1');
  });

  it('uses virtual root for multi-root Authored View', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: {
        type: 'authored',
        view: { identity: 'multi', include: ['domain-a', 'domain-b'] },
      },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });

    expect(projection.virtualRoot).toBe(true);
  });

  it('uses real root for single-root Authored View', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: {
        type: 'authored',
        view: { identity: 'single', include: ['root'] },
      },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });

    expect(projection.virtualRoot).toBe(false);
  });

  it('filters relationships to visible endpoints only', () => {
    const projection = createRuntimeProjection({
      model,
      viewSelection: {
        type: 'authored',
        view: { identity: 'domain-a-only', include: ['domain-a'] },
      },
      changeSelection: null,
      presentationMode: 'complete',
      focus: null,
      expanded: [],
    });

    expect(projection.likec4Model.relationships).toHaveLength(0);
  });
});

describe('computeProjectionKey', () => {
  it('produces same key for same inputs', () => {
    const params = {
      modelFingerprint: 'abc123',
      viewSelection: { type: 'model' as const },
      changeSelection: null,
      presentationMode: 'complete' as const,
      focus: null,
      expanded: [],
    };

    const key1 = computeProjectionKey(params);
    const key2 = computeProjectionKey(params);
    expect(key1).toBe(key2);
  });

  it('produces different keys for different view selections', () => {
    const base = {
      modelFingerprint: 'abc123',
      changeSelection: null,
      presentationMode: 'complete' as const,
      focus: null,
      expanded: [],
    };

    const modelKey = computeProjectionKey({ ...base, viewSelection: { type: 'model' } });
    const authoredKey = computeProjectionKey({
      ...base,
      viewSelection: { type: 'authored', view: { identity: 'partial', include: ['a'] } },
    });

    expect(modelKey).not.toBe(authoredKey);
  });

  it('sorts expanded set for deterministic key', () => {
    const base = {
      modelFingerprint: 'abc123',
      viewSelection: { type: 'model' as const },
      changeSelection: null,
      presentationMode: 'complete' as const,
      focus: null,
    };

    const key1 = computeProjectionKey({ ...base, expanded: ['a', 'b', 'c'] });
    const key2 = computeProjectionKey({ ...base, expanded: ['c', 'b', 'a'] });
    expect(key1).toBe(key2);
  });
});
