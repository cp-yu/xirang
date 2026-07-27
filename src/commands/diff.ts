import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { XIRANG_DIR_NAME } from '../core/config.js';
import { compileChange } from '../core/change-compiler.js';
import { renderChangeDiff, renderEffectiveChange } from '../core/change-diff-renderer.js';
import { DIFF_ENTITY_KINDS, type DiffKind } from '../core/semantic-diff.js';
import { atomicWrite } from '../utils/likec4-writer.js';

export const EFFECTIVE_CHANGE_FILE = 'effective-change.md';

export interface DiffOptions {
  change?: string;
  entity?: string;
  json?: boolean;
  write?: boolean;
}

/** Detail kinds are nested under their host entry, so filtering happens by entity type only. */
export function normalizeEntities(entity?: string): Set<DiffKind> | undefined {
  if (entity === undefined) return undefined;
  const requested = entity.split(',').map(item => item.trim()).filter(item => item !== '');
  const unknown = requested.filter(item => !DIFF_ENTITY_KINDS.includes(item as DiffKind));
  if (requested.length === 0 || unknown.length > 0) {
    throw new Error(`Unknown diff entity '${unknown[0] ?? entity}'. Supported entities: ${DIFF_ENTITY_KINDS.join(', ')}`);
  }
  return new Set(requested as DiffKind[]);
}

export async function diffCommand(projectRoot: string, options: DiffOptions): Promise<void> {
  if (!options.change) throw new Error('diff requires --change <name>');
  const changeDir = path.join(projectRoot, XIRANG_DIR_NAME, 'changes', options.change);
  const stat = await fs.stat(changeDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!stat?.isDirectory()) throw new Error(`Unknown active change '${options.change}'`);

  const entities = normalizeEntities(options.entity);
  const compiled = await compileChange(projectRoot, options.change);
  if (options.write) {
    await atomicWrite(path.join(changeDir, EFFECTIVE_CHANGE_FILE), renderEffectiveChange(compiled.diff));
  }
  if (options.json) console.log(JSON.stringify(compiled.diff, null, 2));
  else console.log(renderChangeDiff(compiled.diff, entities).trimEnd());
  process.exitCode = compiled.valid ? 0 : 1;
}

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Show the effective Semantic Delta for an active change')
    .requiredOption('--change <name>', 'Active change name')
    .option('--entity <type>', `Limit text output to entity types (comma separated): ${DIFF_ENTITY_KINDS.join(', ')}`)
    .option('--json', 'Output the complete Diff IR as JSON')
    .option('--write', `Write deterministic ${EFFECTIVE_CHANGE_FILE}`)
    .action(async (options: DiffOptions) => {
      try {
        await diffCommand(process.cwd(), options);
      } catch (error) {
        console.error((error as Error).message);
        process.exitCode = 1;
      }
    });
}
