import path from 'node:path';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export async function previewArchitecture(projectRoot: string, options: { port?: number; runLikeC4?: LikeC4Runner } = {}): Promise<void> {
  const args = ['start', path.join(projectRoot, 'openspec', 'architecture')];
  if (options.port) args.push('--port', String(options.port));
  await (options.runLikeC4 ?? runLikeC4)(args);
}
