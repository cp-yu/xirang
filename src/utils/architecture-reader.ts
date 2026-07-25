import { XIRANG_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readLikeC4Architecture } from './likec4-reader.js';

export type Architecture = Awaited<ReturnType<typeof readLikeC4Architecture>>;

export async function readArchitecture(projectRoot: string): Promise<Architecture> {
  const likec4Directory = path.join(projectRoot, XIRANG_DIR_NAME, 'architecture');
  try {
    const stat = await fs.stat(likec4Directory);
    if (!stat.isDirectory()) throw new Error(`Architecture path is not a directory: ${likec4Directory}`);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        `No LikeC4 architecture model found at ${likec4Directory}. ` +
        'Run "xirang setup" to create a formal skeleton or use xirang-build to construct a reviewed Candidate.',
      );
    }
    throw error;
  }
  return readLikeC4Architecture(projectRoot);
}
