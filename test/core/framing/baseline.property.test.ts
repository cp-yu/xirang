import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { captureRelevantBaseline } from '../../../src/core/framing/baseline.js';
import type { ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';
import type { SemanticModel } from '../../../src/core/model/types.js';

const payload: ChangeStructuralDefinitionPayload = {
  elementKinds: [],
  relationshipKinds: [],
  elements: [{ identity: 'leaf', kind: 'node', parent: 'root', title: 'Leaf', definition: 'Leaf.' }],
  relationships: [],
};

const base: SemanticModel = {
  elementKinds: [
    { identity: 'project', contract: 'optional', root: true, body: '' },
    { identity: 'node', contract: 'optional', parents: ['project'], body: '' },
  ],
  relationshipKinds: [],
  elements: [
    { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, requirements: [] },
    { declaration: { identity: 'leaf', kind: 'node', parent: 'root', title: 'Leaf', definition: 'Leaf.' }, requirements: [] },
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
