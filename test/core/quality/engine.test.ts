import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  QUALITY_FILE,
  QualityEngineError,
  readQualityRecord,
  readQualityRecordStatus,
  readQualitySeal,
  recordQualityOpt,
  recordQualityReview,
  recordQualitySeal,
  transactQualityRecord,
} from '../../../src/core/quality/engine.js';
import { removeTempDir } from '../../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

describe('quality v4 single-file protocol', () => {
  let root: string;
  let changeDir: string;
  let commit: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-v3-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(path.join(changeDir, 'elements'), { recursive: true });
    await fs.writeFile(path.join(root, 'source.ts'), 'export const value = 1;\n');
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.com'], { cwd: root });
    await execFileAsync('git', ['add', '.'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd: root });
    commit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  });

  afterEach(async () => removeTempDir(root));

  it('uses one record with revision CAS, serialized writers and atomic replacement', async () => {
    const legacySnapshot = Buffer.from('legacy snapshot bytes\n');
    await fs.writeFile(path.join(changeDir, '.quality-state.json'), legacySnapshot);
    const initial = await readQualityRecord(changeDir);
    expect(initial).toMatchObject({ schemaVersion: 4, changeId: 'c1', revision: 0, reviews: [], opt: null, seal: null });

    const first = await transactQualityRecord(changeDir, 0, current => ({ ...current, revision: 1 }));
    expect(first.revision).toBe(1);
    expect(JSON.parse(await fs.readFile(path.join(changeDir, QUALITY_FILE), 'utf8'))).toEqual(first);
    const race = await Promise.allSettled([
      transactQualityRecord(changeDir, 1, current => ({ ...current, revision: 2 })),
      transactQualityRecord(changeDir, 1, current => ({ ...current, revision: 2 })),
    ]);
    expect(race.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(race.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect((await readQualityRecord(changeDir)).revision).toBe(2);

    const before = await fs.readFile(path.join(changeDir, QUALITY_FILE));
    await expect(transactQualityRecord(changeDir, 2, current => ({ ...current, revision: 3 }), {
      beforeReplace: async () => { throw new Error('simulated interruption'); },
    })).rejects.toThrow('simulated interruption');
    expect(await fs.readFile(path.join(changeDir, QUALITY_FILE))).toEqual(before);
    expect((await fs.readdir(changeDir)).sort()).toEqual(['.quality-state.json', QUALITY_FILE, 'elements']);
    expect(await fs.readFile(path.join(changeDir, '.quality-state.json'))).toEqual(legacySnapshot);
  });

  it('records commit-bound Review by kind and requires a different commit after a same-kind failure', async () => {
    const failed = await recordQualityReview({
      changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'FAIL', summary: 'A correction is required.', findings: ['Missing behavior'],
    });
    await expect(recordQualityReview({
      changeDir, projectRoot: root, expectedRevision: failed.revision, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Cannot reuse failed commit.', findings: [],
    })).rejects.toMatchObject({ code: 'REVIEW_COMMIT_NOT_ADVANCED' });

    await fs.writeFile(path.join(root, 'source.ts'), 'export const value = 2;\n');
    await execFileAsync('git', ['add', 'source.ts'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'fix review finding'], { cwd: root });
    const nextCommit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
    const passed = await recordQualityReview({
      changeDir, projectRoot: root, expectedRevision: failed.revision, reviewKind: 'full-change', commit: nextCommit,
      result: 'PASS', summary: 'The correction is present.', findings: [],
    });
    expect(passed.reviews).toHaveLength(2);
    expect(passed.reviews.map(item => item.commit)).toEqual([commit, nextCommit]);
  });

  it('requires explicit Opt disposition and seals only with a valid full commit object', async () => {
    await expect(recordQualitySeal({
      changeDir, projectRoot: root, expectedRevision: 0,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    })).rejects.toMatchObject({ code: 'FULL_CHANGE_REVIEW_REQUIRED' });
    const review = await recordQualityReview({
      changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Baseline passes.', findings: [],
    });
    await expect(recordQualitySeal({
      changeDir, projectRoot: root, expectedRevision: review.revision,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    })).rejects.toMatchObject({ code: 'OPT_DISPOSITION_REQUIRED' });
    const opt = await recordQualityOpt({ changeDir, projectRoot: root, expectedRevision: review.revision, disposition: 'not_performed', reason: 'No optimization is warranted.' });
    const sealed = await recordQualitySeal({
      changeDir, projectRoot: root, expectedRevision: opt.revision,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    });
    expect(sealed.seal?.commit).toBe(commit);
    expect((await readQualityRecordStatus(changeDir, root)).status).toBe('all_done');
  });

  it('validates Opt commit sequence and leaves a failed CAS unchanged', async () => {
    const review = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Baseline passes.', findings: [] });
    const before = await fs.readFile(path.join(changeDir, QUALITY_FILE));
    await expect(recordQualityOpt({
      changeDir, projectRoot: root, expectedRevision: review.revision, disposition: 'delivered',
      opinions: [{ opinionId: 'OPT-1', baseCommit: 'f'.repeat(40), resultCommit: commit, summary: 'Optimized.', findings: [] }],
    })).rejects.toMatchObject({ code: 'OPT_COMMIT_SEQUENCE_INVALID' });
    expect(await fs.readFile(path.join(changeDir, QUALITY_FILE))).toEqual(before);
    await expect(recordQualityOpt({ changeDir, projectRoot: root, expectedRevision: 0, disposition: 'not_performed', reason: 'stale' }))
      .rejects.toMatchObject({ code: 'STALE_QUALITY_REVISION' });
  });

  it.each(['canRun', 'testsExpectedToPass'] as const)('rejects a stored Seal with %s=false', async field => {
    const review = await recordQualityReview({
      changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Baseline passes.', findings: [],
    });
    const opt = await recordQualityOpt({
      changeDir, projectRoot: root, expectedRevision: review.revision,
      disposition: 'not_performed', reason: 'No optimization is warranted.',
    });
    await recordQualitySeal({
      changeDir, projectRoot: root, expectedRevision: opt.revision,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    });
    const file = path.join(changeDir, QUALITY_FILE);
    const record = JSON.parse(await fs.readFile(file, 'utf8'));
    record.seal[field] = false;
    await fs.writeFile(file, JSON.stringify(record));

    await expect(readQualityRecordStatus(changeDir, root)).rejects.toMatchObject({ code: 'INVALID_QUALITY_RECORD' });
    await expect(readQualitySeal(changeDir, root)).rejects.toMatchObject({ code: 'INVALID_QUALITY_RECORD' });
  });

  it('rejects a symlinked .xirang/changes parent before creating Quality storage', async () => {
    const changesDir = path.join(root, '.xirang', 'changes');
    const outsideDir = path.join(root, 'outside');
    await fs.rm(changesDir, { recursive: true, force: true });
    await fs.mkdir(outsideDir);
    await fs.symlink(outsideDir, changesDir, 'junction');

    await expect(transactQualityRecord(changeDir, 0, current => current))
      .rejects.toMatchObject({ code: 'UNSAFE_SYMLINK' });
    await expect(fs.access(path.join(outsideDir, 'c1'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('requires a passing full-change Review and all latest kinds to pass before sealing', async () => {
    await expect(recordQualitySeal({
      changeDir, projectRoot: root, expectedRevision: 0,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    })).rejects.toMatchObject({ code: 'FULL_CHANGE_REVIEW_REQUIRED' });
    const fullChange = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Whole Change passes.', findings: [] });
    const incrementalFailure = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: fullChange.revision, reviewKind: 'incremental', commit,
      result: 'FAIL', summary: 'Opt update needs correction.', findings: ['Affected path is incorrect'] });
    await expect(recordQualitySeal({ changeDir, projectRoot: root, expectedRevision: incrementalFailure.revision,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    })).rejects.toMatchObject({ code: 'FULL_CHANGE_REVIEW_REQUIRED' });
    expect((await readQualityRecordStatus(changeDir, root)).status).toBe('needs_review');

    await fs.writeFile(path.join(root, 'source.ts'), 'export const value = 2;\n');
    await execFileAsync('git', ['add', 'source.ts'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'fix incremental finding'], { cwd: root });
    const nextCommit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
    const incrementalPass = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: incrementalFailure.revision, reviewKind: 'incremental', commit: nextCommit,
      result: 'PASS', summary: 'Opt update is correct.', findings: [] });
    expect(incrementalPass.reviews.map(item => item.reviewKind)).toEqual(['full-change', 'incremental', 'incremental']);
    expect((await readQualityRecordStatus(changeDir, root)).status).toBe('needs_optimize');
    const opt = await recordQualityOpt({ changeDir, projectRoot: root, expectedRevision: incrementalPass.revision, disposition: 'not_performed', reason: 'No further optimization.' });
    const sealed = await recordQualitySeal({ changeDir, projectRoot: root, expectedRevision: opt.revision,
      seal: { commit: nextCommit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' },
    });
    expect(sealed.schemaVersion).toBe(4);
    expect((await readQualityRecordStatus(changeDir, root)).status).toBe('all_done');
  });

  it('rejects v3 .quality.json explicitly without changing its bytes', async () => {
    const file = path.join(changeDir, QUALITY_FILE);
    const v3Bytes = Buffer.from(JSON.stringify({ schemaVersion: 3, changeId: 'c1', revision: 0, reviews: [], opt: null, seal: null }, null, 2));
    await fs.writeFile(file, v3Bytes);
    await expect(readQualityRecordStatus(changeDir, root)).rejects.toMatchObject({ code: 'UNSUPPORTED_QUALITY_VERSION' });
    await expect(recordQualityReview({ changeDir, projectRoot: root, expectedRevision: 0, reviewKind: 'full-change', commit,
      result: 'PASS', summary: 'Must not migrate.', findings: [] })).rejects.toMatchObject({ code: 'UNSUPPORTED_QUALITY_VERSION' });
    expect(await fs.readFile(file)).toEqual(v3Bytes);
  });

  it('does not read legacy files and fails closed for malformed or mismatched v4 JSON', async () => {
    const legacyLog = Buffer.from('legacy log bytes\n');
    await fs.writeFile(path.join(changeDir, '.quality-log.jsonl'), legacyLog);
    expect((await readQualityRecordStatus(changeDir, root)).qualityStatus).toBe('missing');
    expect(await fs.readFile(path.join(changeDir, '.quality-log.jsonl'))).toEqual(legacyLog);
    await fs.writeFile(path.join(changeDir, QUALITY_FILE), '{broken');
    await expect(readQualityRecord(changeDir)).rejects.toMatchObject({ code: 'MALFORMED_QUALITY_RECORD' });
    await fs.writeFile(path.join(changeDir, QUALITY_FILE), JSON.stringify({ schemaVersion: 4, changeId: 'other', revision: 0, reviews: [], opt: null, seal: null }));
    await expect(readQualityRecord(changeDir)).rejects.toMatchObject({ code: 'QUALITY_CHANGE_MISMATCH' });
    await expect(readQualityRecord(path.join(root, 'outside'))).rejects.toBeInstanceOf(QualityEngineError);
  });
});
