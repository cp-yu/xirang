import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { completeOptimization, planCompletion, recordCheckpoint } from '../../src/core/quality/completion.js';
import { beginReview, executeVerification, readQualityStore, skipDelegation, submitReview } from '../../src/core/quality/engine.js';

const execFileAsync = promisify(execFile);

export async function createCompleteQualityFixture(root: string, changeDir: string): Promise<void> {
  await fs.mkdir(changeDir, { recursive: true });
  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  const source = path.join(root, 'src', 'quality-fixture.ts');
  try { await fs.access(source); }
  catch { await fs.writeFile(source, 'export const fixture = true;\n', 'utf8'); }

  try { await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: root }); }
  catch { await execFileAsync('git', ['init', '-q'], { cwd: root }); }
  await execFileAsync('git', ['config', 'user.name', 'Quality Fixture'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'quality-fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  const hasCommit = await execFileAsync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root }).then(() => true, () => false);
  const hasStagedChanges = await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: root }).then(() => false, () => true);
  if (!hasCommit || hasStagedChanges) await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'quality fixture baseline'], { cwd: root });
  const head = async () => (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();

  let store = await readQualityStore(changeDir).catch(() => undefined);
  if (store?.snapshot.state.checkpoints?.some(item => item.kind === 'successful')) return;
  const baselineStart = await beginReview({ changeDir, projectRoot: root, scope: 'baseline', assignment: 'independent quality fixture baseline review' });
  const baselineReview = await submitReview({
    changeDir,
    projectRoot: root,
    reviewId: baselineStart.review.reviewId,
    expectedVersion: baselineStart.snapshot.version,
    result: 'PASS',
    issues: [],
    evidenceFiles: ['src/quality-fixture.ts'],
    summary: 'Test fixture injects a passing independent baseline verdict.',
    writeBackPlan: [],
  });
  const baseline = await recordCheckpoint({
    changeDir,
    projectRoot: root,
    expectedVersion: baselineReview.snapshot.version,
    kind: 'baseline',
    commit: await head(),
    reviewId: baselineReview.review.reviewId,
  });
  const skipped = await skipDelegation(changeDir, 'Optimization explicitly skipped in fixture setup.', baseline.snapshot.version);
  const verification = await executeVerification({
    changeDir,
    projectRoot: root,
    expectedVersion: skipped.version,
    scope: 'fixture process verification',
    argv: [process.execPath, '-e', 'process.stdout.write("fixture verification passed")'],
  });
  const planned = await planCompletion({
    changeDir,
    projectRoot: root,
    expectedVersion: verification.snapshot.version,
    delegationIds: [],
    verificationPlan: [{ scope: 'fixture process verification', reason: 'Capture one actual successful process result.' }],
    reasons: 'Fixture completion uses an explicit skip and actual process evidence.',
    requiredEvidenceIds: [verification.verification.evidenceId],
    requiredReviewIds: [],
    baselineDefects: [],
    applicability: [],
    recoveryConfirmed: true,
    unresolvedIssues: [],
  });
  const conclusion = await completeOptimization({
    changeDir,
    projectRoot: root,
    expectedVersion: planned.snapshot.version,
    planId: planned.plan.planId,
    reasons: 'The actual captured fixture verification satisfies the declared check.',
  });
  await recordCheckpoint({
    changeDir,
    projectRoot: root,
    expectedVersion: conclusion.snapshot.version,
    kind: 'successful',
    commit: await head(),
  });
}

export async function createBaselineOnlyQualityFixture(root: string, changeDir: string): Promise<void> {
  await createCompleteQualityFixture(root, changeDir);
  const store = await readQualityStore(changeDir);
  const { completion: _completion, checkpoints, ...state } = store.snapshot.state;
  const baselineOnly = { ...state, checkpoints: checkpoints?.filter(item => item.kind === 'baseline') };
  const { transactQuality } = await import('../../src/core/quality/engine.js');
  await transactQuality(changeDir, store.snapshot.version, 'test.fixture.incomplete', {}, baselineOnly);
}
