import { describe, expect, it } from 'vitest';
import { partitionFingerprints } from '../../src/core/view.js';
import { normalizeSemanticModel, semanticModelFingerprint, type ChangeDiff } from '../../src/core/semantic-diff.js';
import { createSemanticDiff } from '../../src/core/semantic-diff.js';
import { emptySemanticModel, type SemanticModel } from '../../src/core/model/types.js';

function base(): SemanticModel {
  return {
    ...emptySemanticModel(),
    elementKinds: [
      { identity: 'project', contract: 'required', root: true, children: ['perspective'], body: '' },
      { identity: 'perspective', contract: 'optional', parents: ['project'], body: 'Perspective kind.' },
    ],
    relationshipKinds: [{ identity: 'organizes', body: '' }],
    elements: [
      { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, requirements: [] },
      { declaration: { identity: 'perspective.browser', kind: 'perspective', parent: 'root', title: 'Browser', definition: 'Browser.' }, requirements: [{ name: 'Navigates', body: 'SHALL navigate.', scenarios: [] }] },
    ],
    relationships: [{ source: 'perspective.browser', kind: 'organizes', target: 'root' }],
    views: [{ identity: 'overview', include: '*' }],
  };
}

const WITH_PRESENTATION: SemanticModel = {
  ...base(),
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, children: ['perspective'], body: '' },
    {
      identity: 'perspective',
      contract: 'optional',
      parents: ['project'],
      nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
      body: 'Perspective kind.',
    },
  ],
};

describe('presentation-only fingerprint isolation', () => {
  it('does not change element contract or relationship fingerprints after presentation change', () => {
    const before = base();
    const after = WITH_PRESENTATION;

    const beforeFingerprints = partitionFingerprints(before);
    const afterFingerprints = partitionFingerprints(after);

    expect(afterFingerprints.metamodel).not.toBe(beforeFingerprints.metamodel);
    expect(afterFingerprints.elements).toBe(beforeFingerprints.elements);
    expect(afterFingerprints.relationships).toBe(beforeFingerprints.relationships);
    expect(afterFingerprints.views).toBe(beforeFingerprints.views);
  });

  it('treats a permuted Authored View exclude as the same semantics', () => {
    const left: SemanticModel = { ...base(), views: [{ identity: 'overview', include: ['root'], exclude: ['a', 'b'] }] };
    const right: SemanticModel = { ...base(), views: [{ identity: 'overview', include: ['root'], exclude: ['b', 'a'] }] };

    // `exclude` is an unordered set for semantic comparison, exactly like `include`.
    expect(semanticModelFingerprint(right)).toBe(semanticModelFingerprint(left));
    expect(normalizeSemanticModel(right).views).toEqual(normalizeSemanticModel(left).views);
  });

  it('separates a changed Authored View exclude from an unchanged one', () => {
    const before: SemanticModel = { ...base(), views: [{ identity: 'overview', include: ['root'], exclude: ['a'] }] };
    const after: SemanticModel = { ...base(), views: [{ identity: 'overview', include: ['root'], exclude: ['a', 'b'] }] };

    expect(partitionFingerprints(after).views).not.toBe(partitionFingerprints(before).views);
  });

  it('carries Relationship Kind presentation into the metamodel fingerprint only', () => {
    const before = base();
    const after: SemanticModel = {
      ...before,
      relationshipKinds: [{ identity: 'organizes', presentation: { color: 'blue', line: 'dotted' }, body: '' }],
    };

    const beforeFingerprints = partitionFingerprints(before);
    const afterFingerprints = partitionFingerprints(after);

    expect(afterFingerprints.metamodel).not.toBe(beforeFingerprints.metamodel);
    expect(afterFingerprints.relationships).toBe(beforeFingerprints.relationships);
    expect(afterFingerprints.elements).toBe(beforeFingerprints.elements);
  });

  it('reports presentation change as an element-kind MODIFIED diff', () => {
    const diff = createSemanticDiff(base(), WITH_PRESENTATION, {
      change: 'presentation-only',
      valid: true,
      formalFingerprint: 'f'.repeat(64),
      changeFingerprint: semanticModelFingerprint(WITH_PRESENTATION),
      diagnostics: [],
    }) as ChangeDiff;

    const kind = diff.entries.find(entry => entry.kind === 'element-kind' && entry.identity === 'perspective');
    expect(kind).toBeDefined();
    expect(kind!.operation).toBe('MODIFIED');
    expect(kind!.before).not.toHaveProperty('nodePresentation');
    expect(kind!.after).toMatchObject({ nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' } });
  });
});
