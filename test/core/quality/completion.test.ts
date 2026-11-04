import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { beginReview, buildCodeManifest, executeVerification, readQualityStore, saveDelegation, startDelegation, submitReview } from '../../../src/core/quality/engine.js';
import { completeOptimization, evaluateCompletion, planCompletion, recordCheckpoint } from '../../../src/core/quality/completion.js';
import { readQualityCompletion } from '../../../src/core/quality/state.js';
import { captureSyncAssociation, persistSyncAssociation } from '../../../src/core/quality/sync-association.js';
import { removeTempDir } from '../../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

describe('optimization completion gate', () => {
  let root: string;
  let changeDir: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-completion-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(path.join(root, 'src'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 1;\n');
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [ ] implement\n');
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.com'], { cwd: root });
    await commit('initial');
  });

  afterEach(async () => removeTempDir(root));

  async function commit(message: string): Promise<string> {
    await execFileAsync('git', ['add', '-A'], { cwd: root });
    await execFileAsync('git', ['commit', '--allow-empty', '-qm', message], { cwd: root });
    return (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  }

  async function establishBaseline() {
    const started = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'independently review baseline' });
    const reviewed = await submitReview({ changeDir, projectRoot: root, reviewId: started.review.reviewId, expectedVersion: started.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'Baseline is correct.', writeBackPlan: [] });
    const baseline = await commit('reviewed baseline');
    const checkpoint = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: reviewed.snapshot.version, kind: 'baseline', commit: baseline, reviewId: reviewed.review.reviewId });
    return { review: reviewed.review, snapshot: checkpoint.snapshot, commit: baseline };
  }

  async function delegate(version: number, baselineReviewId: string, recoveryCommit: string, scope: string) {
    return startDelegation({ changeDir, projectRoot: root, expectedVersion: version, baselineReviewId, recoveryCommit, scope });
  }

  async function save(delId: string, version: number) {
    return saveDelegation({ changeDir, delegationId: delId, expectedVersion: version, report: 'Retained changes and evidence are delivered; no unresolved issues.', evidenceIds: [], delivery: 'delivered', unresolved: false });
  }

  async function successfulRun(version: number, delegationId?: string, scope?: string) {
    return executeVerification({ changeDir, projectRoot: root, expectedVersion: version, delegationId, scope, argv: [process.execPath, '-e', 'process.stdout.write("tests passed")'] });
  }

  async function plan(version: number, delegationIds: string[], evidenceIds: string[], extra: Partial<Parameters<typeof planCompletion>[0]> = {}) {
    return planCompletion({
      changeDir, projectRoot: root, expectedVersion: version, delegationIds,
      verificationPlan: [{ scope: 'changed behavior tests', reason: 'Cover current retained optimization changes.' }],
      reasons: 'Risk review: local behavior is covered and unrelated evidence remains applicable.',
      requiredEvidenceIds: evidenceIds, requiredReviewIds: [], baselineDefects: [], applicability: [],
      recoveryConfirmed: true, unresolvedIssues: [], ...extra,
    });
  }

  it('starts a new completion flow after explicit revalidation without requiring a new Git commit', async () => {
    const baseline = await establishBaseline();
    const delegation = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'previous optimization');
    const evidence = await successfulRun(delegation.snapshot.version, delegation.delegation.delegationId);
    const delivered = await save(delegation.delegation.delegationId, evidence.snapshot.version);
    const planned = await plan(delivered.snapshot.version, [delegation.delegation.delegationId], [evidence.verification.evidenceId]);
    const completed = await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'Prior quality flow completed.' });
    const oldState = completed.snapshot.state;
    const oldEvidenceFile = path.join(root, evidence.verification.evidenceFile);
    const oldEvidenceBytes = await fs.readFile(oldEvidenceFile);
    const oldHead = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root });
    const currentCommit = await commit('existing matching code commit');
    const revalidation = await beginReview({
      changeDir, projectRoot: root, expectedVersion: completed.snapshot.version, scope: 'baseline', assignment: 'fresh independent review',
      revalidation: { reason: 'The prior flow is not trusted.', previousFlowStopped: true },
    });
    expect((await evaluateCompletion(changeDir, root)).status).toBe('needs_review');
    expect(revalidation.snapshot.state.revalidationHistory![0].snapshot.state).toEqual(oldState);
    expect(await fs.readFile(oldEvidenceFile)).toEqual(oldEvidenceBytes);
    expect((await execFileAsync('git', ['cat-file', '-e', `${oldHead.stdout.trim()}^{commit}`], { cwd: root })).stdout).toBe('');
    expect(revalidation.snapshot.state.verifications).toEqual([]);
    expect(revalidation.snapshot.state.reviews.map(review => review.reviewId)).toEqual([revalidation.review.reviewId]);
    await expect(submitReview({
      changeDir, projectRoot: root, expectedVersion: revalidation.snapshot.version, reviewId: baseline.review.reviewId,
      result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'old review must not be active', writeBackPlan: [],
    })).rejects.toMatchObject({ code: 'UNKNOWN_REVIEW' });
    await expect(saveDelegation({
      changeDir, delegationId: delegation.delegation.delegationId, expectedVersion: revalidation.snapshot.version,
      report: 'old delegation must not be active', evidenceIds: [], delivery: 'progress', unresolved: false,
    })).rejects.toMatchObject({ code: 'UNKNOWN_DELEGATION' });
    const submitted = await submitReview({ changeDir, projectRoot: root, expectedVersion: revalidation.snapshot.version, reviewId: revalidation.review.reviewId, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'Fresh review passes.', writeBackPlan: [] });
    const checkpoint = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: submitted.snapshot.version, kind: 'baseline', commit: currentCommit, reviewId: revalidation.review.reviewId });
    expect(checkpoint.checkpoint.reviewId).toBe(revalidation.review.reviewId);
    expect(checkpoint.checkpoint.commit).toBe(currentCommit);
    expect(checkpoint.snapshot.state.revalidationHistory).toHaveLength(1);
    expect(checkpoint.snapshot.state.delegations).toEqual([]);
  });

  it('associates only exact Sync model outputs while preserving original execution evidence', async () => {
    const baseline = await establishBaseline();
    const delegation = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'validate model Sync association');
    const run = await successfulRun(delegation.snapshot.version, delegation.delegation.delegationId);
    const delivered = await save(delegation.delegation.delegationId, run.snapshot.version);
    const planned = await plan(delivered.snapshot.version, [delegation.delegation.delegationId], [run.verification.evidenceId]);
    const completed = await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'The implementation is covered by the captured successful verification.' });
    const successfulCheckpoint = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: completed.snapshot.version, kind: 'successful', commit: await commit('quality completion') });
    const checkpointEvent = (await readQualityStore(changeDir)).log.find(event => event.operation === 'checkpoint.successful')!;
    expect((checkpointEvent.payload as any).checkpoint).toMatchObject({
      checkpointId: successfulCheckpoint.checkpoint.checkpointId,
      commit: successfulCheckpoint.checkpoint.commit,
      planId: completed.conclusion.planId,
      manifest: { hash: expect.any(String), entries: expect.any(Array) },
    });

    const outputPath = '.xirang/model/elements/sync-result.md';
    const postimage = Buffer.from('---\\nentity: element-declaration\\nidentity: sync-result\\nkind: requirement\\n---\\n', 'utf8');
    const output = { path: outputPath, action: 'write' as const, preimage: null, postimage };
    const captured = await captureSyncAssociation(changeDir, root, [output]);
    expect(captured).not.toBeNull();
    const evidenceBefore = (await readQualityStore(changeDir)).snapshot.state.verifications;
    await fs.mkdir(path.dirname(path.join(root, outputPath)), { recursive: true });
    await fs.writeFile(path.join(root, outputPath), postimage);
    await persistSyncAssociation(captured);

    expect((await readQualityCompletion(changeDir, root)).status).toBe('all_done');
    const history = await readQualityStore(changeDir);
    expect((history.log.find(event => event.operation === 'sync.associate')!.payload as any).association).toMatchObject({
      associationId: expect.any(String),
      planId: completed.conclusion.planId,
      successfulCheckpointId: expect.any(String),
      beforeManifest: { hash: expect.any(String), entries: expect.any(Array) },
      afterManifest: { hash: expect.any(String), entries: expect.any(Array) },
      outputs: [{ path: outputPath, action: 'write' }],
    });
    const evidenceAfter = history.snapshot.state.verifications;
    expect(evidenceAfter).toEqual(evidenceBefore);
    await fs.writeFile(path.join(root, 'src/app.ts'), 'external implementation change\\n');
    const externalDrift = await readQualityCompletion(changeDir, root);
    expect(externalDrift.status).not.toBe('all_done');
    expect(externalDrift.gaps).toContain('CODE_CHANGED_AFTER_PLAN');
  });

  it('projects missing v2 baseline as needs_review and rejects legacy snapshots without rewriting them', async () => {
    const initial = await readQualityCompletion(changeDir, root);
    expect(initial.status).toBe('needs_review');
    expect(initial.gaps).toContain('BASELINE_REVIEW_AND_CHECKPOINT_REQUIRED');

    const snapshotPath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const legacy = JSON.stringify({ kind: 'review', timestamp: '2026-05-01T00:00:00.000Z', result: 'PASS', issues: [], tasksFileHash: null, verificationContext: { contractVersion: '1.0', evidenceFiles: [], evidenceFingerprint: 'x' } });
    await fs.writeFile(snapshotPath, legacy);
    await fs.writeFile(logPath, `${legacy}\\n`);
    const beforeSnapshot = await fs.readFile(snapshotPath);
    const beforeLog = await fs.readFile(logPath);
    const unsupported = await readQualityCompletion(changeDir, root);
    expect(unsupported.unsupported).toBe(true);
    expect(unsupported.status).not.toBe('all_done');
    expect(await fs.readFile(snapshotPath)).toEqual(beforeSnapshot);
    expect(await fs.readFile(logPath)).toEqual(beforeLog);
  });

  it('allows cumulative delegations and reuses unaffected S1 evidence with a separate S2 applicability decision', async () => {
    const baseline = await establishBaseline();
    const first = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'optimization A');
    const testA = await successfulRun(first.snapshot.version, first.delegation.delegationId);
    const deliveredA = await save(first.delegation.delegationId, testA.snapshot.version);
    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 2; // independent B\n');
    const commitB = await commit('independent B');
    const second = await delegate(deliveredA.snapshot.version, baseline.review.reviewId, commitB, 'optimization B');
    const testB = await successfulRun(second.snapshot.version, second.delegation.delegationId);
    const deliveredB = await save(second.delegation.delegationId, testB.snapshot.version);
    const current = await buildCodeManifest(root);
    const planned = await plan(deliveredB.snapshot.version, [first.delegation.delegationId, second.delegation.delegationId], [testA.verification.evidenceId, testB.verification.evidenceId], {
      applicability: [{ evidenceId: testA.verification.evidenceId, scope: 'behavior covered by A', differenceBasis: 'Only an independent exported constant changed in B.', reason: 'B does not touch A behavior or dependencies.', affected: false }],
    });
    expect(planned.plan.manifest.hash).toBe(current.hash);
    const replanned = await plan(planned.snapshot.version, [first.delegation.delegationId, second.delegation.delegationId], [testA.verification.evidenceId, testB.verification.evidenceId], {
      applicability: [{ evidenceId: testA.verification.evidenceId, scope: 'behavior covered by A', differenceBasis: 'Only an independent exported constant changed in B.', reason: 'B does not touch A behavior or dependencies.', affected: false }],
      reasons: 'Reassessed cumulative verification; no full run or additional Review is required.',
    });
    const result = await completeOptimization({ changeDir, projectRoot: root, expectedVersion: replanned.snapshot.version, planId: replanned.plan.planId, reasons: 'All required current and unaffected evidence has been assessed.' });
    const history = await readQualityStore(changeDir);
    const plans = history.log.filter(event => event.operation === 'completion.plan');
    expect((plans[0].payload as any).plan.reasons).toContain('local behavior');
    expect((plans[0].payload as any).plan.manifest).toMatchObject({ hash: expect.any(String), entries: expect.any(Array) });
    expect((plans[1].payload as any).plan.reasons).toContain('Reassessed cumulative');
    expect((history.log.find(event => event.operation === 'completion.complete')!.payload as any).conclusion.reasons).toContain('unaffected evidence');
    expect(result.conclusion.complete).toBe(true);
    const readiness = await evaluateCompletion(changeDir, root);
    expect(readiness.status).toBe('needs_optimize');
    expect(readiness.gaps).toContain('SUCCESSFUL_CHECKPOINT_NOT_RECORDED');
    const successful = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: result.snapshot.version, kind: 'successful', commit: commitB });
    expect((await evaluateCompletion(changeDir, root)).status).toBe('all_done');
    const successfulCheckpointEvent = (await readQualityStore(changeDir)).log.find(event => event.operation === 'checkpoint.successful')!;
    expect((successfulCheckpointEvent.payload as any).checkpoint).toMatchObject({
      checkpointId: successful.checkpoint.checkpointId,
      commit: commitB,
      planId: replanned.plan.planId,
      manifest: { hash: expect.any(String), entries: expect.any(Array) },
    });
    expect(successful.checkpoint.planId).toBe(replanned.plan.planId);
    const originalA = (await readQualityStore(changeDir)).snapshot.state.verifications.find(item => item.evidenceId === testA.verification.evidenceId)!;
    expect(originalA.afterManifest.hash).not.toBe(current.hash);
    await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'HEAD-only'], { cwd: root });
    const afterHeadOnly = await evaluateCompletion(changeDir, root);
    expect(afterHeadOnly.status).toBe('all_done');
    expect(afterHeadOnly.headDifference).toBe(true);
    expect(afterHeadOnly.changedFiles).toEqual(['src/app.ts']);
  });

  it('allows the only successful test to remain applicable from S1 after an independent S2 documentation change', async () => {
    const baseline = await establishBaseline();
    const delegation = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'local optimization');
    const testAtS1 = await successfulRun(delegation.snapshot.version, delegation.delegation.delegationId);
    const delivered = await save(delegation.delegation.delegationId, testAtS1.snapshot.version);
    await fs.writeFile(path.join(root, 'NOTES.md'), 'Independent documentation update.\\n');
    const currentCommit = await commit('unrelated docs update');
    const planned = await plan(delivered.snapshot.version, [delegation.delegation.delegationId], [testAtS1.verification.evidenceId], {
      applicability: [{ evidenceId: testAtS1.verification.evidenceId, scope: 'optimized source behavior', differenceBasis: 'Manifest delta is limited to NOTES.md.', reason: 'Documentation does not affect the tested implementation.', affected: false }],
    });
    await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'The one successful test remains applicable; no additional Review is required.' });
    await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version + 1, kind: 'successful', commit: currentCommit });
    expect((await evaluateCompletion(changeDir, root)).status).toBe('all_done');
    expect((await readQualityStore(changeDir)).snapshot.state.verifications[0].afterManifest.hash).not.toBe(planned.plan.manifest.hash);
  });

  it('rejects affected-as-unaffected claims, failing evidence, and code changes after a plan', async () => {
    const baseline = await establishBaseline();
    const first = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'optimization');
    const bad = await executeVerification({ changeDir, projectRoot: root, expectedVersion: first.snapshot.version, delegationId: first.delegation.delegationId, argv: [process.execPath, '-e', 'process.exit(4)'] });
    await save(first.delegation.delegationId, bad.snapshot.version);
    await expect(plan(bad.snapshot.version + 1, [first.delegation.delegationId], [bad.verification.evidenceId], {
      applicability: [{ evidenceId: bad.verification.evidenceId, scope: 'failed test', differenceBasis: 'none', reason: 'affected', affected: true } as never],
    })).rejects.toMatchObject({ code: 'INVALID_APPLICABILITY' });
    const failedPlan = await plan(bad.snapshot.version + 1, [first.delegation.delegationId], [bad.verification.evidenceId]);
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: failedPlan.snapshot.version, planId: failedPlan.plan.planId, reasons: 'must reject failed test evidence' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
    const good = await successfulRun(failedPlan.snapshot.version, first.delegation.delegationId);
    const delivered = await save(first.delegation.delegationId, good.snapshot.version);
    const planned = await plan(delivered.snapshot.version, [first.delegation.delegationId], [good.verification.evidenceId]);
    await fs.writeFile(path.join(root, 'src/app.ts'), 'changed after plan\n');
    expect((await evaluateCompletion(changeDir, root)).gaps).toContain('CODE_CHANGED_AFTER_PLAN');
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'complete' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
  });

  it('accepts an incremental Review linked to A as unaffected by a later independent B delegation', async () => {
    const baseline = await establishBaseline();
    const a = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'optimization A');
    const aTest = await successfulRun(a.snapshot.version, a.delegation.delegationId);
    const aDelivery = await save(a.delegation.delegationId, aTest.snapshot.version);
    const reviewStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: aDelivery.snapshot.version, scope: 'incremental', assignment: 'Review A behavior only', delegationIds: [a.delegation.delegationId] });
    const aReview = await submitReview({ changeDir, projectRoot: root, reviewId: reviewStart.review.reviewId, expectedVersion: reviewStart.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'A reviewed.', writeBackPlan: [] });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 2; // B is independent\\n');
    const bCommit = await commit('optimization B');
    const b = await delegate(aReview.snapshot.version, baseline.review.reviewId, bCommit, 'optimization B');
    const bTest = await successfulRun(b.snapshot.version, b.delegation.delegationId);
    const bDelivery = await save(b.delegation.delegationId, bTest.snapshot.version);
    const planned = await plan(bDelivery.snapshot.version, [a.delegation.delegationId, b.delegation.delegationId], [bTest.verification.evidenceId], {
      requiredReviewIds: [aReview.review.reviewId],
      applicability: [{ reviewId: aReview.review.reviewId, scope: 'optimization A only', differenceBasis: 'B changed no A dependency.', reason: 'A review scope remains unaffected.', affected: false }],
    });
    const result = await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'A review remains applicable; B has current successful tests.' });
    expect(result.conclusion.complete).toBe(true);
  });

  it('requires a correctly scoped defect-repair Review and passing incremental Reviews', async () => {
    const baseline = await establishBaseline();
    const first = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'repair and optimize');
    const run = await successfulRun(first.snapshot.version, first.delegation.delegationId);
    const delivered = await save(first.delegation.delegationId, run.snapshot.version);
    const wrongStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: delivered.snapshot.version, scope: 'incremental', assignment: 'review defect repair', delegationIds: [first.delegation.delegationId] });
    const wrong = await submitReview({ changeDir, projectRoot: root, reviewId: wrongStart.review.reviewId, expectedVersion: wrongStart.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'pass', writeBackPlan: [] });
    const wrongPlan = await plan(wrong.snapshot.version, [first.delegation.delegationId], [run.verification.evidenceId], {
      baselineDefects: [{ problem: 'preexisting correctness defect', repairScope: 'review defect repair', repairEvidenceIds: [run.verification.evidenceId], reviewId: wrong.review.reviewId }],
    });
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: wrongPlan.snapshot.version, planId: wrongPlan.plan.planId, reasons: 'wrong scope must block' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
    const defectStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: wrongPlan.snapshot.version, scope: 'defect-repair', assignment: 'verify repaired baseline defect', delegationIds: [first.delegation.delegationId] });
    const defect = await submitReview({ changeDir, projectRoot: root, reviewId: defectStart.review.reviewId, expectedVersion: defectStart.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'repair independently reviewed', writeBackPlan: [] });
    const incrementalStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: defect.snapshot.version, scope: 'incremental', assignment: 'review optimization', delegationIds: [first.delegation.delegationId] });
    const failedReview = await submitReview({ changeDir, projectRoot: root, reviewId: incrementalStart.review.reviewId, expectedVersion: incrementalStart.snapshot.version, result: 'FAIL_NEEDS_CORRECTIONS', issues: [{ severity: 'CRITICAL', message: 'regression' }], evidenceFiles: ['src/app.ts'], summary: 'failed', writeBackPlan: [{ action: 'append_correction', correctionType: 'code_fix', summary: 'repair regression' }] }, { writeBack: async () => {} });
    const blockedPlan = await plan(failedReview.snapshot.version, [first.delegation.delegationId], [run.verification.evidenceId], {
      requiredReviewIds: [failedReview.review.reviewId],       baselineDefects: [{ problem: 'preexisting correctness defect', repairScope: 'verify repaired baseline defect', repairEvidenceIds: [run.verification.evidenceId], reviewId: defect.review.reviewId }],
    });
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: blockedPlan.snapshot.version, planId: blockedPlan.plan.planId, reasons: 'required review failed' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'repaired and optimized\n');
    const fixedTest = await successfulRun(blockedPlan.snapshot.version, first.delegation.delegationId, 'defect-repair');
    const deliveredAgain = await save(first.delegation.delegationId, fixedTest.snapshot.version);
    const freshReviewStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: deliveredAgain.snapshot.version, scope: 'incremental', assignment: 'review repaired optimization', delegationIds: [first.delegation.delegationId] });
    const freshReview = await submitReview({ changeDir, projectRoot: root, reviewId: freshReviewStart.review.reviewId, expectedVersion: freshReviewStart.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'repair reviewed', writeBackPlan: [] });
    const fixedDelivery = await save(first.delegation.delegationId, freshReview.snapshot.version);
    await plan(fixedDelivery.snapshot.version, [first.delegation.delegationId], [fixedTest.verification.evidenceId], {
      requiredReviewIds: [freshReview.review.reviewId], baselineDefects: [{ problem: 'preexisting correctness defect', repairScope: 'verify repaired baseline defect', repairEvidenceIds: [fixedTest.verification.evidenceId], reviewId: defect.review.reviewId }],
    });
  });

  it('allows a defect-repair Review scoped to A while independent delegation B is tested separately', async () => {
    const baseline = await establishBaseline();
    const a = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'repair defect A');
    const repairTest = await successfulRun(a.snapshot.version, a.delegation.delegationId, 'defect-repair');
    const aDelivered = await save(a.delegation.delegationId, repairTest.snapshot.version);
    const repairScope = 'Verify repair of defect A only';
    const repairStart = await beginReview({ changeDir, projectRoot: root, expectedVersion: aDelivered.snapshot.version, scope: 'defect-repair', assignment: repairScope, delegationIds: [a.delegation.delegationId] });
    const repairReview = await submitReview({ changeDir, projectRoot: root, reviewId: repairStart.review.reviewId, expectedVersion: repairStart.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'A defect repair reviewed.', writeBackPlan: [] });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'B is independent of A defect repair\\n');
    const bCommit = await commit('independent B');
    const b = await delegate(repairReview.snapshot.version, baseline.review.reviewId, bCommit, 'optimization B');
    const bTest = await successfulRun(b.snapshot.version, b.delegation.delegationId);
    const bDelivered = await save(b.delegation.delegationId, bTest.snapshot.version);
    const planned = await plan(bDelivered.snapshot.version, [a.delegation.delegationId, b.delegation.delegationId], [repairTest.verification.evidenceId, bTest.verification.evidenceId], {
      baselineDefects: [{ problem: 'confirmed defect A', repairScope, repairEvidenceIds: [repairTest.verification.evidenceId], reviewId: repairReview.review.reviewId }],
      applicability: [
        { evidenceId: repairTest.verification.evidenceId, scope: 'defect A tests', differenceBasis: 'B changed no A dependency.', reason: 'A test remains applicable.', affected: false },
        { reviewId: repairReview.review.reviewId, scope: repairScope, differenceBasis: 'B changed no A defect behavior.', reason: 'A review remains applicable.', affected: false },
      ],
    });
    const completed = await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'A targeted defect review plus B current tests cover the cumulative result.' });
    expect(completed.conclusion.complete).toBe(true);
  });

  it('links defect repair to its actual evidence scope and permits an explicitly scoped skip review', async () => {
    const baseline = await establishBaseline();
    const skipped = await (await import('../../../src/core/quality/engine.js')).skipDelegation(changeDir, 'Optimization explicitly skipped.', baseline.snapshot.version);
    const test = await successfulRun(skipped.version, undefined, 'defect-repair');
    const assignment = 'Verify repair of the confirmed parser defect';
    const begun = await beginReview({ changeDir, projectRoot: root, expectedVersion: test.snapshot.version, scope: 'defect-repair', assignment, delegationIds: [] });
    const reviewed = await submitReview({ changeDir, projectRoot: root, reviewId: begun.review.reviewId, expectedVersion: begun.snapshot.version, result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'Targeted defect repair verified.', writeBackPlan: [] });
    const planned = await plan(reviewed.snapshot.version, [], [test.verification.evidenceId], {
      baselineDefects: [{ problem: 'confirmed parser defect', repairScope: assignment, repairEvidenceIds: [test.verification.evidenceId], reviewId: reviewed.review.reviewId }],
    });
    await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'Optimization skip does not waive targeted defect verification.' });
  });

  it('blocks a pending required Review and missing required verification evidence', async () => {
    const baseline = await establishBaseline();
    const delegation = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'verify obligations');
    const test = await successfulRun(delegation.snapshot.version, delegation.delegation.delegationId);
    const delivered = await save(delegation.delegation.delegationId, test.snapshot.version);
    const pending = await beginReview({ changeDir, projectRoot: root, expectedVersion: delivered.snapshot.version, scope: 'incremental', assignment: 'Review changed behavior', delegationIds: [delegation.delegation.delegationId] });
    const pendingPlan = await plan(pending.snapshot.version, [delegation.delegation.delegationId], [test.verification.evidenceId], { requiredReviewIds: [pending.review.reviewId] });
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: pendingPlan.snapshot.version, planId: pendingPlan.plan.planId, reasons: 'review is not submitted' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
    const missingPlan = await plan(pendingPlan.snapshot.version, [delegation.delegation.delegationId], ['EVD-not-recorded']);
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: missingPlan.snapshot.version, planId: missingPlan.plan.planId, reasons: 'required run is missing' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
  });

  it('persists pending obligations but invalidates a plan after a later delegation save', async () => {
    const baseline = await establishBaseline();
    const delegation = await delegate(baseline.snapshot.version, baseline.review.reviewId, baseline.commit, 'pending delivery');
    const run = await successfulRun(delegation.snapshot.version, delegation.delegation.delegationId);
    const planned = await plan(run.snapshot.version, [delegation.delegation.delegationId], [run.verification.evidenceId]);
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'delivery is still pending' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
    const delivered = await save(delegation.delegation.delegationId, planned.snapshot.version);
    expect((await evaluateCompletion(changeDir, root)).gaps).toContain('DELEGATION_CHANGED_AFTER_PLAN');
    await expect(completeOptimization({ changeDir, projectRoot: root, expectedVersion: delivered.snapshot.version, planId: planned.plan.planId, reasons: 'stale plan' })).rejects.toMatchObject({ code: 'COMPLETION_NOT_READY' });
  });

  it('accepts only exact current-state commits for intermediate checkpoints', async () => {
    const baseline = await establishBaseline();
    await expect(recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: baseline.snapshot.version, kind: 'invalid' as never, commit: baseline.commit })).rejects.toMatchObject({ code: 'INVALID_CHECKPOINT_KIND' });
    await fs.writeFile(path.join(root, 'src/app.ts'), 'intermediate state\n');
    await expect(recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: baseline.snapshot.version, kind: 'intermediate', commit: baseline.commit })).rejects.toMatchObject({ code: 'CHECKPOINT_STATE_MISMATCH' });
    const intermediateCommit = await commit('intermediate checkpoint');
    const checkpoint = await recordCheckpoint({ changeDir, projectRoot: root, expectedVersion: baseline.snapshot.version, kind: 'intermediate', commit: intermediateCommit });
    expect(checkpoint.checkpoint.kind).toBe('intermediate');
    expect(checkpoint.checkpoint.manifest.hash).toBe((await buildCodeManifest(root)).hash);
  });

  it('requires every latest delegation save delivered and does not let an explicit skip waive testing', async () => {
    const baseline = await establishBaseline();
    const skipped = await (await import('../../../src/core/quality/engine.js')).skipDelegation(changeDir, 'Optimization disabled by explicit choice.', baseline.snapshot.version);
    await expect(plan(skipped.version, [], [])).rejects.toMatchObject({ code: 'REQUIRED_TEST_EVIDENCE' });
    const run = await successfulRun(skipped.version);
    const planned = await plan(run.snapshot.version, [], [run.verification.evidenceId]);
    await completeOptimization({ changeDir, projectRoot: root, expectedVersion: planned.snapshot.version, planId: planned.plan.planId, reasons: 'Optimization was explicitly skipped; mandatory test evidence passed.' });
  });
});
