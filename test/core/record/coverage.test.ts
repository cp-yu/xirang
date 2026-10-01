import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { recordCoverage } from '../../../src/core/record/coverage.js';
import { createRecord } from '../../../src/core/record/workspace.js';
import { readRecordSemanticContext } from '../../../src/core/record/validator.js';
import { initializeCandidate } from '../../../src/core/candidate/workspace.js';
import { elementUnit, minimalModel, writeChangeDelta, writeModel, writeProjectModel } from '../../helpers/model-fixture.js';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true }); });

const entries = [
  { identity: 'conjunctive', nature: 'normative' as const, content: '当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）。' },
  { identity: 'limit', nature: 'normative' as const, content: '最多 5 本。' },
  { identity: 'why', nature: 'informative' as const, content: '背景。' },
];
const sections = '## ADDED Sections\n\n### Section: 选择候选\n\n候选必须覆盖全部标签。\n\n#### Acceptance Case: 多标签全覆盖\n\nA、C 时 ABC 入选。\n';

async function changeSetup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-coverage-'));
  roots.push(root);
  await writeProjectModel(root, minimalModel({ elements: [{ identity: 'kept', kind: 'capability', parent: 'root', sections: '## Specification\n\n### Section: 限额\n\n最多 5 本。\n' }] }));
  const changeDir = await writeChangeDelta(root, 'sample', {
    'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add selection.\n',
    'elements/select.md': `---\noperation: ADDED\n${elementUnit({ identity: 'select', parent: 'root', sections }).slice(4)}`,
  });
  const record = await createRecord(root, 'sample', { schemaVersion: 3, context: 'change', entries }, await readRecordSemanticContext(root, 'change'));
  return { root, changeDir, record, id: record.document.metadata.explorationId };
}

const covered = {
  entries: [
    { identity: 'conjunctive', details: [
      { detail: 'A、C 时 ABC 入选', location: { element: 'select', section: '选择候选', acceptanceCase: '多标签全覆盖' }, quote: 'A、C 时 ABC 入选' },
      { detail: '候选覆盖全部标签', location: { element: 'select', section: '选择候选' }, quote: '候选必须覆盖全部标签' },
    ] },
    { identity: 'limit', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' }, quote: '最多  5 本' }] },
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

  it.each([
    ['缺少 normative 条目', { entries: [covered.entries[0]] }, 'COVERAGE_ENTRY_MISSING', 'limit'],
    ['未知条目', { entries: [...covered.entries, { identity: 'ghost', details: covered.entries[1].details }] }, 'COVERAGE_ENTRY_UNKNOWN', 'ghost'],
    ['零细节', { entries: [covered.entries[0], { identity: 'limit', details: [] }] }, 'COVERAGE_DETAILS_EMPTY', 'limit'],
    ['未覆盖细节', { entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '闭馆日顺延', uncovered: 'Delta 中没有闭馆日规则' }] }] }, 'COVERAGE_DETAIL_UNCOVERED', 'limit'],
    ['缺少摘录', { entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' } }] }] }, 'INVALID_COVERAGE_INPUT', 'limit'],
    ['摘录不在位置中', { entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '最多 5 本', location: { element: 'kept', section: '限额' }, quote: '最多 3 本' }] }] }, 'COVERAGE_QUOTE_NOT_FOUND', 'limit'],
    ['摘录取自其他位置', { entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '最多 5 本', location: { element: 'select', section: '选择候选' }, quote: '最多 5 本' }] }] }, 'COVERAGE_QUOTE_NOT_FOUND', 'limit'],
    ['位置不存在', { entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '最多 5 本', location: { element: 'select', section: '选择候选', acceptanceCase: '不存在' }, quote: '最多 5 本' }] }] }, 'COVERAGE_LOCATION_UNRESOLVED', 'limit'],
  ])('%s时返回 invalid 与逐项诊断且不写入', async (_name, input, code, identity) => {
    const { root, changeDir, record, id } = await changeSetup();
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, input)).rejects.toMatchObject({
      code: 'INVALID_COVERAGE', diagnostics: expect.arrayContaining([expect.objectContaining({ code, identity })]),
    });
    await expect(fs.access(path.join(changeDir, 'record-coverage.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('未覆盖诊断保留理由，过期来源版本被拒绝', async () => {
    const { root, record, id } = await changeSetup();
    await expect(recordCoverage(root, id, { change: 'sample' }, record.sourceVersion, {
      entries: [covered.entries[0], { identity: 'limit', details: [{ detail: '闭馆日顺延', uncovered: 'Delta 中没有闭馆日规则' }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ message: expect.stringContaining('Delta 中没有闭馆日规则') })] });
    await expect(recordCoverage(root, id, { change: 'sample' }, '0'.repeat(64), covered)).rejects.toMatchObject({ code: 'SOURCE_VERSION_MISMATCH' });
  });

  it('Candidate 目标按四分区解析位置', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-coverage-candidate-'));
    roots.push(root);
    await fs.mkdir(path.join(root, '.xirang'));
    const record = await createRecord(root, 'build', { schemaVersion: 3, context: 'build', entries: [entries[1]] }, await readRecordSemanticContext(root, 'build'));
    await initializeCandidate(root, { kind: 'clean' });
    await writeModel(path.join(root, '.xirang', 'candidate'), minimalModel({ elements: [{ identity: 'kept', kind: 'capability', parent: 'root', sections: '## Specification\n\n### Section: 限额\n\n最多 5 本。\n' }] }));
    const input = { entries: [covered.entries[1]] };
    const result = await recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, input);
    expect(result.path).toBe('.xirang/candidate/record-coverage.json');
    await expect(recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, {
      entries: [{ identity: 'limit', details: [{ detail: 'x', location: { relationship: { source: 'kept', kind: 'uses', target: 'root' } } }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: 'COVERAGE_LOCATION_UNRESOLVED' })] });
    await expect(recordCoverage(root, record.document.metadata.explorationId, { candidate: true }, record.sourceVersion, {
      entries: [{ identity: 'limit', details: [{ detail: 'x', location: { elementKind: 'project' }, quote: 'x' }] }],
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: 'INVALID_COVERAGE_INPUT' })] });
  });
});
