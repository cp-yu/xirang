import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { readQualityCompletion } from '../../../src/core/quality/state.js';
import { readQualityRecord, recordQualityOpt, recordQualityReview, recordQualitySeal } from '../../../src/core/quality/engine.js';
import { removeTempDir } from '../../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

describe('quality status projection', () => {
  let root: string;
  let changeDir: string;
  let commit: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-status-'));
    changeDir = path.join(root, '.xirang', 'changes', 'c1');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(root, 'src.ts'), 'export const value = 1;\n');
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.com'], { cwd: root });
    await execFileAsync('git', ['add', '.'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'initial'], { cwd: root });
    commit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  });
  afterEach(async () => removeTempDir(root));

  it('projects Review, Opt and Seal gaps without manifest freshness comparison', async () => {
    expect((await readQualityCompletion(changeDir, root)).status).toBe('needs_review');
    const review = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: 0, reviewId: 'REV-1', scope: 'baseline', commit,
      result: 'PASS', summary: 'Baseline passes.', findings: [] });
    expect((await readQualityCompletion(changeDir, root)).status).toBe('needs_optimize');
    const opt = await recordQualityOpt({ changeDir, projectRoot: root, expectedRevision: review.revision, disposition: 'not_performed', reason: 'No Opt is needed.' });
    expect((await readQualityCompletion(changeDir, root)).status).toBe('needs_optimize');
    await recordQualitySeal({ changeDir, projectRoot: root, expectedRevision: opt.revision,
      seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'unit tests', assessment: 'Ready.' } });
    await fs.writeFile(path.join(root, 'src.ts'), 'export const value = 2;\n');
    expect((await readQualityCompletion(changeDir, root)).status).toBe('all_done');
    expect((await readQualityRecord(changeDir)).seal?.commit).toBe(commit);
  });

  it('reports malformed new records without rewriting them', async () => {
    const file = path.join(changeDir, '.quality.json');
    const bytes = Buffer.from('{not json');
    await fs.writeFile(file, bytes);
    const status = await readQualityCompletion(changeDir, root);
    expect(status.unsupported).toBe(true);
    expect(await fs.readFile(file)).toEqual(bytes);
  });
});
