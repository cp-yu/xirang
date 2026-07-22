import { OPSX_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readLikeC4Architecture } from './likec4-reader.js';

export type Architecture = Awaited<ReturnType<typeof readLikeC4Architecture>>;

export async function readArchitecture(projectRoot: string): Promise<Architecture> {
  const likec4Directory = path.join(projectRoot, OPSX_DIR_NAME, 'architecture');
  try {
    const stat = await fs.stat(likec4Directory);
    if (!stat.isDirectory()) throw new Error(`Architecture path is not a directory: ${likec4Directory}`);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        `No LikeC4 architecture model found at ${likec4Directory}. ` +
        'For legacy YAML, run "opsx migrate opsx-to-likec4"; for semantic migration, run "opsx migrate semantic-model".',
      );
    }
    throw error;
  }
  return readLikeC4Architecture(projectRoot);
}
