import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { listActiveChangeDirectories } from './change-utils.js';

export async function statIfPresent(location: string) {
  return fs.lstat(location).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
}

export async function hasArchiveHistoryDirectory(directory: string): Promise<boolean> {
  const stat = await statIfPresent(directory);
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

interface ArchiveCandidate {
  directory: string;
  date: string;
}

type ArchiveHistory = Map<string, { name?: string; candidates: ArchiveCandidate[] }>;

/** Index both history locations by the same key used for completed and orphaned attempts. */
export async function readArchiveHistory(archiveDir: string, abandon = false): Promise<ArchiveHistory> {
  const history: ArchiveHistory = new Map();
  if (!await hasArchiveHistoryDirectory(archiveDir)) return history;
  const abandonedDir = path.join(archiveDir, 'abandoned');
  for (const directory of abandon ? [abandonedDir, archiveDir] : [archiveDir, abandonedDir]) {
    if (directory === abandonedDir && !await hasArchiveHistoryDirectory(directory)) continue;
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    const names = new Map<string, string>();
    for (const entry of entries) {
      const marker = /^\.archive-(\d{4}-\d{2}-\d{2})-([0-9a-f]{64})\.pending$/.exec(entry.name);
      if (marker) {
        const id = `${marker[1]}-${marker[2]}`;
        if (!names.has(id)) names.set(id, '');
      } else if (entry.isDirectory() && isDatedArchiveName(entry.name)) {
        const name = entry.name.slice(11);
        names.set(`${entry.name.slice(0, 10)}-${archiveKey(name)}`, name);
      }
    }
    for (const id of [...names.keys()].sort().reverse()) {
      const key = id.slice(11);
      const name = names.get(id);
      const item = history.get(key) ?? { candidates: [] };
      if (name) item.name = name;
      item.candidates.push({ directory, date: id.slice(0, 10) });
      history.set(key, item);
    }
  }
  return history;
}

/** Do not fall back to a receipt when a listed attempt disappeared during inspection. */
export async function resolveArchiveHistory(history: ArchiveHistory, changeName: string): Promise<{ pending?: string; receipt?: string; changed?: true }> {
  let receipt: string | undefined;
  let changed = false;
  for (const { directory, date } of history.get(archiveKey(changeName))?.candidates ?? []) {
    const location = path.join(directory, `${date}-${changeName}`);
    const state = await archivedDirectoryState(location);
    if (state === 'pending') return { pending: location };
    if (state === 'complete') receipt ??= location;
    else changed = true;
  }
  return changed ? { changed: true } : { receipt };
}

export async function listArchiveChoices(changesDir: string): Promise<Map<string, 'active' | 'archived'>> {
  const names = new Set(await listActiveChangeDirectories(changesDir));
  const history = await readArchiveHistory(path.join(changesDir, 'archive'));
  for (const { name } of history.values()) if (name) names.add(name);
  const choices = new Map<string, 'active' | 'archived'>();
  for (const name of [...names].sort()) {
    try {
      const result = await resolveArchiveHistory(history, name);
      if (result.pending) continue;
      const active = await statIfPresent(path.join(changesDir, name));
      if (active?.isDirectory()) choices.set(name, 'active');
      else if (result.receipt) choices.set(name, 'archived');
    } catch {
      // An unreadable entry cannot be offered as a completion.
    }
  }
  return choices;
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
