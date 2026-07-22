import { describe, expect, it } from 'vitest';
import {
  ACTIVE_RELATION_TYPES,
  ActiveRelationDefinitionRegistry,
  ActiveRelationTypeSchema,
} from '../../../src/core/relations/active-registry.js';
import {
  RELATION_TYPES,
  RelationDefinitionRegistry,
  RelationTypeSchema,
} from '../../../src/core/relations/registry.js';

const EXPECTED_TYPES = [
  'belongs_to',
  'invokes',
  'consumes',
  'precedes',
  'constrains',
  'validates',
] as const;

describe('ActiveRelationDefinitionRegistry', () => {
  it('defines exactly the six v1 active relation types', () => {
    expect(ACTIVE_RELATION_TYPES).toEqual([
      'invokes',
      'produces',
      'consumes',
      'precedes',
      'constrains',
      'validates',
    ]);
    expect(ActiveRelationDefinitionRegistry.map(({ type }) => type)).toEqual(ACTIVE_RELATION_TYPES);
    expect(ActiveRelationDefinitionRegistry.map(({ type }) => type)).not.toEqual(expect.arrayContaining([
      'belongs_to', 'refines', 'abstracts',
    ]));
  });

  it.each(ActiveRelationDefinitionRegistry)('uses generic element endpoints for $type', (definition) => {
    expect(definition.fromKinds).toEqual(['generic']);
    expect(definition.toKinds).toEqual(['element']);
    expect(definition.example.type).toBe(definition.type);
    expect(ActiveRelationTypeSchema.parse(definition.type)).toBe(definition.type);
  });

  it('provides complete authoring metadata for each active relation', () => {
    for (const definition of ActiveRelationDefinitionRegistry) {
      expect(definition.direction).toBeTruthy();
      expect(definition.meaning).toBeTruthy();
      expect(definition.useWhen).toBeTruthy();
      expect(definition.doNotUseWhen).toBeTruthy();
      expect(definition.propagationHint).toBeTruthy();
    }
  });
});

describe('RelationDefinitionRegistry', () => {
  it('defines exactly the six canonical relation types', () => {
    expect(RELATION_TYPES).toEqual(EXPECTED_TYPES);
    expect(RelationDefinitionRegistry.map(({ type }) => type)).toEqual(EXPECTED_TYPES);
  });

  it.each(RelationDefinitionRegistry)('projects complete authoring metadata for $type', (definition) => {
    expect(definition.direction).toBeTruthy();
    expect(definition.meaning).toBeTruthy();
    expect(definition.useWhen).toBeTruthy();
    expect(definition.doNotUseWhen).toBeTruthy();
    expect(definition.propagationHint).toBeTruthy();
    expect(definition.example.type).toBe(definition.type);
    expect(RelationTypeSchema.parse(definition.type)).toBe(definition.type);
  });

  it('derives endpoint and note contracts from the registry', () => {
    const ownership = RelationDefinitionRegistry.find(({ type }) => type === 'belongs_to');
    expect(ownership).toMatchObject({
      fromKinds: ['capability'],
      toKinds: ['domain'],
      notePolicy: { allowed: false, maxLength: 0 },
    });

    for (const definition of RelationDefinitionRegistry.filter(({ type }) => type !== 'belongs_to')) {
      expect(definition.fromKinds).toEqual(['capability']);
      expect(definition.toKinds).toEqual(['capability']);
      expect(definition.notePolicy).toMatchObject({ allowed: true, maxLength: 200 });
    }
  });

  it.each(['contains', 'depends_on', 'relates_to', 'implemented_by', 'verified_by'])(
    'rejects legacy token %s',
    (type) => {
      expect(RelationTypeSchema.safeParse(type).success).toBe(false);
    },
  );
});
