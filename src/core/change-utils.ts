import { promises as fs } from 'fs';
import { validateChangeName } from '../utils/change-utils.js';
import { formatTaskStatus, getTaskProgressForChange } from '../utils/task-progress.js';

interface SelectActiveChangeOptions {
  message?: string;
  output?: NodeJS.WritableStream;
}

export async function listActiveChangeDirectories(changesDir: string): Promise<string[]> {
  const entries = await fs.readdir(changesDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive' && validateChangeName(entry.name).valid)
    .map((entry) => entry.name)
    .sort();
}

export async function selectActiveChange(
  changesDir: string,
  options: SelectActiveChangeOptions = {}
): Promise<string | null> {
  const { select } = await import('@inquirer/prompts');
  const changeDirs = await listActiveChangeDirectories(changesDir);

  if (changeDirs.length === 0) {

    return null;
  }

  let choices: Array<{ name: string; value: string }> = changeDirs.map((name) => ({ name, value: name }));
  try {
    const progressList: Array<{ id: string; status: string }> = [];
    for (const id of changeDirs) {
      const progress = await getTaskProgressForChange(changesDir, id);
      progressList.push({ id, status: formatTaskStatus(progress) });
    }

    const nameWidth = Math.max(...progressList.map((progress) => progress.id.length));
    choices = progressList.map((progress) => ({
      name: `${progress.id.padEnd(nameWidth)}     ${progress.status}`,
      value: progress.id,
    }));
  } catch {
    choices = changeDirs.map((name) => ({ name, value: name }));
  }

  try {
    const config = { message: options.message ?? 'Select a change', choices };
    return await (options.output ? select(config, { output: options.output }) : select(config));
  } catch {
    return null;
  }
}
