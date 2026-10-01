import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseDesignRecord, renderDesignRecord } from '../../../src/core/record/document.js';
import type { DesignRecordDocument } from '../../../src/core/record/types.js';

const identity = fc.stringMatching(/^[A-Za-z0-9._-]{1,16}$/);
const content = fc.oneof(fc.string({ minLength: 1, maxLength: 80 }).filter(value => value.trim().length > 0), fc.constantFrom('第一行\n第二行', 'a: b', '<!-- XIRANG:SEMANTIC_MODEL_BASELINE', '- item'));
const document: fc.Arbitrary<DesignRecordDocument> = fc.record({
  metadata: fc.record({
    entity: fc.constant('confirmed-design-record' as const), explorationId: fc.constant('20260729T120000Z-a1b2c3d4'),
    slug: fc.stringMatching(/^[a-z0-9]{1,8}$/), semanticModelFingerprint: fc.stringMatching(/^[a-f0-9]{64}$/),
  }),
  payload: fc.record({
    schemaVersion: fc.constant(3 as const), context: fc.constant('build' as const),
    relatedIdentities: fc.uniqueArray(identity, { maxLength: 3 }),
    entries: fc.uniqueArray(fc.record({ identity, nature: fc.constantFrom('normative' as const, 'informative' as const), content }), { minLength: 1, maxLength: 5, selector: item => item.identity }),
    structure: fc.record({
      elements: fc.uniqueArray(fc.record({
        identity, kind: identity, parent: fc.option(identity, { nil: null }), title: content, definition: content,
      }, { requiredKeys: ['identity'] }), { maxLength: 4, selector: item => item.identity }),
      relationships: fc.uniqueArray(fc.record({ source: identity, kind: identity, target: identity }), { maxLength: 3, selector: item => `${item.source}\0${item.kind}\0${item.target}` }),
      elementKinds: fc.constant([]),
      relationshipKinds: fc.constant([]),
    }),
  }),
  baseline: fc.constant({ modelState: 'absent' as const, objects: {} }),
});

describe('确认记录文档属性', () => {
  it('任意合法条目无损往返并确定性序列化', () => {
    fc.assert(fc.property(document, value => {
      const rendered = renderDesignRecord(value);
      expect(parseDesignRecord(rendered)).toEqual(value);
      expect(renderDesignRecord(parseDesignRecord(rendered))).toBe(rendered);
    }), { numRuns: 150 });
  });
});
