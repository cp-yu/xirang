import { describe, expect, it } from 'vitest';
import {
  FramingDocumentError,
  parseChangeStructuralDefinition,
  renderChangeStructuralDefinition,
} from '../../../src/core/framing/document.js';
import type { ChangeStructuralDefinitionDocument } from '../../../src/core/framing/types.js';

const document: ChangeStructuralDefinitionDocument = {
  metadata: {
    entity: 'change-structural-definition',
    explorationId: '20260729T120000Z-a1b2c3d4',
    slug: 'definition-first',
    semanticModelFingerprint: 'f'.repeat(64),
  },
  payload: {
    informativeHierarchyPreview: 'project.root\n  explore',
    elementKinds: [
      { identity: 'stage', contract: 'optional', parents: [], children: ['capability'], body: '第一行\n第二行' },
    ],
    relationshipKinds: [
      { identity: 'guides', sourceKinds: ['stage'], targetKinds: [], body: 'Guidance relation.' },
    ],
    elements: [
      {
        identity: 'definition-framing',
        kind: 'stage',
        parent: 'explore',
        title: 'Definition Framing',
        definition: '确认结构定义。\n\n保留完整目标。',
      },
    ],
    relationships: [
      { source: 'definition-framing', kind: 'guides', target: 'design-exploration' },
    ],
  },
  baseline: {
    elementKinds: [],
    relationshipKinds: [],
    elements: [],
    relationships: [],
  },
};

describe('Change Structural Definition document', () => {
  it('round-trips all four structural target types and managed metadata', () => {
    const rendered = renderChangeStructuralDefinition(document);
    expect(rendered).toContain('entity: change-structural-definition');
    expect(rendered).toContain('<!-- XIRANG:SEMANTIC_MODEL_BASELINE');
    expect(parseChangeStructuralDefinition(rendered)).toEqual(document);
  });

  it('preserves payload ordering and absent versus empty constraints', () => {
    const input: ChangeStructuralDefinitionDocument = {
      ...document,
      payload: {
        elementKinds: [
          { identity: 'open', contract: 'required', body: '' },
          { identity: 'closed', contract: 'optional', parents: [], children: [], body: '' },
        ],
        relationshipKinds: [
          { identity: 'open-rel', body: '' },
          { identity: 'closed-rel', sourceKinds: [], targetKinds: [], body: '' },
        ],
        elements: [
          { identity: 'b', kind: 'open', parent: null, title: 'B', definition: 'B.' },
          { identity: 'a', kind: 'open', parent: null, title: 'A', definition: 'A.' },
        ],
        relationships: [],
      },
    };

    const parsed = parseChangeStructuralDefinition(renderChangeStructuralDefinition(input));
    expect(parsed.payload).toEqual(input.payload);
    expect('parents' in parsed.payload.elementKinds[0]).toBe(false);
    expect(parsed.payload.elementKinds[1].parents).toEqual([]);
    expect(parsed.payload.elements.map(item => item.identity)).toEqual(['b', 'a']);
  });

  it.each(['ADDED', 'MODIFIED'] as const)('rejects explicit %s operations', operation => {
    const rendered = renderChangeStructuralDefinition(document).replace(
      '  - identity: definition-framing',
      `  - operation: ${operation}\n    identity: definition-framing`,
    );
    expect(() => parseChangeStructuralDefinition(rendered)).toThrowError(
      expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_TARGET_OPERATION' }),
    );
  });

  it('rejects unknown fields, invalid managed metadata, and corrupted baseline entries', () => {
    const rendered = renderChangeStructuralDefinition(document);
    expect(() => parseChangeStructuralDefinition(rendered.replace(
      '  - identity: definition-framing\n',
      '  - identity: definition-framing\n    unknown: discarded\n',
    ))).toThrowError(expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_PAYLOAD' }));
    expect(() => parseChangeStructuralDefinition(rendered.replace(
      'slug: definition-first',
      'slug: Not Valid',
    ))).toThrowError(expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_METADATA' }));
    expect(() => parseChangeStructuralDefinition(rendered.replace(
      'explorationId: 20260729T120000Z-a1b2c3d4',
      'explorationId: ../escape',
    ))).toThrowError(expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_METADATA' }));

    expect(() => parseChangeStructuralDefinition(rendered.replace(
      '  - identity: definition-framing\n',
      '  - identity: ../definition-framing\n',
    ))).toThrowError(expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_PAYLOAD' }));

    const corruptions: ChangeStructuralDefinitionDocument[] = [];
    const missingValue = structuredClone(document);
    missingValue.baseline.elements = [{ identity: 'definition-framing', exists: true }] as typeof missingValue.baseline.elements;
    corruptions.push(missingValue);
    const invalidAbsentIdentity = structuredClone(document);
    invalidAbsentIdentity.baseline.elements = [{ identity: '../escape', exists: false }];
    corruptions.push(invalidAbsentIdentity);
    const mismatchedValue = structuredClone(document);
    mismatchedValue.baseline.elements = [{
      identity: 'definition-framing',
      exists: true,
      value: { ...document.payload.elements[0], identity: 'other' },
    }];
    corruptions.push(mismatchedValue);
    for (const corrupted of corruptions) {
      expect(() => renderChangeStructuralDefinition(corrupted)).toThrowError(
        expect.objectContaining<Partial<FramingDocumentError>>({ code: 'INVALID_BASELINE' }),
      );
    }
  });

  it('preserves nodePresentation in framing payload', () => {
    const input: ChangeStructuralDefinitionDocument = {
      ...document,
      payload: {
        ...document.payload,
        elementKinds: [{
          identity: 'perspective',
          contract: 'optional',
          nodePresentation: { shape: 'document', color: 'indigo', border: 'solid' },
          body: 'Perspective kind.',
        }],
      },
    };
    expect(parseChangeStructuralDefinition(renderChangeStructuralDefinition(input)).payload.elementKinds[0])
      .toEqual(input.payload.elementKinds[0]);
  });

  it('accepts framing record without nodePresentation', () => {
    expect(parseChangeStructuralDefinition(renderChangeStructuralDefinition(document)).payload.elementKinds[0])
      .not.toHaveProperty('nodePresentation');
  });

  it('accepts minimal REMOVED entries and rejects duplicate identities or triples', () => {
    const removed: ChangeStructuralDefinitionDocument = {
      ...document,
      payload: {
        elementKinds: [{ operation: 'REMOVED', identity: 'old-kind' }],
        relationshipKinds: [{ operation: 'REMOVED', identity: 'old-relation' }],
        elements: [{ operation: 'REMOVED', identity: 'old-element' }],
        relationships: [{ operation: 'REMOVED', source: 'a', kind: 'uses', target: 'b' }],
      },
    };
    expect(parseChangeStructuralDefinition(renderChangeStructuralDefinition(removed)).payload).toEqual(removed.payload);

    const duplicate = structuredClone(document);
    duplicate.payload.elements.push(structuredClone(duplicate.payload.elements[0]));
    expect(() => renderChangeStructuralDefinition(duplicate)).toThrowError(
      expect.objectContaining<Partial<FramingDocumentError>>({ code: 'DUPLICATE_TARGET' }),
    );

    const duplicateTriple = structuredClone(document);
    duplicateTriple.payload.relationships.push(structuredClone(duplicateTriple.payload.relationships[0]));
    expect(() => renderChangeStructuralDefinition(duplicateTriple)).toThrowError(
      expect.objectContaining<Partial<FramingDocumentError>>({ code: 'DUPLICATE_TARGET' }),
    );
  });
});
