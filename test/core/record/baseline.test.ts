import { describe, expect, it } from 'vitest';
import { captureRelevantBaseline, classifyBaselineDrift } from '../../../src/core/record/baseline.js';
import type { DesignRecordPayload } from '../../../src/core/record/types.js';
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
      { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Root.' }, sections: [] },
      { declaration: { identity: 'domain', kind: 'domain', parent: 'root', title: 'Domain', definition: 'Domain.' }, sections: [] },
      { declaration: { identity: 'a', kind: 'capability', parent: 'domain', title: 'A', definition: 'A.' }, sections: [] },
      { declaration: { identity: 'b', kind: 'capability', parent: 'domain', title: 'B', definition: 'B.' }, sections: [] },
      { declaration: { identity: 'other', kind: 'unrelated', parent: 'root', title: 'Other', definition: 'Other.' }, sections: [] },
    ],
    relationships: [{ source: 'a', kind: 'uses', target: 'b' }],
    views: [{ identity: 'overview', include: ['a'] }],
  };
}

const payload: DesignRecordPayload = {
  schemaVersion: 3, context: 'change', relatedIdentities: ['a'],
  entries: [{ identity: 'limit', nature: 'normative', content: '最多 5 本，闭馆日顺延。' }],
  structure: { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] },
};

describe('关联上下文基准', () => {
  it('记录显式关联、祖先、Kinds、关系和 Contract；不从自然语言猜依赖', () => {
    const baseline = captureRelevantBaseline(model(), payload);
    expect(baseline.modelState).toBe('present');
    expect(baseline.objects).toHaveProperty('element:a');
    expect(baseline.objects).toHaveProperty('element:root');
    expect(baseline.objects).toHaveProperty('element-kind:capability');
    expect(baseline.objects['element:a']).toMatchObject({ sections: [] });
    expect(baseline.objects).not.toHaveProperty('element:other');
    expect(captureRelevantBaseline(model(), { ...payload, relatedIdentities: [] }).objects).toEqual({});
  });

  it('结构部分引用的对象进入基准，其相关变化报告为 drift', () => {
    const structural: DesignRecordPayload = { ...payload, relatedIdentities: [], structure: {
      ...payload.structure,
      elements: [{ identity: 'b', parent: 'domain' }],
      relationships: [{ source: 'a', kind: 'uses', target: 'b', removed: true }],
    } };
    const baseline = captureRelevantBaseline(model(), structural);
    expect(baseline.objects).toHaveProperty('element:b');
    expect(baseline.objects).toHaveProperty('element:a');
    expect(baseline.objects).toHaveProperty('relationship-kind:uses');
    expect(baseline.objects).not.toHaveProperty('element:other');
    const changed = model();
    changed.elements[3].declaration.definition = 'B changed.';
    expect(classifyBaselineDrift('old', 'new', baseline, changed, structural)).toMatchObject({ status: 'relevant-drift', changed: ['element:b'] });
    const unrelated = model();
    unrelated.elements[4].declaration.definition = 'Other changed.';
    expect(classifyBaselineDrift('old', 'new', baseline, unrelated, structural).status).toBe('unrelated-drift');
  });

  it('区分不存在的模型、对象与后续出现的模型', () => {
    const absent = captureRelevantBaseline(null, { ...payload, context: 'build' });
    expect(absent).toEqual({ modelState: 'absent', objects: {} });
    expect(classifyBaselineDrift('old', 'new', absent, model(), payload).status).toBe('relevant-drift');
    expect(captureRelevantBaseline(model(), { ...payload, relatedIdentities: ['new'] }).objects['identity:new']).toBeNull();
  });

  it('无关变化不失效，关联 Contract、祖先、Kind 和关系变化均失效', () => {
    const initial = model();
    const baseline = captureRelevantBaseline(initial, payload);
    expect(classifyBaselineDrift('same', 'same', baseline, initial, payload).status).toBe('fresh');
    const unrelated = structuredClone(initial);
    unrelated.elements.find(item => item.declaration.identity === 'other')!.declaration.definition = '无关变化';
    expect(classifyBaselineDrift('old', 'new', baseline, unrelated, payload).status).toBe('unrelated-drift');
    const mutations = [
      (value: SemanticModel) => { value.elements.find(item => item.declaration.identity === 'a')!.sections.push({ name: '上限', body: 'SHALL 最多借阅三本。', acceptanceCases: [] }); },
      (value: SemanticModel) => { value.elements.find(item => item.declaration.identity === 'domain')!.declaration.definition = '关联祖先变化'; },
      (value: SemanticModel) => { value.elementKinds.find(item => item.identity === 'capability')!.nodePresentation = { shape: 'component' }; },
      (value: SemanticModel) => { value.relationships = []; },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(initial); mutate(changed);
      expect(classifyBaselineDrift('old', 'new', baseline, changed, payload).status).toBe('relevant-drift');
    }
  });

  it('无序 Kind 约束重排不形成语义变化', () => {
    const initial = model();
    initial.elementKinds[2].parents = ['domain', 'project'];
    const saved = captureRelevantBaseline(initial, payload);
    const reordered = structuredClone(initial);
    reordered.elementKinds[2].parents!.reverse();
    expect(classifyBaselineDrift('old', 'new', saved, reordered, payload).status).toBe('unrelated-drift');
  });
});
