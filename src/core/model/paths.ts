import path from 'node:path';
import { XIRANG_DIR_NAME } from '../config.js';

export const MODEL_DIR_NAME = 'model';

const DELTA_METADATA = new Set(['.gitkeep', '.gitignore', '.DS_Store']);
const DELTA_WRITEBACK_TEMP = /^\..+\.[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.tmp$/is;

export function isIgnoredDeltaFile(name: string): boolean {
  return DELTA_METADATA.has(name) || DELTA_WRITEBACK_TEMP.test(name);
}

/** The single persistence root of the Semantic Model. */
export function modelRoot(projectRoot: string): string {
  return path.join(projectRoot, XIRANG_DIR_NAME, MODEL_DIR_NAME);
}

export function changeRoot(projectRoot: string, changeName: string): string {
  return path.join(projectRoot, XIRANG_DIR_NAME, 'changes', changeName);
}
