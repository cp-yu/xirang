import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { runCLI } from '../helpers/run-cli.js';
import { removeTempDir } from '../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

describe('quality v3 public CLI', () => {
  let root: string;
  let changeDir: string;
  let commit: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-cli-v3-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] unchanged task\n');
    await fs.writeFile(path.join(root, 'src.ts'), 'export const value = 1;\n');
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.com'], { cwd: root });
    await execFileAsync('git', ['add', '.'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd: root });
    commit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  });

  afterEach(async () => removeTempDir(root));

  async function cli(args: string[]) {
    return runCLI(['quality', ...args], { cwd: root });
  }
  async function payload(result: Awaited<ReturnType<typeof cli>>) {
    expect(result.stdout).not.toBe('');
    return JSON.parse(result.stdout.trim());
  }
  async function record(command: string, input: unknown, revision: number) {
    const result = await cli([command, 'c1', '--version', String(revision), '--json', '--input', JSON.stringify(input)]);
    expect(result.exitCode, result.stdout).toBe(0);
    return payload(result);
  }

  it('reports missing status read-only and does not inspect legacy protocol files', async () => {
    const legacy = Buffer.from('{ old snapshot bytes }');
    await fs.writeFile(path.join(changeDir, '.quality-state.json'), legacy);
    const before = await fs.readdir(changeDir);
    const result = await cli(['status', 'c1', '--json']);
    expect(result.exitCode, result.stdout).toBe(0);
    expect(await payload(result)).toMatchObject({ status: 'needs_review', qualityStatus: 'missing', revision: 0 });
    expect(await fs.readFile(path.join(changeDir, '.quality-state.json'))).toEqual(legacy);
    expect(await fs.readdir(changeDir)).toEqual(before);
  });

  it('records commit-bound Review, explicit Opt disposition and Seal with CAS revisions', async () => {
    const tasksBefore = await fs.readFile(path.join(changeDir, 'tasks.md'));
    const review = await record('review', {
      reviewId: 'REV-1', scope: 'baseline', commit, result: 'PASS', summary: 'Reviewed baseline.', findings: [],
    }, 0);
    expect(review).toMatchObject({ contractVersion: 3, code: 'REVIEW_RECORDED', revision: 1 });
    const duplicate = await cli(['review', 'c1', '--version', '1', '--json', '--input', JSON.stringify({
      reviewId: 'REV-1', scope: 'baseline', commit, result: 'PASS', summary: 'duplicate', findings: [],
    })]);
    expect(duplicate.exitCode).not.toBe(0);
    expect((await payload(duplicate)).code).toBe('DUPLICATE_REVIEW_ID');

    const status = await payload(await cli(['status', 'c1', '--json']));
    expect(status).toMatchObject({ status: 'needs_optimize', revision: 1 });
    await record('opt', { disposition: 'not_performed', reason: 'No optimization is warranted.' }, 1);
    const sealed = await record('seal', {
      commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'The committed result is runnable.',
    }, 2);
    expect(sealed).toMatchObject({ code: 'SEALED', revision: 3, status: 'all_done' });
    expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(tasksBefore);
    const quality = JSON.parse(await fs.readFile(path.join(changeDir, '.quality.json'), 'utf8'));
    expect(quality).toMatchObject({ schemaVersion: 3, changeId: 'c1', revision: 3, opt: { disposition: 'not_performed' }, seal: { commit } });
    expect(await fs.readdir(changeDir)).toEqual(['.quality.json', 'tasks.md']);
  });

  it('requires a passing baseline and an existing full commit before accepting opinions', async () => {
    const noReview = await cli(['opt', 'c1', '--version', '0', '--json', '--input', JSON.stringify({ disposition: 'not_performed', reason: 'No Opt.' })]);
    expect(noReview.exitCode).not.toBe(0);
    expect((await payload(noReview)).code).toBe('BASELINE_REVIEW_REQUIRED');
    const missingCommit = await cli(['review', 'c1', '--version', '0', '--json', '--input', JSON.stringify({
      reviewId: 'REV-1', scope: 'baseline', commit: 'f'.repeat(40), result: 'PASS', summary: 'not real', findings: [],
    })]);
    expect(missingCommit.exitCode).not.toBe(0);
    expect((await payload(missingCommit)).code).toBe('GIT_COMMIT_NOT_FOUND');
  });
});
