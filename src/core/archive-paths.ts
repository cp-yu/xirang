import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function hasArchiveHistoryDirectory(directory: string): Promise<boolean> {
  const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (stat && !stat.isDirectory()) {
    throw new Error(`INVALID_ARCHIVE_HISTORY_DIRECTORY: ${directory} must be a directory, not a file or symbolic link.`);
  }
  return stat !== undefined;
}

export function isDatedArchiveName(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);
}

function archiveKey(name: string): string {
  return createHash('sha256').update(name).digest('hex');
}

export function pendingArchivePath(destination: string): string {
  const basename = path.basename(destination);
  const key = isDatedArchiveName(basename)
    ? `${basename.slice(0, 10)}-${archiveKey(basename.slice(11))}`
    : archiveKey(basename);
  return path.join(path.dirname(destination), `.archive-${key}.pending`);
}

export function pendingArchiveName(marker: string, changeName: string): string | undefined {
  const match = /^\.archive-(\d{4}-\d{2}-\d{2})-([0-9a-f]{64})\.pending$/.exec(marker);
  return match && match[2] === archiveKey(changeName) ? `${match[1]}-${changeName}` : undefined;
}

/** Confirm the same directory survived the marker check; rollback removes it before the marker. */
export async function archivedDirectoryState(destination: string): Promise<'complete' | 'pending' | 'missing'> {
  const stat = (location: string) => fs.lstat(location, { bigint: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
    return undefined;
  });
  const before = await stat(destination);
  if (await stat(pendingArchivePath(destination))) return 'pending';
  if (!before?.isDirectory()) return 'missing';
  const after = await stat(destination);
  return after?.isDirectory() && after.dev === before.dev && after.ino === before.ino && after.birthtimeNs === before.birthtimeNs
    ? 'complete' : 'missing';
}
