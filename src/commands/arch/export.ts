import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateLikeC4 } from '../../core/likec4/generator.js';
import { likec4CacheDir } from '../../core/likec4/paths.js';
import { modelRoot } from '../../core/model/paths.js';
import { parseSemanticModel } from '../../core/model/parser.js';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export type ExportFormat = 'png' | 'svg' | 'pdf';

/** Generates `.c4` artifacts into the cache directory; the persistent source is never written. */
export async function generateLikeC4Artifacts(projectRoot: string): Promise<string> {
  const { model } = await parseSemanticModel(modelRoot(projectRoot));
  const target = likec4CacheDir(projectRoot);
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });
  for (const [file, content] of generateLikeC4(model)) {
    await fs.writeFile(path.join(target, file), content, 'utf8');
  }
  return target;
}

export async function exportArchitecture(
  projectRoot: string,
  options: { format?: ExportFormat; output: string; runLikeC4?: LikeC4Runner },
): Promise<void> {
  const source = await generateLikeC4Artifacts(projectRoot);
  await fs.mkdir(options.output, { recursive: true });
  await (options.runLikeC4 ?? runLikeC4)(['export', options.format ?? 'png', '-o', options.output, source]);
}
