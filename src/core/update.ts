/**
 * Update Command
 *
 * Refreshes Xirang skills for configured tools.
 * Supports stale-config cleanup, default reconciliation, and smart update detection.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { AI_TOOLS, XIRANG_DIR_NAME } from './config.js';
import {
  getToolVersionStatus,
  getToolsWithSkillsDir,
  type ToolVersionStatus,
} from './shared/index.js';
import { isInteractive } from '../utils/interactive.js';
import { getGlobalConfig, getGlobalConfigPath, saveGlobalConfig } from './global-config.js';
import { getAvailableTools } from './available-tools.js';
import {
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  createWorkflowArtifactPlan,
} from './workflow-installation.js';
import { ALL_WORKFLOWS, WORKFLOW_TO_SKILL_DIR } from './workflow-surface.js';
import { migrateProjectConfigDefaults } from './project-config.js';
import { ArtifactSyncEngine } from './templates/sync-engine.js';
import { WorkflowManifestRegistry } from './templates/manifest/index.js';

const require = createRequire(import.meta.url);
const { version: XIRANG_VERSION } = require('../../package.json');

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 */
export function scanInstalledWorkflows(projectPath: string, toolIds: string[]): string[] {
  const installed = new Set<string>();
  for (const toolId of toolIds) {
    const tool = AI_TOOLS.find((candidate) => candidate.value === toolId);
    if (!tool?.skillsDir) continue;
    const skillsRoot = path.join(projectPath, tool.skillsDir, 'skills');
    for (const workflowId of ALL_WORKFLOWS) {
      const skillFile = path.join(skillsRoot, WORKFLOW_TO_SKILL_DIR[workflowId], 'SKILL.md');
      if (fs.existsSync(skillFile)) installed.add(workflowId);
    }
  }
  return ALL_WORKFLOWS.filter((workflowId) => installed.has(workflowId));
}

export class UpdateCommand {
  private readonly force: boolean;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const xirangPath = path.join(resolvedProjectPath, XIRANG_DIR_NAME);

    // 1. Check xirang directory exists
    if (!await FileSystemUtils.directoryExists(xirangPath)) {
      throw new Error("未找到 Xirang 项目。运行 'xirang setup' 进行设置。");
    }

    // 2. Resolve the fixed workflow set without writing project state.
    const allWorkflowIds = WorkflowManifestRegistry.getAllWorkflowIds();
    const plan = createWorkflowArtifactPlan(allWorkflowIds, resolvedProjectPath);
    const desiredWorkflows = [...plan.workflows];

    const configMigration = migrateProjectConfigDefaults(resolvedProjectPath);
    if (configMigration.status === 'skipped') {
      console.warn(
        chalk.yellow(
          `Project config default migration skipped for ${path.relative(resolvedProjectPath, configMigration.path)} (${configMigration.reason})`
        )
      );
    }

    const detectedTools = getAvailableTools(resolvedProjectPath);

    // 4. Reconcile obsolete managed settings and workflow remnants after approval.
    this.cleanupObsoleteConfigFields();
    this.cleanupExpandedWorkflowRemnants(resolvedProjectPath);

    // 5. Find configured tools (skills-only surface)
    const configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath);

    if (configuredTools.length === 0) {
      console.log(chalk.yellow('No configured tools found.'));
      console.log(chalk.dim('Run "xirang setup" to set up tools.'));
      return;
    }

    // 6. Check version status for all configured tools
    const toolStatuses = configuredTools.map((toolId) =>
      getToolVersionStatus(resolvedProjectPath, toolId, XIRANG_VERSION)
    );
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 7. Smart update detection (skills-only drift)
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => s.needsUpdate)
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      configuredTools
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
    ]);
    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0) {
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, configuredTools);
      this.displayExtraWorkflowsNote(resolvedProjectPath, configuredTools, desiredWorkflows);
      return;
    }

    // 8. Display update plan
    if (this.force) {
      console.log(`Force updating ${configuredTools.length} tool(s): ${configuredTools.join(', ')}`);
    } else {
      this.displayUpdatePlan([...toolsToUpdateSet], statusByTool, toolsUpToDate);
    }
    console.log();

    // 9. Update tools (all if force, otherwise only those needing update)
    const toolsToUpdate = this.force ? configuredTools : [...toolsToUpdateSet];

    const syncRequests = toolsToUpdate.map((toolId) => ({
      toolId,
      projectPath: resolvedProjectPath,
      workflows: desiredWorkflows,
      version: XIRANG_VERSION,
    }));

    const summary = await ArtifactSyncEngine.syncAll(syncRequests);

    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];

    for (const result of summary.results) {
      const tool = AI_TOOLS.find((t) => t.value === result.toolId);
      if (result.error) {
        failedTools.push({ name: tool?.name || result.toolId, error: result.error.message });
      } else {
        updatedTools.push(tool?.name || result.toolId);
      }
    }

    // 11. Summary
    console.log();
    if (updatedTools.length > 0) {
      console.log(chalk.green(`✓ Updated: ${updatedTools.join(', ')} (v${XIRANG_VERSION})`));
    }
    if (failedTools.length > 0) {
      console.log(chalk.red(`✗ Failed: ${failedTools.map(f => `${f.name} (${f.error})`).join(', ')}`));
    }
    if (summary.totalSkillsRemoved > 0) {
      console.log(chalk.dim(`Removed: ${summary.totalSkillsRemoved} skill directories`));
    }

    const configuredAndNewTools = [...configuredTools];

    // 13. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredAndNewTools);

    // 14. Display note about extra workflows not in profile
    this.displayExtraWorkflowsNote(resolvedProjectPath, configuredAndNewTools, desiredWorkflows);

    // 15. List affected tools
    if (updatedTools.length > 0) {
      const toolDisplayNames = updatedTools;
      console.log(chalk.dim(`Tools: ${toolDisplayNames.join(', ')}`));
    }

    console.log();
    console.log(chalk.dim('Restart your IDE or current session for refreshed skills to take effect.'));
  }

  private getGuidanceToolId(toolIds: readonly string[]): string {
    return toolIds[0] ?? 'codex';
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    console.log(chalk.green(`✓ All ${toolStatuses.length} tool(s) up to date (v${XIRANG_VERSION})`));
    console.log(chalk.dim(`  Tools: ${toolNames.join(', ')}`));
    console.log();
    console.log(chalk.dim('Use --force to refresh files anyway.'));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? 'unknown';
        return `${status.toolId} (${fromVersion} → ${XIRANG_VERSION})`;
      }
      return `${toolId} (config sync)`;
    });

    console.log(`Updating ${toolsToUpdate.length} tool(s): ${updates.join(', ')}`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      console.log(chalk.dim(`Already up to date: ${upToDateNames.join(', ')}`));
    }
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredTools: string[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredTools);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      const isSingleTool = newToolNames.length === 1;
      const toolNoun = isSingleTool ? 'tool' : 'tools';
      const pronoun = isSingleTool ? 'it' : 'them';
      console.log();
      console.log(
        chalk.yellow(
          `Detected new ${toolNoun}: ${newToolNames.join(', ')}. Run 'xirang setup' to add ${pronoun}.`
        )
      );
    }
  }

  /**
   * Displays a note about extra workflows installed outside the fixed workflow set.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): void {
    const installedWorkflows = scanInstalledWorkflows(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      console.log(chalk.dim(`Note: ${extraWorkflows.length} extra workflows installed outside the standard set. Run 'xirang update' to sync.`));
    }
  }

  /**
   * Clean up obsolete profile/workflows/delivery fields from global config.
   * Re-saves the config without those fields (getGlobalConfig already strips them).
   */
  private cleanupObsoleteConfigFields(): void {
    const configPath = getGlobalConfigPath();
    try {
      if (!fs.existsSync(configPath)) return;
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (raw.profile === undefined && raw.workflows === undefined && raw.delivery === undefined) return;
      console.warn(chalk.yellow('Obsolete config fields detected (profile/workflows/delivery), auto-cleaning...'));
      const config = getGlobalConfig();
      saveGlobalConfig(config);
      console.log(chalk.dim('Obsolete fields auto-cleaned.'));
    } catch {
      // Silently ignore config cleanup failures
    }
  }

  /**
   * Remove expanded workflow remnants: skill dirs and command files for
   * the 7 workflows that were removed from the registry.
   */
  private cleanupExpandedWorkflowRemnants(projectPath: string): void {
    const removedSkillDirNames = [
      'opsx-new-change',
      'opsx-continue-change',
      'opsx-ff-change',
      'opsx-verify-change',
      'opsx-sync-specs',
      'opsx-bulk-archive-change',
      'opsx-onboard',
    ];

    const removedCommandSlugs = ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive', 'onboard'];

    const toolDirs: Array<{ skills: string; commands: string }> = [
      { skills: '.claude/skills', commands: '.claude/commands/xirang' },
      { skills: '.cursor/skills', commands: '.cursor/commands' },
      { skills: '.windsurf/skills', commands: '.windsurf/workflows' },
      { skills: '.codex/skills', commands: '' },
      { skills: '.gemini/skills', commands: '.gemini/commands/xirang' },
      { skills: '.continue/skills', commands: '.continue/prompts' },
      { skills: '.clinerules/skills', commands: '.clinerules/workflows' },
    ];

    let cleaned = 0;

    for (const { skills, commands } of toolDirs) {
      const skillsBase = path.join(projectPath, skills);
      for (const dirName of removedSkillDirNames) {
        const skillDir = path.join(skillsBase, dirName);
        try {
          if (fs.existsSync(skillDir)) {
            fs.rmSync(skillDir, { recursive: true, force: true });
            cleaned++;
          }
        } catch {
          // Ignore errors
        }
      }

      if (commands) {
        const commandsBase = path.join(projectPath, commands);
        for (const slug of removedCommandSlugs) {
          // Try multiple extensions
          for (const ext of ['.md', '.toml', '.prompt', '.prompt.md']) {
            const cmdFile = path.join(commandsBase, `xirang-${slug}${ext}`);
            try {
              if (fs.existsSync(cmdFile)) {
                fs.rmSync(cmdFile, { force: true });
                cleaned++;
              }
            } catch {
              // Ignore errors
            }
          }
          // Claude-style flat slug commands
          const flatCmdFile = path.join(commandsBase, `${slug}.md`);
          try {
            if (fs.existsSync(flatCmdFile)) {
              fs.rmSync(flatCmdFile, { force: true });
              cleaned++;
            }
          } catch {
            // Ignore errors
          }
        }
      }
    }

    if (cleaned > 0) {
      console.log(chalk.dim(`Cleaned ${cleaned} deprecated workflow remnant files.`));
    }
  }
}
