import { describe, expect, it } from 'vitest';
import { partitionFingerprints } from '../../src/core/view.js';
import { semanticModelFingerprint, type ChangeDiff } from '../../src/core/semantic-diff.js';
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
