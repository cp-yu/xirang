import { promises as fs } from 'fs';
import path from 'path';
import type { QualityRecord } from './types.js';

export const QUALITY_STATE_FILE = '.quality-state.json';
export const QUALITY_LOG_FILE = '.quality-log.jsonl';
export const QUALITY_RECORD_FILES = [QUALITY_STATE_FILE, QUALITY_LOG_FILE];

export async function readQualitySnapshot(changeDir: string): Promise<QualityRecord | null> {
  try {
    const content = await fs.readFile(path.join(changeDir, QUALITY_STATE_FILE), 'utf-8');
    return JSON.parse(content) as QualityRecord;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function readQualityLog(changeDir: string): Promise<QualityRecord[]> {
  let content: string;
  try {
    content = await fs.readFile(path.join(changeDir, QUALITY_LOG_FILE), 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const records: QualityRecord[] = [];
  for (const line of content.split('\n')) {
    if (line.trim() === '') {
      continue;
    }
    try {
      records.push(JSON.parse(line) as QualityRecord);
    } catch {
      continue;
    }
  }
  return records;
}

export async function writeQualityRecord(changeDir: string, record: QualityRecord): Promise<void> {
  await fs.appendFile(path.join(changeDir, QUALITY_LOG_FILE), `${JSON.stringify(record)}\n`, 'utf-8');
  await fs.writeFile(
    path.join(changeDir, QUALITY_STATE_FILE),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf-8'
  );
}
