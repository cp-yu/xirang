import path from 'node:path';
import { XIRANG_DIR_NAME } from '../config.js';

export const LIKEC4_CACHE_DIR_NAME = '.cache-likec4';

export function likec4CacheDir(projectRoot: string): string {
  return path.join(projectRoot, XIRANG_DIR_NAME, LIKEC4_CACHE_DIR_NAME);
}
