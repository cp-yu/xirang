import { promises as fs } from 'node:fs';
import path from 'node:path';
import { OPSX_DIR_NAME } from '../../core/config.js';

export async function inferSpecPaths(projectRoot: string, capabilityId: string): Promise<string[]> {
  const slug = capabilityId.split('.').at(-1)!;
  const relativeDir = path.join(OPSX_DIR_NAME, 'specs', slug);
  const absoluteDir = path.join(projectRoot, relativeDir);
  let entries;
  try {
    entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(relativeDir, entry.name))
    .sort();
}
