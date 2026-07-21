import type { Command } from 'commander';
import ora from 'ora';
import { migrateOpsxToLikeC4, type MigrateOpsxOptions } from './opsx-to-likec4.js';

export function registerMigrateCommand(program: Command): void {
  const migrate = program.command('migrate').description('Migrate OPSX project formats');
  migrate.command('opsx-to-likec4')
    .description('Migrate OPSX YAML architecture to LikeC4')
    .option('--dry-run', 'Preview generated files without writing')
    .option('--agent-verify', 'Request agent verification guidance')
    .action(async (options: MigrateOpsxOptions) => {
      try {
        await migrateOpsxToLikeC4(process.cwd(), options);
      } catch (error) {
        ora().fail(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });
}
