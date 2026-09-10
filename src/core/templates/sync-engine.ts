/**
 * Shared Artifact Sync Engine.
 *
 * Single orchestration engine for planning, rendering, transforming,
 * and writing skill artifacts. Skills-only workflow surface.
 */

import path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { parse as parseYaml } from 'yaml';
import { FileSystemUtils } from '../../utils/file-system.js';
import { XIRANG_DIR_NAME } from '../config.js';
import {
  generateSkillContent,
  getSkillTemplates,
  getManagedSkillDirNames,
  MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES,
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
  _projectPath: string,
  workflows: readonly string[]
): readonly WorkflowId[] {
  return normalizeWorkflowIds(workflows);
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

  return `xirang-${path.posix.basename(normalized)}`;
}

function assertToolNeutralReference(referencePath: string, content: string): void {
  if (/\/xirang:|\$xirang-/.test(content)) {
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
  'opsx-apply-phase2-optimization.md',
  'xirang-apply-phase2-optimization.md',
  'xirang-apply-step-3-phase1-verification.md',
  'xirang-apply-step-4-phase2-optimization.md',
  'xirang-apply-step-5-phase3-seal.md',
  'xirang-relation-authoring.md',
] as const;

const RETIRED_SWEEPER_REFERENCE_HASHES: Readonly<Record<string, string>> = {
  'xirang-evidence-protocol.md': '0908fc37927b9cf418ef1c7339559100168d0acbee880ccc728cd7a59bf4ed86',
  'xirang-terminology-awareness.md': 'c6a0cca37dd18bb74196204012e50a3919ee375393b9fb968aa5b7a142692218',
  'xirang-report-schema.md': 'ec1c8fb035345bd57bf08beb8cc0823eb4f75921568b9ce6ba5c9274fbf7c623',
};

async function removeRetiredSweeperReferences(referencesDir: string): Promise<void> {
  for (const [fileName, expectedHash] of Object.entries(RETIRED_SWEEPER_REFERENCE_HASHES)) {
    const filePath = path.join(referencesDir, fileName);
    try {
      const content = await fs.promises.readFile(filePath);
      const actualHash = createHash('sha256').update(content).digest('hex');
      if (actualHash === expectedHash) await fs.promises.rm(filePath, { force: true });
    } catch {
      // Missing or unreadable files are not owned cleanup candidates.
    }
  }
}

async function writeSharedReferences(
  projectPath: string,
  references: readonly SharedReferenceFile[]
): Promise<void> {
  const referencesDir = path.join(projectPath, XIRANG_DIR_NAME, 'references');

  for (const fileName of STALE_SHARED_REFERENCE_FILES) {
    await fs.promises.rm(path.join(referencesDir, fileName), { force: true });
  }
  await removeRetiredSweeperReferences(referencesDir);

  for (const referenceFile of references) {
    if (!referenceFile.fileName.startsWith('xirang-')) {
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

const RETIRED_SWEEPER_AGENT_NAMES = [
  'xirang-impact-sweeper',
  'opsx-impact-sweeper',
] as const;

const RETIRED_SWEEPER_AGENT_HASHES = new Set([
  // xirang-impact-sweeper
  '506e4a65501583b87d24903646bb37f5e57375606e1ce02add7b635549d4ba3f',
  '8aa784ad9ce0968679ff707a0ffc7d4be1e48a902284b5daac44942647dbb83c',
  'bd138bbc5397df5d7e952af0282af4b88369b9a831932ed091442da9ff7c3c73',
  '70561628e52da745070ef469b4ede9a8d88bb9cd785e053ce033d3adf1e363b4',
  '13887e077eb13514c3ecdf469329dd496456b7efc052708a3af65a0516ba6bae',
  // opsx-impact-sweeper
  '6ab3c7809e6448511ca320810fdc4d4e1ab3637eb84a979cb17a9336bfe73654',
  '09233a9e991ae90f0be7ed899c49501637f02104818ac9d475b2cacbfa7c2e4c',
  '1e30cd812a15e8dbcbc0947bbf4992d2e5148f93e1d927a84554c5bd759aee84',
  '244bdc71bbe7d78a4db1fea45b181268a380a39f9105bc2f7f8ab52596eaa1b1',
  '501112f4fa52bad92b392837ac7f4268a4d13d04daafe8308775aea1eea1dfe0',
  'a94960c017f72d094b41e950309c750b216fe7627c60cdb56ae665e1eb075fd7',
  '62f02e96ddc262eed46fee4c62a3c5d05dbd8a88417d42dbfd47b3af592ad106',
  '600e6c19efb6ec0b0c622f4858d20f72c91eba6b4ff52fdc74b311994c121051',
  '23a30f2f5e3051271cc14bbb179fa9574b3dc124e88998ccd4e9ff3cfebf6837',
  '83a014e1084eb1034eb616cbf38e56aa04eb1c2313f084f1776829062c75213a',
]);

function hasGeneratedAgentOwnership(content: Buffer, name: string, extension: string): boolean {
  const hash = createHash('sha256').update(content).digest('hex');
  if (RETIRED_SWEEPER_AGENT_HASHES.has(hash)) return true;
  if (extension !== 'md') return false;

  const frontmatter = content.toString('utf8').match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) return false;
  const parsed = parseYaml(frontmatter[1]) as Record<string, unknown>;
  const metadata = parsed.metadata;
  return (
    parsed.name === name &&
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof (metadata as Record<string, unknown>).generatedBy === 'string'
  );
}

async function removeRetiredSweeperAgents(baseDir: string, extension: string): Promise<void> {
  for (const name of RETIRED_SWEEPER_AGENT_NAMES) {
    const agentFile = path.join(baseDir, `${name}.${extension}`);
    try {
      const content = await fs.promises.readFile(agentFile);
      if (hasGeneratedAgentOwnership(content, name, extension)) {
        await fs.promises.rm(agentFile, { force: true });
      }
    } catch {
      // Missing or unreadable files are not owned cleanup candidates.
    }
  }
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
  await removeRetiredSweeperAgents(baseDir, extension);
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
  claude: ['commands/xirang/apply.md'],
  'github-copilot': ['prompts/opsx-apply.prompt.md', 'prompts/xirang-apply.prompt.md'],
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

function hasGeneratedSkillOwnership(content: string): boolean {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) return false;
  try {
    const parsed = parseYaml(frontmatter[1]) as { metadata?: { generatedBy?: unknown } };
    return typeof parsed.metadata?.generatedBy === 'string';
  } catch {
    return false;
  }
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
        if ((MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES as readonly string[]).includes(dirName)) {
          const skillFile = path.join(skillDir, 'SKILL.md');
          const content = await fs.promises.readFile(skillFile, 'utf8').catch(() => '');
          if (!hasGeneratedSkillOwnership(content)) continue;
        }
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
