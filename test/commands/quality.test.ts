import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { runCLI } from '../helpers/run-cli.js';
import {
  DIRECTION_STATUS_VALUES,
  DIRECTION_LEVEL_VALUES,
  REVIEW_RESULT_VALUES,
  STOP_REASON_VALUES,
} from '../../src/core/quality/validators.js';

const execFileAsync = promisify(execFile);

function reviewPayload(overrides: Record<string, unknown> = {}) {
  return { result: 'PASS', issues: [], evidenceFiles: ['src/a.ts'], ...overrides };
}

function direction(overrides: Record<string, unknown> = {}) {
  return {
    location: { files: ['src/a.ts'], symbols: ['a'] },
    opportunity: 'Repeated linear membership scan',
    impact: 'Avoid repeated scans of the same list',
    evidence: ['src/a.ts scans the list twice'],
    recommendation: 'Build a lookup set once',
    keyDesign: 'Build the set before the loop and keep output order',
    preservationConstraints: ['Preserve inputs, outputs, ordering, and errors'],
    implementationOutline: ['Build the lookup set', 'Replace repeated scans'],
    validation: ['Run the focused behavior test'],
    impactLevel: 'high',
    confidence: 'high',
    risk: 'low',
    cost: 'low',
    dependencies: [],
    priorityReason: 'Highest impact and confidence at the lowest risk',
    ...overrides,
  };
}

describe('xirang quality command', () => {
  let tempDir: string;
  let changeDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-cli-'));
    changeDir = path.join(tempDir, '.xirang', 'changes', 'c1');
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] task\n', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 1;\n', 'utf-8');
    await execFileAsync('git', ['init'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'Xirang Test'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'init'], { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeConfig(optimization: Record<string, unknown>): Promise<void> {
    await fs.writeFile(
      path.join(tempDir, '.xirang', 'config.yaml'),
      `optimization:\n${Object.entries(optimization).map(([key, value]) => `  ${key}: ${value}\n`).join('')}`,
      'utf-8'
    );
  }

  async function review(payload: Record<string, unknown> = reviewPayload()) {
    return runCLI(['quality', 'review', 'c1', '--json', '--input', JSON.stringify(payload)], {
      cwd: tempDir,
    });
  }

  async function optimize(payload: Record<string, unknown>) {
    return runCLI(['quality', 'optimize', 'c1', '--json', '--input', JSON.stringify(payload)], {
      cwd: tempDir,
    });
  }

  async function snapshot(): Promise<Record<string, any>> {
    return JSON.parse(await fs.readFile(path.join(changeDir, '.quality-state.json'), 'utf-8'));
  }

  async function directions(): Promise<Array<Record<string, any>>> {
    return (await snapshot()).optimization?.directions ?? [];
  }

  async function assignDirection(overrides: Record<string, unknown> = {}): Promise<string> {
    const round = await optimize({ directions: [direction(overrides)] });
    expect(round.exitCode, round.stdout).toBe(0);
    return JSON.parse(round.stdout).directions.at(-1).id;
  }

  it('records a review conclusion while the workspace is dirty', async () => {
    const result = await review();

    expect(result.exitCode, result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.state).toBe('clean');
    expect(payload.allowedNextOperations).toContain('optimize');
    expect((await snapshot()).result).toBe('PASS');
    expect(
      (await fs.readFile(path.join(changeDir, '.quality-log.jsonl'), 'utf-8')).trim().split('\n')
    ).toHaveLength(1);
  });

  it('rejects a second review while the recorded conclusion still matches the code', async () => {
    await review();
    const before = await fs.readFile(path.join(changeDir, '.quality-state.json'), 'utf-8');

    const second = await review();

    expect(second.exitCode, second.stdout).toBe(1);
    const payload = JSON.parse(second.stdout);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe('REVIEW_NOT_REQUIRED');
    expect(payload.allowedNextOperations).toContain('optimize');
    expect(await fs.readFile(path.join(changeDir, '.quality-state.json'), 'utf-8')).toBe(before);
  });

  it('reports invalid review input with actionable diagnostics', async () => {
    const result = await review({ issues: [], evidenceFiles: [] });

    expect(result.exitCode, result.stdout).toBe(2);
    const payload = JSON.parse(result.stdout);
    expect(payload.code).toBe('INVALID_INPUT');
    expect(payload.diagnostics[0]).toEqual({
      path: 'result',
      expected: REVIEW_RESULT_VALUES.join(' | '),
      actual: 'undefined',
      fix: expect.any(String),
    });
    await expect(fs.access(path.join(changeDir, '.quality-state.json'))).rejects.toThrow();
  });

  it('rejects CLI-managed fields in a review payload', async () => {
    const result = await review({ ...reviewPayload(), tasksFileHash: 'f'.repeat(64) });

    expect(result.exitCode, result.stdout).toBe(2);
    const payload = JSON.parse(result.stdout);
    expect(payload.diagnostics[0].path).toBe('tasksFileHash');
    expect(payload.diagnostics[0].expected).toContain('CLI');
  });

  it('accepts the canonical reviewer payload unchanged', async () => {
    const reviewerPayload = {
      result: 'PASS_WITH_WARNINGS',
      issues: [
        {
          severity: 'WARNING',
          message: 'one requirement lacks a boundary test',
          requirement: 'quality state',
          task: 'Task 3',
          recommendation: 'add a boundary case',
          evidenceCitations: ['src/core/quality/state.ts:1-2'],
        },
      ],
      summary: {
        completeness: { tasksCompleted: 3, tasksTotal: 3, reqsCovered: 2, reqsTotal: 2 },
        cleanliness: { checked: true, halfMigrationsFound: 0 },
      },
      writeBackPlan: [],
      evidenceFiles: ['src/a.ts'],
      gitDiffSummary: 'scope: src/core/quality/**',
    };

    const result = await review(reviewerPayload);

    expect(result.exitCode, result.stdout).toBe(0);
    const record = await snapshot();
    expect(record.result).toBe('PASS_WITH_WARNINGS');
    expect(record.issues).toHaveLength(1);
    expect(record.verificationContext.gitDiffSummary).toBe('scope: src/core/quality/**');
  });

  it('records an optimization round and echoes the assigned direction id', async () => {
    await review();

    const round = await optimize({ directions: [direction()] });

    expect(round.exitCode, round.stdout).toBe(0);
    const payload = JSON.parse(round.stdout);
    expect(payload.directions).toHaveLength(1);
    expect(payload.directions[0].id).toMatch(/^OPT-/);
    expect(payload.selected).toBe(payload.directions[0].id);
    expect(payload.ledger.directionsUsed).toBe(1);
    expect((await directions())[0].status).toBe('selected');
  });

  it('resolves same-batch dependencies to the assigned direction ids', async () => {
    await review();

    const round = await optimize({
      directions: [
        direction({ opportunity: 'Prerequisite' }),
        direction({
          opportunity: 'Dependent',
          dependencies: [{ actionIndex: 0 }],
        }),
      ],
    });

    expect(round.exitCode, round.stdout).toBe(0);
    const [prerequisite, dependent] = await directions();
    expect(dependent.dependencies).toEqual([prerequisite.id]);
    expect(JSON.stringify(await directions())).not.toContain('actionIndex');
  });

  it('rejects an agent-authored direction id', async () => {
    await review();

    const round = await optimize({ directions: [direction({ id: 'OPT-handmade' })] });

    expect(round.exitCode, round.stdout).toBe(2);
    expect(JSON.parse(round.stdout).diagnostics[0].path).toBe('directions[0].id');
  });

  it('rejects a selection that skips the highest priority direction', async () => {
    await review();
    const low = await assignDirection({
      opportunity: 'Low value cleanup',
      impactLevel: 'low',
      confidence: 'low',
    });

    const round = await optimize({
      directions: [direction({ opportunity: 'High value cleanup' })],
      selected: low,
    });

    expect(round.exitCode, round.stdout).toBe(2);
    const payload = JSON.parse(round.stdout);
    expect(payload.code).toBe('DIRECTION_ORDER_VIOLATION');
    expect(payload.diagnostics[0].path).toBe('selected');
  });

  it('rejects optimizer-authored status changes beyond revocation', async () => {
    await review();
    const id = await assignDirection();

    for (const status of ['selected', 'implemented', 'verified', 'failed', 'pending']) {
      const round = await optimize({ directions: [{ id, status }] });
      expect(round.exitCode, `${status}: ${round.stdout}`).toBe(2);
      const payload = JSON.parse(round.stdout);
      expect(payload.code).toBe('INVALID_INPUT');
      expect(payload.diagnostics[0].path).toBe('directions[0].status');
      expect(payload.diagnostics[0].expected).toBe('rejected | deferred');
    }
  });

  it('accepts an optimizer revocation and keeps a single selected direction', async () => {
    await review();
    const first = await assignDirection({ opportunity: 'First direction' });

    const round = await optimize({
      directions: [
        { id: first, status: 'deferred', reason: 'blocked by an unrelated migration', evidence: ['migration PR pending'] },
        direction({ opportunity: 'Second direction' }),
      ],
    });

    expect(round.exitCode, round.stdout).toBe(0);
    const payload = JSON.parse(round.stdout);
    expect(payload.selected).not.toBe(first);
    const selected = (await directions()).filter((item) => item.status === 'selected');
    expect(selected).toHaveLength(1);
    const stored = (await directions()).find((item) => item.id === first);
    expect(stored).toEqual(
      expect.objectContaining({
        status: 'deferred',
        reason: 'blocked by an unrelated migration',
        revocationEvidence: ['migration PR pending'],
      })
    );
  });

  it('rejects an unknown direction reference', async () => {
    await review();

    const round = await optimize({ directions: [direction({ id: 'OPT-20200101T000000000Z-01', status: 'rejected', reason: 'no', evidence: ['e'] })] });

    expect(round.exitCode, round.stdout).toBe(2);
    expect(JSON.parse(round.stdout).diagnostics[0].path).toBe('directions[0].id');
  });

  it('records a failing conclusion with exit 0 and reports the dirty state', async () => {
    const result = await review({
      result: 'FAIL_NEEDS_CORRECTIONS',
      issues: [{ severity: 'CRITICAL', message: 'required behavior is missing' }],
      evidenceFiles: ['src/a.ts'],
    });

    expect(result.exitCode, result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.state).toBe('dirty');
    expect(payload.review.result).toBe('FAIL_NEEDS_CORRECTIONS');
    expect(payload.allowedNextOperations).toEqual(['review']);
    expect((await snapshot()).result).toBe('FAIL_NEEDS_CORRECTIONS');
  });

  it('keeps the direction ledger across the documented failure rollback', async () => {
    await review();
    const directionId = await assignDirection({ opportunity: 'Risky direction' });

    // The round implementation lands, then the round review fails.
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    const failed = await review({
      result: 'FAIL_NEEDS_CORRECTIONS',
      issues: [{ severity: 'CRITICAL', message: 'preservation constraints broke' }],
      evidenceFiles: ['src/a.ts'],
    });
    expect(failed.exitCode, failed.stdout).toBe(0);

    // Rollback: snapshot both record files, discard the speculative code, restore them.
    const statePath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const stateSnapshot = await fs.readFile(statePath, 'utf-8');
    const logSnapshot = await fs.readFile(logPath, 'utf-8');
    await execFileAsync('git', ['reset', '--hard', 'HEAD'], { cwd: tempDir });
    await execFileAsync('git', ['clean', '-fd'], { cwd: tempDir });
    expect((await fs.readdir(changeDir)).includes('.quality-log.jsonl')).toBe(false);
    await fs.writeFile(statePath, stateSnapshot, 'utf-8');
    await fs.appendFile(logPath, logSnapshot, 'utf-8');

    // The restored code matches the earlier passing record, so the next round continues directly.
    const failedRound = await optimize({
      directions: [],
      attempt: { directionId, status: 'failed', summary: 'preservation constraints broke' },
    });

    expect(failedRound.exitCode, failedRound.stdout).toBe(0);
    expect((await directions()).find((item) => item.id === directionId)).toEqual(
      expect.objectContaining({ status: 'failed', failureCount: 1 })
    );
  });

  it('reports REVIEW_REQUIRED when a rollback restores the snapshot without its log line', async () => {
    await review();
    const directionId = await assignDirection({ opportunity: 'Risky direction' });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review({
      result: 'FAIL_NEEDS_CORRECTIONS',
      issues: [{ severity: 'CRITICAL', message: 'preservation constraints broke' }],
      evidenceFiles: ['src/a.ts'],
    });
    const statePath = path.join(changeDir, '.quality-state.json');
    const stateSnapshot = await fs.readFile(statePath, 'utf-8');
    await execFileAsync('git', ['reset', '--hard', 'HEAD'], { cwd: tempDir });
    await execFileAsync('git', ['clean', '-fd'], { cwd: tempDir });
    await fs.writeFile(statePath, stateSnapshot, 'utf-8');

    const blocked = await optimize({ directions: [], attempt: { directionId, status: 'failed' } });

    expect(blocked.exitCode, blocked.stdout).toBe(1);
    const blockedPayload = JSON.parse(blocked.stdout);
    expect(blockedPayload.code).toBe('REVIEW_REQUIRED');
    expect(blockedPayload.diagnostics[0].actual).toBe('dirty');

    // The recovery review keeps the recorded ledger, so the failed round is still reportable.
    const recovery = await review();
    expect(recovery.exitCode, recovery.stdout).toBe(0);
    expect(JSON.parse(recovery.stdout).state).toBe('clean');

    const failedRound = await optimize({
      directions: [],
      attempt: { directionId, status: 'failed', summary: 'preservation constraints broke' },
    });

    expect(failedRound.exitCode, failedRound.stdout).toBe(0);
    expect((await directions()).find((item) => item.id === directionId)).toEqual(
      expect.objectContaining({ status: 'failed', failureCount: 1 })
    );
  });

  it('requires a clean state before optimization', async () => {
    const round = await optimize({ directions: [direction()] });

    expect(round.exitCode, round.stdout).toBe(1);
    const payload = JSON.parse(round.stdout);
    expect(payload.code).toBe('REVIEW_REQUIRED');
    expect(payload.allowedNextOperations).toContain('review');
  });

  it('marks the selected direction implemented once the review passes', async () => {
    await review();
    await assignDirection();
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');

    await review();

    expect((await directions())[0].status).toBe('implemented');
  });

  it('derives IMPROVED when the direction limit is reached after a verified direction', async () => {
    await writeConfig({ directionLimit: 1, directionRetries: 2 });
    await review();
    const first = await assignDirection();
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review();

    const round = await optimize({
      directions: [],
      attempt: { directionId: first, status: 'verified' },
      stopReason: 'DIRECTION_LIMIT_REACHED',
      summary: 'direction limit reached',
    });

    expect(round.exitCode, round.stdout).toBe(0);
    const payload = JSON.parse(round.stdout);
    expect(payload.ledger.terminal).toBe('IMPROVED');
    expect(payload.ledger.stopReason).toBe('DIRECTION_LIMIT_REACHED');
  });

  it('derives DEGRADED when only rejected directions were submitted', async () => {
    await writeConfig({ directionLimit: 3, directionRetries: 2 });
    await review();
    const first = await assignDirection();
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review();

    const round = await optimize({
      directions: [{ id: first, status: 'rejected', reason: 'preservation constraints failed', evidence: ['round failed'] }],
      attempt: { directionId: first, status: 'failed' },
      stopReason: 'DIRECTION_REJECTED',
      summary: 'no direction survived review',
    });

    expect(round.exitCode, round.stdout).toBe(0);
    expect(JSON.parse(round.stdout).ledger.terminal).toBe('DEGRADED');
  });

  it('derives NOT_NEEDED when the optimizer finds no actionable direction', async () => {
    await review();

    const round = await optimize({ directions: [], stopReason: 'NO_ACTIONABLE', summary: 'optimizer found no eligible direction' });

    expect(round.exitCode, round.stdout).toBe(0);
    expect(JSON.parse(round.stdout).ledger.terminal).toBe('NOT_NEEDED');
  });

  it('records SKIPPED when optimization is disabled', async () => {
    await writeConfig({ enabled: false });
    await review();

    const blocked = await optimize({ directions: [direction()] });
    expect(blocked.exitCode, blocked.stdout).toBe(1);
    expect(JSON.parse(blocked.stdout).code).toBe('OPTIMIZATION_DISABLED');

    const skipped = await optimize({ directions: [], stopReason: 'USER_DECLINED', summary: 'user declined optimization' });

    expect(skipped.exitCode, skipped.stdout).toBe(0);
    const payload = JSON.parse(skipped.stdout);
    expect(payload.ledger.terminal).toBe('SKIPPED');
    expect(payload.ledger.stopReason).toBe('USER_DECLINED');
  });

  it('refuses to re-finalize an already finalized optimization', async () => {
    await review();
    await optimize({ directions: [], stopReason: 'NO_ACTIONABLE', summary: 'optimizer found no eligible direction' });

    const again = await optimize({ directions: [], stopReason: 'USER_DECLINED', summary: 'user declined optimization' });

    expect(again.exitCode, again.stdout).toBe(1);
    expect(JSON.parse(again.stdout).code).toBe('OPTIMIZATION_FINALIZED');
  });

  it('refuses a new direction once the limit is reached but still accepts finalization', async () => {
    await writeConfig({ directionLimit: 1, directionRetries: 2 });
    await review();
    const first = await assignDirection();
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review();

    const blocked = await optimize({
      directions: [direction({ opportunity: 'Another direction' })],
      attempt: { directionId: first, status: 'verified' },
    });

    expect(blocked.exitCode, blocked.stdout).toBe(1);
    expect(JSON.parse(blocked.stdout).code).toBe('DIRECTION_LIMIT_REACHED');

    const finalized = await optimize({ directions: [], stopReason: 'DIRECTION_LIMIT_REACHED', summary: 'direction limit reached' });
    expect(finalized.exitCode, finalized.stdout).toBe(0);
  });

  it('does not consume the failure budget for verified directions', async () => {
    await writeConfig({ directionLimit: 3, directionRetries: 1 });
    await review();

    const ids: string[] = [];
    let attempt: Record<string, unknown> | undefined;
    for (const opportunity of ['first', 'second', 'third']) {
      const round = await optimize({
        directions: [direction({ opportunity })],
        ...(attempt ? { attempt } : {}),
      });
      expect(round.exitCode, round.stdout).toBe(0);
      const payload = JSON.parse(round.stdout);
      ids.push(payload.selected);
      expect(payload.directions.some((item: Record<string, any>) => item.status === 'rejected')).toBe(false);
      attempt = { directionId: payload.selected, status: 'verified' };
      await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), `const a = ${ids.length + 1};\n`, 'utf-8');
      await review();
    }

    expect(ids).toHaveLength(3);
    expect((await directions()).map((item) => item.status)).toEqual([
      'verified',
      'verified',
      'implemented',
    ]);
  });

  it('requires a summary when a round finalizes the loop', async () => {
    await review();

    const missing = await optimize({ directions: [], stopReason: 'NO_ACTIONABLE' });

    expect(missing.exitCode, missing.stdout).toBe(2);
    const payload = JSON.parse(missing.stdout);
    expect(payload.code).toBe('INVALID_INPUT');
    expect(payload.diagnostics[0].path).toBe('summary');

    const accepted = await optimize({
      directions: [],
      stopReason: 'NO_ACTIONABLE',
      summary: 'optimizer found no eligible direction',
    });

    expect(accepted.exitCode, accepted.stdout).toBe(0);
    const record = await snapshot();
    expect(record.optimization.histories.at(-1).reason).toBe(
      'optimizer found no eligible direction'
    );
  });

  it('auto-rejects a direction that reaches the failure limit', async () => {
    await writeConfig({ directionLimit: 3, directionRetries: 1 });
    await review();
    const failing = await assignDirection({ opportunity: 'Fragile direction' });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review();

    const failedRound = await optimize({
      directions: [],
      attempt: { directionId: failing, status: 'failed', summary: 'preservation constraints broke' },
    });

    expect(failedRound.exitCode, failedRound.stdout).toBe(0);
    const rejected = (await directions()).find((item) => item.id === failing);
    expect(rejected.status).toBe('rejected');
    expect(rejected.failureCount).toBe(1);
    expect(rejected.reason).toBe('preservation constraints broke');

    const next = await optimize({ directions: [direction({ opportunity: 'Another direction' })] });
    expect(next.exitCode, next.stdout).toBe(0);
    expect(JSON.parse(next.stdout).selected).not.toBe(failing);

    const reSelect = await optimize({ directions: [], selected: failing });
    expect(reSelect.exitCode, reSelect.stdout).toBe(2);
    expect(JSON.parse(reSelect.stdout).code).toBe('DIRECTION_ORDER_VIOLATION');
  });

  it('reopens a failed direction while the retry budget remains', async () => {
    await writeConfig({ directionLimit: 3, directionRetries: 2 });
    await review();
    const directionId = await assignDirection({ opportunity: 'Retryable direction' });
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');
    await review();

    const failedRound = await optimize({
      directions: [],
      attempt: { directionId, status: 'failed', summary: 'first attempt failed' },
    });
    expect(failedRound.exitCode, failedRound.stdout).toBe(0);
    expect((await directions()).find((item) => item.id === directionId)?.status).toBe('failed');

    const nextRound = await optimize({ directions: [] });

    expect(nextRound.exitCode, nextRound.stdout).toBe(0);
    const reopened = (await directions()).find((item) => item.id === directionId);
    expect(reopened).toEqual(expect.objectContaining({ status: 'selected', failureCount: 1 }));
    expect(JSON.parse(nextRound.stdout).ledger.directionsUsed).toBe(1);
  });

  it('rejects a review without evidence paths', async () => {
    const result = await review({ result: 'PASS', issues: [], evidenceFiles: [] });

    expect(result.exitCode, result.stdout).toBe(2);
    const payload = JSON.parse(result.stdout);
    expect(payload.code).toBe('INVALID_INPUT');
    expect(payload.diagnostics[0].path).toBe('evidenceFiles');
  });

  it('reads a legacy optimization record without crashing review or optimize', async () => {
    await review();
    const statePath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const record = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    record.optimization = { directionsUsed: 0 };
    await fs.writeFile(statePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
    await fs.writeFile(logPath, `${JSON.stringify(record)}\n`, 'utf-8');
    await fs.writeFile(path.join(tempDir, 'src', 'a.ts'), 'const a = 2;\n', 'utf-8');

    const legacyReview = await review();
    expect(legacyReview.exitCode, legacyReview.stdout).toBe(0);

    const round = await optimize({ directions: [direction()] });

    expect(round.exitCode, round.stdout).toBe(0);
    expect(JSON.parse(round.stdout).directions).toHaveLength(1);
    const stored = await snapshot();
    expect(stored.optimization.histories).toHaveLength(1);
  });

  it('documents the finalize summary in every actionable diagnostic', async () => {
    const disabled = await (async () => {
      await writeConfig({ enabled: false });
      await review();
      return optimize({ directions: [direction()] });
    })();

    expect(disabled.exitCode, disabled.stdout).toBe(1);
    for (const diagnostic of JSON.parse(disabled.stdout).diagnostics) {
      if (diagnostic.fix.includes('stopReason')) {
        expect(diagnostic.fix).toContain('summary');
      }
    }
  });

  it('rejects further optimization rounds after an unsafe abort', async () => {
    await review();
    await optimize({ directions: [], stopReason: 'UNSAFE', summary: 'workspace unsafe' });

    const round = await optimize({ directions: [direction()] });

    expect(round.exitCode, round.stdout).toBe(1);
    expect(JSON.parse(round.stdout).code).toBe('ABORTED_UNSAFE');
  });

  it('moves to reviewed-but-not-finalized status after a passing review', async () => {
    await review();

    const status = await runCLI(['quality', 'status', 'c1', '--json'], { cwd: tempDir });

    expect(status.exitCode, status.stdout).toBe(0);
    const payload = JSON.parse(status.stdout);
    expect(payload.state).toBe('clean');
    expect(payload.review.result).toBe('PASS');
    expect(payload.optimization.terminal).toBeUndefined();
    expect(payload.allowedNextOperations).toEqual(['optimize']);
    expect(payload.nextCommands).toEqual([
      'xirang quality optimize c1 --input \'<round json>\' --json',
      'xirang quality seal c1 --json   # requires a finalized optimization ledger',
    ]);
  });

  it('gives the review command template while the state is dirty', async () => {
    const status = await runCLI(['quality', 'status', 'c1', '--json'], { cwd: tempDir });

    expect(status.exitCode, status.stdout).toBe(0);
    const payload = JSON.parse(status.stdout);
    expect(payload.state).toBe('dirty');
    expect(payload.allowedNextOperations).toEqual(['review']);
    expect(payload.nextCommands).toEqual(["xirang quality review c1 --input '<review json>' --json"]);
  });

  it('lists the seal and archive commands once the ledger is finalized', async () => {
    await review();
    await optimize({ directions: [], stopReason: 'NO_ACTIONABLE', summary: 'nothing to do' });

    const status = await runCLI(['quality', 'status', 'c1', '--json'], { cwd: tempDir });

    const payload = JSON.parse(status.stdout);
    expect(payload.allowedNextOperations).toEqual(['seal', 'archive']);
    expect(payload.nextCommands).toEqual(['xirang quality seal c1 --json', 'xirang archive c1']);
  });

  it('keeps status and help read-only', async () => {
    await review();
    const statePath = path.join(changeDir, '.quality-state.json');
    const logPath = path.join(changeDir, '.quality-log.jsonl');
    const before = await Promise.all([fs.stat(statePath), fs.stat(logPath)]);

    await runCLI(['quality', 'status', 'c1'], { cwd: tempDir });
    await runCLI(['quality', '--help'], { cwd: tempDir });
    await runCLI(['quality', 'optimize', '--help'], { cwd: tempDir });

    const after = await Promise.all([fs.stat(statePath), fs.stat(logPath)]);
    expect(after.map((stat) => stat.mtimeMs)).toEqual(before.map((stat) => stat.mtimeMs));
    expect(after.map((stat) => stat.size)).toEqual(before.map((stat) => stat.size));
  });

  it('seals a finalized change and lists unmet conditions otherwise', async () => {
    await review();
    const notReady = await runCLI(['quality', 'seal', 'c1', '--json'], { cwd: tempDir });

    expect(notReady.exitCode, notReady.stdout).toBe(1);
    const blocked = JSON.parse(notReady.stdout);
    expect(blocked.code).toBe('SEAL_NOT_READY');
    expect(blocked.diagnostics.map((item: Record<string, string>) => item.path)).toContain(
      'optimization.terminal'
    );

    await optimize({ directions: [], stopReason: 'NO_ACTIONABLE', summary: 'optimizer found no eligible direction' });
    const sealed = await runCLI(['quality', 'seal', 'c1', '--json'], { cwd: tempDir });

    expect(sealed.exitCode, sealed.stdout).toBe(0);
    const payload = JSON.parse(sealed.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.sealHash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.allowedNextOperations).toContain('archive');
  });

  it('renders protocol help from the shared constants', async () => {
    const result = await runCLI(['quality', 'optimize', '--help'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('directionLimit');
    expect(result.stdout).toContain('stopReason');
    for (const value of STOP_REASON_VALUES) {
      expect(result.stdout, `missing stop reason ${value}`).toContain(value);
    }
    for (const value of DIRECTION_STATUS_VALUES) {
      expect(result.stdout, `missing direction status ${value}`).toContain(value);
    }
    for (const value of DIRECTION_LEVEL_VALUES) {
      expect(result.stdout, `missing level ${value}`).toContain(value);
    }
  });
});
