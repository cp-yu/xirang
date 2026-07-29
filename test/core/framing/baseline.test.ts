import { describe, expect, it } from 'vitest';
import { captureRelevantBaseline, classifyBaselineDrift } from '../../../src/core/framing/baseline.js';
import type { ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';
import type { SemanticModel } from '../../../src/core/model/types.js';

function model(): SemanticModel {
  return {
    elementKinds: [
      { identity: 'project', contract: 'optional', root: true, children: ['domain'], body: '' },
      { identity: 'domain', contract: 'optional', parents: ['project'], children: ['capability'], body: '' },
      { identity: 'capability', contract: 'required', parents: ['domain'], body: '' },
      { identity: 'unrelated', contract: 'optional', body: '' },
    ],
    relationshipKinds: [
      { identity: 'uses', sourceKinds: ['capability'], targetKinds: ['capability'], body: '' },
    ],
    elements: [
      { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, requirements: [] },
      { declaration: { identity: 'domain', kind: 'domain', parent: 'root', title: 'Domain', definition: 'Domain.' }, requirements: [] },
      { declaration: { identity: 'a', kind: 'capability', parent: 'domain', title: 'A', definition: 'A.' }, requirements: [] },
      { declaration: { identity: 'b', kind: 'capability', parent: 'domain', title: 'B', definition: 'B.' }, requirements: [] },
      { declaration: { identity: 'other', kind: 'unrelated', parent: 'root', title: 'Other', definition: 'Other.' }, requirements: [] },
    ],
    relationships: [{ source: 'a', kind: 'uses', target: 'b' }],
    views: [{ identity: 'overview', include: ['a'] }],
  };
}

const payload: ChangeStructuralDefinitionPayload = {
  elementKinds: [],
  relationshipKinds: [],
  elements: [{ identity: 'a', kind: 'capability', parent: 'domain', title: 'A2', definition: 'A changed.' }],
  relationships: [{ source: 'a', kind: 'uses', target: 'b' }],
};

describe('relevant Semantic Model baseline', () => {
  it('captures targets, endpoints, ancestors, used Kinds and constraints but excludes Contracts and Views', () => {
    const baseline = captureRelevantBaseline(model(), payload);
    expect(baseline.elements.map(item => item.identity)).toEqual(['a', 'b', 'domain', 'root']);
    expect(baseline.elementKinds.map(item => item.identity)).toEqual(['capability', 'domain', 'project']);
    expect(baseline.relationshipKinds.map(item => item.identity)).toEqual(['uses']);
    expect(baseline.relationships).toEqual([{
      source: 'a', kind: 'uses', target: 'b', exists: true,
      value: { source: 'a', kind: 'uses', target: 'b' },
    }]);
    expect(JSON.stringify(baseline)).not.toContain('requirements');
    expect(JSON.stringify(baseline)).not.toContain('overview');
  });

  it('captures a relationship-only multi-level Kind constraint closure once in deterministic order', () => {
    const current = model();
    current.elementKinds.push(
      { identity: 'top', contract: 'optional', children: ['middle'], body: '' },
      { identity: 'middle', contract: 'optional', parents: ['top'], children: ['leaf'], body: '' },
      { identity: 'leaf', contract: 'optional', parents: ['middle'], body: '' },
    );
    current.relationshipKinds.push({ identity: 'bridges', sourceKinds: ['leaf'], targetKinds: ['leaf'], body: '' });
    const baseline = captureRelevantBaseline(current, {
      elementKinds: [], relationshipKinds: [], elements: [],
      relationships: [{ source: 'a', kind: 'bridges', target: 'b' }],
    });
    expect(baseline.elementKinds.map(item => item.identity)).toEqual([
      'capability', 'domain', 'leaf', 'middle', 'project', 'top',
    ]);
    expect(new Set(baseline.elementKinds.map(item => item.identity)).size).toBe(baseline.elementKinds.length);
  });

  it('records explicit absence for new targets', () => {
    const baseline = captureRelevantBaseline(model(), {
      ...payload,
      elements: [{ identity: 'new', kind: 'capability', parent: 'domain', title: 'New', definition: 'New.' }],
    });
    expect(baseline.elements).toContainEqual({ identity: 'new', exists: false });
  });

  it('treats Kind constraint reordering as unrelated drift', () => {
    const initial = model();
    initial.elementKinds.find(item => item.identity === 'capability')!.parents = ['domain', 'project'];
    initial.relationshipKinds[0].sourceKinds = ['capability', 'domain'];
    initial.relationshipKinds[0].targetKinds = ['domain', 'capability'];
    const baseline = captureRelevantBaseline(initial, payload);
    const reordered = structuredClone(initial);
    reordered.elementKinds.find(item => item.identity === 'capability')!.parents!.reverse();
    reordered.relationshipKinds[0].sourceKinds!.reverse();
    reordered.relationshipKinds[0].targetKinds!.reverse();
    expect(classifyBaselineDrift('old', 'new', baseline, reordered, payload)).toMatchObject({
      status: 'unrelated-drift', changed: [],
    });
  });

  it('classifies fresh, unrelated and relevant drift', () => {
    const initial = model();
    const baseline = captureRelevantBaseline(initial, payload);
    expect(classifyBaselineDrift('same', 'same', baseline, initial, payload).status).toBe('fresh');

    const unrelated = model();
    unrelated.elements.find(item => item.declaration.identity === 'other')!.declaration.definition = 'Unrelated change.';
    expect(classifyBaselineDrift('old', 'new', baseline, unrelated, payload).status).toBe('unrelated-drift');

    const relevant = model();
    relevant.elements.find(item => item.declaration.identity === 'domain')!.declaration.definition = 'Relevant ancestor change.';
    const result = classifyBaselineDrift('old', 'new', baseline, relevant, payload);
    expect(result.status).toBe('relevant-drift');
    expect(result.changed).toContain('element:domain');
  });
});
