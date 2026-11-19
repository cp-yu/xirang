import { promises as fs } from 'node:fs';
import path from 'node:path';

let paused = false;
async function pause(phase) {
  if (paused || process.env.XIRANG_TEST_ARCHIVE_PAUSE !== phase) return;
  paused = true;
  const resume = new Promise(resolve => process.once('message', resolve));
  process.send(phase);
  await resume;
}

const { mkdtemp, rename } = fs;
fs.mkdtemp = async (prefix, ...args) => {
  if (path.basename(String(prefix)).startsWith('.archive-lock-')) await pause('claim');
  return mkdtemp(prefix, ...args);
};
fs.rename = async (source, target) => {
  if (path.basename(String(target)) === 'existing.id.md') await pause('write');
  return rename(source, target);
};
