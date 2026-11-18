import { createHash } from 'node:crypto';
import path from 'node:path';

export function isDatedArchiveName(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);
}

export function pendingArchivePath(destination: string): string {
  const key = createHash('sha256').update(path.basename(destination)).digest('hex');
  return path.join(path.dirname(destination), `.archive-${key}.pending`);
}
