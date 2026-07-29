import { XIRANG_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { checkFreshness } from './verify/freshness.js';

interface ChangeInfo {
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastModified: Date;
  verifyStatus?: 'MISSING' | 'STALE' | 'FRESH';
}

interface ListOptions {
  sort?: 'recent' | 'name';
  json?: boolean;
}

/**
 * Get the most recent modification time of any file in a directory (recursive).
 * Falls back to the directory's own mtime if no files are found.
 */
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
        if (latest === null || stat.mtime > latest) {
          latest = stat.mtime;
        }
      }
    }
  }

  await walk(dirPath);

  // If no files found, use the directory's own modification time
  if (latest === null) {
    const dirStat = await fs.stat(dirPath);
    return dirStat.mtime;
  }

  return latest;
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'just now';
  }
}

export class ListCommand {
  async execute(targetPath: string = '.', options: ListOptions = {}): Promise<void> {
    const { sort = 'recent', json = false } = options;
    const changesDir = path.join(targetPath, XIRANG_DIR_NAME, 'changes');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error("No Xirang changes directory found. Run 'xirang setup' first.");
    }

    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive' && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    if (changeDirs.length === 0) {
      if (json) {
        console.log(JSON.stringify({ changes: [] }));
      } else {
        console.log('No active changes found.');
      }
      return;
    }

    // Collect information about each change
    const changes: ChangeInfo[] = [];

    for (const changeDir of changeDirs) {
      const progress = await getTaskProgressForChange(changesDir, changeDir);
      const changePath = path.join(changesDir, changeDir);
      const lastModified = await getLastModified(changePath);
      const verifyStatus = json ? (await checkFreshness(changePath, targetPath)).status : undefined;
      changes.push({
        name: changeDir,
        completedTasks: progress.completed,
        totalTasks: progress.total,
        lastModified,
        verifyStatus,
      });
    }

    // Sort by preference (default: recent first)
    if (sort === 'recent') {
      changes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } else {
      changes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // JSON output for programmatic use
    if (json) {
      const jsonOutput = changes.map(c => ({
        name: c.name,
        completedTasks: c.completedTasks,
        totalTasks: c.totalTasks,
        lastModified: c.lastModified.toISOString(),
        status: c.totalTasks === 0 ? 'no-tasks' : c.completedTasks === c.totalTasks ? 'complete' : 'in-progress',
        verifyStatus: c.verifyStatus ?? 'MISSING',
      }));
      console.log(JSON.stringify({ changes: jsonOutput }, null, 2));
      return;
    }

    // Display results
    console.log('Changes:');
    const padding = '  ';
    const nameWidth = Math.max(...changes.map(c => c.name.length));
    for (const change of changes) {
      const paddedName = change.name.padEnd(nameWidth);
      const status = formatTaskStatus({ total: change.totalTasks, completed: change.completedTasks });
      const timeAgo = formatRelativeTime(change.lastModified);
      console.log(`${padding}${paddedName}     ${status.padEnd(12)}  ${timeAgo}`);
    }
  }
}
