/**
 * Setup Command
 *
 * Sets up Xirang with managed workflow skills.
 * This is the sole project and tool setup command.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import {
  renderWorkflowInvocation,
} from '../utils/command-references.js';
import {
  AI_TOOLS,
  XIRANG_DIR_NAME,
  AIToolOption,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import { readProjectConfig } from './project-config.js';
import {
  getToolsWithSkillsDir,
  getToolStates,
  type ToolSkillStatus,
} from './shared/index.js';
import { type WorkflowId } from './workflow-surface.js';
import { WorkflowManifestRegistry } from './templates/manifest/index.js';
import { getAvailableTools } from './available-tools.js';
import {
  createWorkflowArtifactPlan,
} from './workflow-installation.js';
import { isMap, parseDocument } from 'yaml';
import { ArtifactSyncEngine } from './templates/sync-engine.js';
import {
  MODEL_FILE_MANIFEST,
  PERSPECTIVE_KIND,
  PERSPECTIVE_KIND_FILE,
  type ModelFileManifestEntry,
} from './templates/model-skeleton.js';
import { parseSemanticModel } from './model/parser.js';
import { MODEL_DIR_NAME } from './model/paths.js';
import { PARTITIONS } from './model/types.js';

export const SETUP_MODEL_FILE_MANIFEST: readonly ModelFileManifestEntry[] = MODEL_FILE_MANIFEST;

const require = createRequire(import.meta.url);
const { version: XIRANG_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'spec-driven';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type SetupCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  projectDefinition?: string;
};

// -----------------------------------------------------------------------------
// Setup Command Class
// -----------------------------------------------------------------------------

export class SetupCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly projectDefinitionArg?: string;

  constructor(options: SetupCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.projectDefinitionArg = options.projectDefinition;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const opsxDir = XIRANG_DIR_NAME;
    const xirangPath = path.join(projectPath, opsxDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, xirangPath);

    // Detect available tools in the project (task 7.1)
    const detectedTools = getAvailableTools(projectPath);

    // Show animated welcome screen (interactive mode only)
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // Validate profile override early so invalid values fail before tool setup.
    // The resolved value is consumed later when generation reads effective config.
    const proseLanguage = await this.promptForProseLanguage(projectPath);

    // Get tool states before processing
    const toolStates = getToolStates(projectPath);

    // Get tool selection (pass detected tools for pre-selection)
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates);
    const projectDefinition = await this.resolveProjectDefinition(extendMode);

    // Create directory structure and config
    await this.createDirectoryStructure(xirangPath, extendMode);

    // Seed the Semantic Model on first-time setup (non-extend mode)
    if (!extendMode) {
      await this.writeModelSkeleton(projectPath, xirangPath, projectDefinition!);
    }
    await this.ensureManagedModelFiles(xirangPath);

    // Generate skills and commands for each tool
    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    // Create config.yaml if needed
    const configStatus = await this.createConfig(xirangPath, proseLanguage);

    // Display success message
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus, extendMode, proseLanguage);
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & SETUP
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    xirangPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(xirangPath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // Check for --tools flag first
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    if (!canPrompt) {
      throw new Error(
        `Non-interactive setup requires --tools. Available values: all, none, ${validTools.join(', ')}`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `No tools available for skill generation.`
      );
    }

    // Interactive mode: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // Build choices: pre-select configured tools; keep detected tools visible but unselected.
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // Configured tools first, then detected (not configured), then everything else.
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      console.log(`Xirang configured: ${configuredNames.join(', ')} (pre-selected)`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? 'pre-selected for first-time setup'
        : 'not pre-selected';
      console.log(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
    }

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${validTools.length} available)`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = getToolsWithSkillsDir();
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(xirangPath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // In extend mode, just ensure directories exist without spinner
      for (const dir of this.structureDirectories(xirangPath)) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('Creating Xirang structure...');

    for (const dir of this.structureDirectories(xirangPath)) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('Xirang structure created'),
    });
  }

  private structureDirectories(xirangPath: string): string[] {
    return [
      xirangPath,
      ...PARTITIONS.map((partition) => path.join(xirangPath, MODEL_DIR_NAME, partition)),
      path.join(xirangPath, 'changes'),
      path.join(xirangPath, 'changes', 'archive'),
      path.join(xirangPath, 'references'),
    ];
  }

  // ═══════════════════════════════════════════════════════════
  // SEMANTIC MODEL SEED
  // ═══════════════════════════════════════════════════════════

  private async resolveProjectDefinition(extendMode: boolean): Promise<string | undefined> {
    if (extendMode) return undefined;
    if (this.projectDefinitionArg !== undefined) {
      if (this.projectDefinitionArg.trim().length === 0) {
        throw new Error('Project Definition must not be empty');
      }
      return this.projectDefinitionArg;
    }
    if (!this.canPromptInteractively()) {
      throw new Error('Non-interactive setup requires --project-definition');
    }

    const { input } = await import('@inquirer/prompts');
    return input({
      message: 'Project Definition',
      validate: (value: string) => value.trim().length > 0 || 'Enter a non-empty Project Definition',
    });
  }

  private async writeModelSkeleton(projectPath: string, xirangPath: string, projectDefinition: string): Promise<void> {
    const projectName = this.inferProjectName(projectPath);
    const context = {
      projectName,
      projectDefinition,
    };

    for (const file of SETUP_MODEL_FILE_MANIFEST) {
      const filePath = path.join(xirangPath, MODEL_DIR_NAME, ...file.relativePath.split('/'));
      if (!fs.existsSync(filePath)) {
        await FileSystemUtils.writeFile(filePath, file.render(context));
      }
    }
  }

  private async ensureManagedModelFiles(xirangPath: string): Promise<void> {
    const context = { projectName: '', projectDefinition: '' };
    const modelPath = path.join(xirangPath, MODEL_DIR_NAME);
    const parsed = await parseSemanticModel(modelPath);
    const managedFiles = [
      {
        identity: 'element',
        file: SETUP_MODEL_FILE_MANIFEST.find(file => file.relativePath === 'metamodel/element.md')!,
      },
      { identity: PERSPECTIVE_KIND.identity, file: PERSPECTIVE_KIND_FILE },
    ];
    for (const { identity, file } of managedFiles) {
      const expected = file.render(context);
      const matchingKinds = parsed.model.elementKinds.filter(kind => kind.identity === identity);
      if (matchingKinds.length > 1) {
        throw new Error(`Managed Element Kind ${identity} has duplicate declarations`);
      }
      const existing = matchingKinds[0];
      if (existing) {
        if (file !== PERSPECTIVE_KIND_FILE) continue;
        const module = parsed.index.moduleOf(identity);
        if (!module) throw new Error(`Managed Element Kind ${identity} has no source module`);
        const target = path.join(modelPath, ...module.path.split('/'));
        if (JSON.stringify(existing) !== JSON.stringify(PERSPECTIVE_KIND)) {
          throw new Error(`Managed Element Kind perspective conflicts with ${target}`);
        }
        continue;
      }
      const target = path.join(modelPath, ...file.relativePath.split('/'));
      await FileSystemUtils.writeFile(target, expected);
    }
  }

  private inferProjectName(projectPath: string): string {
    try {
      const pkgPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.name && typeof pkg.name === 'string' && pkg.name.trim().length > 0) {
          return pkg.name.trim();
        }
      }
    } catch {
      // Fall through to basename fallback
    }
    return path.basename(projectPath);
  }

  private toProjectId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL & COMMAND GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
    generatedSkillCount: number;
    generatedCommandCount: number;
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];

    // Workflows are fixed from registry; skills-only surface.
    const allWorkflowIds = WorkflowManifestRegistry.getAllWorkflowIds() as unknown as readonly WorkflowId[];
    const workflows = createWorkflowArtifactPlan(
      allWorkflowIds,
      projectPath
    ).workflows;

    // Build sync requests for all tools
    const requests = tools.map((tool) => ({
      toolId: tool.value,
      projectPath,
      workflows,
      version: XIRANG_VERSION,
    }));

    const summary = await ArtifactSyncEngine.syncAll(requests);

    // Map sync results to setup output
    for (const tool of tools) {
      const result = summary.results.find((r) => r.toolId === tool.value);
      if (!result) continue;

      if (result.error) {
        failedTools.push({ name: tool.name, error: result.error });
      } else {
        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      generatedSkillCount: summary.totalSkillsWritten,
      generatedCommandCount: summary.totalCommandsWritten,
      removedCommandCount: summary.totalCommandsRemoved,
      removedSkillCount: summary.totalSkillsRemoved,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async promptForProseLanguage(projectPath: string): Promise<string | undefined> {
    if (!this.canPromptInteractively()) {
      return undefined;
    }

    const currentProseLanguage = readProjectConfig(projectPath)?.proseLanguage;
    const { input } = await import('@inquirer/prompts');
    const response = await input({
      message: 'Xirang document language (optional, e.g. en, zh-CN, pt-BR)',
      default: currentProseLanguage ?? '',
      validate: (value: string) => {
        if (value.trim().length === 0) {
          return true;
        }
        return value.trim().length > 0 || 'Enter a non-empty language or leave it blank';
      },
    });

    const normalized = response.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private async writeProseLanguage(
    configPath: string,
    proseLanguage: string
  ): Promise<void> {
    const content = await fs.promises.readFile(configPath, 'utf-8');
    const document = parseDocument(content);

    if (document.errors.length > 0) {
      throw new Error(`Failed to parse existing ${path.basename(configPath)}`);
    }

    if (!document.contents || !isMap(document.contents)) {
      throw new Error(`${path.basename(configPath)} must contain a YAML object`);
    }

    document.set('proseLanguage', proseLanguage);
    await FileSystemUtils.writeFile(configPath, String(document));
  }

  private async createConfig(
    xirangPath: string,
    proseLanguage?: string
  ): Promise<'created' | 'updated' | 'exists' | 'skipped'> {
    const configPath = path.join(xirangPath, 'config.yaml');
    const configYmlPath = path.join(xirangPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);
    const existingConfigPath = configYamlExists ? configPath : configYmlExists ? configYmlPath : null;

    if (existingConfigPath) {
      if (!proseLanguage) {
        return 'exists';
      }
      await this.writeProseLanguage(existingConfigPath, proseLanguage);
      return 'updated';
    }

    try {
      const yamlContent = serializeConfig({ schema: DEFAULT_SCHEMA, proseLanguage });
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
      generatedSkillCount: number;
      generatedCommandCount: number;
      removedCommandCount: number;
      removedSkillCount: number;
    },
    configStatus: 'created' | 'updated' | 'exists' | 'skipped',
    extendMode: boolean,
    proseLanguage?: string
  ): void {
    console.log();
    console.log(chalk.bold('Xirang Setup Complete'));
    console.log();

    // Show created vs refreshed tools
    if (results.createdTools.length > 0) {
      console.log(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      console.log(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    // Show counts (skills-only)
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      const skillCount = results.generatedSkillCount;
      if (skillCount > 0) {
        console.log(`${skillCount} skills in ${toolDirs}/`);
      }
    }

    // Show failures
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // Show removed skills (from deselected workflows)
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`Removed: ${results.removedSkillCount} skill directories (no longer in workflow manifest)`));
    }

    // Config status
    if (configStatus === 'created') {
      const details = proseLanguage ? `schema: ${DEFAULT_SCHEMA}, proseLanguage: ${proseLanguage}` : `schema: ${DEFAULT_SCHEMA}`;
      console.log(`Config: ${XIRANG_DIR_NAME}/config.yaml (${details})`);
    } else if (configStatus === 'updated') {
      console.log(`Config: ${XIRANG_DIR_NAME}/config.yaml (updated proseLanguage: ${proseLanguage})`);
    } else if (configStatus === 'exists') {
      // Show actual filename (config.yaml or config.yml)
      const configYaml = path.join(projectPath, XIRANG_DIR_NAME, 'config.yaml');
      const configYml = path.join(projectPath, XIRANG_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`Config: ${XIRANG_DIR_NAME}/${configName} (exists)`);
    } else {
      console.log(chalk.dim(`Config: skipped (non-interactive mode)`));
    }

    // Getting started
    const activeWorkflows = [...WorkflowManifestRegistry.getAllWorkflowIds()];
    const guidanceToolId = this.getGuidanceToolId(successfulTools.map((tool) => tool.value));
    console.log();
    if (guidanceToolId && activeWorkflows.includes('propose')) {
      console.log(chalk.bold('Getting started:'));
      console.log(`  Start your first change: ${renderWorkflowInvocation(guidanceToolId, 'propose')} "your idea"`);
    } else {
      console.log("Done. Run 'xirang setup' to configure your workflows.");
    }

    if (!extendMode && guidanceToolId && activeWorkflows.includes('build')) {
      const buildRef = renderWorkflowInvocation(guidanceToolId, 'build' as WorkflowId);
      console.log(`  Next: run ${buildRef} to build your project Xirang`);
    }

    // Links
    console.log();
    console.log(`Learn more: ${chalk.cyan('https://github.com/cp-yu/xirang')}`);
    console.log(`Feedback:   ${chalk.cyan('https://github.com/cp-yu/xirang/issues')}`);

    // Restart instruction if any tools were configured
    if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
      console.log();
      console.log(chalk.white('Restart your IDE or current session for refreshed skills to take effect.'));
    }

    console.log();
  }

  private getGuidanceToolId(toolIds: readonly string[]): string | undefined {
    return toolIds[0];
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }
}
