import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { recordCoverage } from '../../../src/core/record/coverage.js';
import { createRecord, updateRecord } from '../../../src/core/record/workspace.js';
import { readRecordSemanticContext } from '../../../src/core/record/validator.js';
import { initializeCandidate } from '../../../src/core/candidate/workspace.js';
import { elementUnit, minimalModel, writeChangeDelta, writeModel, writeProjectModel } from '../../helpers/model-fixture.js';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true }); });

const entries = [
  { identity: 'conjunctive', nature: 'normative' as const, decision: 'accepted' as const, content: '当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）。' },
  { identity: 'limit', nature: 'normative' as const, decision: 'accepted' as const, content: '最多 5 本。' },
  { identity: 'why', nature: 'informative' as const, decision: 'accepted' as const, content: '背景。' },
];
const sections = '## ADDED Sections\n\n### Section: 选择候选\n\n候选必须覆盖全部标签。\n\n#### Acceptance Case: 多标签全覆盖\n\nA、C 时 ABC 入选。\n';

async function changeSetup(extraEntries: import('../../../src/core/record/types.js').RecordEntry[] = []) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-coverage-'));
  roots.push(root);
  await writeProjectModel(root, minimalModel({ elements: [{ identity: 'kept', kind: 'capability', parent: 'root', sections: '## Specification\n\n### Section: 限额\n\n最多 5 本。\n' }] }));
  const changeDir = await writeChangeDelta(root, 'sample', {
    'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add selection.\n',
    'elements/select.md': `---\noperation: ADDED\n${elementUnit({ identity: 'select', parent: 'root', sections }).slice(4)}`,
  });
  const record = await createRecord(root, 'sample', { schemaVersion: 4, context: 'change', entries: [...entries, ...extraEntries] }, await readRecordSemanticContext(root, 'change'));
  return { root, changeDir, record, id: record.document.metadata.explorationId };
}

const covered = {
  entries: [
    { identity: 'conjunctive', result: 'covered', details: [
      { detail: 'A、C 时 ABC 入选', location: { element: 'select', section: '选择候选', acceptanceCase: '多标签全覆盖' }, quote: 'A、C 时 ABC 入选' },
      { detail: '候选覆盖全部标签', location: { element: 'select', section: '选择候选' }, quote: '候选必须覆盖全部标签' },
    ] },
    { identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' }, quote: '最多  5 本' }] },
  ],
};

describe('记录覆盖检查结果', () => {
  it('全部有效时写入绑定来源版本与目标指纹的覆盖结果，并接受既有语义作为 no-op 位置', async () => {
    const { root, changeDir, record, id } = await changeSetup();
    const result = await recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, covered);
    expect(result).toMatchObject({ path: '.xirang/changes/sample/record-coverage.json', sourceVersion: record.sourceVersion, targetFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const saved = JSON.parse(await fs.readFile(path.join(changeDir, 'record-coverage.json'), 'utf8'));
    expect(saved).toMatchObject({ schemaVersion: 1, explorationId: id, sourceVersion: record.sourceVersion, targetFingerprint: result.targetFingerprint, entries: covered.entries });
  });

  it('声明摘录忽略排版强调并保留提交的细节顺序', async () => {
    const { root, changeDir, record, id } = await changeSetup();
    const input = { entries: [
      { ...covered.entries[0], details: [{ detail: '声明标题', location: { element: 'select' }, quote: '*select*' }, ...covered.entries[0].details] },
      { ...covered.entries[1], details: [{ ...covered.entries[1].details[0], quote: '**最多** _5_ `本`' }] },
    ] };
    const before = structuredClone(input);
    await recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, input);
    expect(JSON.parse(await fs.readFile(path.join(changeDir, 'record-coverage.json'), 'utf8')).entries).toEqual(input.entries);
    expect(input).toEqual(before);
  });

  it('按细节顺序保留格式、未覆盖、位置与摘录诊断且不覆盖已有结果', async () => {
    const { root, changeDir, record, id } = await changeSetup();
    await recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, covered);
    const destination = path.join(changeDir, 'record-coverage.json');
    const before = await fs.readFile(destination);
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, {
      entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [
        { detail: '格式优先', location: { element: 'missing' } },
        { detail: '尚未覆盖', uncovered: '等待确认' },
        { detail: '空摘录优先', location: { element: 'missing' }, quote: '' },
        { detail: '位置缺失', location: { element: 'missing' }, quote: '最多 5 本' },
        { detail: '摘录不符', location: { element: 'kept', section: '限额' }, quote: '最多 3 本' },
      ] }],
    })).rejects.toMatchObject({ code: 'INVALID_COVERAGE', diagnostics: [
      { severity: 'ERROR', code: 'INVALID_COVERAGE_INPUT', identity: 'limit', message: 'Detail 1 must be { detail, location, quote } for an Element location, { detail, location } otherwise, or { detail, uncovered }' },
      { severity: 'ERROR', code: 'COVERAGE_DETAIL_UNCOVERED', identity: 'limit', message: 'Detail "尚未覆盖" is uncovered: 等待确认' },
      { severity: 'ERROR', code: 'INVALID_COVERAGE_INPUT', identity: 'limit', message: 'Detail "空摘录优先" has an invalid location or empty quote' },
      { severity: 'ERROR', code: 'COVERAGE_LOCATION_UNRESOLVED', identity: 'limit', message: 'Detail "位置缺失" points to a location absent from the target: {"element":"missing"}' },
      { severity: 'ERROR', code: 'COVERAGE_QUOTE_NOT_FOUND', identity: 'limit', message: 'Detail "摘录不符" quote does not appear at {"element":"kept","section":"限额"}: 最多 3 本' },
    ] });
    expect(await fs.readFile(destination)).toEqual(before);
  });

  it.each([
    ['缺少 normative 条目', { entries: [covered.entries[0]] }, 'COVERAGE_ENTRY_MISSING', 'limit'],
    ['未知条目', { entries: [...covered.entries, { identity: 'ghost', result: 'covered', details: covered.entries[1].details }] }, 'COVERAGE_ENTRY_UNKNOWN', 'ghost'],
    ['零细节', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [] }] }, 'COVERAGE_DETAILS_EMPTY', 'limit'],
    ['未覆盖细节', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '闭馆日顺延', uncovered: 'Delta 中没有闭馆日规则' }] }] }, 'COVERAGE_DETAIL_UNCOVERED', 'limit'],
    ['缺少摘录', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' } }] }] }, 'INVALID_COVERAGE_INPUT', 'limit'],
    ['摘录不在位置中', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' }, quote: '最多 3 本' }] }] }, 'COVERAGE_QUOTE_NOT_FOUND', 'limit'],
    ['摘录取自其他位置', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'select', section: '选择候选' }, quote: '最多 5 本' }] }] }, 'COVERAGE_QUOTE_NOT_FOUND', 'limit'],
    ['位置不存在', { entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'select', section: '选择候选', acceptanceCase: '不存在' }, quote: '最多 5 本' }] }] }, 'COVERAGE_LOCATION_UNRESOLVED', 'limit'],
  ])('%s时返回 invalid 与逐项诊断且不写入', async (_name, input, code, identity) => {
    const { root, changeDir, record, id } = await changeSetup();
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, input)).rejects.toMatchObject({
      code: 'INVALID_COVERAGE', diagnostics: expect.arrayContaining([expect.objectContaining({ code, identity })]),
    });
    await expect(fs.access(path.join(changeDir, 'record-coverage.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['pending', { result: 'pending', affectsTarget: true }, 'COVERAGE_PENDING_TARGET'],
    ['pending', { result: 'pending', affectsTarget: false }, 'INVALID_COVERAGE_INPUT'],
    ['pending', { result: 'covered', details: covered.entries[1].details }, 'INVALID_COVERAGE_INPUT'],
    ['accepted', { result: 'not-applicable', reason: '' }, 'INVALID_COVERAGE_INPUT'],
    ['accepted', { result: 'pending', affectsTarget: false, reason: '无关' }, 'INVALID_COVERAGE_INPUT'],
  ] as const)('拒绝 %s 条目的无效状态结果 %j', async (decision, disposition, code) => {
    const { root, record, id } = await changeSetup([{ identity: 'question', nature: 'normative', decision, content: '目标待决问题' }]);
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, {
      entries: [...covered.entries, { identity: 'question', ...disposition }],
    })).rejects.toMatchObject({ diagnostics: expect.arrayContaining([expect.objectContaining({ identity: 'question', code })]) });
  });

  it('接受不适用理由和无关pending，excluded与已采纳说明不强造义务，缺pending结果仍拒绝', async () => {
    const { root, changeDir, record, id } = await changeSetup([
      { identity: 'other', nature: 'normative', decision: 'accepted', content: '其他目标' },
      { identity: 'question', nature: 'informative', decision: 'pending', content: '其他问题' },
      { identity: 'excluded', nature: 'normative', decision: 'excluded', content: '排除' },
    ]);
    const input = { entries: [...covered.entries,
      { identity: 'other', result: 'not-applicable', reason: '用户限定为其他 Change' },
      { identity: 'question', result: 'pending', affectsTarget: false, reason: '只影响另一个目标' },
    ] };
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, { entries: input.entries.slice(0, -1) }))
      .rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: 'COVERAGE_ENTRY_MISSING', identity: 'question' })] });
    await recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, input);
    expect(JSON.parse(await fs.readFile(path.join(changeDir, 'record-coverage.json'), 'utf8')).entries).toEqual(input.entries);
    const updated = await updateRecord(root, id, { entries: { upsert: [{ identity: 'question', nature: 'informative', decision: 'pending', content: '变更后的问题' }] } }, record.sourceVersion, await readRecordSemanticContext(root, 'change'));
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, input)).rejects.toMatchObject({ code: 'SOURCE_VERSION_MISMATCH' });
    expect(updated.record.sourceVersion).not.toBe(record.sourceVersion);
  });

  it('未覆盖诊断保留理由，过期来源版本被拒绝', async () => {
    const { root, record, id } = await changeSetup();
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, {
      entries: [covered.entries[0], { identity: 'limit', result: 'covered', details: [{ detail: '闭馆日顺延', uncovered: 'Delta 中没有闭馆日规则' }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ message: expect.stringContaining('Delta 中没有闭馆日规则') })] });
    await expect(recordCoverage(root, id, { change: 'sample' }, '0'.repeat(64), covered)).rejects.toMatchObject({ code: 'SOURCE_VERSION_MISMATCH' });
  });

  it('Candidate 目标按四分区解析位置', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-coverage-candidate-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.xirang'));
    const record = await createRecord(root, 'build', { schemaVersion: 4, context: 'build', entries: [entries[1]] }, await readRecordSemanticContext(root, 'build'));
    await initializeCandidate(root, { kind: 'clean' });
    await writeModel(path.join(root, '.xirang', 'candidate'), minimalModel({ elements: [{ identity: 'kept', kind: 'capability', parent: 'root', sections: '## Specification\n\n### Section: 限额\n\n最多 5 本。\n' }] }));
    const input = { entries: [covered.entries[1]] };
    const result = await recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, input);
    expect(result.path).toBe('.xirang/candidate/record-coverage.json');
    await expect(recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, {
      entries: [{ identity: 'limit', result: 'covered', details: [{ detail: 'x', location: { relationship: { source: 'kept', kind: 'uses', target: 'root' } } }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: 'COVERAGE_LOCATION_UNRESOLVED' })] });
    await expect(recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, {
      entries: [{ identity: 'limit', result: 'covered', details: [{ detail: 'x', location: { elementKind: 'project' }, quote: 'x' }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: 'INVALID_COVERAGE_INPUT' })] });
  });
});
