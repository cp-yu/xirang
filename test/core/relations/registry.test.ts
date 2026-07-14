import { describe, expect, it } from 'vitest';
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
