import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export function isDatedArchiveName(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);
}

export function pendingArchivePath(destination: string): string {
  const key = createHash('sha256').update(path.basename(destination)).digest('hex');
  return path.join(path.dirname(destination), `.archive-${key}.pending`);
}

/** Confirm the same directory survived the marker check; rollback removes it before the marker. */
export async function archivedDirectoryState(destination: string): Promise<'complete' | 'pending' | 'missing'> {
  const stat = (location: string) => fs.lstat(location, { bigint: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
    return undefined;
  });
  const before = await stat(destination);
  if (!before?.isDirectory()) return 'missing';
  if (await stat(pendingArchivePath(destination))) return 'pending';
  const after = await stat(destination);
  return after?.isDirectory() && after.dev === before.dev && after.ino === before.ino && after.birthtimeNs === before.birthtimeNs
    ? 'complete' : 'missing';
}
