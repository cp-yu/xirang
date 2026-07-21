import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readProjectOpsx } from './opsx-utils.js';
import { readLikeC4Architecture } from './likec4-reader.js';

export type Architecture = Awaited<ReturnType<typeof readLikeC4Architecture>> | {
  source: 'opsx';
  bundle: NonNullable<Awaited<ReturnType<typeof readProjectOpsx>>>;
};

export async function readArchitecture(projectRoot: string): Promise<Architecture> {
  const likec4Directory = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  try {
    const stat = await fs.stat(likec4Directory);
    if (stat.isDirectory()) return readLikeC4Architecture(projectRoot);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const bundle = await readProjectOpsx(projectRoot);
  if (bundle) {
    console.warn('Using legacy OPSX YAML. Run: opsx migrate opsx-to-likec4');
    return { source: 'opsx', bundle };
  }
  throw new Error('No architecture model found');
}
