import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  QUALITY_LOG_FILE,
  QUALITY_STATE_FILE,
  readQualityLog,
  readQualitySnapshot,
  writeQualityRecord,
} from '../../../src/core/quality/log.js';
import type { QualityRecord } from '../../../src/core/quality/types.js';

describe('quality record persistence', () => {
  let tempDir: string;
  let changeDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-quality-log-'));
    changeDir = path.join(tempDir, '.xirang', 'changes', 'c1');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function record(kind: QualityRecord['kind'], timestamp: string): QualityRecord {
    return {
      kind,
      timestamp,
      result: 'PASS',
      issues: [],
      tasksFileHash: null,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src/a.ts'],
        evidenceFingerprint: 'f'.repeat(64),
      },
    };
  }

  it('returns null when no snapshot has been written yet', async () => {
    expect(await readQualitySnapshot(changeDir)).toBeNull();
    expect(await readQualityLog(changeDir)).toEqual([]);
  });

  it('appends one log line per record and keeps earlier lines intact', async () => {
    const first = record('review', '2026-05-01T00:00:00.000Z');
    const second = record('optimize', '2026-05-01T01:00:00.000Z');
    await writeQualityRecord(changeDir, first);
    const afterFirst = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE), 'utf-8');

    await writeQualityRecord(changeDir, second);

    const logContent = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE), 'utf-8');
    expect(logContent.startsWith(afterFirst)).toBe(true);
    expect(await readQualityLog(changeDir)).toEqual([first, second]);
  });

  it('overwrites the snapshot with the newest record', async () => {
    await writeQualityRecord(changeDir, record('review', '2026-05-01T00:00:00.000Z'));
    await writeQualityRecord(changeDir, record('optimize', '2026-05-01T01:00:00.000Z'));

    expect((await readQualitySnapshot(changeDir))?.kind).toBe('optimize');
    expect(await readQualityLog(changeDir)).toHaveLength(2);
  });

  it('appends the log line before writing the snapshot', async () => {
    await fs.mkdir(path.join(changeDir, QUALITY_STATE_FILE));

    await expect(
      writeQualityRecord(changeDir, record('review', '2026-05-01T00:00:00.000Z'))
    ).rejects.toThrow();

    expect(await readQualityLog(changeDir)).toHaveLength(1);
  });

  it('ignores a trailing partial log line', async () => {
    await writeQualityRecord(changeDir, record('review', '2026-05-01T00:00:00.000Z'));
    await fs.appendFile(path.join(changeDir, QUALITY_LOG_FILE), '{"kind":"review"', 'utf-8');

    const log = await readQualityLog(changeDir);

    expect(log).toHaveLength(1);
    expect(log[0].timestamp).toBe('2026-05-01T00:00:00.000Z');
  });
});
