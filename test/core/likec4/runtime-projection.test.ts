import { describe, expect, it } from 'vitest';
import { resolveViewSelection } from '../../../src/core/likec4/runtime-projection.js';
import { emptySemanticModel, type AuthoredView, type SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null, kind = 'capability'): SemanticModel['elements'][number] {
  return { declaration: { identity, kind, parent, title: identity, definition: `${identity} definition.` }, requirements: [] };
}

const model: SemanticModel = {
  ...emptySemanticModel(),
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, body: '' },
    { identity: 'domain', contract: 'required', body: '' },
    { identity: 'capability', contract: 'required', body: '' },
  ],
  elements: [
    element('root', null, 'project'),
    element('domain-a', 'root', 'domain'),
    element('cap-a1', 'domain-a'),
    element('cap-a2', 'domain-a'),
    element('domain-b', 'root', 'domain'),
    element('cap-b1', 'domain-b'),
  ],
};

function authored(view: Partial<AuthoredView> & { include: AuthoredView['include'] }): AuthoredView {
  return { identity: 'view', ...view };
}

describe('resolveViewSelection Model Selection', () => {
  it('selects the whole model and keeps the real Project Root', () => {
    const resolved = resolveViewSelection(null, model);

    expect(resolved.selection).toEqual(['cap-a1', 'cap-a2', 'cap-b1', 'domain-a', 'domain-b', 'root']);
    expect(resolved.roots).toEqual(['root']);
    expect(resolved.virtualRoot).toBe(false);
  });

  it('never requests a virtual root even when the model has several top-level Elements', () => {
    const forest: SemanticModel = {
      ...emptySemanticModel(),
      elements: [element('a', null, 'project'), element('b', null, 'project')],
    };

    const resolved = resolveViewSelection(null, forest);

    expect(resolved.roots).toEqual(['a', 'b']);
    expect(resolved.virtualRoot).toBe(false);
  });
});

describe('resolveViewSelection Authored Selection', () => {
  it('forms the descendants closure of every included Element', () => {
    const resolved = resolveViewSelection(authored({ include: ['domain-a'] }), model);

    expect(resolved.selection).toEqual(['cap-a1', 'cap-a2', 'domain-a']);
    expect(resolved.roots).toEqual(['domain-a']);
  });

  it('expands a wildcard include to the whole model', () => {
    expect(resolveViewSelection(authored({ include: '*' }), model).selection)
      .toEqual(resolveViewSelection(null, model).selection);
  });

  it('prunes the whole excluded subtree ahead of include', () => {
    const resolved = resolveViewSelection(authored({ include: ['root'], exclude: ['domain-b'] }), model);

    expect(resolved.selection).toEqual(['cap-a1', 'cap-a2', 'domain-a', 'root']);
    expect(resolved.selection).not.toContain('domain-b');
    expect(resolved.selection).not.toContain('cap-b1');
  });

  it('lets exclude win over an explicitly included descendant', () => {
    const resolved = resolveViewSelection(authored({ include: ['root', 'cap-b1'], exclude: ['domain-b'] }), model);

    expect(resolved.selection).not.toContain('cap-b1');
  });

  it('treats a missing or empty exclude as no exclusion', () => {
    const full = resolveViewSelection(authored({ include: ['root'] }), model).selection;

    expect(resolveViewSelection(authored({ include: ['root'], exclude: [] }), model).selection).toEqual(full);
  });

  it('ignores an unknown identity instead of inventing an Element', () => {
    const resolved = resolveViewSelection(
      authored({ include: ['domain-a', 'missing'], exclude: ['also-missing'] }),
      model,
    );

    expect(resolved.selection).toEqual(['cap-a1', 'cap-a2', 'domain-a']);
  });

  it('never pulls an out-of-selection neighbour into the boundary', () => {
    const related: SemanticModel = {
      ...model,
      relationshipKinds: [{ identity: 'invokes', body: '' }],
      relationships: [{ source: 'cap-a1', kind: 'invokes', target: 'cap-b1' }],
    };

    expect(resolveViewSelection(authored({ include: ['domain-a'] }), related).selection)
      .not.toContain('cap-b1');
  });
});

describe('resolveViewSelection roots and virtual root', () => {
  it('requests a virtual root for mutually independent top-level selections', () => {
    const resolved = resolveViewSelection(authored({ include: ['domain-a', 'domain-b'] }), model);

    expect(resolved.roots).toEqual(['domain-a', 'domain-b']);
    expect(resolved.virtualRoot).toBe(true);
  });

  it('keeps a single real root when the selection has one', () => {
    const resolved = resolveViewSelection(authored({ include: ['root'] }), model);

    expect(resolved.roots).toEqual(['root']);
    expect(resolved.virtualRoot).toBe(false);
  });

  it('treats a nested include as one root rather than two', () => {
    const resolved = resolveViewSelection(authored({ include: ['domain-a', 'cap-a1'] }), model);

    expect(resolved.roots).toEqual(['domain-a']);
    expect(resolved.virtualRoot).toBe(false);
  });

  it('keeps the virtual root out of the selection so it never becomes an Element', () => {
    const resolved = resolveViewSelection(authored({ include: ['domain-a', 'domain-b'] }), model);
    const known = new Set(model.elements.map(item => item.declaration.identity));

    expect(resolved.virtualRoot).toBe(true);
    expect(resolved.selection.every(identity => known.has(identity))).toBe(true);
  });
});

describe('resolveViewSelection determinism', () => {
  it('is insensitive to include order', () => {
    expect(resolveViewSelection(authored({ include: ['domain-b', 'domain-a'] }), model))
      .toEqual(resolveViewSelection(authored({ include: ['domain-a', 'domain-b'] }), model));
  });

  it('is insensitive to exclude order', () => {
    expect(resolveViewSelection(authored({ include: ['root'], exclude: ['cap-a2', 'domain-b'] }), model))
      .toEqual(resolveViewSelection(authored({ include: ['root'], exclude: ['domain-b', 'cap-a2'] }), model));
  });
});

describe('root package boundary', () => {
  it('never imports the LikeC4 compute or layout engines', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../../../src/core/likec4/runtime-projection.ts', import.meta.url), 'utf8');

    // Lowering stays a pure Xirang concern; compute-view and Graphviz run in the view server.
    for (const forbidden of ['@likec4/core', '@likec4/layouts', '@likec4/language-services', 'graphviz']) {
      expect(source).not.toContain(forbidden);
    }
  });
});
