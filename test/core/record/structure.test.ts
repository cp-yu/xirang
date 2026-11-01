import { describe, expect, it } from 'vitest';
import {
  applyRecordPatch,
  compareStructure,
  diffStructure,
  summarizeRecord,
  validateRecordStructure,
} from '../../../src/core/record/structure.js';
import type { DesignRecordPayload, RecordStructure } from '../../../src/core/record/types.js';
import type { SemanticModel } from '../../../src/core/model/types.js';

const structure = (value: Partial<RecordStructure> = {}): RecordStructure => ({
  elements: [], relationships: [], elementKinds: [], relationshipKinds: [], ...value,
});
const entry = (identity: string, nature: 'normative' | 'informative' = 'normative') => ({ identity, nature, decision: 'accepted' as const, content: `${identity} 内容` });
const payload = (value: Partial<DesignRecordPayload> = {}): DesignRecordPayload => ({
  schemaVersion: 4, context: 'change', relatedIdentities: [], entries: [], structure: structure(), ...value,
});

const element = (identity: string, kind: string, parent: string | null, definition = `${identity} 定义`) => ({
  declaration: { identity, kind, parent, title: identity, definition }, sections: [],
});
const model: SemanticModel = {
  elementKinds: [
    { identity: 'project', contract: 'optional', root: true, body: '' },
    { identity: 'capability', contract: 'optional', body: '' },
  ],
  relationshipKinds: [{ identity: 'depends-on', body: '' }],
  elements: [element('root', 'project', null), element('x', 'capability', 'root'), element('y', 'capability', 'root'), element('d', 'capability', 'x')],
  relationships: [{ source: 'x', kind: 'depends-on', target: 'y' }],
  views: [],
};

describe('按部分更新记录', () => {
  const eighteen = payload({ entries: Array.from({ length: 18 }, (_, index) => entry(`e${index}`)) });

  it('只 upsert 与修改提及的条目，其余逐字不变', () => {
    const next = applyRecordPatch(eighteen, {
      entries: { upsert: [{ identity: 'e3', nature: 'normative', decision: 'accepted' as const, content: '修改后' }, { identity: 'new', nature: 'informative', decision: 'accepted' as const, content: '新增' }] },
    });
    expect(next.entries).toHaveLength(19);
    expect(next.entries.filter(item => !['e3', 'new'].includes(item.identity))).toEqual(eighteen.entries.filter(item => item.identity !== 'e3'));
    expect(next.entries[3]).toEqual({ identity: 'e3', nature: 'normative', decision: 'accepted' as const, content: '修改后' });
    expect(summarizeRecord(next)).toEqual({ entries: 19, normativeEntries: 18, decisions: { pending: 0, accepted: 19, excluded: 0 }, elements: 0, relationships: 0, elementKinds: 0, relationshipKinds: 0 });
  });

  it('结构对象按字段合并，clear 移除字段而 parent: null 表示 Project Root', () => {
    const before = payload({ structure: structure({ elements: [{ identity: 'd', kind: 'capability', parent: 'x', title: 'D' }] }) });
    const merged = applyRecordPatch(before, { structure: { upsert: { elements: [{ identity: 'd', definition: 'D 定义' }] } } });
    expect(merged.structure.elements).toEqual([{ identity: 'd', kind: 'capability', parent: 'x', title: 'D', definition: 'D 定义' }]);
    const cleared = applyRecordPatch(merged, { structure: { upsert: { elements: [{ identity: 'd', parent: null, clear: ['title'] }] } } });
    expect(cleared.structure.elements).toEqual([{ identity: 'd', kind: 'capability', parent: null, definition: 'D 定义' }]);
  });

  it('撤回使对象回到未确认，区别于 removed: true 的目标删除', () => {
    const before = payload({ structure: structure({
      elements: [{ identity: 'd', parent: 'x' }, { identity: 'e', removed: true }],
      relationships: [{ source: 'x', kind: 'depends-on', target: 'y' }],
    }) });
    const withdrawn = applyRecordPatch(before, { structure: { withdraw: { elements: ['e'], relationships: [{ source: 'x', kind: 'depends-on', target: 'y' }] } } });
    expect(withdrawn.structure.elements).toEqual([{ identity: 'd', parent: 'x' }]);
    expect(withdrawn.structure.relationships).toEqual([]);
    const removed = applyRecordPatch(before, { structure: { upsert: { elements: [{ identity: 'd', removed: true, clear: ['parent'] }] } } });
    expect(removed.structure.elements[0]).toEqual({ identity: 'd', removed: true });
  });

  it.each([
    [{}, 'EMPTY_PATCH'],
    [{ entries: { remove: ['missing'] } }, 'PATCH_TARGET_NOT_FOUND'],
    [{ structure: { withdraw: { elements: ['missing'] } } }, 'PATCH_TARGET_NOT_FOUND'],
    [{ entries: { upsert: [entry('a')], remove: ['a'] } }, 'PATCH_CONFLICT'],
    [{ structure: { upsert: { elements: [{ identity: 'a', parent: null, clear: ['parent'] }] } } }, 'PATCH_CONFLICT'],
    [{ structure: { upsert: { elements: [{ identity: 'a', clear: ['sections'] }] } } }, 'INVALID_PATCH'],
    [{ context: 'build' }, 'INVALID_PATCH'],
    [{ entries: { remove: ['a'] } }, 'EMPTY_PAYLOAD'],
  ])('拒绝空、冲突、越界或清空记录的补丁 %#', (patch, code) => {
    expect(() => applyRecordPatch(payload({ entries: [entry('a')] }), patch)).toThrow(expect.objectContaining({ code }));
  });
});

describe('返回确认内容的相对变化', () => {
  it('分开报告修改已确认字段、补充新字段与移除字段', () => {
    const before = structure({ elements: [{ identity: 'd', parent: 'x', title: 'D' }, { identity: 'gone', parent: 'x' }] });
    const after = structure({
      elements: [{ identity: 'd', parent: 'y', definition: '新定义' }, { identity: 'n', parent: 'x' }],
      relationships: [{ source: 'x', kind: 'depends-on', target: 'd' }],
    });
    expect(diffStructure(before, after)).toEqual({
      added: [
        { ref: { element: 'n' }, after: { identity: 'n', parent: 'x' } },
        { ref: { relationship: { source: 'x', kind: 'depends-on', target: 'd' } }, after: { source: 'x', kind: 'depends-on', target: 'd' } },
      ],
      modified: [{
        ref: { element: 'd' },
        changedFields: [{ field: 'parent', before: 'x', after: 'y' }],
        addedFields: [{ field: 'definition', after: '新定义' }],
        clearedFields: [{ field: 'title', before: 'D' }],
      }],
      withdrawn: [{ ref: { element: 'gone' }, before: { identity: 'gone', parent: 'x' } }],
    });
    expect(diffStructure(after, after)).toEqual({ added: [], modified: [], withdrawn: [] });
  });

  it('对照当前模型推导新增、修改、删除或一致', () => {
    const derived = compareStructure(structure({
      elements: [
        { identity: 'd', kind: 'capability', parent: 'x' },
        { identity: 'y', parent: 'x' },
        { identity: 'n', parent: 'x' },
        { identity: 'x', removed: true },
        { identity: 'ghost', removed: true },
      ],
      relationships: [{ source: 'x', kind: 'depends-on', target: 'y', removed: true }],
      elementKinds: [{ identity: 'capability', contract: 'optional' }],
    }), model);
    expect(derived.map(item => [item.ref, item.status])).toEqual([
      [{ element: 'd' }, 'unchanged'],
      [{ element: 'y' }, 'modified'],
      [{ element: 'n' }, 'added'],
      [{ element: 'x' }, 'removed'],
      [{ element: 'ghost' }, 'unchanged'],
      [{ relationship: { source: 'x', kind: 'depends-on', target: 'y' } }, 'removed'],
      [{ elementKind: 'capability' }, 'unchanged'],
    ]);
    expect(derived[1].fields).toEqual([{ field: 'parent', record: 'x', model: 'root' }]);
    expect(compareStructure(structure({ elements: [{ identity: 'd', parent: 'x' }] }), null)[0].status).toBe('added');
  });
});

describe('校验记录结构与上下文', () => {
  it('Kind、parent 与 Relationship 端点必须解析到当前模型或记录中未删除的对象', () => {
    const diagnostics = validateRecordStructure(structure({
      elements: [
        { identity: 'a', kind: 'ghost-kind', parent: 'ghost-parent' },
        { identity: 'b', kind: 'capability', parent: 'x' },
        { identity: 'c', parent: 'b' },
        { identity: 'z', kind: 'capability', parent: null },
        { identity: 'x', removed: true },
      ],
      relationships: [
        { source: 'c', kind: 'depends-on', target: 'nowhere' },
        { source: 'c', kind: 'ghost-rel', target: 'y' },
        { source: 'x', kind: 'depends-on', target: 'y', removed: true },
      ],
      elementKinds: [{ identity: 'module', contract: 'optional', parents: ['ghost-kind'] }],
    }), model);
    expect(diagnostics.map(item => [item.code, item.identity, item.field])).toEqual([
      ['UNKNOWN_ELEMENT_KIND', 'a', 'kind'],
      ['UNRESOLVED_PARENT', 'a', 'parent'],
      ['UNRESOLVED_PARENT', 'b', 'parent'],
      ['UNRESOLVED_PARENT', 'z', 'parent'],
      ['UNRESOLVED_RELATIONSHIP_ENDPOINT', 'c -depends-on-> nowhere', 'target'],
      ['UNKNOWN_RELATIONSHIP_KIND', 'c -ghost-rel-> y', 'kind'],
      ['UNKNOWN_ELEMENT_KIND', 'module', 'parents'],
    ]);
    expect(diagnostics.every(item => item.severity === 'ERROR' && item.message)).toBe(true);
  });

  it('连续校验独立覆盖对象且不修改模型或记录', () => {
    const first = structure({
      elements: [{ identity: 'x', removed: true }, { identity: 'y', parent: 'x' }, { identity: 'root', kind: 'capability', parent: null }],
      relationships: [{ source: 'd', kind: 'depends-on', target: 'x' }],
      elementKinds: [{ identity: 'capability', root: true }],
      relationshipKinds: [{ identity: 'depends-on', removed: true }],
    });
    const second = structure({
      elements: [{ identity: 'd', parent: 'x' }, { identity: 'n', kind: 'capability', parent: null }],
      relationships: [{ source: 'd', kind: 'depends-on', target: 'x' }],
    });
    const originalModel = structuredClone(model);
    const originalFirst = structuredClone(first);
    const originalSecond = structuredClone(second);
    const firstDiagnostics = [
      { severity: 'ERROR', code: 'UNRESOLVED_PARENT', message: 'Parent x is not in the current model or record', identity: 'y', field: 'parent' },
      { severity: 'ERROR', code: 'UNRESOLVED_RELATIONSHIP_ENDPOINT', message: 'Endpoint x is not in the current model or record', identity: 'd -depends-on-> x', field: 'target' },
      { severity: 'ERROR', code: 'UNKNOWN_RELATIONSHIP_KIND', message: 'Relationship Kind depends-on is not in the Metamodel or record', identity: 'd -depends-on-> x', field: 'kind' },
    ];
    expect(validateRecordStructure(first, model)).toEqual(firstDiagnostics);
    expect(validateRecordStructure(second, model)).toEqual([
      { severity: 'ERROR', code: 'UNRESOLVED_PARENT', message: 'Element Kind capability does not allow Project Root', identity: 'n', field: 'parent' },
    ]);
    expect(validateRecordStructure(first, model)).toEqual(firstDiagnostics);
    expect(validateRecordStructure(structure(), model)).toEqual([]);
    expect(model).toEqual(originalModel);
    expect(first).toEqual(originalFirst);
    expect(second).toEqual(originalSecond);
  });

  it('无正式模型时只按记录自身解析', () => {
    const own = structure({
      elementKinds: [{ identity: 'project', contract: 'optional', root: true }],
      relationshipKinds: [{ identity: 'uses' }],
      elements: [{ identity: 'root', kind: 'project', parent: null }, { identity: 'a', kind: 'project', parent: 'root' }],
      relationships: [{ source: 'a', kind: 'uses', target: 'root' }],
    });
    expect(validateRecordStructure(own, null)).toEqual([]);
    expect(validateRecordStructure(structure({ elements: [{ identity: 'a', kind: 'capability', parent: 'x' }] }), null).map(item => item.code))
      .toEqual(['UNKNOWN_ELEMENT_KIND', 'UNRESOLVED_PARENT']);
  });
});
