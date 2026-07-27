import { describe, expect, it } from 'vitest';
import {
  ACTIVE_RELATION_TYPES,
  ActiveRelationDefinitionRegistry,
  ActiveRelationTypeSchema,
} from '../../../src/core/relations/active-registry.js';

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
