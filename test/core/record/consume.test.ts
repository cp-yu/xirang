import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { consumeRecord } from '../../../src/core/record/consume.js';
import { createRecord, updateRecord } from '../../../src/core/record/workspace.js';
import { recordCoverage } from '../../../src/core/record/coverage.js';
import { readRecordSemanticContext } from '../../../src/core/record/validator.js';
import { modelRoot } from '../../../src/core/model/paths.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { readSemanticTree, semanticTreeFingerprint } from '../../../src/core/model/transaction.js';
import { writeChangeDelta, writeProjectModel, minimalModel, elementUnit } from '../../helpers/model-fixture.js';

import { initializeCandidate } from '../../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../../src/core/candidate/validator.js';

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function setup(changeName = 'sample', contextKind: 'build' | 'change' = 'change') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-'));
  roots.push(root);
  await writeProjectModel(root, minimalModel());
  const parsed = await parseSemanticModel(modelRoot(root));
  const context = {
    model: parsed.model,
    semanticModelFingerprint: semanticTreeFingerprint(await readSemanticTree(root)),
  };
  const payload = {
    schemaVersion: 4, context: contextKind, relatedIdentities: ['root'],
    entries: [{ identity: 'limit', nature: 'normative', decision: 'accepted' as const, content: '最多 5 本，闭馆日顺延。' }],
    structure: { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] },
  } satisfies import('../../../src/core/record/types.js').DesignRecordPayload;
  const record = await createRecord(root, 'sample.md', payload, context);
  return { root, changeName, record };
}

type Target = { change: string } | { candidate: true };
const coverage = { entries: [{ identity: 'limit', result: 'covered', details: [{ detail: '最多 5 本', location: { element: 'root' }, quote: 'Project root definition.' }] }] };
async function cover(root: string, record: { path: string; sourceVersion: string }, target: Target) {
  return recordCoverage(root, path.basename(record.path), target, coverage);
}

async function validChange(root: string, changeName: string): Promise<string> {
  return writeChangeDelta(root, changeName, {
    'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add new capability.\n',
    'elements/new.md': `---\noperation: ADDED\n${elementUnit({ identity: 'new', title: 'New', definition: 'New capability.' }).slice(4)}`,
  });
}

describe('record consume', () => {
  it('consumes an explicit active Candidate and binds the source bytes to its digest', async () => {
    const { root, record } = await setup('build', 'build');
    const id = path.basename(record.path);
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    await expect(fs.access(record.absolutePath)).resolves.toBeUndefined();
    await initializeCandidate(root, { kind: 'current' });
    await cover(root, record, { candidate: true });
    const before = await validateCandidate(root);
    const result = await consumeRecord(root, id, { candidate: true });
    expect(result.path).toBe('.xirang/candidate/record-source.md');
    expect(await fs.readFile(path.join(root, result.path))).toEqual(record.bytes);
    const after = await validateCandidate(root);
    expect(after.valid).toBe(true);
    expect(after.reviewDigest).not.toBe(before.reviewDigest);
    await expect(fs.access(record.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves Candidate and source on invalid target, conflicting snapshot, or stale source', async () => {
    const { root, record } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const id = path.basename(record.path);
    const destination = path.join(root, '.xirang', 'candidate', 'record-source.md');
    const build = path.join(root, '.xirang', 'candidate', 'build.md');
    await fs.writeFile(build, 'invalid  \r\n');
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'CANDIDATE_VALIDATION_FAILED' });
    await expect(fs.access(destination)).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.writeFile(build, 'valid\n');
    await fs.writeFile(destination, 'existing snapshot\n');
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'PROVENANCE_CONFLICT' });
    expect(await fs.readFile(destination, 'utf8')).toBe('existing snapshot\n');
    expect(await fs.readFile(record.absolutePath)).toEqual(record.bytes);
  });

  it('revalidates an identical Candidate snapshot before recovering interrupted consumption', async () => {
    const { root, record } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const destination = path.join(root, '.xirang', 'candidate', 'record-source.md');
    await fs.writeFile(destination, record.bytes);
    await cover(root, record, { candidate: true });
    const result = await consumeRecord(root, path.basename(record.path), { candidate: true });
    expect(result.recovered).toBe(true);
    expect(await fs.readFile(destination)).toEqual(record.bytes);
    await expect(fs.access(record.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['change', false], ['change', true], ['build', false], ['build', true],
  ] as const)('preserves %s source if the final snapshot disappears (recovery: %s)', async (contextKind, recovery) => {
    const { root, record, changeName } = await setup('missing-snapshot', contextKind);
    const directory = contextKind === 'build'
      ? (await initializeCandidate(root, { kind: 'current' }), path.join(root, '.xirang', 'candidate'))
      : await validChange(root, changeName);
    const destination = path.join(directory, 'record-source.md');
    if (recovery) await fs.writeFile(destination, record.bytes);
    let destinationChecks = 0;
    const filesystem = {
      ...fs,
      lstat: (async (...args: Parameters<typeof fs.lstat>) => {
        if (args[0] === destination && ++destinationChecks === 2) await fs.rm(destination);
        return fs.lstat(...args);
      }) as typeof fs.lstat,
    };
    const target = contextKind === 'build' ? { candidate: true as const } : { change: changeName };
    await cover(root, record, target);
    await expect(consumeRecord(root, path.basename(record.path), target, filesystem))
      .rejects.toMatchObject({ code: 'PROVENANCE_MISSING' });
    expect(await fs.readFile(record.absolutePath)).toEqual(record.bytes);
    await expect(fs.access(destination)).rejects.toMatchObject({ code: 'ENOENT' });
    await consumeRecord(root, path.basename(record.path), target);
    expect(await fs.readFile(destination)).toEqual(record.bytes);
    await expect(fs.access(record.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects ambiguous targets and cross-context consumption', async () => {
    const { root, record } = await setup();
    const id = path.basename(record.path);
    await expect(consumeRecord(root, id, { candidate: true, change: 'sample' } as any))
      .rejects.toMatchObject({ code: 'INVALID_CONSUME_TARGET' });
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'CONTEXT_MISMATCH' });
    expect(await fs.readFile(record.absolutePath)).toEqual(record.bytes);
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked Candidate and provenance destinations', async () => {
    const { root, record } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const candidate = path.join(root, '.xirang', 'candidate');
    const outside = path.join(root, 'outside');
    await fs.rename(candidate, outside);
    await fs.symlink(outside, candidate, 'dir');
    const id = path.basename(record.path);
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    await fs.unlink(candidate);
    await fs.rename(outside, candidate);
    await fs.symlink(record.absolutePath, path.join(candidate, 'record-source.md'));
    await expect(consumeRecord(root, id, { candidate: true }))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    expect(await fs.readFile(record.absolutePath)).toEqual(record.bytes);
  });

  it('rejects source bytes changed after coverage and preserves source and target', async () => {
    const { root, changeName, record } = await setup();
    const changeDir = await validChange(root, changeName);
    await cover(root, record, { change: changeName });
    await fs.writeFile(record.absolutePath, record.bytes.toString().replace('最多 5 本', '最多 6 本'));
    await expect(consumeRecord(root, path.basename(record.path), { change: changeName })).rejects.toMatchObject({ code: 'COVERAGE_STALE' });
    await expect(fs.access(record.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(changeDir, 'record-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('无效目标不删除来源，也不保留新写入的快照', async () => {
    const { root, changeName, record } = await setup();
    const changeDir = await writeChangeDelta(root, changeName, {
      'elements/bad.md': `---
operation: ADDED
${elementUnit({ identity: 'bad', kind: 'missing' }).slice(4)}`,
    });
    await expect(consumeRecord(root, path.basename(record.path), { change: changeName }))
      .rejects.toMatchObject({ code: 'CHANGE_VALIDATION_FAILED' });
    await expect(fs.access(record.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(changeDir, 'record-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('freezes provenance and removes the source only after source and target validation pass', async () => {
    const { root, changeName, record } = await setup();
    const changeDir = await validChange(root, changeName);
    await cover(root, record, { change: changeName });
    const before = await fs.readFile(record.absolutePath);
    const result = await consumeRecord(root, path.basename(record.path), { change: changeName });
    expect(result.path).toBe(`.xirang/changes/${changeName}/record-source.md`);
    expect(await fs.readFile(path.join(changeDir, 'record-source.md'))).toEqual(before);
    await expect(fs.access(record.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked Change destinations and preserves the source', async () => {
    const { root, changeName, record } = await setup('linked');
    const changeDir = await validChange(root, changeName);
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-outside-'));
    roots.push(outside);
    await fs.cp(changeDir, outside, { recursive: true });
    await fs.rm(changeDir, { recursive: true });
    await fs.symlink(outside, changeDir, 'dir');
    await expect(consumeRecord(root, path.basename(record.path), { change: changeName })).rejects.toMatchObject({
      code: 'INVALID_CHANGE_PATH',
    });
    await expect(fs.access(record.absolutePath)).resolves.toBeUndefined();
  });

  it('recovers an identical copy and fails closed on a conflicting copy', async () => {
    const recovered = await setup('recover');
    const recoverDir = await validChange(recovered.root, recovered.changeName);
    const source = await fs.readFile(recovered.record.absolutePath);
    await fs.writeFile(path.join(recoverDir, 'record-source.md'), source);
    await cover(recovered.root, recovered.record, { change: recovered.changeName });
    await consumeRecord(recovered.root, path.basename(recovered.record.path), { change: recovered.changeName });
    await expect(fs.access(recovered.record.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });

    const conflict = await setup('conflict');
    const conflictDir = await validChange(conflict.root, conflict.changeName);
    await fs.writeFile(path.join(conflictDir, 'record-source.md'), 'different', 'utf8');
    await expect(consumeRecord(conflict.root, path.basename(conflict.record.path), { change: conflict.changeName }))
      .rejects.toMatchObject({ code: 'PROVENANCE_CONFLICT' });
    await expect(fs.access(conflict.record.absolutePath)).resolves.toBeUndefined();
  });

  it('无覆盖结果或覆盖后 Delta 改变时拒绝，修改 tasks.md 不使其过期', async () => {
    const { root, changeName, record } = await setup('gate');
    const changeDir = await validChange(root, changeName);
    const id = path.basename(record.path);
    await expect(consumeRecord(root, id, { change: changeName })).rejects.toMatchObject({ code: 'COVERAGE_MISSING' });
    await cover(root, record, { change: changeName });
    await fs.writeFile(path.join(changeDir, 'elements', 'new.md'), `---\noperation: ADDED\n${elementUnit({ identity: 'new', title: 'New', definition: 'Changed capability.' }).slice(4)}`);
    await expect(consumeRecord(root, id, { change: changeName })).rejects.toMatchObject({ code: 'COVERAGE_STALE' });
    await expect(fs.access(record.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(changeDir, 'record-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
    await cover(root, record, { change: changeName });
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '');
    await expect(consumeRecord(root, id, { change: changeName })).resolves.toMatchObject({ recovered: false });
  });

  it('Change 结构不一致时在 coverage 阶段拒绝并逐项报告', async () => {
    const { root, changeName, record } = await setup('structure');
    await validChange(root, changeName);
    const id = path.basename(record.path);
    const context = await readRecordSemanticContext(root, 'change');
    const updated = await updateRecord(root, id, { structure: { upsert: { elements: [{ identity: 'new', parent: 'root', title: 'Other' }], elementKinds: [{ identity: 'domain', removed: true }] } } }, context);
    await expect(cover(root, updated.record, { change: changeName })).rejects.toMatchObject({
      code: 'STRUCTURE_MISMATCH',
      diagnostics: [
        expect.objectContaining({ identity: 'new', field: 'title', message: expect.stringContaining('Other') }),
        expect.objectContaining({ identity: 'domain', field: 'removed' }),
      ],
    });
    await expect(fs.access(updated.record.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, '.xirang', 'changes', changeName, 'record-coverage.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
