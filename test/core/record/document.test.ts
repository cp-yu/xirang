import { describe, expect, it } from 'vitest';
import { normalizeRecordPayload, parseDesignRecord, renderDesignRecord } from '../../../src/core/record/document.js';
import type { DesignRecordDocument, DesignRecordPayload } from '../../../src/core/record/types.js';

const emptyStructure = { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] };
const payload: DesignRecordPayload = {
  schemaVersion: 4, context: 'build', relatedIdentities: [],
  entries: [
    { identity: 'loan-limit', nature: 'normative', decision: 'accepted' as const, content: '最多借阅 5 本；闭馆日顺延。\n当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）。' },
    { identity: 'rationale', nature: 'informative', decision: 'accepted' as const, content: '用户要求保留的方案说明。' },
  ],
  structure: {
    elements: [
      { identity: 'library', kind: 'module', parent: null, title: '图书馆', definition: '借阅服务。' },
      { identity: 'fines', parent: 'library' },
      { identity: 'legacy', removed: true },
    ],
    relationships: [
      { source: 'library', kind: 'depends-on', target: 'fines' },
      { source: 'library', kind: 'depends-on', target: 'legacy', removed: true },
    ],
    elementKinds: [{ identity: 'module', contract: 'required', parents: ['module'] }],
    relationshipKinds: [{ identity: 'depends-on', sourceKinds: ['module'] }],
  },
};
const document: DesignRecordDocument = {
  metadata: { entity: 'confirmed-design-record', explorationId: '20260729T120000Z-a1b2c3d4', slug: 'library', semanticModelFingerprint: 'f'.repeat(64) },
  payload, baseline: { modelState: 'absent', objects: {} },
};

describe('已确认设计记录', () => {
  it('以条目与结构两部分往返，保留顺序、多行内容与部分字段声明', () => {
    expect(normalizeRecordPayload(payload)).toEqual(payload);
    expect(parseDesignRecord(renderDesignRecord(document))).toEqual(document);
  });

  it('只有条目或只有结构都可表达确认内容，缺省部分规范化为空', () => {
    expect(normalizeRecordPayload({ schemaVersion: 4, context: 'build', entries: payload.entries }))
      .toEqual({ ...payload, structure: emptyStructure });
    expect(normalizeRecordPayload({ schemaVersion: 4, context: 'build', structure: { elements: [{ identity: 'a', parent: null }] } }))
      .toEqual({ schemaVersion: 4, context: 'build', relatedIdentities: [], entries: [], structure: { ...emptyStructure, elements: [{ identity: 'a', parent: null }] } });
  });

  it.each([
    { ...payload, entries: [], structure: emptyStructure },
    { ...payload, context: 'unknown' },
    { ...payload, entries: [{ identity: 'a', nature: 'normative', content: '内容' }] },
    { ...payload, entries: [{ ...payload.entries[0], decision: 'unknown' }] },
    { ...payload, entries: [{ identity: 'a', nature: 'normative', decision: 'accepted' as const, content: ' ' }] },
    { ...payload, entries: [{ identity: '../a', nature: 'normative', decision: 'accepted' as const, content: '内容' }] },
    { ...payload, entries: [payload.entries[0], payload.entries[0]] },
    { ...payload, entries: [{ ...payload.entries[0], operation: 'REMOVED' }] },
    { ...payload, relatedIdentities: ['root', 'root'] },
    { ...payload, unknown: true },
    { ...payload, structure: { ...emptyStructure, elements: [{ identity: 'a', operation: 'ADDED' }] } },
    { ...payload, structure: { ...emptyStructure, elements: [{ identity: 'a', sections: [] }] } },
    { ...payload, structure: { ...emptyStructure, elements: [{ identity: 'a' }, { identity: 'a', parent: null }] } },
    { ...payload, structure: { ...emptyStructure, elements: [{ identity: 'a', removed: true, parent: null }] } },
    { ...payload, structure: { ...emptyStructure, elements: [{ identity: 'a', removed: false }] } },
    { ...payload, structure: { ...emptyStructure, relationships: [{ source: 'a', kind: 'k' }] } },
    { ...payload, structure: { ...emptyStructure, relationships: [{ source: 'a', kind: 'k', target: 'b' }, { source: 'a', kind: 'k', target: 'b' }] } },
    { ...payload, structure: { ...emptyStructure, elementKinds: [{ identity: 'k', contract: 'maybe' }] } },
    { ...payload, structure: { ...emptyStructure, relationshipKinds: [{ identity: 'k', presentation: {} }] } },
    { ...payload, structure: { ...emptyStructure, views: [] } },
  ])('拒绝非法、空或携带差量操作的记录 %#', value => {
    expect(() => normalizeRecordPayload(value)).toThrow();
  });

  it('明确拒绝旧版本记录与旧结构格式，不隐式转换', () => {
    for (const value of [
      { elementKinds: [], relationshipKinds: [], elements: [], relationships: [] },
      { ...payload, schemaVersion: 1 },
      { ...payload, schemaVersion: 3 },
      { schemaVersion: 2, context: 'build', relatedIdentities: [], entries: payload.entries },
    ]) {
      expect(() => normalizeRecordPayload(value)).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_RECORD_VERSION' }));
    }
    expect(() => parseDesignRecord('---\nentity: change-structural-definition\n---\nelements: []\n'))
      .toThrow(expect.objectContaining({ code: 'UNSUPPORTED_RECORD_VERSION' }));
  });

  it('拒绝损坏的身份、指纹、基准和未知元数据', () => {
    for (const metadata of [
      { ...document.metadata, explorationId: '../outside' },
      { ...document.metadata, slug: '../outside' },
      { ...document.metadata, semanticModelFingerprint: 'invalid' },
      { ...document.metadata, unknown: true },
    ]) expect(() => renderDesignRecord({ ...document, metadata })).toThrow();
    expect(() => renderDesignRecord({ ...document, baseline: { modelState: 'missing', objects: {} } } as never)).toThrow();
    expect(() => renderDesignRecord({ ...document, baseline: { modelState: 'absent', objects: { root: {} } } })).toThrow();
  });
});
