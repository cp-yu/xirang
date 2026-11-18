import path from 'node:path';

export function pendingArchivePath(destination: string): string {
  return path.join(path.dirname(destination), `.${path.basename(destination)}.pending`);
}
