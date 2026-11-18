import { createHash } from 'node:crypto';
import path from 'node:path';

export function pendingArchivePath(destination: string): string {
  const key = createHash('sha256').update(path.basename(destination)).digest('hex');
  return path.join(path.dirname(destination), `.archive-${key}.pending`);
}
