import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach } from 'vitest';

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

/** Creates a temporary model root populated with the given `partition/file` entries. */
export async function createModelRoot(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-model-'));
  roots.push(root);
  for (const partition of ['elements', 'metamodel', 'relationships', 'views']) {
    await fs.mkdir(path.join(root, partition), { recursive: true });
  }
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
  }
  return root;
}
