import { XIRANG_DIR_NAME } from '../../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export type ExportFormat = 'png' | 'svg' | 'pdf';
export async function exportArchitecture(projectRoot: string, options: { format?: ExportFormat; output: string; runLikeC4?: LikeC4Runner }): Promise<void> {
  const format = options.format ?? 'png';
  await fs.mkdir(options.output, { recursive: true });
  await (options.runLikeC4 ?? runLikeC4)(['export', format, '-o', options.output, path.join(projectRoot, XIRANG_DIR_NAME, 'architecture')]);
}
