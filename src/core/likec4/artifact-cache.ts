import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateLikeC4 } from './generator.js';
import { likec4CacheDir } from './paths.js';
import type { SemanticModel } from '../model/types.js';
import { runLikeC4, type LikeC4Runner } from '../../commands/arch/runner.js';

/** Generate and validate a complete cache before replacing the last-known-good directory. */
export async function generateLikeC4Artifacts(
  projectRoot: string,
  model: SemanticModel,
  runner: LikeC4Runner = runLikeC4,
): Promise<string> {
  const target = likec4CacheDir(projectRoot);
  const parent = path.dirname(target);
  const staging = await fs.mkdtemp(path.join(parent, '.cache-likec4-staging-'));
  let backup: string | undefined;
  try {
    for (const [file, content] of generateLikeC4(model)) {
      await fs.writeFile(path.join(staging, file), content, 'utf8');
    }
    await runner(['validate', staging, '--no-layout']);

    backup = `${target}.backup-${process.pid}-${Date.now()}`;
    try {
      await fs.rename(target, backup);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      backup = undefined;
    }
    await fs.rename(staging, target);
    if (backup) await fs.rm(backup, { recursive: true, force: true });
    return target;
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    if (backup) {
      await fs.rm(target, { recursive: true, force: true });
      await fs.rename(backup, target).catch(() => undefined);
    }
    throw error;
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
    if (backup) await fs.rm(backup, { recursive: true, force: true });
  }
}
