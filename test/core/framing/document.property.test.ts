import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  parseChangeStructuralDefinition,
  renderChangeStructuralDefinition,
} from '../../../src/core/framing/document.js';
import type {
  ChangeStructuralDefinitionDocument,
  ElementKindTarget,
  ElementTarget,
  RelationshipKindTarget,
  RelationshipTarget,
} from '../../../src/core/framing/types.js';

const identity = fc.stringMatching(/^[A-Za-z0-9._-]{1,16}$/);
const prose = fc.oneof(
  fc.string({ maxLength: 40 }),
  fc.constantFrom('', '第一行\n第二行', 'a: b', '- item', 'quoted "text"', 'line one\n\nline three'),
);
const optional = <T>(arbitrary: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> =>
  fc.option(arbitrary, { nil: undefined });
const defined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;

const elementKind: fc.Arbitrary<ElementKindTarget> = fc.record({
  identity,
  contract: fc.constantFrom<'required' | 'optional'>('required', 'optional'),
  root: optional(fc.boolean()),
  parents: optional(fc.array(identity, { maxLength: 3 })),
  children: optional(fc.array(identity, { maxLength: 3 })),
  body: prose,
}).map(defined);

const relationshipKind: fc.Arbitrary<RelationshipKindTarget> = fc.record({
  identity,
  sourceKinds: optional(fc.array(identity, { maxLength: 3 })),
  targetKinds: optional(fc.array(identity, { maxLength: 3 })),
  body: prose,
}).map(defined);

const element: fc.Arbitrary<ElementTarget> = fc.record({
  identity,
  kind: identity,
  parent: fc.option(identity, { nil: null }),
  title: prose,
  definition: prose.filter(value => value.trim().length > 0),
});

const relationship: fc.Arbitrary<RelationshipTarget> = fc.record({ source: identity, kind: identity, target: identity });

const document: fc.Arbitrary<ChangeStructuralDefinitionDocument> = fc.record({
  metadata: fc.record({
    entity: fc.constant<'change-structural-definition'>('change-structural-definition'),
    explorationId: fc.constant('20260729T120000Z-a1b2c3d4'),
    slug: fc.array(fc.stringMatching(/^[a-z0-9]{1,8}$/), { minLength: 1, maxLength: 3 })
      .map(segments => segments.join('-')),
    semanticModelFingerprint: fc.stringMatching(/^[a-f0-9]{64}$/),
  }),
  payload: fc.record({
    informativeHierarchyPreview: optional(prose),
    elementKinds: fc.uniqueArray(elementKind, { maxLength: 4, selector: item => item.identity }),
    relationshipKinds: fc.uniqueArray(relationshipKind, { maxLength: 4, selector: item => item.identity }),
    elements: fc.uniqueArray(element, { maxLength: 5, selector: item => item.identity }),
    relationships: fc.uniqueArray(relationship, {
      maxLength: 5,
      selector: item => `${item.source}\u0000${item.kind}\u0000${item.target}`,
    }),
  }).map(defined),
  baseline: fc.constant({ elementKinds: [], relationshipKinds: [], elements: [], relationships: [] }),
});

describe('Change Structural Definition document properties', () => {
  it('parse(render(document)) preserves the complete document', () => {
    fc.assert(fc.property(document, value => {
      expect(parseChangeStructuralDefinition(renderChangeStructuralDefinition(value))).toEqual(value);
    }), { numRuns: 150 });
  });

  it('rendering is deterministic', () => {
    fc.assert(fc.property(document, value => {
      expect(renderChangeStructuralDefinition(value)).toBe(renderChangeStructuralDefinition(value));
    }), { numRuns: 100 });
  });
});
