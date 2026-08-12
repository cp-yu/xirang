import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateLikeC4 } from './generator.js';
import { likec4CacheDir } from './paths.js';
import type { SemanticModel } from '../model/types.js';
import { runLikeC4, type LikeC4Runner } from '../../commands/arch/runner.js';

async function publishDirectory(source: string, target: string): Promise<void> {
  const sourceEntries = await fs.readdir(source, { withFileTypes: true });
  const names = new Set(sourceEntries.map(entry => entry.name));
  const temporary: string[] = [];

  await fs.mkdir(target, { recursive: true });
  try {
    for (const entry of sourceEntries) {
      if (!entry.isFile()) throw new Error(`Unsupported LikeC4 cache entry: ${entry.name}`);
      const temp = path.join(target, `.${entry.name}.${randomUUID()}.tmp`);
      await fs.copyFile(path.join(source, entry.name), temp);
      temporary.push(temp);
    }
    for (let index = 0; index < sourceEntries.length; index += 1) {
      await fs.rename(temporary[index]!, path.join(target, sourceEntries[index]!.name));
      temporary[index] = '';
    }
    for (const entry of await fs.readdir(target, { withFileTypes: true })) {
      if (!names.has(entry.name) && !temporary.includes(path.join(target, entry.name))) {
        await fs.rm(path.join(target, entry.name), { recursive: true, force: true });
      }
    }
  } finally {
    await Promise.all(temporary.filter(Boolean).map(file => fs.rm(file, { force: true }).catch(() => undefined)));
  }
}

/** Generate and validate a complete cache before replacing the last-known-good contents. */
export async function generateLikeC4Artifacts(
  projectRoot: string,
  model: SemanticModel,
  runner: LikeC4Runner = runLikeC4,
  publisher: (source: string, target: string) => Promise<void> = publishDirectory,
): Promise<string> {
  const target = likec4CacheDir(projectRoot);
  const parent = path.dirname(target);
  const staging = await fs.mkdtemp(path.join(parent, '.cache-likec4-staging-'));
  let backup: string | undefined;
  let publishing = false;
  let retainBackup = false;
  try {
    for (const [file, content] of generateLikeC4(model)) {
      await fs.writeFile(path.join(staging, file), content, 'utf8');
    }
    await runner(['validate', staging, '--no-layout']);

    const hadTarget = await fs.stat(target).then(stat => stat.isDirectory()).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    if (hadTarget) {
      backup = await fs.mkdtemp(path.join(parent, '.cache-likec4-backup-'));
      await fs.cp(target, backup, { recursive: true });
    }

    publishing = true;
    await publisher(staging, target);
    return target;
  } catch (error) {
    if (publishing) {
      try {
        if (backup) await publishDirectory(backup, target);
        else await fs.rm(target, { recursive: true, force: true });
      } catch (rollbackError) {
        retainBackup = true;
        throw new AggregateError(
          [error, rollbackError],
          `LikeC4 cache publication and rollback failed${backup ? `; backup retained at ${backup}` : ''}`,
        );
      }
    }
    throw error;
  } finally {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
    if (backup && !retainBackup) await fs.rm(backup, { recursive: true, force: true }).catch(() => undefined);
  }
}
