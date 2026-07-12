/**
 * Shared Artifact Sync Engine.
 *
 * Single orchestration engine for planning, rendering, transforming,
 * and writing skill artifacts. Skills-only workflow surface.
 */

import path from 'path';
import * as fs from 'fs';
import { parse as parseYaml } from 'yaml';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  generateSkillContent,
  getSkillTemplates,
  getManagedSkillDirNames,
} from '../shared/skill-generation.js';
import {
  INTERNAL_SUBAGENT_TEMPLATES,
  generateSubagentContent,
  type SubagentArtifactFormat,
  type SubagentTemplate,
} from '../shared/subagent-generation.js';
import type { SkillTemplateEntry } from '../shared/skill-generation.js';
import { runTransforms } from './transforms/index.js';
import {
  ALL_WORKFLOWS,
  normalizeWorkflowIds,
  type WorkflowId,
} from '../workflow-surface.js';
import { ToolProfileRegistry } from './tool-profile/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtifactSyncRequest {
  toolId: string;
  projectPath: string;
  workflows: readonly string[];
  version: string;
}

export interface ArtifactSyncResult {
  toolId: string;
  toolName: string;
  skillsWritten: number;
  agentsWritten: number;
  commandsWritten: number;
  skillsRemoved: number;
  commandsRemoved: number;
  error?: Error;
}

export interface ArtifactSyncSummary {
  results: ArtifactSyncResult[];
  totalSkillsWritten: number;
  totalAgentsWritten: number;
  totalCommandsWritten: number;
  totalSkillsRemoved: number;
  totalCommandsRemoved: number;
  failed: ArtifactSyncResult[];
  succeeded: ArtifactSyncResult[];
}

// ---------------------------------------------------------------------------
// Plan types
// ---------------------------------------------------------------------------

interface SkillWriteEntry {
  template: SkillTemplateEntry['template'];
  dirName: string;
  workflowId: string;
}

interface SubagentWriteEntry {
  template: SubagentTemplate;
}

interface SharedReferenceSource {
  template: { referenceFiles?: readonly { path: string; content: string }[] };
  workflowId: string;
}

export interface SharedReferenceFile {
  fileName: string;
  sourcePath: string;
  content: string;
}

interface ToolSyncPlan {
  toolId: string;
  toolName: string;
  skillsDir: string;
  agentsDir?: string;
  agentFormat?: SubagentArtifactFormat;
  skillEntries: SkillWriteEntry[];
  subagentEntries: SubagentWriteEntry[];
  expectedSkillDirNames: string[];
  managedSkillDirNames: string[];
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function resolveEffectiveWorkflows(
  projectPath: string,
  workflows: readonly string[]
): readonly WorkflowId[] {
  const effective = new Set<WorkflowId>(normalizeWorkflowIds(workflows));
  const bootstrapDir = path.join(projectPath, 'openspec', 'bootstrap');

  try {
    if (fs.statSync(bootstrapDir).isDirectory()) {
      effective.add('bootstrap-opsx' as WorkflowId);
    }
  } catch {
    // No bootstrap workspace; keep the requested workflows unchanged.
  }

  return ALL_WORKFLOWS.filter((workflowId) => effective.has(workflowId));
}

function buildPlan(request: ArtifactSyncRequest): ToolSyncPlan | null {
  const profile = ToolProfileRegistry.get(request.toolId);
  if (!profile?.skillsDir) return null;

  const normalizedWorkflows = resolveEffectiveWorkflows(request.projectPath, request.workflows);

  const skillTemplates = getSkillTemplates(normalizedWorkflows, request.toolId);

  const skillEntries: SkillWriteEntry[] = skillTemplates.map((entry) => ({
    template: entry.template,
    dirName: entry.dirName,
    workflowId: entry.workflowId,
  }));

  return {
    toolId: request.toolId,
    toolName: profile.name,
    skillsDir: profile.skillsDir,
    agentsDir: profile.agentsDir,
    agentFormat: profile.agentFormat,
    skillEntries,
    subagentEntries: profile.agentsDir && profile.agentFormat
      ? INTERNAL_SUBAGENT_TEMPLATES.map((template) => ({ template }))
      : [],
    expectedSkillDirNames: skillEntries.map((e) => e.dirName),
    managedSkillDirNames: getManagedSkillDirNames(),
  };
}

function toSharedReferenceFileName(referencePath: string): string {
  const normalized = path.posix.normalize(referencePath);
  if (
    path.posix.isAbsolute(referencePath) ||
    path.win32.isAbsolute(referencePath) ||
    referencePath.includes('\\') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    !normalized.startsWith('references/')
  ) {
    throw new Error(`Invalid skill reference path: ${referencePath}`);
  }

  return `openspec-${path.posix.basename(normalized)}`;
}

function assertToolNeutralReference(referencePath: string, content: string): void {
  if (/\/opsx:|\$openspec-/.test(content)) {
    throw new Error(`Tool-specific syntax in skill reference file: ${referencePath}`);
  }
}

export function collectSharedReferenceFiles(
  sources: readonly SharedReferenceSource[]
): SharedReferenceFile[] {
  const byFileName = new Map<string, string>();
  const references: SharedReferenceFile[] = [];

  for (const source of sources) {
    for (const referenceFile of source.template.referenceFiles ?? []) {
      const fileName = toSharedReferenceFileName(referenceFile.path);
      const previousSource = byFileName.get(fileName);
      if (previousSource) {
        throw new Error(
          `Duplicate skill reference file name: ${fileName} from ${previousSource} and ${source.workflowId}`
        );
      }

      assertToolNeutralReference(referenceFile.path, referenceFile.content);
      byFileName.set(fileName, source.workflowId);
      references.push({
        fileName,
        sourcePath: referenceFile.path,
        content: referenceFile.content,
      });
    }
  }

  return references;
}

const STALE_SHARED_REFERENCE_FILES = [
  'openspec-apply-phase2-optimization.md',
] as const;

async function writeSharedReferences(
  projectPath: string,
  references: readonly SharedReferenceFile[]
): Promise<void> {
  const referencesDir = path.join(projectPath, 'openspec', 'references');

  for (const fileName of STALE_SHARED_REFERENCE_FILES) {
    await fs.promises.rm(path.join(referencesDir, fileName), { force: true });
  }

  for (const referenceFile of references) {
    if (!referenceFile.fileName.startsWith('openspec-')) {
      throw new Error(`Invalid managed reference file name: ${referenceFile.fileName}`);
    }

    await FileSystemUtils.writeFile(
      path.join(referencesDir, referenceFile.fileName),
      referenceFile.content
    );
  }
}

async function writeSkills(
  projectPath: string,
  skillsDir: string,
  toolId: string,
  entries: SkillWriteEntry[],
  version: string
): Promise<number> {
  let written = 0;
  const baseDir = path.join(projectPath, skillsDir, 'skills');
  const sharedReferenceFiles = collectSharedReferenceFiles(entries);
  await writeSharedReferences(projectPath, sharedReferenceFiles);

  for (const entry of entries) {
    const skillDir = path.join(baseDir, entry.dirName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    const referencesDir = path.join(skillDir, 'references');

    const skillContent = generateSkillContent(entry.template, version, (instructions) =>
      runTransforms(instructions, {
        toolId,
        workflowId: entry.workflowId,
        artifactType: 'skill',
      })
    );

    await FileSystemUtils.writeFile(skillFile, skillContent);
    await fs.promises.rm(referencesDir, { recursive: true, force: true });
    written++;
  }

  return written;
}

function extractUserModel(
  content: string,
  extension: string
): string | undefined {
  if (extension === 'toml') {
    const match = content.match(/^model\s*=\s*"([^"]+)"/m);
    return match?.[1];
  }

  // Markdown: parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return undefined;

  const fm = parseYaml(fmMatch[1]) as Record<string, unknown>;
  return typeof fm.model === 'string' ? fm.model : undefined;
}

function injectModelMarkdown(content: string, model: string): string {
  // Insert model line before the closing frontmatter `---`
  return content.replace(
    /\n---\n/,
    `\nmodel: ${JSON.stringify(model)}\n---\n`
  );
}

function injectModelToml(content: string, model: string): string {
  // Insert model line after description
  return content.replace(
    /(description\s*=\s*"[^"]*"\n)/,
    `$1model = ${JSON.stringify(model)}\n`
  );
}

async function writeSubagents(
  projectPath: string,
  toolId: string,
  agentsDir: string | undefined,
  agentFormat: SubagentArtifactFormat | undefined,
  entries: SubagentWriteEntry[],
  version: string
): Promise<number> {
  if (!agentsDir || !agentFormat) return 0;

  const extension = agentFormat === 'toml' ? 'toml' : 'md';
  const baseDir = path.join(projectPath, agentsDir, 'agents');
  const sharedReferenceFiles = collectSharedReferenceFiles(
    entries.map((entry) => ({ template: entry.template, workflowId: entry.template.name }))
  );
  await writeSharedReferences(projectPath, sharedReferenceFiles);

  let written = 0;
  for (const entry of entries) {
    const agentFile = path.join(baseDir, `${entry.template.name}.${extension}`);

    let content = generateSubagentContent(entry.template, toolId, version);

    // Preserve user-set model from existing agent file
    try {
      const existing = await fs.promises.readFile(agentFile, 'utf-8');
      const userModel = extractUserModel(existing, extension);
      if (userModel && userModel !== 'inherit') {
        content = extension === 'toml'
          ? injectModelToml(content, userModel)
          : injectModelMarkdown(content, userModel);
      }
    } catch {
      // File doesn't exist yet — keep generated content as-is
    }

    await FileSystemUtils.writeFile(agentFile, content);
    written++;
  }

  return written;
}

const RETIRED_MANAGED_COMMANDS: Readonly<Record<string, readonly string[]>> = {
  claude: ['commands/opsx/apply.md'],
  'github-copilot': ['prompts/opsx-apply.prompt.md'],
};

async function removeRetiredManagedCommands(
  projectPath: string,
  skillsDir: string,
  toolId: string
): Promise<number> {
  const toolDir = skillsDir;
  let removed = 0;
  for (const relativePath of RETIRED_MANAGED_COMMANDS[toolId] ?? []) {
    const commandPath = path.join(projectPath, toolDir, relativePath);
    if (fs.existsSync(commandPath)) {
      await fs.promises.rm(commandPath, { force: true });
      removed += 1;
    }
  }
  return removed;
}

async function removeUnselectedSkillDirs(
  projectPath: string,
  skillsDir: string,
  expected: readonly string[],
  managed: readonly string[]
): Promise<number> {
  const expectedSet = new Set(expected);
  const baseDir = path.join(projectPath, skillsDir, 'skills');
  let removed = 0;

  for (const dirName of managed) {
    if (expectedSet.has(dirName)) continue;
    const skillDir = path.join(baseDir, dirName);
    try {
      if (fs.existsSync(skillDir)) {
        await fs.promises.rm(skillDir, { recursive: true, force: true });
        removed++;
      }
    } catch {
      // Ignore errors
    }
  }

  return removed;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const ArtifactSyncEngine = {
  /**
   * Execute a single tool sync.
   */
  async syncOne(request: ArtifactSyncRequest): Promise<ArtifactSyncResult> {
    const plan = buildPlan(request);
    if (!plan) {
      return {
        toolId: request.toolId,
        toolName: request.toolId,
        skillsWritten: 0,
        agentsWritten: 0,
        commandsWritten: 0,
        skillsRemoved: 0,
        commandsRemoved: 0,
        error: new Error(`No tool profile or skillsDir for ${request.toolId}`),
      };
    }

    try {
      const skillsWritten = await writeSkills(
        request.projectPath,
        plan.skillsDir,
        request.toolId,
        plan.skillEntries,
        request.version
      );
      const agentsWritten = await writeSubagents(
        request.projectPath,
        request.toolId,
        plan.agentsDir,
        plan.agentFormat,
        plan.subagentEntries,
        request.version
      );
      const commandsRemoved = await removeRetiredManagedCommands(
        request.projectPath,
        plan.skillsDir,
        request.toolId
      );
      const skillsRemoved = await removeUnselectedSkillDirs(
        request.projectPath,
        plan.skillsDir,
        plan.expectedSkillDirNames,
        plan.managedSkillDirNames
      );

      return {
        toolId: request.toolId,
        toolName: plan.toolName,
        skillsWritten,
        agentsWritten,
        commandsWritten: 0,
        skillsRemoved,
        commandsRemoved,
      };
    } catch (error) {
      return {
        toolId: request.toolId,
        toolName: plan.toolName,
        skillsWritten: 0,
        agentsWritten: 0,
        commandsWritten: 0,
        skillsRemoved: 0,
        commandsRemoved: 0,
        error: error instanceof Error ? error : new Error(String(error ?? 'Unknown error')),
      };
    }
  },

  /**
   * Execute sync for multiple tools.
   */
  async syncAll(requests: ArtifactSyncRequest[]): Promise<ArtifactSyncSummary> {
    const results: ArtifactSyncResult[] = [];
    for (const request of requests) {
      results.push(await this.syncOne(request));
    }

    return {
      results,
      totalSkillsWritten: results.reduce((sum, r) => sum + r.skillsWritten, 0),
      totalAgentsWritten: results.reduce((sum, r) => sum + r.agentsWritten, 0),
      totalCommandsWritten: results.reduce((sum, r) => sum + r.commandsWritten, 0),
      totalSkillsRemoved: results.reduce((sum, r) => sum + r.skillsRemoved, 0),
      totalCommandsRemoved: results.reduce((sum, r) => sum + r.commandsRemoved, 0),
      failed: results.filter((r) => r.error),
      succeeded: results.filter((r) => !r.error),
    };
  },
};
