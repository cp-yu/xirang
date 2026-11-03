import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  QUALITY_CONTRACT_VERSION,
  QUALITY_LOG_FILE,
  QUALITY_STATE_FILE,
  QualityEngineError,
  beginReview,
  buildCodeManifest,
  compareRecoverableCommit,
  compareManifests,
  executeVerification,
  readQualityStore,
  saveDelegation,
  startDelegation,
  submitReview,
  transactQuality,
} from '../../../src/core/quality/engine.js';
import { recordCheckpoint } from '../../../src/core/quality/completion.js';

const execFileAsync = promisify(execFile);

describe('quality v2 engine foundation', () => {
  let root: string;
  let changeDir: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-engine-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(path.join(root, 'src'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(root, 'src', 'app.ts'), 'export const value = 1;\n');
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [ ] implement\n');
    await fs.writeFile(path.join(root, '.gitignore'), 'ignored.ts\n');
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.com'], { cwd: root });
    await execFileAsync('git', ['add', '.'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd: root });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function head(): Promise<string> {
    const result = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root });
    return result.stdout.trim();
  }

  async function stateVersion(): Promise<number> {
    return (await readQualityStore(changeDir)).snapshot.version;
  }

  async function baselineReview() {
    const started = await beginReview({
      changeDir,
      projectRoot: root,
      scope: 'baseline',
      assignment: 'review the current change',
    });
    const submitted = await submitReview({
      changeDir,
      projectRoot: root,
      reviewId: started.review.reviewId,
      expectedVersion: started.snapshot.version,
      result: 'PASS',
      issues: [],
      evidenceFiles: ['src/app.ts'],
      summary: 'The current implementation is independently reviewed.',
      writeBackPlan: [],
    });
    const state = submitted.snapshot.state;
    if (!(state.checkpoints ?? []).some(item => item.kind === 'baseline') && state.delegations.length === 0) {
      await execFileAsync('git', ['add', '-A'], { cwd: root });
      await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'baseline checkpoint'], { cwd: root });
      const checkpoint = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: submitted.snapshot.version, kind: 'baseline', commit: await head(), reviewId: submitted.review.reviewId });
      return { ...submitted, snapshot: checkpoint.snapshot };
    }
    return submitted;
  }

  it('rotates a completed quality association while retaining immutable history and starting needs_review', async () => {
    const completed = await baselineReview();
    const previous = completed.snapshot.state;
    const reason = 'The earlier verification evidence is no longer trusted.';
    const originalLog = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE));
    const revalidated = await beginReview({
      changeDir, projectRoot: root, scope: 'baseline', assignment: 'fresh baseline review', expectedVersion: completed.snapshot.version,
      revalidation: { reason, previousFlowStopped: true },
    } as any);

    expect(revalidated.review).toMatchObject({ scope: 'baseline', assignment: 'fresh baseline review', associationId: expect.any(String) });
    expect(revalidated.snapshot.state.reviews).toEqual([revalidated.review]);
    expect(revalidated.snapshot.state.delegations).toEqual([]);
    expect(revalidated.snapshot.state.verifications).toEqual([]);
    expect(revalidated.snapshot.state.checkpoints).toEqual([]);
    expect(revalidated.snapshot.state.completion).toBeUndefined();
    expect(revalidated.snapshot.state.revalidationHistory).toHaveLength(1);
    expect(revalidated.snapshot.state.revalidationHistory![0]).toMatchObject({
      associationId: revalidated.review.associationId, reason, archivedVersion: completed.snapshot.version,
      snapshot: { version: completed.snapshot.version, sequence: completed.snapshot.sequence, state: previous },
    });
    const log = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE));
    expect(log.subarray(0, originalLog.length)).toEqual(originalLog);
    expect(revalidated.snapshot.version).toBe(completed.snapshot.version + 1);

    const repeated = await beginReview({
      changeDir, projectRoot: root, scope: 'baseline', assignment: 'second fresh baseline review', expectedVersion: revalidated.snapshot.version,
      revalidation: { reason: 'A second explicit reassessment was requested.', previousFlowStopped: true },
    } as any);
    expect(repeated.snapshot.state.revalidationHistory).toHaveLength(2);
    expect(repeated.snapshot.state.revalidationHistory![0]).toEqual(revalidated.snapshot.state.revalidationHistory![0]);
    expect(repeated.snapshot.state.revalidationHistory![1].snapshot.state.reviews).toEqual([revalidated.review]);
    expect(repeated.snapshot.state.revalidationHistory![1].snapshot.state.activeAssociationId).toBe(revalidated.review.associationId);
  });

  it('rejects malformed or stale revalidation without changing quality files', async () => {
    const completed = await baselineReview();
    const stateFile = path.join(changeDir, QUALITY_STATE_FILE);
    const logFile = path.join(changeDir, QUALITY_LOG_FILE);
    const beforeState = await fs.readFile(stateFile);
    const beforeLog = await fs.readFile(logFile);
    const base = { changeDir, projectRoot: root, scope: 'baseline' as const, assignment: 'fresh review' };
    for (const revalidation of [
      { reason: ' ', previousFlowStopped: true },
      { reason: 'explicit request', previousFlowStopped: false },
    ]) {
      await expect(beginReview({ ...base, expectedVersion: completed.snapshot.version, revalidation } as any)).rejects.toBeInstanceOf(QualityEngineError);
    }
    await expect(beginReview({ ...base, scope: 'incremental', expectedVersion: completed.snapshot.version, revalidation: { reason: 'explicit request', previousFlowStopped: true } } as any)).rejects.toMatchObject({ code: 'INVALID_REVALIDATION_SCOPE' });
    await expect(beginReview({ ...base, delegationIds: ['DEL-old'], expectedVersion: completed.snapshot.version, revalidation: { reason: 'explicit request', previousFlowStopped: true } } as any)).rejects.toMatchObject({ code: 'INVALID_REVALIDATION_SCOPE' });
    await expect(beginReview({ ...base, expectedVersion: 0, revalidation: { reason: 'explicit request', previousFlowStopped: true } } as any)).rejects.toMatchObject({ code: 'STALE_QUALITY_VERSION' });
    const appendOptions = { appendLog: async () => { throw new Error('revalidation append failed'); } };
    await expect(beginReview({
      changeDir, projectRoot: root, expectedVersion: completed.snapshot.version, scope: 'baseline', assignment: 'fresh review',
      revalidation: { reason: 'The prior result is not trusted.', previousFlowStopped: true },
    } as any, appendOptions)).rejects.toThrow('revalidation append failed');
    expect(await fs.readFile(stateFile)).toEqual(beforeState);
    expect(await fs.readFile(logFile)).toEqual(beforeLog);
    const options = { writeSnapshot: async () => { throw new Error('revalidation snapshot replacement failed'); } };
    await expect(beginReview({
      changeDir, projectRoot: root, expectedVersion: completed.snapshot.version, scope: 'baseline', assignment: 'fresh review',
      revalidation: { reason: 'The prior result is not trusted.', previousFlowStopped: true },
    } as any, options)).rejects.toThrow('revalidation snapshot replacement failed');
    expect(await fs.readFile(stateFile)).toEqual(beforeState);
    const logAfter = await fs.readFile(logFile);
    expect(logAfter.subarray(0, beforeLog.length)).toEqual(beforeLog);
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'QUALITY_STORE_MISMATCH' });
  });

  it('requires explicit versioned revalidation only when the caller requests rotation', async () => {
    const ordinary = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'ordinary begin' });
    expect(ordinary.review.associationId).toBeUndefined();
  });

  it('uses a strict v2 snapshot and append-only log with CAS writes', async () => {
    const first = await transactQuality(changeDir, 0, 'test.first', { value: 1 }, { reviews: [], delegations: [], verifications: [] });
    expect(first.snapshot.contractVersion).toBe(QUALITY_CONTRACT_VERSION);
    expect(await stateVersion()).toBe(1);

    const snapshotBefore = await fs.readFile(path.join(changeDir, QUALITY_STATE_FILE));
    const logBefore = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE));
    await expect(transactQuality(changeDir, 0, 'test.stale', {}, first.snapshot.state)).rejects.toMatchObject({ code: 'STALE_QUALITY_VERSION' });
    expect(await fs.readFile(path.join(changeDir, QUALITY_STATE_FILE))).toEqual(snapshotBefore);
    expect(await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE))).toEqual(logBefore);

    await expect(transactQuality(
      changeDir,
      1,
      'test.write-failure',
      {},
      first.snapshot.state,
      { writeSnapshot: async () => { throw new Error('targeted snapshot failure'); } },
    )).rejects.toThrow('targeted snapshot failure');
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'QUALITY_STORE_MISMATCH' });
  });

  it('preserves the submitted Review in append-only history when snapshot replacement fails', async () => {
    const started = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'review snapshot failure recovery' });
    const snapshotBefore = await fs.readFile(path.join(changeDir, QUALITY_STATE_FILE));
    const logBefore = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE));
    const startEvent = JSON.parse(logBefore.toString('utf8'));
    expect(startEvent.operation).toBe('review.begin');
    expect(startEvent.payload.review).toMatchObject({
      reviewId: started.review.reviewId,
      assignment: 'review snapshot failure recovery',
      delegationIds: [],
      beforeManifest: { hash: expect.any(String), entries: expect.arrayContaining([expect.objectContaining({ path: 'src/app.ts' })]) },
    });
    const reviewInput = {
      changeDir,
      projectRoot: root,
      reviewId: started.review.reviewId,
      expectedVersion: started.snapshot.version,
      result: 'FAIL_NEEDS_CORRECTIONS' as const,
      issues: [{ severity: 'CRITICAL' as const, message: 'Missing durable cache invalidation', component: 'cache-layer' }],
      evidenceFiles: ['src/app.ts'],
      summary: { decision: 'reject', rationale: 'Cache invalidation is not persisted.', observed: ['stale cache after write'] },
      writeBackPlan: [{ action: 'append_correction', correctionType: 'code_fix', section: 'Cache invalidation', summary: 'Persist invalidation before acknowledging writes.', nextAction: 'Add a regression test.' }],
    };
    await expect(submitReview(reviewInput, {
      writeBack: async () => {},
      writeSnapshot: async () => {
        throw new Error('snapshot replacement failed');
      },
    })).rejects.toThrow('snapshot replacement failed');

    expect(await fs.readFile(path.join(changeDir, QUALITY_STATE_FILE))).toEqual(snapshotBefore);
    const logAfter = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE));
    expect(logAfter.subarray(0, logBefore.length)).toEqual(logBefore);
    const appendedEvents = logAfter.subarray(logBefore.length).toString('utf8').trim().split('\n').map(line => JSON.parse(line));
    expect(appendedEvents).toHaveLength(1);
    const event = appendedEvents[0];
    expect(event.operation).toBe('review.submit');
    expect(event.payload.review).toMatchObject({
      reviewId: started.review.reviewId,
      result: 'FAIL_NEEDS_CORRECTIONS',
      issues: [{ severity: 'CRITICAL', message: 'Missing durable cache invalidation', component: 'cache-layer' }],
      summary: { decision: 'reject', rationale: 'Cache invalidation is not persisted.' },
      writeBackPlan: [{ section: 'Cache invalidation', summary: 'Persist invalidation before acknowledging writes.' }],
      delegationIds: [],
      beforeManifest: { hash: expect.any(String), entries: expect.arrayContaining([expect.objectContaining({ path: 'src/app.ts' })]) },
      afterManifest: { hash: expect.any(String) },
    });
    expect(event.payload.review.reviewId).toBe(started.review.reviewId);
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'QUALITY_STORE_MISMATCH' });
    await expect(transactQuality(changeDir, started.snapshot.version, 'test.must-not-overwrite', {}, started.snapshot.state)).rejects.toMatchObject({ code: 'QUALITY_STORE_MISMATCH' });
    expect(await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE))).toEqual(logAfter);
  });

  it('fails closed for unsupported snapshots and malformed or mismatched logs', async () => {
    const snapshotPath = path.join(changeDir, QUALITY_STATE_FILE);
    const logPath = path.join(changeDir, QUALITY_LOG_FILE);
    await fs.writeFile(snapshotPath, JSON.stringify({ contractVersion: 1 }), 'utf8');
    await fs.writeFile(logPath, '{"contractVersion":1}\n', 'utf8');
    const oldSnapshot = await fs.readFile(snapshotPath);
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'UNSUPPORTED_QUALITY_VERSION' });
    expect(await fs.readFile(snapshotPath)).toEqual(oldSnapshot);

    await fs.rm(snapshotPath);
    await fs.rm(logPath);
    await transactQuality(changeDir, 0, 'test.valid', {}, { reviews: [], delegations: [], verifications: [] });
    await fs.appendFile(logPath, '{"truncated"');
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'MALFORMED_QUALITY_LOG' });
  });

  it('builds a complete manifest, ignores only owned runtime paths, and normalizes task checkboxes', async () => {
    await fs.writeFile(path.join(root, 'ignored.ts'), 'ignored\n');
    await fs.writeFile(path.join(root, 'src', 'with space.ts'), 'space\n');
    await fs.writeFile(path.join(root, 'src', '.quality-state.json'), 'source file\n');
    await fs.mkdir(path.join(changeDir, '.quality-evidence'), { recursive: true });
    await fs.writeFile(path.join(changeDir, '.quality-evidence', 'run.json'), 'runtime\n');
    const before = await buildCodeManifest(root);
    const paths = before.entries.map((entry) => entry.path);
    expect(paths).toContain('src/.quality-state.json');
    expect(paths).toContain('src/with space.ts');
    expect(paths).not.toContain('ignored.ts');
    expect(paths).not.toContain('.xirang/changes/c1/.quality-evidence/run.json');

    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] implement\n');
    const checked = await buildCodeManifest(root);
    const taskBefore = before.entries.find((entry) => entry.path.endsWith('tasks.md'))!;
    const taskAfter = checked.entries.find((entry) => entry.path.endsWith('tasks.md'))!;
    expect(taskAfter.contentHash).not.toBe(taskBefore.contentHash);
    expect(taskAfter.comparisonHash).toBe(taskBefore.comparisonHash);
    expect((await (await import('../../../src/core/quality/engine.js')).compareManifests(before, checked)).equal).toBe(true);

    await fs.writeFile(path.join(root, 'src', 'app.ts'), 'changed\n');
    const changed = await buildCodeManifest(root);
    expect((await (await import('../../../src/core/quality/engine.js')).compareManifests(before, changed)).changed).toContain('src/app.ts');
  });

  it('compares a recoverable commit with workspace additions and deletions', async () => {
    const initial = await head();
    await fs.writeFile(path.join(root, 'src', 'new.ts'), 'new\n');
    await fs.rm(path.join(root, 'src', 'app.ts'));
    const comparison = await compareRecoverableCommit(root, initial);
    expect(comparison.equal).toBe(false);
    expect(comparison.added).toContain('src/new.ts');
    expect(comparison.deleted).toContain('src/app.ts');
  });

  it('records symlink identities without traversing targets and detects target or mode drift', async () => {
    await fs.mkdir(path.join(root, 'outside'), { recursive: true });
    await fs.writeFile(path.join(root, 'outside', 'secret.ts'), 'secret\\n');
    await fs.symlink('outside/secret.ts', path.join(root, 'linked.ts'));
    await fs.symlink('missing-target', path.join(root, 'dangling.ts'));
    await execFileAsync('git', ['add', '-A'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'link entries'], { cwd: root });
    const initialHead = await head();
    const initial = await buildCodeManifest(root);
    expect(initial.entries.find(entry => entry.path === 'linked.ts')).toMatchObject({ mode: '120000', size: 'outside/secret.ts'.length });
    expect(initial.entries.find(entry => entry.path === 'dangling.ts')?.mode).toBe('120000');
    expect((await compareRecoverableCommit(root, initialHead)).equal).toBe(true);

    await fs.unlink(path.join(root, 'linked.ts'));
    await fs.symlink('outside/other.ts', path.join(root, 'linked.ts'));
    const changedTarget = await buildCodeManifest(root);
    expect((await compareManifests(initial, changedTarget)).changed).toContain('linked.ts');

    await fs.unlink(path.join(root, 'linked.ts'));
    await fs.writeFile(path.join(root, 'linked.ts'), 'outside/secret.ts');
    const changedKind = await buildCodeManifest(root);
    expect((await compareManifests(initial, changedKind)).changed).toContain('linked.ts');
  });

  it('captures Review start and end manifests and rejects critical inconsistencies', async () => {
    const started = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'review implementation' });
    await fs.writeFile(path.join(root, 'src', 'app.ts'), 'changed during review\n');
    const submitted = await submitReview({
      changeDir,
      projectRoot: root,
      reviewId: started.review.reviewId,
      expectedVersion: started.snapshot.version,
      result: 'PASS',
      issues: [],
      evidenceFiles: ['src/app.ts'],
      summary: 'reviewed',
      writeBackPlan: [],
    });
    expect(submitted.review.changedDuringReview).toBe(true);
    expect(submitted.review.valid).toBe(false);

    const next = await beginReview({ changeDir, projectRoot: root, scope: 'incremental', assignment: 'check changed implementation' });
    await expect(submitReview({
      changeDir,
      projectRoot: root,
      reviewId: next.review.reviewId,
      expectedVersion: next.snapshot.version,
      result: 'PASS',
      issues: [{ severity: 'CRITICAL', message: 'missing behavior' }],
      evidenceFiles: ['src/app.ts'],
      summary: 'invalid result',
      writeBackPlan: [],
    })).rejects.toMatchObject({ code: 'REVIEW_RESULT_INCONSISTENT' });
  });

  it('requires a passing baseline before delegation and preserves same-id saves', async () => {
    const reviewed = await baselineReview();
    const delegation = await startDelegation({
      changeDir,
      projectRoot: root,
      scope: 'optimize the implementation',
      baselineReviewId: reviewed.review.reviewId,
      recoveryCommit: await head(),
      expectedVersion: reviewed.snapshot.version,
    });
    const saved = await saveDelegation({
      changeDir,
      delegationId: delegation.delegation.delegationId,
      expectedVersion: delegation.snapshot.version,
      report: 'Implemented and locally checked the optimization; unresolved: none.',
      evidenceIds: [],
      delivery: 'progress',
      unresolved: false,
    });
    const history = (await readQualityStore(changeDir)).log;
    expect((history.find(event => event.operation === 'delegation.start')!.payload as any).delegation).toMatchObject({
      delegationId: delegation.delegation.delegationId,
      scope: 'optimize the implementation',
      baselineReviewId: reviewed.review.reviewId,
      recoveryCommit: await head(),
      startManifest: { hash: expect.any(String), entries: expect.any(Array) },
    });
    expect((history.find(event => event.operation === 'delegation.save')!.payload as any).save).toMatchObject({
      report: 'Implemented and locally checked the optimization; unresolved: none.',
      evidenceIds: [], delivery: 'progress', unresolved: false,
    });
    const corrected = await saveDelegation({
      changeDir,
      delegationId: delegation.delegation.delegationId,
      expectedVersion: saved.snapshot.version,
      report: 'Corrected delivery report with the final evidence.',
      evidenceIds: [],
      delivery: 'delivered',
      unresolved: false,
    });
    expect(corrected.delegation.delegationId).toBe(delegation.delegation.delegationId);
    expect(corrected.delegation.saves).toHaveLength(2);
  });

  it('executes real argv processes and records success, failure, and code mutation', async () => {
    const reviewed = await baselineReview();
    const delegation = await startDelegation({ changeDir, projectRoot: root, scope: 'run tests', baselineReviewId: reviewed.review.reviewId, recoveryCommit: await head(), expectedVersion: reviewed.snapshot.version });
    const success = await executeVerification({ changeDir, projectRoot: root, delegationId: delegation.delegation.delegationId, argv: [process.execPath, '-e', "process.stdout.write('ok')"], expectedVersion: delegation.snapshot.version });
    expect(success.verification.success).toBe(true);
    expect(success.verification.stdout).toBe('ok');
    expect(success.verification.exitCode).toBe(0);
    const verificationEvent = (await readQualityStore(changeDir)).log.find(event => event.operation === 'verification.execute')!;
    expect((verificationEvent.payload as any).verification).toMatchObject({
      evidenceId: success.verification.evidenceId,
      delegationId: delegation.delegation.delegationId,
      argv: [process.execPath, '-e', "process.stdout.write('ok')"],
      success: true,
      beforeManifest: { hash: expect.any(String), entries: expect.any(Array) },
      afterManifest: { hash: expect.any(String), entries: expect.any(Array) },
    });

    const failed = await executeVerification({ changeDir, projectRoot: root, argv: [process.execPath, '-e', "process.stderr.write('bad'); process.exit(3)"], expectedVersion: success.snapshot.version });
    expect(failed.verification.success).toBe(false);
    expect(failed.verification.exitCode).toBe(3);
    expect(failed.verification.stderr).toBe('bad');

    const mutation = await executeVerification({ changeDir, projectRoot: root, argv: [process.execPath, '-e', "require('node:fs').writeFileSync('src/app.ts', 'mutated during run\\n')"], expectedVersion: failed.snapshot.version });
    expect(mutation.verification.success).toBe(false);
    expect(mutation.verification.changedDuringRun).toBe(true);
    expect(mutation.verification.beforeManifest.entries.find((entry) => entry.path === 'src/app.ts')?.contentHash).not.toBe(mutation.verification.afterManifest.entries.find((entry) => entry.path === 'src/app.ts')?.contentHash);
    const evidence = await fs.readFile(path.join(changeDir, '.quality-evidence', path.basename(mutation.verification.evidenceFile)), 'utf8');
    expect(evidence).toContain('mutated during run');
  });

  it('does not permit a verification to overwrite a concurrent quality write', async () => {
    const reviewed = await baselineReview();
    const version = reviewed.snapshot.version;
    await transactQuality(changeDir, version, 'test.concurrent', {}, reviewed.snapshot.state);
    await expect(executeVerification({ changeDir, projectRoot: root, argv: [process.execPath, '-e', 'void 0'], expectedVersion: version })).rejects.toMatchObject({ code: 'STALE_QUALITY_VERSION' });
  });

  it('requires an ordinary existing evidence path', async () => {
    const started = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'review' });
    await expect(submitReview({ changeDir, projectRoot: root, reviewId: started.review.reviewId, expectedVersion: started.snapshot.version, result: 'PASS', issues: [], evidenceFiles: [], summary: 'no evidence', writeBackPlan: [] })).rejects.toMatchObject({ code: 'MISSING_REVIEW_EVIDENCE' });
    expect(await stateVersion()).toBe(started.snapshot.version);
  });

  it('keeps unknown evidence references out of delegation saves', async () => {
    const reviewed = await baselineReview();
    const delegation = await startDelegation({ changeDir, projectRoot: root, scope: 'scope', baselineReviewId: reviewed.review.reviewId, recoveryCommit: await head(), expectedVersion: reviewed.snapshot.version });
    await expect(saveDelegation({ changeDir, delegationId: delegation.delegation.delegationId, expectedVersion: delegation.snapshot.version, report: 'report', evidenceIds: ['EVD-missing'], delivery: 'delivered', unresolved: false })).rejects.toMatchObject({ code: 'UNKNOWN_EVIDENCE' });
  });

  it('exposes a typed engine error for unsafe input', async () => {
    await expect(buildCodeManifest(path.join(root, '..', '..', 'outside'))).rejects.toBeInstanceOf(QualityEngineError);
  });

  async function commitCode(message: string) {
    await execFileAsync('git', ['add', 'src'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', message], { cwd: root });
    return head();
  }

  it('rejects missing and failed baselines and stale S1 baselines at first optimization', async () => {
    const args = { changeDir, projectRoot: root, scope: 'opt', recoveryCommit: await head() };
    await expect(startDelegation({ ...args, baselineReviewId: 'REV-missing' })).rejects.toMatchObject({ code: 'BASELINE_REVIEW_REQUIRED' });
    const started = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'all' });
    const failed = await submitReview({ changeDir, projectRoot: root, reviewId: started.review.reviewId, expectedVersion: started.snapshot.version, result: 'FAIL_NEEDS_CORRECTIONS', issues: [{ severity: 'CRITICAL', message: 'defect' }], evidenceFiles: ['src/app.ts'], summary: 'failed', writeBackPlan: [{ action: 'append_correction', correctionType: 'code_fix', summary: 'fix defect' }] }, { writeBack: async (tasksPath, plan) => {
      expect(plan).toHaveLength(1);
      await fs.appendFile(tasksPath, '- [ ] fix defect\n');
    } });
    await expect(startDelegation({ ...args, baselineReviewId: failed.review.reviewId })).rejects.toMatchObject({ code: 'BASELINE_REVIEW_REQUIRED' });
    const baseline = await baselineReview();
    await fs.writeFile(path.join(root, 'src/app.ts'), 'S2');
    const s2 = await commitCode('S2');
    await expect(startDelegation({ ...args, baselineReviewId: baseline.review.reviewId, recoveryCommit: s2 })).rejects.toMatchObject({ code: 'BASELINE_STATE_MISMATCH' });
  });

  it('reuses only the established preoptimization baseline and matching or original recovery commits', async () => {
    const baseline = await baselineReview();
    const original = await head();
    const args = { changeDir, projectRoot: root, scope: 'opt', baselineReviewId: baseline.review.reviewId, recoveryCommit: original };
    await startDelegation(args);
    await fs.writeFile(path.join(root, 'src/app.ts'), 'optimized');
    const optimized = await commitCode('optimized');
    const lateBaseline = await baselineReview();
    await expect(startDelegation({ ...args, baselineReviewId: lateBaseline.review.reviewId, recoveryCommit: optimized })).rejects.toMatchObject({ code: 'BASELINE_REVIEW_REQUIRED' });
    await startDelegation({ ...args, recoveryCommit: optimized });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'more optimization');
    await startDelegation(args); // the original established recovery point is explicitly reusable
    await fs.writeFile(path.join(root, 'src/app.ts'), 'unrelated old snapshot');
    const unrelated = await commitCode('unrelated');
    await fs.writeFile(path.join(root, 'src/app.ts'), 'current');
    await expect(startDelegation({ ...args, recoveryCommit: unrelated })).rejects.toMatchObject({ code: 'RECOVERY_COMMIT_MISMATCH' });
  });

  it('binds actual snapshot state to the log and rejects malformed state shapes', async () => {
    await baselineReview();
    const file = path.join(changeDir, QUALITY_STATE_FILE);
    const original = await fs.readFile(file, 'utf8');
    const altered = JSON.parse(original);
    altered.state.reviews[0].assignment = 'forged assignment';
    await fs.writeFile(file, JSON.stringify(altered));
    await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'QUALITY_STORE_MISMATCH' });
    altered.state.reviews[0].result = 'FABRICATED';
    await fs.writeFile(file, JSON.stringify(altered));
    await expect(readQualityStore(changeDir)).rejects.toBeInstanceOf(QualityEngineError);
    await fs.writeFile(file, original);
    const good = (await readQualityStore(changeDir)).snapshot.state;
    await expect(transactQuality(changeDir, 2, 'bad.state', {}, { ...good, reviews: [null] } as any)).rejects.toBeInstanceOf(QualityEngineError);
  });

  it('normalizes only managed task checkboxes and has consistent hash/equality with rename and HEAD-only changes', async () => {
    await fs.writeFile(path.join(root, 'src/tasks.md'), '- [ ] actual source');
    const initial = await buildCodeManifest(root);
    await fs.writeFile(path.join(root, 'src/tasks.md'), '- [x] actual source');
    expect((await compareManifests(initial, await buildCodeManifest(root))).changed).toContain('src/tasks.md');
    const before = await buildCodeManifest(root);
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [X] implement\n');
    const checked = await buildCodeManifest(root);
    expect(checked.hash).toBe(before.hash);
    await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'head only'], { cwd: root });
    expect((await buildCodeManifest(root)).hash).toBe(checked.hash);
    await fs.rename(path.join(root, 'src/app.ts'), path.join(root, 'src/moved app.ts'));
    const diff = await compareManifests(checked, await buildCodeManifest(root));
    expect(diff.deleted).toContain('src/app.ts');
    expect(diff.added).toContain('src/moved app.ts');
    await fs.mkdir(path.join(changeDir, QUALITY_STATE_FILE), { recursive: true });
    await fs.writeFile(path.join(changeDir, QUALITY_STATE_FILE, 'source.ts'), 'not runtime');
    expect((await buildCodeManifest(root)).entries.map(entry => entry.path)).toContain('.xirang/changes/c1/.quality-state.json/source.ts');
  });

  it('rejects unsafe storage and evidence parents before executing or writing externally', async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-outside-'));
    try {
      await fs.symlink(outside, path.join(changeDir, '.quality-evidence'));
      await expect(executeVerification({ changeDir, projectRoot: root, argv: [process.execPath, '-e', "require('fs').writeFileSync('ran', 'yes')"] })).rejects.toMatchObject({ code: 'UNSAFE_SYMLINK' });
      expect(await fs.readdir(outside)).toEqual([]);
      expect(await fs.stat(path.join(root, 'ran')).catch(() => null)).toBeNull();
      await fs.rm(path.join(changeDir, '.quality-evidence'));
      await fs.writeFile(path.join(outside, 'state'), 'preserved');
      await fs.symlink(path.join(outside, 'state'), path.join(changeDir, QUALITY_STATE_FILE));
      await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'UNSAFE_SYMLINK' });
      await expect(transactQuality(changeDir, 0, 'unsafe', {}, { reviews: [], delegations: [], verifications: [] })).rejects.toMatchObject({ code: 'UNSAFE_SYMLINK' });
      expect(await fs.readFile(path.join(outside, 'state'), 'utf8')).toBe('preserved');
      await fs.rm(path.join(changeDir, QUALITY_STATE_FILE));
      await fs.rm(changeDir, { recursive: true });
      await fs.symlink(outside, changeDir);
      await expect(readQualityStore(changeDir)).rejects.toMatchObject({ code: 'UNSAFE_SYMLINK' });
    } finally { await fs.rm(outside, { recursive: true, force: true }); }
  });

  it('validates runtime payload shapes and accepts ordinary structured Review summaries', async () => {
    const base = { changeDir, projectRoot: root, scope: 'baseline' as const, assignment: 'all' };
    await expect(beginReview({ ...base, delegationIds: 'not-array' } as any)).rejects.toBeInstanceOf(QualityEngineError);
    const begun = await beginReview(base);
    const submit = { changeDir, projectRoot: root, reviewId: begun.review.reviewId, expectedVersion: begun.snapshot.version, result: 'PASS' as const, issues: [], evidenceFiles: ['src\\app.ts'], summary: { completeness: 'pass', correctness: 'pass' }, writeBackPlan: [] };
    await expect(submitReview({ ...submit, issues: null } as any)).rejects.toBeInstanceOf(QualityEngineError);
    const reviewed = await submitReview(submit);
    await execFileAsync('git', ['add', '-A'], { cwd: root });
    await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'baseline checkpoint'], { cwd: root });
    await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: reviewed.snapshot.version, kind: 'baseline', commit: await head(), reviewId: reviewed.review.reviewId });
    const start = { changeDir, projectRoot: root, scope: 'opt', baselineReviewId: reviewed.review.reviewId, recoveryCommit: await head() };
    await expect(startDelegation({ ...start, constraints: 'nope' } as any)).rejects.toBeInstanceOf(QualityEngineError);
    const delegation = await startDelegation(start);
    const save = { changeDir, delegationId: delegation.delegation.delegationId, expectedVersion: delegation.snapshot.version, report: 'report', evidenceIds: [], delivery: 'progress' as const, unresolved: false };
    await expect(saveDelegation({ ...save, unresolved: 'false' } as any)).rejects.toBeInstanceOf(QualityEngineError);
    await expect(saveDelegation({ ...save, evidenceIds: [42] } as any)).rejects.toBeInstanceOf(QualityEngineError);
  });

  it('serializes competing CAS transactions without corrupting or losing history', async () => {
    const state = { reviews: [], delegations: [], verifications: [] };
    const results = await Promise.allSettled([transactQuality(changeDir, 0, 'first', {}, state), transactQuality(changeDir, 0, 'second', {}, state)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((await readQualityStore(changeDir)).log).toHaveLength(1);
    expect(await fs.stat(path.join(changeDir, '.quality-lock')).catch(() => null)).toBeNull();
  });

  it('retains actual process output when a record write happens during execution', async () => {
    const baseline = await baselineReview();
    const evidenceDir = path.join(changeDir, '.quality-evidence');
    const running = executeVerification({ changeDir, projectRoot: root, expectedVersion: baseline.snapshot.version, argv: [process.execPath, '-e', "process.stdout.write('started'); require('fs').writeFileSync('.xirang/changes/c1/.quality-evidence/ready', 'yes'); setTimeout(() => process.stdout.write('finished'), 250)"] });
    const rejected = expect(running).rejects.toMatchObject({ code: 'STALE_QUALITY_VERSION' });
    for (let i = 0; i < 200; i++) {
      if (await fs.stat(path.join(evidenceDir, 'ready')).catch(() => null)) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    expect(await fs.stat(path.join(evidenceDir, 'ready')).catch(() => null)).not.toBeNull();
    await transactQuality(changeDir, baseline.snapshot.version, 'concurrent.record', {}, baseline.snapshot.state);
    await rejected;
    const outputs = (await fs.readdir(evidenceDir)).filter(file => file.endsWith('.json'));
    expect(outputs).toHaveLength(1);
    expect(JSON.parse(await fs.readFile(path.join(evidenceDir, outputs[0]), 'utf8')).stdout).toBe('startedfinished');
    expect((await readQualityStore(changeDir)).snapshot.state.verifications).toEqual([]);
  });


  it('retains actual report history and diagnoses retained locks without deleting them', async () => {
    const baseline = await baselineReview();
    const started = await startDelegation({ changeDir, projectRoot: root, scope: 'opt', baselineReviewId: baseline.review.reviewId, recoveryCommit: await head() });
    await saveDelegation({ changeDir, delegationId: started.delegation.delegationId, expectedVersion: started.snapshot.version, report: 'abandoned attempt: reverted because tests failed', evidenceIds: [], delivery: 'progress', unresolved: false });
    const store = await readQualityStore(changeDir);
    expect(store.snapshot.state.delegations[0].saves[0].report).toContain('abandoned attempt');
    const lock = path.join(changeDir, '.quality-lock');
    await fs.writeFile(lock, 'retained lock');
    await expect(transactQuality(changeDir, store.snapshot.version, 'locked', {}, store.snapshot.state)).rejects.toMatchObject({ code: 'QUALITY_STORE_LOCKED' });
    expect(await fs.readFile(lock, 'utf8')).toBe('retained lock');
  });

  it('keeps actual nonzero, spawn failure and signal outcomes rather than manufacturing success', async () => {
    const missing = await executeVerification({ changeDir, projectRoot: root, argv: [path.join(root, 'nonexistent-executable')] });
    expect(missing.verification.spawnError).toBeTruthy();
    expect(missing.verification.success).toBe(false);
    if (process.platform !== 'win32') {
      const interrupted = await executeVerification({ changeDir, projectRoot: root, argv: [process.execPath, '-e', "process.kill(process.pid, 'SIGTERM')"] });
      expect(interrupted.verification.signal).toBe('SIGTERM');
      expect(interrupted.verification.success).toBe(false);
    }
  });


  it('requires critical writeback and captures the resulting tasks hash without excusing code edits', async () => {
    const begun = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'review' });
    const submit = { changeDir, projectRoot: root, reviewId: begun.review.reviewId, expectedVersion: begun.snapshot.version, result: 'FAIL_NEEDS_CORRECTIONS' as const, issues: [{ severity: 'CRITICAL', message: 'needs correction' }], evidenceFiles: ['src/app.ts'], summary: 'correction required', writeBackPlan: [{ action: 'append_correction', correctionType: 'code_fix', summary: 'correct implementation' }] };
    await expect(submitReview(submit)).rejects.toMatchObject({ code: 'WRITEBACK_REQUIRED' });
    const submitted = await submitReview(submit, { writeBack: async () => {
      await fs.appendFile(path.join(changeDir, 'tasks.md'), '- [ ] correct implementation\n');
      await fs.writeFile(path.join(root, 'src/app.ts'), 'implementation edited');
    } });
    expect(submitted.review.tasksFileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(submitted.review.changedDuringReview).toBe(true);
    expect(submitted.review.valid).toBe(false);
  });

});
