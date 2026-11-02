import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { captureRelevantBaseline } from '../../../src/core/record/baseline.js';
import type { DesignRecordPayload } from '../../../src/core/record/types.js';
import type { SemanticModel } from '../../../src/core/model/types.js';

const payload: DesignRecordPayload = {
  schemaVersion: 4, context: 'change', relatedIdentities: ['leaf'],
  entries: [{ identity: 'limit', nature: 'normative', decision: 'accepted' as const, content: '必须保留叶节点确认。' }],
  structure: { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] },
};

const base: SemanticModel = {
  elementKinds: [
    { identity: 'project', contract: 'optional', root: true, body: '' },
    { identity: 'node', contract: 'optional', parents: ['project'], body: '' },
  ],
  relationshipKinds: [],
  elements: [
    { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, sections: [] },
    { declaration: { identity: 'leaf', kind: 'node', parent: 'root', title: 'Leaf', definition: 'Leaf.' }, sections: [] },
  ],
  relationships: [],
  views: [],
};

describe('relevant baseline properties', () => {
  it('is invariant to source collection ordering', () => {
    fc.assert(fc.property(fc.boolean(), fc.boolean(), (reverseKinds, reverseElements) => {
      const model: SemanticModel = {
        ...base,
        elementKinds: reverseKinds ? [...base.elementKinds].reverse() : [...base.elementKinds],
        elements: reverseElements ? [...base.elements].reverse() : [...base.elements],
      };
      expect(captureRelevantBaseline(model, payload)).toEqual(captureRelevantBaseline(base, payload));
    }), { numRuns: 50 });
  });
});
