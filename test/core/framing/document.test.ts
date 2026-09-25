import { describe, expect, it } from 'vitest';
import { normalizeFramingPayload, parseChangeStructuralDefinition, renderChangeStructuralDefinition } from '../../../src/core/framing/document.js';
import type { ChangeStructuralDefinitionDocument, ChangeStructuralDefinitionPayload } from '../../../src/core/framing/types.js';

const payload: ChangeStructuralDefinitionPayload = {
  schemaVersion: 2, context: 'build', relatedIdentities: [],
  entries: [
    { identity: 'loan-limit', nature: 'normative', content: '最多借阅 5 本；闭馆日顺延。' },
    { identity: 'rationale', nature: 'informative', content: '用户要求保留的方案说明。' },
  ],
};
const document: ChangeStructuralDefinitionDocument = {
  metadata: { entity: 'confirmed-design-record', explorationId: '20260729T120000Z-a1b2c3d4', slug: 'library', semanticModelFingerprint: 'f'.repeat(64) },
  payload, baseline: { modelState: 'absent', objects: {} },
};

describe('已确认设计记录', () => {
  it('接收并往返局部确认，保留顺序、性质和完整内容', () => {
    expect(normalizeFramingPayload(payload)).toEqual(payload);
    expect(parseChangeStructuralDefinition(renderChangeStructuralDefinition(document))).toEqual(document);
  });

  it.each([
    { ...payload, entries: [] },
    { ...payload, context: 'unknown' },
    { ...payload, entries: [{ identity: 'a', nature: 'normative', content: ' ' }] },
    { ...payload, entries: [{ identity: '../a', nature: 'normative', content: '内容' }] },
    { ...payload, entries: [payload.entries[0], payload.entries[0]] },
    { ...payload, entries: [{ ...payload.entries[0], operation: 'REMOVED' }] },
    { ...payload, relatedIdentities: ['root', 'root'] },
    { ...payload, unknown: true },
  ])('拒绝非法或空当前态 %#', value => {
    expect(() => normalizeFramingPayload(value)).toThrow();
  });

  it('明确拒绝旧结构格式和未知版本，不隐式转换', () => {
    for (const value of [
      { elementKinds: [], relationshipKinds: [], elements: [], relationships: [] },
      { ...payload, schemaVersion: 1 },
      { ...payload, schemaVersion: 3 },
    ]) {
      expect(() => normalizeFramingPayload(value)).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_FRAMING_VERSION' }));
    }
    expect(() => parseChangeStructuralDefinition('---\nentity: change-structural-definition\n---\nelements: []\n'))
      .toThrow(expect.objectContaining({ code: 'UNSUPPORTED_FRAMING_VERSION' }));
  });

  it('拒绝损坏的身份、指纹、基准和未知元数据', () => {
    for (const metadata of [
      { ...document.metadata, explorationId: '../outside' },
      { ...document.metadata, slug: '../outside' },
      { ...document.metadata, semanticModelFingerprint: 'invalid' },
      { ...document.metadata, unknown: true },
    ]) expect(() => renderChangeStructuralDefinition({ ...document, metadata })).toThrow();
    expect(() => renderChangeStructuralDefinition({ ...document, baseline: { modelState: 'missing', objects: {} } } as never)).toThrow();
    expect(() => renderChangeStructuralDefinition({ ...document, baseline: { modelState: 'absent', objects: { root: {} } } })).toThrow();
  });
});
