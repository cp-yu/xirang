import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compareUtf8Bytes } from '../../../src/core/candidate/canonical.js';
import { parseSemanticModelFiles } from '../../../src/core/model/parser.js';
import { compareRelationships, serializeSemanticModel } from '../../../src/core/model/serializer.js';
import type {
  AuthoredView,
  ElementKind,
  ModelElement,
  Relationship,
  RelationshipKind,
  Requirement,
  Scenario,
  SemanticModel,
} from '../../../src/core/model/types.js';

const identity = fc.stringMatching(/^[A-Za-z0-9._-]{1,12}$/);

/** Scalars exercised by the frontmatter renderer: quotes, escapes, YAML indicators, multi-line. */
const scalarText = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.constantFrom(
    '', ' padded ', '*', '- dash', 'a: b', 'a #b', 'true', 'null', '42', '1.5', '~', '[]', '{}',
    'he said "hi"', "it's", 'back\\slash', 'tab\there', 'line one\nline two\n\nline four', '你好',
  ),
);

/** Prose already in canonical form: no CR, no trailing blank space, no heading collisions. */
const prose = fc.oneof(
  fc.constant(''),
  fc.array(fc.stringMatching(/^[A-Za-z0-9 ."'\\*_-]{0,24}$/), { minLength: 1, maxLength: 4 })
    .map(lines => lines.join('\n').replace(/^\n+/, '').trimEnd()),
);

const blockName = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,20}$/).map(value => value.trim())
  .filter(value => value.length > 0);

const scenario: fc.Arbitrary<Scenario> = fc.record({ name: blockName, body: prose });

const requirement: fc.Arbitrary<Requirement> = fc.record({
  name: blockName,
  body: prose,
  scenarios: fc.array(scenario, { maxLength: 3 }),
});

function optional<T>(arbitrary: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> {
  return fc.option(arbitrary, { nil: undefined });
}

function withDefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

const definitionText = scalarText.filter(value => value.trim().length > 0);

const element: fc.Arbitrary<ModelElement> = fc.record({
  declaration: fc.record({
    identity,
    kind: scalarText,
    parent: fc.option(scalarText, { nil: null }),
    title: scalarText,
    definition: definitionText,
  }),
  requirements: fc.array(requirement, { maxLength: 3 }),
});

const elementKind: fc.Arbitrary<ElementKind> = fc.record({
  identity,
  contract: fc.constantFrom<'required' | 'optional'>('required', 'optional'),
  root: optional(fc.boolean()),
  parents: optional(fc.array(scalarText, { maxLength: 3 })),
  children: optional(fc.array(scalarText, { maxLength: 3 })),
  body: prose,
}).map(withDefined);

const relationshipKind: fc.Arbitrary<RelationshipKind> = fc.record({
  identity,
  sourceKinds: optional(fc.array(scalarText, { maxLength: 3 })),
  targetKinds: optional(fc.array(scalarText, { maxLength: 3 })),
  body: prose,
}).map(withDefined);

const view: fc.Arbitrary<AuthoredView> = fc.record({
  identity,
  include: fc.oneof(fc.constant<'*'>('*'), fc.array(scalarText, { maxLength: 3 })),
  of: optional(scalarText),
  title: optional(scalarText),
  autoLayout: optional(scalarText),
}).map(withDefined);

const endpoint = scalarText.filter(value => value !== '');

const relationship: fc.Arbitrary<Relationship> = fc.record({
  source: endpoint,
  kind: identity,
  target: endpoint,
});

const semanticModel: fc.Arbitrary<SemanticModel> = fc.record({
  elements: fc.uniqueArray(element, { maxLength: 4, selector: item => item.declaration.identity }),
  elementKinds: fc.uniqueArray(elementKind, { maxLength: 3, selector: item => item.identity }),
  relationshipKinds: fc.uniqueArray(relationshipKind, { maxLength: 3, selector: item => item.identity }),
  relationships: fc.uniqueArray(relationship, {
    maxLength: 5,
    selector: item => `${item.source}\u0000${item.kind}\u0000${item.target}`,
  }),
  views: fc.uniqueArray(view, { maxLength: 3, selector: item => item.identity }),
}).filter(model => {
  const kinds = [...model.elementKinds, ...model.relationshipKinds].map(item => item.identity);
  return new Set(kinds).size === kinds.length;
});

/** Serialization normalizes cross-unit ordering by unit path; the canonical image is what parsing returns. */
function canonicalize(model: SemanticModel): SemanticModel {
  const byUnitPath = <T extends { identity: string }>(items: T[]): T[] =>
    [...items].sort((left, right) => compareUtf8Bytes(`${left.identity}.md`, `${right.identity}.md`));
  const containers = [...new Set([
    ...model.relationshipKinds.map(item => item.identity),
    ...model.relationships.map(item => item.kind),
  ])].sort((left, right) => compareUtf8Bytes(`${left}.yaml`, `${right}.yaml`));
  return {
    elements: [...model.elements].sort((left, right) =>
      compareUtf8Bytes(`${left.declaration.identity}.md`, `${right.declaration.identity}.md`)),
    elementKinds: byUnitPath(model.elementKinds),
    relationshipKinds: byUnitPath(model.relationshipKinds),
    relationships: containers.flatMap(kind =>
      model.relationships.filter(item => item.kind === kind).sort(compareRelationships)),
    views: byUnitPath(model.views),
  };
}

function roundTrip(model: SemanticModel): SemanticModel {
  const files = [...serializeSemanticModel(model)].map(([key, value]) => [key, value.toString('utf8')] as const);
  const parsed = parseSemanticModelFiles(files);
  expect(parsed.diagnostics).toEqual([]);
  return parsed.model;
}

describe('serializer round-trip properties', () => {
  it('parse(serialize(ir)) equals the canonical image of ir', () => {
    fc.assert(fc.property(semanticModel, model => {
      expect(roundTrip(model)).toEqual(canonicalize(model));
    }), { numRuns: 200 });
  });

  it('serialization is deterministic', () => {
    fc.assert(fc.property(semanticModel, model => {
      expect([...serializeSemanticModel(model)]).toEqual([...serializeSemanticModel(model)]);
    }), { numRuns: 100 });
  });

  it('canonical models are fixed points of the round trip', () => {
    fc.assert(fc.property(semanticModel, model => {
      const canonical = canonicalize(model);
      expect(roundTrip(canonical)).toEqual(canonical);
    }), { numRuns: 100 });
  });

  it('covers empty collections', () => {
    const empty: SemanticModel = { elements: [], elementKinds: [], relationshipKinds: [], relationships: [], views: [] };
    expect(serializeSemanticModel(empty).size).toBe(0);
    expect(roundTrip(empty)).toEqual(empty);
    expect(roundTrip({
      ...empty,
      elements: [{
        declaration: { identity: 'a', kind: 'k', parent: null, title: '', definition: 'Element A.' },
        requirements: [],
      }],
      elementKinds: [{ identity: 'k', contract: 'optional', body: '' }],
      relationshipKinds: [{ identity: 'r', body: '' }],
    }).relationships).toEqual([]);
  });

  it('covers absent optional fields', () => {
    const model: SemanticModel = {
      elements: [],
      elementKinds: [{ identity: 'k', contract: 'required', body: '' }],
      relationshipKinds: [{ identity: 'r', body: '' }],
      relationships: [],
      views: [{ identity: 'v', include: [] }],
    };
    const result = roundTrip(model);
    expect(Object.keys(result.elementKinds[0]).sort()).toEqual(['body', 'contract', 'identity']);
    expect(Object.keys(result.relationshipKinds[0]).sort()).toEqual(['body', 'identity']);
    expect(Object.keys(result.views[0]).sort()).toEqual(['identity', 'include']);
  });

  it('covers escapes, quotes and multi-line prose in every body field', () => {
    const multiline = 'first line\n\n  indented "quoted" \\ line\n- dash';
    const model: SemanticModel = {
      elements: [{
        declaration: { identity: 'a', kind: 'k', parent: null, title: 'a: b', definition: 'one\ntwo' },
        requirements: [{
          name: 'Handles escapes',
          body: multiline,
          scenarios: [{ name: 'Quoted', body: multiline }],
        }],
      }],
      elementKinds: [{ identity: 'k', contract: 'required', body: multiline }],
      relationshipKinds: [{ identity: 'r', body: multiline }],
      relationships: [{ source: 'a', kind: 'r', target: 'a' }],
      views: [{ identity: 'v', include: '*', title: '*', autoLayout: '- TB' }],
    };
    expect(roundTrip(model)).toEqual(canonicalize(model));
  });
});
