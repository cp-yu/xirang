import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import {
  checkArchiveCompatibility,
  checkQualityState,
  computeEvidenceFingerprint,
  computeTasksFileHash,
  formatQualityGateFailure,
  refreshQualityEvidenceAfterSync,
} from '../../../src/core/quality/state.js';
import { writeQualityRecord } from '../../../src/core/quality/log.js';
import type { QualityRecord } from '../../../src/core/quality/types.js';

const execFileAsync = promisify(execFile);

describe('quality state engine', () => {
  let tempDir: string;
  let changeDir: string;
  let evidencePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-state-'));
    changeDir = path.join(tempDir, '.xirang', 'changes', 'c1');
    evidencePath = path.join(tempDir, 'src', 'a.ts');
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] task\n', 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function initRepository(): Promise<void> {
    await execFileAsync('git', ['init'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'Xirang Test'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'init'], { cwd: tempDir });
  }

  async function currentHead(): Promise<string> {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: tempDir });
    return stdout.trim();
  }

  async function reviewRecord(
    result: QualityRecord['result'],
    content: string
  ): Promise<{ record: QualityRecord; fingerprint: string }> {
    await fs.writeFile(evidencePath, content, 'utf-8');
    const fingerprint = await computeEvidenceFingerprint(['src/a.ts'], tempDir);
    const record: QualityRecord = {
      kind: 'review',
      timestamp: new Date().toISOString(),
      result,
      issues: [],
      tasksFileHash: await computeTasksFileHash(path.join(changeDir, 'tasks.md')),
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src/a.ts'],
        evidenceFingerprint: fingerprint.hash,
        evidenceFingerprintEntries: fingerprint.entries,
      },
    };
    return { record, fingerprint: fingerprint.hash };
  }

  it('computes tasks.md sha256 and returns null for missing files', async () => {
    expect(await computeTasksFileHash(path.join(changeDir, 'tasks.md'))).toMatch(/^[a-f0-9]{64}$/);
    expect(await computeTasksFileHash(path.join(changeDir, 'missing.md'))).toBeNull();
  });

  it('computes evidence fingerprint with normalized relative POSIX paths', async () => {
    await fs.writeFile(evidencePath, 'a', 'utf-8');

    const fingerprint = await computeEvidenceFingerprint(['src\\a.ts', 'missing.ts'], tempDir);

    expect(fingerprint.entries).toEqual([
      expect.objectContaining({ path: 'src/a.ts', hash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    ]);
    expect(fingerprint.skippedFiles).toEqual(['missing.ts']);
  });

  it('keeps evidence fingerprint stable when only file mtime changes', async () => {
    await fs.writeFile(evidencePath, 'a', 'utf-8');

    const before = await computeEvidenceFingerprint(['src/a.ts'], tempDir);
    const future = new Date(Date.now() + 60_000);
    await fs.utimes(evidencePath, future, future);
    const after = await computeEvidenceFingerprint(['src/a.ts'], tempDir);

    expect(after.hash).toBe(before.hash);
    expect(after.entries).toEqual(before.entries);
  });

  it('excludes quality record files from the evidence fingerprint', async () => {
    await fs.writeFile(evidencePath, 'a', 'utf-8');
    await fs.writeFile(path.join(changeDir, '.quality-state.json'), '{"kind":"review"}\n', 'utf-8');
    await fs.writeFile(path.join(changeDir, '.quality-log.jsonl'), '{"kind":"review"}\n', 'utf-8');

    const withRecords = await computeEvidenceFingerprint(
      ['src/a.ts', '.quality-state.json', '.quality-log.jsonl'],
      tempDir
    );
    await fs.rm(path.join(changeDir, '.quality-state.json'));
    await fs.rm(path.join(changeDir, '.quality-log.jsonl'));
    const withoutRecords = await computeEvidenceFingerprint(['src/a.ts'], tempDir);

    expect(withRecords.entries).toEqual(withoutRecords.entries);
    expect(withRecords.hash).toBe(withoutRecords.hash);
    expect(withRecords.skippedFiles).toEqual(
      expect.arrayContaining(['.quality-state.json', '.quality-log.jsonl'])
    );
  });

  it('reports clean when a passing review record matches current code', async () => {
    const { record, fingerprint } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('clean');
    expect(state.changedFiles).toEqual([]);
    expect(state.record?.verificationContext.evidenceFingerprint).toBe(fingerprint);
  });

  it('stays clean when only the quality record files change', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    record.verificationContext.evidenceFiles = [
      'src/a.ts',
      '.quality-state.json',
      '.quality-log.jsonl',
    ];
    await writeQualityRecord(changeDir, record);

    expect((await checkQualityState(changeDir, tempDir)).status).toBe('clean');

    await writeQualityRecord(changeDir, record);

    expect((await checkQualityState(changeDir, tempDir)).status).toBe('clean');
  });

  it('reports dirty when no record exists', async () => {
    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('dirty');
    expect(state.record).toBeUndefined();
  });

  it('reports dirty with changed files when the fingerprint no longer matches', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);
    await fs.writeFile(evidencePath, 'changed', 'utf-8');

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('dirty');
    expect(state.changedFiles).toEqual(['src/a.ts']);
  });

  it('reports dirty when the matching record is a failure', async () => {
    const { record } = await reviewRecord('FAIL_NEEDS_CORRECTIONS', 'a');
    await writeQualityRecord(changeDir, record);

    expect((await checkQualityState(changeDir, tempDir)).status).toBe('dirty');
  });

  it('reports clean after a failed round is rolled back', async () => {
    const passing = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, passing.record);

    const failing = await reviewRecord('FAIL_NEEDS_CORRECTIONS', 'broken');
    await writeQualityRecord(changeDir, failing.record);

    await fs.writeFile(evidencePath, 'a', 'utf-8');
    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('clean');
    expect(state.record?.result).toBe('PASS');
  });

  it('reads a legacy optimization record as empty collections', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    record.optimization = { directionsUsed: 0 } as never;
    await writeQualityRecord(changeDir, record);

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('clean');
    expect(state.record?.optimization).toEqual({
      directions: [],
      histories: [],
      directionsUsed: 0,
    });
  });

  it('never reports clean for a record without fingerprint entries', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    record.verificationContext.evidenceFiles = [];
    const empty = await computeEvidenceFingerprint([], tempDir);
    record.verificationContext.evidenceFingerprint = empty.hash;
    record.verificationContext.evidenceFingerprintEntries = empty.entries;
    await writeQualityRecord(changeDir, record);

    expect((await checkQualityState(changeDir, tempDir)).status).toBe('dirty');
  });

  it('reports dirty when the snapshot has no matching log entry', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    await fs.writeFile(
      path.join(changeDir, '.quality-state.json'),
      `${JSON.stringify(record, null, 2)}\n`,
      'utf-8'
    );

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('dirty');
    expect(state.details.join('\n')).toContain('.quality-log.jsonl');
  });

  it('matches evidence paths recorded with Windows backslashes', async () => {
    await fs.writeFile(evidencePath, 'a', 'utf-8');
    const fingerprint = await computeEvidenceFingerprint(['src/a.ts'], tempDir);
    const record: QualityRecord = {
      kind: 'review',
      timestamp: new Date().toISOString(),
      result: 'PASS_WITH_WARNINGS',
      issues: [],
      tasksFileHash: null,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src\\a.ts'],
        evidenceFingerprint: fingerprint.hash,
        evidenceFingerprintEntries: fingerprint.entries,
      },
    };
    await writeQualityRecord(changeDir, record);

    expect((await checkQualityState(changeDir, tempDir)).status).toBe('clean');
  });

  it('reports a git HEAD difference as informational without changing the state', async () => {
    await initRepository();
    const { record } = await reviewRecord('PASS', 'a');
    record.verificationContext.gitHeadCommit = 'recorded-head';
    await writeQualityRecord(changeDir, record);

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('clean');
    expect(state.information.gitHeadCommit).toEqual({
      matches: false,
      recorded: 'recorded-head',
      current: expect.stringMatching(/^[a-f0-9]{40}$/),
    });
  });

  it('checks archive compatibility against the optimization terminal state', async () => {
    const base = (await reviewRecord('PASS', 'a')).record;

    expect(checkArchiveCompatibility({ ...base, optimization: { terminal: 'IMPROVED', histories: [], directions: [], directionsUsed: 1 } }))
      .toEqual({ compatible: true });
    expect(checkArchiveCompatibility({ ...base, optimization: { terminal: 'SKIPPED', histories: [], directions: [], directionsUsed: 0 } }))
      .toEqual({ compatible: true });
    expect(checkArchiveCompatibility(base)).toEqual({
      compatible: false,
      blockReason: 'NOT_FINALIZED',
    });
    expect(
      checkArchiveCompatibility({
        ...base,
        optimization: { terminal: 'ABORTED_UNSAFE', histories: [], directions: [], directionsUsed: 1 },
      })
    ).toEqual({ compatible: false, blockReason: 'ABORTED_UNSAFE' });
  });

  it('formats a quality gate failure with fingerprint and archive sections', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);
    await fs.writeFile(evidencePath, 'changed', 'utf-8');
    const state = await checkQualityState(changeDir, tempDir);

    const message = formatQualityGateFailure(state, undefined, { changeName: 'c1' });

    expect(message).toContain('src/a.ts');
    expect(message).toContain('xirang quality review c1');
    expect(message).not.toContain('Git HEAD');
  });

  it('formats archive context suggestions and omits an empty fingerprint section', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);
    const state = await checkQualityState(changeDir, tempDir);

    const message = formatQualityGateFailure(
      state,
      { compatible: false, blockReason: 'ABORTED_UNSAFE' },
      { changeName: 'c1', command: 'archive' }
    );

    expect(message).toContain('ABORTED_UNSAFE');
    expect(message).toContain('xirang archive c1 --no-verify');
    expect(message).not.toContain('Evidence file fingerprint mismatch');
  });

  it('refreshes matching evidence entries after sync and keeps the state clean', async () => {
    const configPath = path.join(tempDir, '.xirang', 'project.xirang.yaml');
    await fs.writeFile(configPath, 'version: 1\n', 'utf-8');
    await fs.writeFile(evidencePath, 'a', 'utf-8');

    const before = await computeEvidenceFingerprint(
      ['src/a.ts', '.xirang/project.xirang.yaml'],
      tempDir
    );
    await writeQualityRecord(changeDir, {
      kind: 'review',
      timestamp: new Date().toISOString(),
      result: 'PASS',
      issues: [],
      tasksFileHash: null,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src/a.ts', '.xirang/project.xirang.yaml'],
        evidenceFingerprint: before.hash,
        evidenceFingerprintEntries: before.entries,
      },
    });

    await fs.writeFile(configPath, 'version: 2\n', 'utf-8');
    expect((await checkQualityState(changeDir, tempDir)).status).toBe('dirty');

    await refreshQualityEvidenceAfterSync(changeDir, tempDir, ['.xirang\\project.xirang.yaml']);

    const refreshed = await checkQualityState(changeDir, tempDir);
    expect(refreshed.status).toBe('clean');

    await fs.writeFile(configPath, 'version: 3\n', 'utf-8');
    const reDirtied = await checkQualityState(changeDir, tempDir);
    expect(reDirtied.status).toBe('dirty');
    expect(reDirtied.changedFiles).toEqual(['.xirang/project.xirang.yaml']);
  });

  it('skips the sync refresh when nothing matches or no snapshot exists', async () => {
    await fs.writeFile(evidencePath, 'a', 'utf-8');
    await expect(
      refreshQualityEvidenceAfterSync(changeDir, tempDir, ['src/a.ts'])
    ).resolves.toBeUndefined();

    const { record } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);
    const snapshotPath = path.join(changeDir, '.quality-state.json');
    const original = await fs.readFile(snapshotPath, 'utf-8');

    await refreshQualityEvidenceAfterSync(changeDir, tempDir, ['.xirang/model/elements/auth.md']);

    expect(await fs.readFile(snapshotPath, 'utf-8')).toBe(original);
  });

  it('reports nothing to do for an empty sync file list', async () => {
    const { record } = await reviewRecord('PASS', 'a');
    await writeQualityRecord(changeDir, record);
    const snapshotPath = path.join(changeDir, '.quality-state.json');
    const original = await fs.readFile(snapshotPath, 'utf-8');

    await refreshQualityEvidenceAfterSync(changeDir, tempDir, []);

    expect(await fs.readFile(snapshotPath, 'utf-8')).toBe(original);
  });

  it('matches a recorded git HEAD against the repository commit', async () => {
    await initRepository();
    const { record } = await reviewRecord('PASS', 'a');
    record.verificationContext.gitHeadCommit = await currentHead();
    await writeQualityRecord(changeDir, record);

    const state = await checkQualityState(changeDir, tempDir);

    expect(state.status).toBe('clean');
    expect(state.information.gitHeadCommit?.matches).toBe(true);
  });
});
