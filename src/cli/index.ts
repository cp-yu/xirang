import { Command } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { diagnostic, setJsonOutput } from '../utils/output.js';
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS } from '../core/config.js';
import { UpdateCommand } from '../core/update.js';
import { ListCommand } from '../core/list.js';
import { ArchiveCommand } from '../core/archive.js';
import { ViewCommand } from '../core/view.js';
import { registerHelpCommand } from '../commands/help.js';
import { ValidateCommand } from '../commands/validate.js';
import { ShowCommand } from '../commands/show.js';
import { CompletionCommand } from '../commands/completion.js';
import { FeedbackCommand } from '../commands/feedback.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerSchemaCommand } from '../commands/schema.js';
import { registerSyncCommand } from '../commands/sync.js';
import { registerQualityCommand } from '../commands/quality.js';
import { registerArchCommand } from '../commands/arch/index.js';
import { registerCandidateCommand } from '../commands/candidate.js';
import { registerRecordCommand } from '../commands/record.js';
import { registerDeltaCommand } from '../commands/delta.js';
import {
  statusCommand,
  templatesCommand,
  schemasCommand,
  newChangeCommand,
  DEFAULT_SCHEMA,
  type StatusOptions,
  type TemplatesOptions,
  type SchemasOptions,
  type NewChangeOptions,
} from '../commands/workflow/index.js';
import { maybeShowTelemetryNotice, trackCommand, shutdown } from '../telemetry/index.js';

export const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
function getCommandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;

  while (current) {
    const name = current.name();
    // Skip the root 'xirang' command
    if (name && name !== 'xirang') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'xirang';
}

program
  .name('xirang')
  .description('AI-native system for semantic-model-driven development')
  .version(version);

// Global options
program.option('--no-color', 'Disable color output');

// Apply global flags and telemetry before any command runs
// Note: preAction receives (thisCommand, actionCommand) where:
// - thisCommand: the command where hook was added (root program)
// - actionCommand: the command actually being executed (subcommand)
program.hook('preAction', async (_thisCommand, actionCommand) => {
  const opts = actionCommand.optsWithGlobals();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }

  // Show first-run telemetry notice (if not seen)
  await maybeShowTelemetryNotice();

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);
  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async () => {
  await shutdown();
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);
const toolsOptionDescription = `Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(', ')}`;

program
  .command('setup [path]')
  .description('Set up Xirang in your project')
  .option('--tools <tools>', toolsOptionDescription)
  .option('--project-definition <definition>', 'Complete Project Definition for a new non-interactive workspace')
  .option('--force', 'Archive retired managed files without prompting')
  .action(async (targetPath = '.', options?: { tools?: string; projectDefinition?: string; force?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);

      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path "${targetPath}" is not a directory`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {

        } else if (error.message && error.message.includes('not a directory')) {
          throw error;
        } else {
          throw new Error(`Cannot access path "${targetPath}": ${error.message}`);
        }
      }

      const { SetupCommand } = await import('../core/setup.js');
      await new SetupCommand({
        tools: options?.tools,
        force: options?.force,
        projectDefinition: options?.projectDefinition,
      }).execute(targetPath);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description('Update Xirang instruction files')
  .option('--force', 'Force update even when tools are up to date')
  .action(async (targetPath = '.', options?: { force?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const updateCommand = new UpdateCommand({ force: options?.force });
      await updateCommand.execute(resolvedPath);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

registerSyncCommand(program);
registerQualityCommand(program);
registerArchCommand(program);
registerCandidateCommand(program);
registerRecordCommand(program);
registerDeltaCommand(program);

program
  .command('list')
  .description('List active changes')
  .option('--changes', 'List changes explicitly (default)')
  .option('--sort <order>', 'Sort order: "recent" (default) or "name"', 'recent')
  .option('--json', 'Output as JSON (for programmatic use)')
  .option('--long', 'Show title, Delta count, and task status')
  .action(async (options?: { changes?: boolean; sort?: string; json?: boolean; long?: boolean }) => {
    try {
      const listCommand = new ListCommand();
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute('.', { sort, json: options?.json, long: options?.long });
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('view')
  .description('Browse the Semantic Model in the embedded web viewer')
  .option('--listen <address>', 'IP address to listen on')
  .option('--port <n>', 'Web server port', (value) => Number(value))
  .action(async (options: { listen?: string; port?: number; json?: boolean }) => {
    try {
      const viewCommand = new ViewCommand();
      await viewCommand.execute('.', { listen: options.listen, port: options.port, json: options.json });
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('archive [change-name]')
  .description('Archive a completed change')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-sync', 'Skip sync gate（pending delta 检查，需要显式授权）')
  .option('--no-validate', 'Skip validation (not recommended, requires confirmation)')
  .option('--no-verify', 'Skip the quality gate (requires explicit user authorization, not recommended)')
  .action(async (changeName?: string, options?: { yes?: boolean; noSync?: boolean; sync?: boolean; noValidate?: boolean; validate?: boolean; noVerify?: boolean; verify?: boolean }) => {
    try {
      const archiveCommand = new ArchiveCommand();
      await archiveCommand.execute(changeName, options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

registerHelpCommand(program);
registerConfigCommand(program);
registerSchemaCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description('Validate changes and Element Contracts')
  .option('--all', 'Validate all changes and Element Contracts')
  .option('--changes', 'Validate all changes')
  .option('--contracts', 'Validate all Element Contracts')
  .option('--change <name>', 'Validate an explicit change')
  .option('--type <type>', 'Specify item type when ambiguous: change|contract')
  .option('--strict', 'Enable strict validation mode')
  .option('--json', 'Encode diagnostics and requested results as JSON')
  .option('--preview', 'Show the Change semantic difference')
  .option('--concurrency <n>', 'Max concurrent validations (defaults to env XIRANG_CONCURRENCY or 6)')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; contracts?: boolean; change?: string; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string }) => {
    try {
      const validateCommand = new ValidateCommand();
      await validateCommand.execute(itemName, options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Top-level show command
program
  .command('show [item-name]')
  .description('Show a change')
  .option('--json', 'Output as JSON')
  .option('--review', 'Output the read-only editor review projection')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (itemName?: string, options?: { json?: boolean; review?: boolean; noInteractive?: boolean; [k: string]: any }) => {
    try {
      const showCommand = new ShowCommand();
      await showCommand.execute(itemName, options ?? {});
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Feedback command
program
  .command('feedback <message>')
  .description('Submit feedback about Xirang')
  .option('--body <text>', 'Detailed description for the feedback')
  .action(async (message: string, options?: { body?: string }) => {
    try {
      const feedbackCommand = new FeedbackCommand();
      await feedbackCommand.execute(message, options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion')
  .description('Manage shell completions for Xirang CLI');

completionCmd
  .command('generate [shell]')
  .description('Generate completion script for a shell (outputs to stdout)')
  .action(async (shell?: string, options?: { json?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand(program);
      await completionCommand.generate({ shell, json: options?.json });
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

completionCmd
  .command('install [shell]')
  .description('Install completion script for a shell')
  .option('--verbose', 'Show detailed installation output')
  .action(async (shell?: string, options?: { verbose?: boolean; json?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand(program);
      await completionCommand.install({ shell, verbose: options?.verbose, json: options?.json });
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall [shell]')
  .description('Uninstall completion script for a shell')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand(program);
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Hidden command for machine-readable completion data
program
  .command('__complete <type>', { hidden: true })
  .description('Output completion data in machine-readable format (internal use)')
  .action(async (type: string) => {
    try {
      const completionCommand = new CompletionCommand(program);
      await completionCommand.complete({ type });
    } catch (error) {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  });

// ═══════════════════════════════════════════════════════════
// Workflow Commands (formerly experimental)
// ═══════════════════════════════════════════════════════════

// Status command
program
  .command('status')
  .description('Display artifact completion status for a change')
  .option('--change <id>', 'Change name to show status for')
  .option('--schema <name>', 'Schema override (auto-detected from config.yaml)')
  .option('--json', 'Output as JSON')
  .action(async (options: StatusOptions) => {
    try {
      await statusCommand(options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('Show resolved template paths for all artifacts in a schema')
  .option('--schema <name>', `Schema to use (default: ${DEFAULT_SCHEMA})`)
  .option('--json', 'Output as JSON mapping artifact IDs to template paths')
  .action(async (options: TemplatesOptions) => {
    try {
      await templatesCommand(options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// Schemas command
program
  .command('schemas')
  .description('List available workflow schemas with descriptions')
  .option('--json', 'Output as JSON (for agent use)')
  .action(async (options: SchemasOptions) => {
    try {
      await schemasCommand(options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

// New command group with change subcommand
const newCmd = program.command('new').description('Create new items');

newCmd
  .command('change <name>')
  .description('Create a new change directory')
  .option('--description <text>', 'Description to add to README.md')
  .option('--schema <name>', `Workflow schema to use (default: ${DEFAULT_SCHEMA})`)
  .action(async (name: string, options: NewChangeOptions) => {
    try {
      await newChangeCommand(name, options);
    } catch (error) {
      diagnostic((error as Error).message);
      process.exit(1);
    }
  });

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const args = argv.slice(2);
  const json = args.includes('--json') || args.some((argument, index) => argument === '--format=json' || (argument === '--format' && args[index + 1] === 'json'));
  setJsonOutput(json);
  const configureOutput = (command: Command): void => {
    if (command !== program && command.commands.length === 0 && !command.options.some(option => option.long === '--json')) command.option('--json', 'Encode results and diagnostics as JSON');
    command.configureOutput({ outputError: (str, write) => write(json ? JSON.stringify({ code: 'INVALID_ARGUMENT', message: str.trim() }) + '\n' : str) });
    command.commands.forEach(configureOutput);
  };
  configureOutput(program);
  const firstCommand = args.find((argument) => !argument.startsWith('-'));
  const qualityInvocation = firstCommand === 'quality';
  if (qualityInvocation) program.enablePositionalOptions(true);
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    diagnostic(error.message);
    process.exitCode = 1;
  } finally {
    setJsonOutput(false);
    if (qualityInvocation) program.enablePositionalOptions(false);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryFile === currentFile) {
  await runCli(process.argv);
}
