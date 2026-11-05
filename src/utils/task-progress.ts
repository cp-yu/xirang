import { promises as fs } from 'fs';
import path from 'path';

export interface TaskProgress {
  total: number;
  completed: number;
}

export function countTasksFromContent(content: string): TaskProgress {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const goalsHeading = lines.findIndex((line) => /^##\s+Goals\s*$/.test(line));
  if (goalsHeading < 0) return { total: 0, completed: 0 };

  let total = 0;
  let completed = 0;
  for (let i = goalsHeading + 1; i < lines.length && !/^##\s+/.test(lines[i]); i++) {
    const match = lines[i].match(/^\s*-\s+\[([ xX])\]\s+G\d+:\s+\S/);
    if (!match) continue;
    total++;
    if (match[1].toLowerCase() === 'x') completed++;
  }
  return { total, completed };
}

export async function getTaskProgressForChange(changesDir: string, changeName: string): Promise<TaskProgress> {
  const tasksPath = path.join(changesDir, changeName, 'tasks.md');
  try {
    const content = await fs.readFile(tasksPath, 'utf-8');
    return countTasksFromContent(content);
  } catch {
    return { total: 0, completed: 0 };
  }
}

export function formatTaskStatus(progress: TaskProgress): string {
  if (progress.total === 0) return 'No goals';
  if (progress.completed === progress.total) return '✓ Complete';
  return `${progress.completed}/${progress.total} goals`;
}
