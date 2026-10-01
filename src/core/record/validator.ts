import { promises as fs } from 'node:fs';
import path from 'node:path';
import { modelRoot } from '../model/paths.js';
import { parseSemanticModelFiles } from '../model/parser.js';
import { MODEL_PATH_PREFIX, semanticTreeFingerprint } from '../model/transaction.js';
import { PARTITIONS } from '../model/types.js';
import { validateSemanticModel } from '../model/validator.js';
import type { DesignRecordPayload } from './types.js';
import type { RecordSemanticContext } from './workspace.js';

function fail(code: string, message: string): never {
  throw Object.assign(new Error(message), { code });
}

export async function readRecordSemanticContext(
  projectRoot: string, context: DesignRecordPayload['context'],
): Promise<RecordSemanticContext> {
  const root = path.resolve(projectRoot);
  for (const directory of [root, path.join(root, '.xirang'), modelRoot(root)]) {
    const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (!stat) {
      if (directory === root) fail('UNSAFE_MANAGED_PATH', 'Project root does not exist');
      if (context !== 'build') fail('SEMANTIC_MODEL_MISSING', 'Change record requires a formal Semantic Model');
      return { model: null, semanticModelFingerprint: semanticTreeFingerprint(new Map()) };
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail('UNSAFE_MANAGED_PATH', `Not a regular model directory: ${directory}`);
  }
  const files = new Map<string, Buffer>();
  const visit = async (directory: string, relative: string): Promise<void> => {
    const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') fail('SEMANTIC_MODEL_INVALID', `Missing model partition: ${relative}`);
      throw error;
    });
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail('UNSAFE_MANAGED_PATH', `Not a regular model directory: ${relative}`);
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      const key = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) fail('UNSAFE_MANAGED_PATH', `Model source is a symlink: ${key}`);
      if (entry.isDirectory()) await visit(child, key);
      else if (entry.isFile()) files.set(key, await fs.readFile(child));
      else fail('UNSAFE_MANAGED_PATH', `Model source is not a regular file: ${key}`);
    }
  };
  for (const partition of PARTITIONS) await visit(path.join(modelRoot(root), partition), partition);
  const parsed = parseSemanticModelFiles([...files].map(([name, bytes]) => [name, bytes.toString('utf8')]));
  const errors = [...parsed.diagnostics, ...validateSemanticModel(parsed.model)].filter(item => item.level === 'ERROR');
  if (errors.length) fail('SEMANTIC_MODEL_INVALID', errors.map(item => `${item.code}: ${item.message}`).join('; '));
  return {
    model: parsed.model,
    semanticModelFingerprint: semanticTreeFingerprint(new Map([...files].map(([name, bytes]) => [`${MODEL_PATH_PREFIX}/${name}`, bytes]))),
  };
}
