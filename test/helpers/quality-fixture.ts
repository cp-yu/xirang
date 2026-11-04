import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { readQualityRecord, recordQualityOpt, recordQualityReview, recordQualitySeal } from '../../src/core/quality/engine.js';

const execFileAsync = promisify(execFile);

/** Windows file locks (Defender scans, handle release) make recursive temp removal flaky. */
export async function removeTempDir(root: string): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.rm(root, { recursive: true, force: true });
      return;
    } catch (cause) {
      const code = (cause as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' && code !== 'EPERM' && code !== 'ENOTEMPTY' && code !== 'EACCES') throw cause;
      if (attempt >= 8) throw cause;
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}

export async function createCompleteQualityFixture(root: string, changeDir: string): Promise<void> {
  await fs.mkdir(changeDir, { recursive: true });
  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  const source = path.join(root, 'src', 'quality-fixture.ts');
  try { await fs.access(source); }
  catch { await fs.writeFile(source, 'export const fixture = true;\\n', 'utf8'); }

  try { await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: root }); }
  catch { await execFileAsync('git', ['init', '-q'], { cwd: root }); }
  await execFileAsync('git', ['config', 'user.name', 'Quality Fixture'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'quality-fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  const hasCommit = await execFileAsync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root }).then(() => true, () => false);
  if (!hasCommit) await execFileAsync('git', ['commit', '-qm', 'quality fixture baseline'], { cwd: root });
  const commit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  const initial = await readQualityRecord(changeDir);
  if (initial.seal) return;
  const review = await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: initial.revision,
    reviewId: `REV-${path.basename(changeDir)}`, scope: 'baseline', commit, result: 'PASS',
    summary: 'Fixture baseline was independently reviewed.', findings: [] });
  const opt = await recordQualityOpt({ changeDir, projectRoot: root, expectedRevision: review.revision,
    disposition: 'not_performed', reason: 'Fixture does not require optimization.' });
  await recordQualitySeal({ changeDir, projectRoot: root, expectedRevision: opt.revision,
    seal: { commit, canRun: true, testsExpectedToPass: true, testScope: 'fixture', assessment: 'Fixture commit is runnable.' } });
}

export async function createBaselineOnlyQualityFixture(root: string, changeDir: string): Promise<void> {
  await fs.mkdir(changeDir, { recursive: true });
  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  const source = path.join(root, 'src', 'quality-fixture.ts');
  try { await fs.access(source); } catch { await fs.writeFile(source, 'export const fixture = true;\\n', 'utf8'); }
  try { await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: root }); }
  catch { await execFileAsync('git', ['init', '-q'], { cwd: root }); }
  await execFileAsync('git', ['config', 'user.name', 'Quality Fixture'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'quality-fixture@example.com'], { cwd: root });
  await execFileAsync('git', ['add', '-A'], { cwd: root });
  const hasCommit = await execFileAsync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root }).then(() => true, () => false);
  if (!hasCommit) await execFileAsync('git', ['commit', '-qm', 'quality fixture baseline'], { cwd: root });
  const commit = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  const initial = await readQualityRecord(changeDir);
  if (initial.reviews.length) return;
  await recordQualityReview({ changeDir, projectRoot: root, expectedRevision: initial.revision,
    reviewId: `REV-${path.basename(changeDir)}`, scope: 'baseline', commit, result: 'PASS',
    summary: 'Fixture baseline was independently reviewed.', findings: [] });
}

