import path from 'node:path';
import { XIRANG_DIR_NAME } from '../config.js';

export const MODEL_DIR_NAME = 'model';

/** The single persistence root of the Semantic Model. */
export function modelRoot(projectRoot: string): string {
  return path.join(projectRoot, XIRANG_DIR_NAME, MODEL_DIR_NAME);
}

export function changeRoot(projectRoot: string, changeName: string): string {
  return path.join(projectRoot, XIRANG_DIR_NAME, 'changes', changeName);
}
