import path from 'node:path';
import type { Command } from 'commander';
import { formatArchitectureQueryText, queryArchitecture } from './query.js';
import { validateArchitectureCommand } from './validate.js';
import { exportArchitecture, type ExportFormat } from './export.js';
import { registerPlanRemoveCommand } from './plan-remove.js';

export function registerArchCommand(program: Command): void {
  const arch = program.command('arch').description('Query, validate, and export LikeC4 architecture');
  arch.command('query <element-id>').option('--relations').option('--depth <n>').option('--json').action(async (id, options) => {
    try {
      const result = await queryArchitecture(process.cwd(), id, { relations: options.relations, depth: options.depth ? Number(options.depth) : undefined });
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else console.log(await formatArchitectureQueryText(process.cwd(), result));
    } catch (error) { console.error((error as Error).message); process.exitCode = 1; }
  });
  arch.command('validate').option('--delta <path>').option('--json').action(async options => {
    try {
      const result = await validateArchitectureCommand(process.cwd(), { deltaPath: options.delta ? path.resolve(options.delta) : undefined });
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else if (result.success) console.log('✓ LikeC4 syntax validation passed');
      else console.log(result.errors.map(error => error.message).join('\n'));
      if (!result.success) process.exitCode = 1;
    } catch (error) {
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });
  arch.command('export').option('--format <format>', 'png, svg, or pdf', 'png').option('--output <dir>', 'output directory', 'docs/architecture').action(options => exportArchitecture(process.cwd(), { format: options.format as ExportFormat, output: path.resolve(options.output) }));
  registerPlanRemoveCommand(arch);
}
