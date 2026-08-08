import { promises as fs } from 'node:fs';
import { generateLikeC4Artifacts as generateTransactionalLikeC4Artifacts } from '../../core/likec4/artifact-cache.js';
import { modelRoot } from '../../core/model/paths.js';
import { parseSemanticModel } from '../../core/model/parser.js';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export type ExportFormat = 'png' | 'svg' | 'pdf';

/** Generates `.c4` artifacts into the cache directory; the persistent source is never written. */
export async function generateLikeC4Artifacts(projectRoot: string): Promise<string> {
  const { model } = await parseSemanticModel(modelRoot(projectRoot));
  return generateTransactionalLikeC4Artifacts(projectRoot, model);
}

export async function exportArchitecture(
  projectRoot: string,
  options: { format?: ExportFormat; output: string; runLikeC4?: LikeC4Runner },
): Promise<void> {
  const source = await generateLikeC4Artifacts(projectRoot);
  await fs.mkdir(options.output, { recursive: true });
  await (options.runLikeC4 ?? runLikeC4)(['export', options.format ?? 'png', '-o', options.output, source]);
}
