import { describe, expect, it } from 'vitest';
import { validateRelationGraph } from '../../../src/core/relations/validator.js';
import type { ProjectXirangBundle } from '../../../src/utils/xirang-utils.js';

const bundle = (relations: ProjectXirangBundle['relations'], capabilityIds = ['cap.a', 'cap.b']): ProjectXirangBundle => ({
  schema_version: 2,
  project: { id: 'test', name: 'test' },
  domains: [{ id: 'dom.core', type: 'domain' }],
  capabilities: capabilityIds.map((id) => ({ id, type: 'capability' as const })),
  relations,
});

const ownership = (capabilityId: string) => ({
  from: capabilityId,
  type: 'belongs_to' as const,
  to: 'dom.core',
});

describe('validateRelationGraph', () => {
  it('accepts complete ownership and distinct mechanisms for one endpoint pair', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.b'),
      { from: 'cap.a', type: 'invokes', to: 'cap.b' },
      { from: 'cap.a', type: 'consumes', to: 'cap.b' },
    ]));

    expect(result).toEqual({ valid: true, errors: [], diagnostics: [] });
  });

  it('rejects missing and duplicate ownership', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.a'),
    ]));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("capability 'cap.a' has 2 belongs_to relations"),
      expect.stringContaining("capability 'cap.b' has 0 belongs_to relations"),
      expect.stringContaining('Duplicate relation'),
    ]));
  });

  it('rejects endpoint-kind violations and dangling endpoints', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.b'),
      { from: 'dom.core', type: 'belongs_to', to: 'cap.a' },
      { from: 'cap.a', type: 'invokes', to: 'dom.core' },
      { from: 'cap.missing', type: 'consumes', to: 'cap.a' },
    ] as ProjectXirangBundle['relations']));

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('belongs_to');
    expect(result.errors.join('\n')).toContain('capability -> domain');
    expect(result.errors.join('\n')).toContain('invokes');
    expect(result.errors.join('\n')).toContain("non-existent 'from' node: cap.missing");
  });

  it('rejects forbidden and oversized notes through the relation schema', async () => {
    const { XirangRelationSchema } = await import('../../../src/utils/xirang-utils.js');
    expect(XirangRelationSchema.safeParse({ ...ownership('cap.a'), note: 'not allowed' }).success).toBe(false);
    expect(XirangRelationSchema.safeParse({
      from: 'cap.a',
      type: 'invokes',
      to: 'cap.b',
      note: 'x'.repeat(201),
    }).success).toBe(false);
  });

  it('rejects self-loops and precedes cycles with their paths', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.b'),
      { from: 'cap.a', type: 'invokes', to: 'cap.a' },
      { from: 'cap.a', type: 'precedes', to: 'cap.b' },
      { from: 'cap.b', type: 'precedes', to: 'cap.a' },
    ]));

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('Self-loop');
    expect(result.errors.join('\n')).toContain('precedes cycle: cap.a -> cap.b -> cap.a');
  });

  it('reports other relation cycles as non-blocking diagnostics', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.b'),
      { from: 'cap.a', type: 'invokes', to: 'cap.b' },
      { from: 'cap.b', type: 'invokes', to: 'cap.a' },
    ]));

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toContain('invokes cycle: cap.a -> cap.b -> cap.a');
  });

  it('preserves exact diagnostic order for mixed invalid raw edges', () => {
    const result = validateRelationGraph(bundle([
      ownership('cap.a'),
      ownership('cap.a'),
      { from: 'cap.missing', type: 'invokes', to: 'cap.a' },
      { from: 'cap.a', type: 'invokes', to: 'cap.a' },
      { from: 'cap.a', type: 'precedes', to: 'cap.b' },
      { from: 'cap.b', type: 'precedes', to: 'cap.a' },
    ], ['cap.a', 'cap.b', 'cap.c']));

    expect(result).toEqual({
      valid: false,
      errors: [
        'Duplicate relation: cap.a -[belongs_to]-> dom.core',
        "Relation references non-existent 'from' node: cap.missing",
        'Self-loop relation: cap.a -[invokes]-> cap.a',
        "capability 'cap.a' has 2 belongs_to relations; expected exactly 1",
        "capability 'cap.b' has 0 belongs_to relations; expected exactly 1",
        "capability 'cap.c' has 0 belongs_to relations; expected exactly 1",
        'precedes cycle: cap.a -> cap.b -> cap.a',
      ],
      diagnostics: ['invokes cycle: cap.a -> cap.a'],
    });
  });

  it('builds cycle adjacency with a linear number of relation type reads', () => {
    let typeReads = 0;
    const relations = Array.from({ length: 200 }, (_, index) => {
      const relation = { from: `cap.c${index}`, to: `cap.c${index + 1}` };
      Object.defineProperty(relation, 'type', {
        enumerable: true,
        get: () => {
          typeReads += 1;
          return 'invokes';
        },
      });
      return relation as typeof relation & { type: 'invokes' };
    });
    const capabilityIds = Array.from({ length: 201 }, (_, index) => `cap.c${index}`);
    relations.push(...capabilityIds.map(ownership));

    validateRelationGraph(bundle(relations, capabilityIds));

    expect(typeReads).toBeLessThanOrEqual(1000);
  });
});
