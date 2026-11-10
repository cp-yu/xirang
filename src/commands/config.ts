import { Command } from 'commander';
import { diagnostic } from '../utils/output.js';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { readProjectConfig, ProjectConfigSchema, validateConfigRules } from '../core/project-config.js';
import { resolveSchema } from '../core/artifact-graph/index.js';
import { normalizeProjectConfig } from '../core/config-projection.js';

function isProjectSelection(key: string, artifactIds: string[]): boolean {
  const parts = key.split('.');
  if (parts[0] === 'rules') return parts.length === 1 || (parts.length === 2 && artifactIds.includes(parts[1]));
  if (parts[0] === 'docLanguage') return false;
  let field: z.ZodType = ProjectConfigSchema;
  for (const part of parts) {
    while (field instanceof z.ZodOptional || field instanceof z.ZodDefault) field = field.unwrap() as z.ZodType;
    if (!(field instanceof z.ZodObject) || !Object.hasOwn(field.shape, part)) return false;
    field = field.shape[part];
  }
  return true;
}

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.includes('force closed the prompt with SIGINT'))
  );
}

/**
 * Register the config command and all its subcommands.
 *
 * @param program - The Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('View and modify global Xirang configuration')
    .option('--scope <scope>', 'Config scope (only "global" supported currently)')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.scope && opts.scope !== 'global') {
        diagnostic('Error: Project-local config is not yet implemented');
        process.exit(1);
      }
    });

  // config path
  configCmd
    .command('path')
    .description('Show config file location')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      console.log(options.json ? JSON.stringify(getGlobalConfigPath()) : getGlobalConfigPath());
    });

  // config list
  configCmd
    .command('list')
    .description('Show all current settings')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const config = getGlobalConfig();

      if (options.json) {
        console.log(JSON.stringify(config));
      } else {
        console.log(formatValueYaml(config));
      }
    });

  // config project
  configCmd
    .command('project')
    .description('Show normalized project-level configuration')
    .option('--json', 'Output as JSON')
    .option('--select <key>', 'Select an effective config field (repeatable)', (value: string, previous: string[]) => [...previous, value], [])
    .option('--artifact <id>', 'Limit rules to one artifact')
    .action((options: { json?: boolean; select: string[]; artifact?: string }) => {
      const report = (message: string, code: string) => console.error(options.json
        ? JSON.stringify({ code, message }) : message);
      const normalized = normalizeProjectConfig(readProjectConfig(process.cwd(), (message) => report(message, 'CONFIG_WARNING')));
      const artifactIds = resolveSchema(normalized.schema ?? 'semantic-model', process.cwd()).artifacts.map(a => a.id);
      if (options.artifact && !artifactIds.includes(options.artifact)) {
        report(`Unknown artifact '${options.artifact}'. Available: ${artifactIds.join(', ')}`, 'INVALID_ARTIFACT');
        process.exitCode = 1;
        return;
      }
      for (const warning of validateConfigRules(normalized.rules, new Set(artifactIds), normalized.schema ?? 'semantic-model')) {
        report(warning, 'CONFIG_WARNING');
      }
      if (options.artifact) {
        const rules = normalized.rules[options.artifact];
        normalized.rules = rules?.length ? { [options.artifact]: rules } : {};
      }
      let result: Record<string, unknown> = normalized as unknown as Record<string, unknown>;
      if (options.select.length) {
        result = {};
        for (const key of options.select) {
          if (!isProjectSelection(key, artifactIds)) {
            report(`Invalid effective configuration field '${key}'`, 'INVALID_CONFIG_SELECTION');
            process.exitCode = 1;
            return;
          }
          const value = getNestedValue(normalized as unknown as Record<string, unknown>, key);
          if (value !== undefined) setNestedValue(result, key, value);
        }
      }
      console.log(options.json ? JSON.stringify(result) : formatValueYaml(result));
    });

  // config get
  configCmd
    .command('get <key>')
    .description('Get a specific value (raw, scriptable)')
    .option('--json', 'Output as JSON')
    .action((key: string, options: { json?: boolean }) => {
      const config = getGlobalConfig();
      const value = getNestedValue(config as Record<string, unknown>, key);

      if (value === undefined) {
        diagnostic(`Configuration key "${key}" is not set`, 'CONFIG_KEY_NOT_FOUND');
        process.exitCode = 1;
        return;
      }

      if (options.json || (typeof value === 'object' && value !== null)) {
        console.log(JSON.stringify(value));
      } else {
        console.log(String(value));
      }
    });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('Set a value (auto-coerce types)')
    .option('--string', 'Force value to be stored as string')
    .option('--allow-unknown', 'Allow setting unknown keys')
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const allowUnknown = Boolean(options.allowUnknown);
      const keyValidation = validateConfigKeyPath(key);
      if (!keyValidation.valid && (keyValidation.retired || !allowUnknown)) {
        const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
        diagnostic(`Error: Invalid configuration key "${key}".${reason}`);
        diagnostic('Use "xirang config list" to see available keys.');
        if (!keyValidation.retired) {
          diagnostic('Pass --allow-unknown to bypass this check.');
        }
        process.exitCode = 1;
        return;
      }

      const config = getGlobalConfig() as Record<string, unknown>;
      const coercedValue = coerceValue(value, options.string || false);

      // Create a copy to validate before saving
      const newConfig = JSON.parse(JSON.stringify(config));
      setNestedValue(newConfig, key, coercedValue);

      // Validate the new config
      const validation = validateConfig(newConfig);
      if (!validation.success) {
        diagnostic(`Error: Invalid configuration - ${validation.error}`);
        process.exitCode = 1;
        return;
      }

      // Apply changes and save
      setNestedValue(config, key, coercedValue);
      saveGlobalConfig(config as GlobalConfig);


    });

  // config unset
  configCmd
    .command('unset <key>')
    .description('Remove a key (revert to default)')
    .action((key: string) => {
      const config = getGlobalConfig() as Record<string, unknown>;
      const existed = deleteNestedValue(config, key);

      if (existed) {
        saveGlobalConfig(config as GlobalConfig);

      }
    });

  // config reset
  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--all', 'Reset all configuration (required)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      if (!options.all) {
        diagnostic('Error: --all flag is required for reset');
        diagnostic('Usage: xirang config reset --all [-y]');
        process.exitCode = 1;
        return;
      }

      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        let confirmed: boolean;
        try {
          confirmed = await confirm({
            message: 'Reset all configuration to defaults?',
            default: false,
          });
        } catch (error) {
          if (isPromptCancellationError(error)) {
            diagnostic('Reset cancelled.', 'CANCELLED');
            process.exitCode = 130;
            return;
          }
          throw error;
        }

        if (!confirmed) {
          diagnostic('Reset cancelled.', 'CANCELLED');
          return;
        }
      }

      saveGlobalConfig({ ...DEFAULT_CONFIG });

    });

  // config edit
  configCmd
    .command('edit')
    .description('Open config in $EDITOR')
    .action(async () => {
      const editor = process.env.EDITOR || process.env.VISUAL;

      if (!editor) {
        diagnostic('Error: No editor configured');
        diagnostic('Set the EDITOR or VISUAL environment variable to your preferred editor');
        diagnostic('Example: export EDITOR=vim');
        process.exitCode = 1;
        return;
      }

      const configPath = getGlobalConfigPath();

      // Ensure config file exists with defaults
      if (!fs.existsSync(configPath)) {
        saveGlobalConfig({ ...DEFAULT_CONFIG });
      }

      // Spawn editor and wait for it to close
      // Avoid shell parsing to correctly handle paths with spaces in both
      // the editor path and config path
      const child = spawn(editor, [configPath], {
        stdio: 'inherit',
        shell: false,
      });

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Editor exited with code ${code}`));
          }
        });
        child.on('error', reject);
      });

      try {
        const rawConfig = fs.readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);
        const validation = validateConfig(parsedConfig);

        if (!validation.success) {
          diagnostic(`Error: Invalid configuration - ${validation.error}`);
          process.exitCode = 1;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          diagnostic(`Error: Config file not found at ${configPath}`);
        } else if (error instanceof SyntaxError) {
          diagnostic(`Error: Invalid JSON in ${configPath}`);
          diagnostic(error.message);
        } else {
          diagnostic(`Error: Unable to validate configuration - ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exitCode = 1;
      }
    });
}
