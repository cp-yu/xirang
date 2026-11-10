import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { runCLI } from '../helpers/run-cli.js';
import { removeTempDir } from '../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

describe('quality v4 public CLI', () => {
  let root: string;
  let changeDir: string;
  let commit: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-cli-v4-'));
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
    if (result.exitCode !== 0) expect(result.stdout).toBe('');
    return JSON.parse((result.exitCode === 0 ? result.stdout : result.stderr).trim());
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

  it('records commit-bound Review by kind, explicit Opt disposition and Seal with CAS revisions', async () => {
    const tasksBefore = await fs.readFile(path.join(changeDir, 'tasks.md'));
    const review = await record('review', {
      reviewKind: 'full-change', commit, result: 'PASS', summary: 'Reviewed whole Change.', findings: [],
    }, 0);
    expect(review).toEqual({ revision: 1 });

    const status = await payload(await cli(['status', 'c1', '--json']));
    expect(status).toMatchObject({ status: 'needs_optimize', revision: 1 });
    await record('opt', { disposition: 'not_performed', reason: 'No optimization is warranted.' }, 1);
    const sealed = await record('seal', {
      commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'The committed result is runnable.',
    }, 2);
    expect(sealed).toEqual({ revision: 3 });
    const current = await payload(await cli(['status', 'c1', '--json']));
    expect(current.status).toBe('all_done');
    expect(current).not.toHaveProperty('record');
    const history = await payload(await cli(['status', 'c1', '--history', '--json']));
    expect(history.record.reviews).toHaveLength(1);
    expect(await fs.readFile(path.join(changeDir, 'tasks.md'))).toEqual(tasksBefore);
    const quality = JSON.parse(await fs.readFile(path.join(changeDir, '.quality.json'), 'utf8'));
    expect(quality).toMatchObject({ schemaVersion: 4, changeId: 'c1', revision: 3, opt: { disposition: 'not_performed' }, seal: { commit } });
    expect(quality.reviews).toEqual([{ reviewKind: 'full-change', commit, result: 'PASS', summary: 'Reviewed whole Change.', findings: [] }]);
    expect(await fs.readdir(changeDir)).toEqual(['.quality.json', 'tasks.md']);
  });

  it('returns the latest delivered Opt commit association without loading opinion history', async () => {
    await record('review', { reviewKind: 'full-change', commit, result: 'PASS', summary: 'Reviewed.', findings: [] }, 0);
    await execFileAsync('git', ['commit', '--allow-empty', '-qm', 'optimized'], { cwd: root });
    const resultCommit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
    await record('opt', { disposition: 'delivered', opinions: [
      { opinionId: 'OPT-1', baseCommit: commit, resultCommit: commit, summary: 'First assessment.', findings: [] },
      { opinionId: 'OPT-2', baseCommit: commit, resultCommit, summary: 'Latest assessment.', findings: [] },
    ] }, 1);
    const current = await payload(await cli(['status', 'c1', '--json']));
    expect(current.opt).toEqual({ disposition: 'delivered', baseCommit: commit, resultCommit });
    expect(current).not.toHaveProperty('record');
    expect(JSON.stringify(current)).not.toContain('assessment');
    const history = await payload(await cli(['status', 'c1', '--history', '--json']));
    expect(history.record.opt.opinions).toHaveLength(2);
  });

  it('requires full-change before Opt, rejects legacy opinion fields and preserves v3 records', async () => {
    const noReview = await cli(['opt', 'c1', '--version', '0', '--json', '--input', JSON.stringify({ disposition: 'not_performed', reason: 'No Opt.' })]);
    expect(noReview.exitCode).not.toBe(0);
    expect((await payload(noReview)).code).toBe('FULL_CHANGE_REVIEW_REQUIRED');

    const oldPayload = await cli(['review', 'c1', '--version', '0', '--json', '--input', JSON.stringify({
      reviewId: 'REV-1', scope: 'baseline', commit, result: 'PASS', summary: 'obsolete', findings: [],
    })]);
    expect(oldPayload.exitCode).toBe(2);
    expect((await payload(oldPayload)).code).toBe('INVALID_INPUT');

    const missingCommit = await cli(['review', 'c1', '--version', '0', '--json', '--input', JSON.stringify({
      reviewKind: 'full-change', commit: 'f'.repeat(40), result: 'PASS', summary: 'not real', findings: [],
    })]);
    expect(missingCommit.exitCode).not.toBe(0);
    expect((await payload(missingCommit)).code).toBe('GIT_COMMIT_NOT_FOUND');

    const file = path.join(changeDir, '.quality.json');
    const v3 = Buffer.from(JSON.stringify({ schemaVersion: 3, changeId: 'c1', revision: 0, reviews: [], opt: null, seal: null }));
    await fs.writeFile(file, v3);
    const status = await cli(['status', 'c1', '--json']);
    expect(status.exitCode).not.toBe(0);
    expect((await payload(status)).code).toBe('UNSUPPORTED_QUALITY_VERSION');
    expect(await fs.readFile(file)).toEqual(v3);
  });
});
