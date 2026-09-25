import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseChangeStructuralDefinition, renderChangeStructuralDefinition } from '../../../src/core/framing/document.js';
import type { ChangeStructuralDefinitionDocument } from '../../../src/core/framing/types.js';

const identity = fc.stringMatching(/^[A-Za-z0-9._-]{1,16}$/);
const content = fc.oneof(fc.string({ minLength: 1, maxLength: 80 }).filter(value => value.trim().length > 0), fc.constantFrom('第一行\n第二行', 'a: b', '<!-- XIRANG:SEMANTIC_MODEL_BASELINE', '- item'));
const document: fc.Arbitrary<ChangeStructuralDefinitionDocument> = fc.record({
  metadata: fc.record({
    entity: fc.constant('confirmed-design-record' as const), explorationId: fc.constant('20260729T120000Z-a1b2c3d4'),
    slug: fc.stringMatching(/^[a-z0-9]{1,8}$/), semanticModelFingerprint: fc.stringMatching(/^[a-f0-9]{64}$/),
  }),
  payload: fc.record({
    schemaVersion: fc.constant(2 as const), context: fc.constant('build' as const),
    relatedIdentities: fc.uniqueArray(identity, { maxLength: 3 }),
    entries: fc.uniqueArray(fc.record({ identity, nature: fc.constantFrom('normative' as const, 'informative' as const), content }), { minLength: 1, maxLength: 5, selector: item => item.identity }),
  }),
  baseline: fc.constant({ modelState: 'absent' as const, objects: {} }),
});

describe('确认记录文档属性', () => {
  it('任意合法条目无损往返并确定性序列化', () => {
    fc.assert(fc.property(document, value => {
      const rendered = renderChangeStructuralDefinition(value);
      expect(parseChangeStructuralDefinition(rendered)).toEqual(value);
      expect(renderChangeStructuralDefinition(parseChangeStructuralDefinition(rendered))).toBe(rendered);
    }), { numRuns: 150 });
  });
});
