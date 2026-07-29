import { promises as fs } from 'fs';
import path from 'path';
import { compileChange, readFormalSemanticModel } from './change-compiler.js';
import { XIRANG_DIR_NAME } from './config.js';
import { checkFreshness } from './verify/freshness.js';
import { formatTaskStatus, getTaskProgressForChange } from '../utils/task-progress.js';

interface ChangeInfo {
  name: string;
  title: string;
  deltaCount: number;
  completedTasks: number;
  totalTasks: number;
  lastModified: Date;
  verifyStatus?: 'MISSING' | 'STALE' | 'FRESH';
}

interface ListOptions {
  sort?: 'recent' | 'name';
  json?: boolean;
  long?: boolean;
}

async function getLastModified(dirPath: string): Promise<Date> {
  let latest: Date | null = null;

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        if (latest === null || stat.mtime > latest) latest = stat.mtime;
      }
    }
  }

  await walk(dirPath);
  if (latest === null) return (await fs.stat(dirPath)).mtime;
  return latest;
}

function formatRelativeTime(date: Date): string {
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) return date.toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export class ListCommand {
  async execute(targetPath: string = '.', options: ListOptions = {}): Promise<void> {
    const { sort = 'recent', json = false, long = false } = options;
    const changesDir = path.join(targetPath, XIRANG_DIR_NAME, 'changes');

    try {
      await fs.access(changesDir);
    } catch {
      throw new Error("No Xirang changes directory found. Run 'xirang setup' first.");
    }

    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive' && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    if (changeDirs.length === 0) {
      console.log(json ? JSON.stringify({ changes: [] }) : 'No active changes found.');
      return;
    }

    const base = json || long
      ? await readFormalSemanticModel(targetPath).catch(() => undefined)
      : undefined;
    const changes: ChangeInfo[] = [];

    for (const changeDir of changeDirs) {
      const progress = await getTaskProgressForChange(changesDir, changeDir);
      const changePath = path.join(changesDir, changeDir);
      const lastModified = await getLastModified(changePath);
      const verifyStatus = json ? (await checkFreshness(changePath, targetPath)).status : undefined;
      let title = changeDir;
      let deltaCount = 0;

      if (json || long) {
        try {
          if (base) {
            const compiled = await compileChange(targetPath, changeDir, { base });
            title = compiled.title;
            deltaCount = compiled.diff.summary.total;
          }
        } catch {
          // Keep deterministic fallback values for incomplete change directories.
        }
      }

      changes.push({
        name: changeDir,
        title,
        deltaCount,
        completedTasks: progress.completed,
        totalTasks: progress.total,
        lastModified,
        verifyStatus,
      });
    }

    if (sort === 'recent') {
      changes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } else {
      changes.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (json) {
      const jsonOutput = changes.map(change => ({
        name: change.name,
        title: change.title,
        deltaCount: change.deltaCount,
        completedTasks: change.completedTasks,
        totalTasks: change.totalTasks,
        lastModified: change.lastModified.toISOString(),
        status: change.totalTasks === 0
          ? 'no-tasks'
          : change.completedTasks === change.totalTasks ? 'complete' : 'in-progress',
        verifyStatus: change.verifyStatus ?? 'MISSING',
      }));
      console.log(JSON.stringify({ changes: jsonOutput }, null, 2));
      return;
    }

    if (long) {
      for (const change of changes) {
        console.log(`${change.name}: ${change.title} [deltas ${change.deltaCount}] [tasks ${change.completedTasks}/${change.totalTasks}]`);
      }
      return;
    }

    console.log('Changes:');
    const nameWidth = Math.max(...changes.map(change => change.name.length));
    for (const change of changes) {
      const status = formatTaskStatus({ total: change.totalTasks, completed: change.completedTasks });
      console.log(`  ${change.name.padEnd(nameWidth)}     ${status.padEnd(12)}  ${formatRelativeTime(change.lastModified)}`);
    }
  }
}
