import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { runCLI } from '../helpers/run-cli.js';
import { readQualityStore } from '../../src/core/quality/engine.js';

const execFileAsync = promisify(execFile);
const logFile = '/tmp/xirang-public-cli-vitest.log';

describe('quality v2 public CLI', () => {
  let root: string;
  let changeDir: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-public-cli-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(path.join(root, 'src'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(root, 'runner.mjs'), 'process.stdout.write(process.argv[2]);\n');
    await fs.writeFile(path.join(root, 'runner-fail.mjs'), 'process.stdout.write("kept"); process.stderr.write("failure"); process.exitCode = 7;\n');
    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 1;\n');
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] completed task\n');
    await git('init', '-q');
    await git('config', 'user.name', 'Quality Test');
    await git('config', 'user.email', 'quality@example.com');
    await git('config', 'core.autocrlf', 'false');
    await commit('initial');
    await fs.appendFile(logFile, `FIXTURE ${root}\n`);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  async function git(...args: string[]): Promise<string> {
    return (await execFileAsync('git', args, { cwd: root })).stdout.trim();
  }
  async function commit(message: string): Promise<string> {
    await git('add', '-A');
    await git('commit', '--allow-empty', '-qm', message);
    return git('rev-parse', 'HEAD');
  }
  async function cli(args: string[], input?: string) {
    const result = await runCLI(['quality', ...args], { cwd: root, input });
    await fs.appendFile(logFile, `${result.exitCode} ${result.stdout.trim()} ${result.stderr.trim()}\n`);
    return result;
  }
  async function json(result: Awaited<ReturnType<typeof cli>>) {
    expect(result.stdout, result.stderr).not.toBe('');
    return JSON.parse(result.stdout.trim());
  }
  async function beginBaseline() {
    const begin = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ assignment: 'Review complete change' })]);
    expect(begin.exitCode, begin.stdout).toBe(0);
    const review = (await json(begin)).review;
    const submitted = await cli(['review', 'c1', '--review', review.reviewId, '--version', '1', '--json', '--input', JSON.stringify({
      result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'Baseline is acceptable.',
    })]);
    expect(submitted.exitCode, submitted.stdout).toBe(0);
    return { review: (await json(submitted)).review, version: 2 };
  }

  it('requires an explicit current version and valid baseline revalidation payload', async () => {
    const ordinary = await cli(['review', 'c1', '--begin', '--version', '0', '--json', '--input', JSON.stringify({ assignment: 'ordinary review' })]);
    expect(ordinary.exitCode).toBe(2);
    expect((await json(ordinary)).code).toBe('INVALID_REVIEW_COMMAND');

    const missingVersion = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ assignment: 'fresh review', revalidation: { reason: 'explicit request', previousFlowStopped: true } })]);
    expect(missingVersion.exitCode).toBe(2);
    expect((await json(missingVersion)).code).toBe('INVALID_QUALITY_VERSION');

    const oldBegin = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ assignment: 'prior flow' })]);
    expect(oldBegin.exitCode).toBe(0);
    const invalid = await cli(['review', 'c1', '--begin', '--version', '1', '--json', '--input', JSON.stringify({ scope: 'incremental', assignment: 'fresh review', delegationIds: [], revalidation: { reason: 'explicit request', previousFlowStopped: false } })]);
    expect(invalid.exitCode).toBe(2);
    const valid = await cli(['review', 'c1', '--begin', '--version', '1', '--json', '--input', JSON.stringify({ scope: 'baseline', assignment: 'fresh review', revalidation: { reason: 'The earlier evidence is no longer trusted.', previousFlowStopped: true } })]);
    expect(valid.exitCode, valid.stdout).toBe(0);
    const begun = await json(valid);
    expect(begun.review.associationId).toEqual(expect.any(String));
    const status = await json(await cli(['status', 'c1', '--json']));
    expect(status).toMatchObject({ status: 'needs_review', activeAssociationId: begun.review.associationId, reviews: [begun.review] });
    expect(status.revalidationHistory).toHaveLength(1);
  });

  it('preserves global version and color options for unrelated commands', async () => {
    const appVersion = await runCLI(['--version'], { cwd: root });
    expect(appVersion.exitCode).toBe(0);
    expect(appVersion.stdout.trim()).toBe('0.2.3');
    const beforeCommand = await runCLI(['--no-color', 'schemas', '--json'], { cwd: root });
    expect(beforeCommand.exitCode, beforeCommand.stderr).toBe(0);
    expect(() => JSON.parse(beforeCommand.stdout)).not.toThrow();
    const afterCommand = await runCLI(['schemas', '--json', '--no-color'], { cwd: root });
    expect(afterCommand.exitCode, afterCommand.stderr).toBe(0);
    expect(() => JSON.parse(afterCommand.stdout)).not.toThrow();
    const qualityBeforeSubcommand = await runCLI(['quality', '--no-color', 'status', 'c1', '--json'], { cwd: root });
    expect(qualityBeforeSubcommand.exitCode, qualityBeforeSubcommand.stderr).toBe(0);
    expect(() => JSON.parse(qualityBeforeSubcommand.stdout)).not.toThrow();
    const qualityAfterSubcommand = await runCLI(['quality', 'status', 'c1', '--no-color', '--json'], { cwd: root });
    expect(qualityAfterSubcommand.exitCode, qualityAfterSubcommand.stderr).toBe(0);
    expect(() => JSON.parse(qualityAfterSubcommand.stdout)).not.toThrow();
  });

  it('accepts file-backed input and leaves WARNING writeback untouched', async () => {
    const inputPath = path.join(root, 'review-input.json');
    await fs.writeFile(inputPath, JSON.stringify({ assignment: 'Review current change' }));
    const begin = await cli(['review', 'c1', '--begin', '--json', '--from', 'review-input.json']);
    expect(begin.exitCode, begin.stdout).toBe(0);
    const reviewId = (await json(begin)).review.reviewId;
    const beforeTasks = await fs.readFile(path.join(changeDir, 'tasks.md'));
    const payloadPath = path.join(root, 'review-submit.json');
    await fs.writeFile(payloadPath, JSON.stringify({ result: 'PASS_WITH_WARNINGS', issues: [{ severity: 'WARNING', message: 'Non-blocking note.' }], evidenceFiles: ['src/app.ts'], summary: 'Current behavior is acceptable.', writeBackPlan: [] }));
    const submitted = await cli(['review', 'c1', '--review', reviewId, '--version', '1', '--json', '--from', 'review-submit.json']);
    expect(submitted.exitCode, submitted.stdout).toBe(0);
    expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(beforeTasks);
  });

  it('accepts explicit user refusal when optimization is enabled', async () => {
    const missingVersion = await cli(['delegation', 'c1', '--json', '--input', JSON.stringify({ action: 'skip', basis: 'user_refusal', reason: 'The user declined an optimization delegation.' })]);
    expect(missingVersion.exitCode).toBe(2);
    expect((await json(missingVersion)).code).toBe('INVALID_QUALITY_VERSION');
    const skipped = await cli(['delegation', 'c1', '--version', '0', '--json', '--input', JSON.stringify({ action: 'skip', basis: 'user_refusal', reason: 'The user declined an optimization delegation.' })]);
    expect(skipped.exitCode, skipped.stdout).toBe(0);
    const snapshot = await readQualityStore(changeDir);
    expect(snapshot.snapshot.state.skip?.reason).toContain('user_refusal:');
  });

  it('status on a missing record is read-only and reports needs_review', async () => {
    const before = await fs.readdir(changeDir);
    const result = await cli(['status', 'c1', '--json']);
    expect(result.exitCode).toBe(0);
    const payload = await json(result);
    expect(payload).toMatchObject({ ok: true, code: 'QUALITY_STATUS', status: 'needs_review', version: 0 });
    expect(payload.gaps).toContain('BASELINE_REVIEW_AND_CHECKPOINT_REQUIRED');
    expect(await fs.readdir(changeDir)).toEqual(before);
  });

  it('runs baseline, delegation, real verification, conclusion, successful checkpoint, status and seal', async () => {
    const baseline = await beginBaseline();
    const baselineCommit = await commit('reviewed baseline');
    const checkpoint = await cli(['checkpoint', 'c1', '--kind', 'baseline', '--commit', baselineCommit, '--review', baseline.review.reviewId, '--version', '2', '--json']);
    expect(checkpoint.exitCode, checkpoint.stdout).toBe(0);
    const started = await cli(['delegation', 'c1', '--version', '3', '--json', '--input', JSON.stringify({
      action: 'start', scope: 'Optimize local lookup', baselineReviewId: baseline.review.reviewId, recoveryCommit: baselineCommit,
    })]);
    expect(started.exitCode, started.stdout).toBe(0);
    const delegationId = (await json(started)).delegation.delegationId;
    await fs.writeFile(path.join(root, 'runner-flags.mjs'), 'process.stdout.write(JSON.stringify(process.argv.slice(2)));\n');
    const verified = await cli(['verification', 'c1', '--json', '--delegation', delegationId, '--scope', 'focused tests', '--', process.execPath, 'runner-flags.mjs', '--no-color', '--version', '--json']);
    expect(verified.exitCode, verified.stdout).toBe(0);
    const evidence = (await json(verified)).verification;
    expect(evidence.argv.slice(-3)).toEqual(['--no-color', '--version', '--json']);
    expect(JSON.parse(evidence.stdout)).toEqual(['--no-color', '--version', '--json']);
    const saved = await cli(['delegation', 'c1', '--version', '5', '--json', '--input', JSON.stringify({
      action: 'save', delegationId, report: 'Implementation delivered with no unresolved issues.', evidenceIds: [evidence.evidenceId], delivery: 'delivered', unresolved: false,
    })]);
    expect(saved.exitCode, saved.stdout).toBe(0);
    const plan = await cli(['conclusion', 'c1', '--version', '6', '--json', '--input', JSON.stringify({
      action: 'plan', delegationIds: [delegationId], verificationPlan: [{ scope: 'focused tests', reason: 'Covers modified lookup behavior.' }],
      reasons: 'The local change is covered and recovery is confirmed.', requiredEvidenceIds: [evidence.evidenceId], requiredReviewIds: [],
      baselineDefects: [], applicability: [], recoveryConfirmed: true, unresolvedIssues: [],
    })]);
    expect(plan.exitCode, plan.stdout).toBe(0);
    const planId = (await json(plan)).plan.planId;
    const completed = await cli(['conclusion', 'c1', '--version', '7', '--json', '--input', JSON.stringify({ action: 'complete', planId, reasons: 'The required evidence is current.' })]);
    expect(completed.exitCode, completed.stdout).toBe(0);
    const finalCommit = await commit('final implementation');
    const successful = await cli(['checkpoint', 'c1', '--kind', 'successful', '--commit', finalCommit, '--version', '8', '--json']);
    expect(successful.exitCode, successful.stdout).toBe(0);
    const status = await cli(['status', 'c1', '--json']);
    expect((await json(status)).status).toBe('all_done');
    const seal = await cli(['seal', 'c1', '--json']);
    expect(seal.exitCode, seal.stdout).toBe(0);
    expect((await json(seal)).code).toBe('SEALED');
  });

  it('retains nonzero verification output as failed evidence', async () => {
    const failed = await cli(['verification', 'c1', '--json', '--', process.execPath, 'runner-fail.mjs']);
    expect(failed.exitCode).toBe(1);
    const payload = await json(failed);
    expect(payload.verification).toMatchObject({ exitCode: 7, stdout: 'kept', stderr: 'failure', success: false });
    await expect(fs.access(path.join(root, payload.verification.evidenceFile))).resolves.toBeUndefined();
  });

  it('writes CRITICAL task corrections before storing Review and records final hash', async () => {
    const begin = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ scope: 'baseline', assignment: 'Review current change' })]);
    const reviewId = (await json(begin)).review.reviewId;
    const tasksPath = path.join(changeDir, 'tasks.md');
    const payload = { result: 'FAIL_NEEDS_CORRECTIONS', issues: [{ severity: 'CRITICAL', message: 'Missing correction.' }], evidenceFiles: ['src/app.ts'], summary: { correctness: 'needs correction' }, writeBackPlan: [
      { taskLine: '- [x] completed task', action: 'unmark', correctionType: 'code_fix', summary: 'Missing behavior', nextAction: 'Implement missing behavior' },
      { taskLine: null, action: 'append_correction', correctionType: 'code_fix', summary: 'Fix missing behavior', nextAction: 'Implement the missing behavior' },
    ] };
    const submitted = await cli(['review', 'c1', '--review', reviewId, '--version', '1', '--json', '--input', JSON.stringify(payload)]);
    expect(submitted.exitCode, submitted.stdout).toBe(0);
    const tasks = await fs.readFile(tasksPath, 'utf8');
    expect(tasks).toContain('- [ ] completed task');
    expect(tasks).toContain('## Required Corrections');
    expect(tasks).toContain('- [ ] [code_fix] Fix missing behavior');
    const snapshot = await readQualityStore(changeDir);
    expect(snapshot.snapshot.state.reviews[0].tasksFileHash).toBe((await import('node:crypto')).createHash('sha256').update(await fs.readFile(tasksPath)).digest('hex'));
    expect(snapshot.snapshot.state.reviews[0].result).toBe('FAIL_NEEDS_CORRECTIONS');
  });

  it('routes a stale baseline review back to review before the baseline checkpoint', async () => {
    await beginBaseline();
    const currentStatus = await cli(['status', 'c1', '--json']);
    expect((await json(currentStatus)).allowedNextOperations).toEqual(['checkpoint', 'status']);

    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 2;\n');

    const status = await cli(['status', 'c1', '--json']);
    const payload = await json(status);
    expect(payload.allowedNextOperations).toEqual(['review', 'status']);
    expect(payload.allowedNextOperations).not.toContain('checkpoint');
  });

  it('keeps optimization routing after a baseline checkpoint despite later code changes', async () => {
    const baseline = await beginBaseline();
    const baselineCommit = await commit('reviewed baseline');
    const checkpoint = await cli(['checkpoint', 'c1', '--kind', 'baseline', '--commit', baselineCommit, '--review', baseline.review.reviewId, '--version', '2', '--json']);
    expect(checkpoint.exitCode, checkpoint.stdout).toBe(0);
    await fs.writeFile(path.join(root, 'src/app.ts'), 'export const value = 2;\n');

    const status = await cli(['status', 'c1', '--json']);
    const payload = await json(status);
    expect(payload.allowedNextOperations).toContain('delegation');
    expect(payload.allowedNextOperations).not.toContain('review');
  });

  it('rejects stale and ambiguous unmark entries atomically before Review writeback', async () => {
    const cases = [
      { taskLine: '- [x] stale task', tasks: '- [x] completed task\n' },
      { taskLine: '- [x] duplicated task', tasks: '- [x] completed task\n- [x] duplicated task\n- [x] duplicated task\n' },
    ];
    for (const [index, testCase] of cases.entries()) {
      await fs.writeFile(path.join(changeDir, 'tasks.md'), testCase.tasks);
      const begin = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ assignment: `Review stale writeback ${index}` })]);
      const reviewId = (await json(begin)).review.reviewId;
      const snapshotPath = path.join(changeDir, '.quality-state.json');
      const logPath = path.join(changeDir, '.quality-log.jsonl');
      const beforeTasks = await fs.readFile(path.join(changeDir, 'tasks.md'));
      const beforeSnapshot = await fs.readFile(snapshotPath);
      const beforeLog = await fs.readFile(logPath);
      const payload = {
        result: 'FAIL_NEEDS_CORRECTIONS',
        issues: [{ severity: 'CRITICAL', message: 'Required correction was not applied.' }],
        evidenceFiles: ['src/app.ts'], summary: 'Required correction remains.',
        writeBackPlan: [
          { taskLine: '- [x] completed task', action: 'unmark', correctionType: 'code_fix', summary: 'Unmark the valid item first.' },
          { taskLine: testCase.taskLine, action: 'unmark', correctionType: 'code_fix', summary: 'Reject the stale or ambiguous item.' },
          { taskLine: null, action: 'append_correction', correctionType: 'code_fix', summary: 'Do not append after an invalid unmark.' },
        ],
      };
      const submitted = await cli(['review', 'c1', '--review', reviewId, '--version', String(index + 1), '--json', '--input', JSON.stringify(payload)]);
      expect(submitted.exitCode).not.toBe(0);
      expect((await json(submitted)).code).toBe('INVALID_WRITEBACK_PLAN');
      expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(beforeTasks);
      expect(await fs.readFile(snapshotPath)).toEqual(beforeSnapshot);
      expect(await fs.readFile(logPath)).toEqual(beforeLog);
    }
  });

  it('preserves snapshot and log bytes on stale submissions and rejects old payloads', async () => {
    const baseline = await beginBaseline();
    const snapshotPath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const beforeSnapshot = await fs.readFile(snapshotPath);
    const beforeLog = await fs.readFile(logPath);
    const beforeTasks = await fs.readFile(path.join(changeDir, 'tasks.md'));
    const stale = await cli(['review', 'c1', '--review', baseline.review.reviewId, '--version', '1', '--json', '--input', JSON.stringify({ result: 'PASS', issues: [], evidenceFiles: ['src/app.ts'], summary: 'stale' })]);
    expect(stale.exitCode).toBe(2);
    expect(await fs.readFile(snapshotPath)).toEqual(beforeSnapshot);
    expect(await fs.readFile(logPath)).toEqual(beforeLog);
    expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(beforeTasks);
    const staleCritical = await cli(['review', 'c1', '--review', baseline.review.reviewId, '--version', '1', '--json', '--input', JSON.stringify({
      result: 'FAIL_NEEDS_CORRECTIONS', issues: [{ severity: 'CRITICAL', message: 'stale correction' }], evidenceFiles: ['src/app.ts'], summary: 'stale',
      writeBackPlan: [{ taskLine: null, action: 'append_correction', correctionType: 'code_fix', summary: 'Must not apply stale correction' }],
    })]);
    expect(staleCritical.exitCode).toBe(2);
    expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(beforeTasks);
    const oldPayload = await cli(['review', 'c1', '--begin', '--json', '--input', JSON.stringify({ directions: [] })]);
    expect(oldPayload.exitCode).toBe(2);
    expect(await fs.readFile(snapshotPath)).toEqual(beforeSnapshot);
    expect(await fs.readFile(logPath)).toEqual(beforeLog);
  });

  it('rejects old optimize payload and unsupported state without migration', async () => {
    const old = await cli(['optimize', 'c1', '--json', '--input', JSON.stringify({ directions: [] })]);
    expect(old.exitCode).toBe(2);
    expect((await json(old)).code).toBe('UNSUPPORTED_OPTIMIZATION_PROTOCOL');
    const snapshotPath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const oldState = Buffer.from(JSON.stringify({ contractVersion: 1, record: { kind: 'review' } }));
    const oldLog = Buffer.from('legacy log bytes\n');
    await fs.writeFile(snapshotPath, oldState);
    await fs.writeFile(logPath, oldLog);
    const result = await cli(['status', 'c1', '--json']);
    expect(result.exitCode).toBe(2);
    expect((await json(result)).code).toBe('UNSUPPORTED_QUALITY_VERSION');
    expect(await fs.readFile(snapshotPath)).toEqual(oldState);
    expect(await fs.readFile(logPath)).toEqual(oldLog);
  });

  it('blocks delegation when disabled but permits explicit skip', async () => {
    await fs.writeFile(path.join(root, '.xirang/config.yaml'), 'schema: semantic-model\noptimization:\n  enabled: false\n');
    const denied = await cli(['delegation', 'c1', '--version', '0', '--json', '--input', JSON.stringify({
      action: 'start', scope: 'optimization', baselineReviewId: 'REV-unknown', recoveryCommit: '0000000000000000000000000000000000000000',
    })]);
    expect(denied.exitCode).toBe(1);
    expect((await json(denied)).code).toBe('OPTIMIZATION_DISABLED');
    const skipped = await cli(['delegation', 'c1', '--version', '0', '--json', '--input', JSON.stringify({ action: 'skip', basis: 'disabled', reason: 'User declined optimization.' })]);
    expect(skipped.exitCode, skipped.stdout).toBe(0);
  });

  it('requires the full completion gate and rejects malformed checkpoint kinds', async () => {
    const missing = await cli(['seal', 'c1', '--json']);
    expect(missing.exitCode).toBe(1);
    expect((await json(missing)).gaps).toContain('BASELINE_REVIEW_AND_CHECKPOINT_REQUIRED');
    const missingFields = await cli(['checkpoint', 'c1', '--json']);
    expect(missingFields.exitCode).toBe(2);
    expect((await json(missingFields)).code).toBe('INVALID_CHECKPOINT_INPUT');
    const bad = await cli(['checkpoint', 'c1', '--kind', 'old-direction', '--commit', '0000000000000000000000000000000000000000', '--json']);
    expect(bad.exitCode).toBe(2);
  });
});
