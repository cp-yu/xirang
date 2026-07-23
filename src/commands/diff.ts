import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { OPSX_DIR_NAME } from '../core/config.js';
import { compileChange } from '../core/change-compiler.js';
import { renderChangeDiff, renderEffectiveChange } from '../core/change-diff-renderer.js';
import type { DiffScope } from '../core/semantic-diff.js';
import { atomicWrite } from '../utils/likec4-writer.js';

export const EFFECTIVE_CHANGE_FILE = 'effective-change.md';

export interface DiffOptions {
  change?: string;
  scope?: string;
  json?: boolean;
  write?: boolean;
}

function normalizeScope(scope?: string): DiffScope | undefined {
  if (scope === undefined) return undefined;
  if (scope === 'specs' || scope === 'architecture') return scope;
  throw new Error(`Unknown diff scope '${scope}'. Supported scopes: specs, architecture`);
}

export async function diffCommand(projectRoot: string, options: DiffOptions): Promise<void> {
  if (!options.change) throw new Error('diff requires --change <name>');
  const changeDir = path.join(projectRoot, OPSX_DIR_NAME, 'changes', options.change);
  const stat = await fs.stat(changeDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!stat?.isDirectory()) throw new Error(`Unknown active change '${options.change}'`);

  const scope = normalizeScope(options.scope);
  const compiled = await compileChange(projectRoot, options.change);
  if (options.write) {
    await atomicWrite(path.join(changeDir, EFFECTIVE_CHANGE_FILE), renderEffectiveChange(compiled.diff));
  }
  if (options.json) console.log(JSON.stringify(compiled.diff, null, 2));
  else console.log(renderChangeDiff(compiled.diff, scope).trimEnd());
  process.exitCode = compiled.valid ? 0 : 1;
}

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Show the effective Semantic Delta for an active change')
    .requiredOption('--change <name>', 'Active change name')
    .option('--scope <scope>', 'Limit text output to specs or architecture')
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
