import { diagnostic } from '../../utils/output.js';
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
  getInstallableSkillTemplates,
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
  normalizeWorkflowIds,
  type WorkflowId,
} from '../workflow-surface.js';
import { ToolProfileRegistry } from './tool-profile/index.js';
import { getApplyChangeSkillTemplate } from './workflows/apply-change.js';

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

  const skillTemplates = getInstallableSkillTemplates(normalizedWorkflows, request.toolId);

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
  'xirang-definition-framing.md',
  'xirang-relation-authoring.md',
] as const;

const RETIRED_MANAGED_REFERENCE_HASHES: Readonly<Record<string, string>> = {
  'xirang-configuration-use.md': '290c84f4fa3296985ec0d462ea9d8c15356dfc3028b75dea3630fb0d2720f802',
  'xirang-artifact-specs.md': '67ce28b1dec2286b9961e7912e59762f5bc73f18c3dec7db2ea441d2a8e854fd',
  'xirang-self-read-protocol.md': '60441cc8f4477c03c9eb89fbd3c18aeb5959d7cf5a25ddf8264cff77eaced901',
  'xirang-decision-rules.md': 'f6f5364e560aa9bf22b88c72734f9dcb9188db21832b3c0301b028e484449ae9',
  'xirang-output-protocol.md': 'c840a954078cc0a5dc8c1932d2efb78fe4d0223dec8c8b7ba32bcfd4677e1932',
  'xirang-evidence-protocol.md': '0908fc37927b9cf418ef1c7339559100168d0acbee880ccc728cd7a59bf4ed86',
  'xirang-terminology-awareness.md': 'c6a0cca37dd18bb74196204012e50a3919ee375393b9fb968aa5b7a142692218',
  'xirang-report-schema.md': 'ec1c8fb035345bd57bf08beb8cc0823eb4f75921568b9ce6ba5c9274fbf7c623',
};

async function removeRetiredManagedReferences(referencesDir: string): Promise<void> {
  for (const [fileName, expectedHash] of Object.entries(RETIRED_MANAGED_REFERENCE_HASHES)) {
    const filePath = path.join(referencesDir, fileName);
    try {
      const content = await fs.promises.readFile(filePath);
      const actualHash = createHash('sha256').update(content).digest('hex');
      if (actualHash === expectedHash || content.toString('utf8').startsWith(MANAGED_REFERENCE_MARKER)) await fs.promises.rm(filePath, { force: true });
    } catch {
      // Missing or unreadable files are not owned cleanup candidates.
    }
  }
}

const MANAGED_REFERENCE_MARKER = '<!-- Generated by Xirang -->\n';
const LEGACY_REFERENCE_HASHES: Readonly<Record<string, string>> = {
  "xirang-artifact-design.md": "1a7ea39e0aa075246b02c26a7bb6d95863ec8e58526244fa44be759ff84e5071",
  "xirang-model-context.md": "8fc434f184f1c3177ad682b8771575e2d141b1ad89123a9c1e41aa5c74c2cb38"
};
const LEGACY_AGENT_HASHES: Readonly<Record<string, string>> = {
  "pi:xirang-reviewer": "421e3ca13ef70de651bd0d3516e01d1563657a73ac78f9d76021a26a83180ade",
  "pi:xirang-optimizer": "143f479f1f0524f8b00e9867933bedf06e7e81ec167317bbb1bd585f7816d6c5",
  "pi:xirang-experimenter": "ceda7145a530329fc9d71457e644c41825e2f6c63f513d87a47e13ab6e67b375",
  "claude:xirang-reviewer": "421e3ca13ef70de651bd0d3516e01d1563657a73ac78f9d76021a26a83180ade",
  "claude:xirang-optimizer": "11f5fce90fb0e657ce843efebc9631e4e4487c284c7dcc51f448a741606a224b",
  "claude:xirang-experimenter": "012049acdbd456d44445f85ec4f68d8e8e9b053947d4bebeb0ed733042842f67",
  "opencode:xirang-reviewer": "62d071f41981e059a0854f7c2dbdaf132488cb797e89b2bf31c0d2b5ae6f8f1b",
  "opencode:xirang-optimizer": "92889c144de2318348027cb7b5c6e9b47fb8b637e4bb3af63f83156bb5ce86e8",
  "opencode:xirang-experimenter": "8b397ba73d9165a01be78b702ed0f49bd8af8e602286fbc8e6bf6a007156eed5",
  "codex:xirang-reviewer": "f5eb58a7deed4a498bb26dcec0e073f122cb6962c63c5486270b7936dd6b6580",
  "codex:xirang-optimizer": "e1b820a8abb1cf11e4e299d53dfb0fabf54482dfecc26f42fa76a5f95a3387ae",
  "codex:xirang-experimenter": "249530ca8e4311de37801df39df10913722b959eec399ecb58687b7b705361a1"
};

async function canReplaceManagedFile(file: string, owned: (content: string) => boolean): Promise<boolean> {
  try {
    const stat = await fs.promises.lstat(file);
    if (!stat.isSymbolicLink() && stat.isFile() && owned(await fs.promises.readFile(file, 'utf8'))) return true;
    diagnostic(`Preserved user-owned file: ${file}; move it or explicitly adopt managed content before refreshing this surface.`, 'UNMANAGED_FILE');
    return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw error;
  }
}

function ownsReference(content: string, target: string, name: string): boolean {
  return content.startsWith(MANAGED_REFERENCE_MARKER) || content === target ||
    createHash('sha256').update(content).digest('hex') === LEGACY_REFERENCE_HASHES[name];
}

async function writeSharedReferences(
  projectPath: string,
  references: readonly SharedReferenceFile[]
): Promise<void> {
  const referencesDir = path.join(projectPath, XIRANG_DIR_NAME, 'references');

  for (const fileName of STALE_SHARED_REFERENCE_FILES) {
    const file = path.join(referencesDir, fileName);
    if (await canReplaceManagedFile(file, content => content.startsWith(MANAGED_REFERENCE_MARKER))) await fs.promises.rm(file, { force: true });
  }
  await removeRetiredManagedReferences(referencesDir);

  for (const referenceFile of references) {
    if (!referenceFile.fileName.startsWith('xirang-')) {
      throw new Error(`Invalid managed reference file name: ${referenceFile.fileName}`);
    }

    const file = path.join(referencesDir, referenceFile.fileName);
    if (await canReplaceManagedFile(file, content => ownsReference(content, referenceFile.content, referenceFile.fileName))) {
      await FileSystemUtils.writeFile(file, MANAGED_REFERENCE_MARKER + referenceFile.content);
    }
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

    if (!await canReplaceManagedFile(skillFile, hasGeneratedSkillOwnership)) continue;
    await FileSystemUtils.writeFile(skillFile, skillContent);
    // Retire only registered, owned reference files; unrelated files keep their directory.
    if (!(await fs.promises.lstat(referencesDir).catch(error => { if (error.code !== 'ENOENT') throw error; return undefined; }))?.isSymbolicLink()) {
      for (const reference of entry.template.referenceFiles ?? []) {
        const file = path.join(skillDir, reference.path);
        if (await canReplaceManagedFile(file, content => ownsReference(content, reference.content, path.basename(file)))) {
          await fs.promises.rm(file, { force: true });
        }
      }
      try { await fs.promises.rmdir(referencesDir); } catch (error) {
        if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      }
    }
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
  if (extension === 'toml') return content.toString('utf8').startsWith(`# Generated by Xirang: ${name} `);
  if (extension !== 'md') return false;

  const frontmatter = content.toString('utf8').match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) return false;
  const parsed = parseYaml(frontmatter[1]) as Record<string, unknown>;
  const metadata = parsed.metadata;
  return (
    (parsed.name === name || (typeof metadata === 'object' && metadata !== null && (metadata as Record<string, unknown>).xirangAgent === name)) &&
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
  const sharedReferenceFiles = collectSharedReferenceFiles([
    ...entries.map((entry) => ({ template: entry.template, workflowId: entry.template.name })),
    { template: getApplyChangeSkillTemplate(), workflowId: 'apply-quality' },
  ]);
  await writeSharedReferences(projectPath, sharedReferenceFiles);

  let written = 0;
  for (const entry of entries) {
    const agentFile = path.join(baseDir, `${entry.template.name}.${extension}`);

    let content = generateSubagentContent(entry.template, toolId, version);

    if (!await canReplaceManagedFile(agentFile, existing => {
      const normalized = existing.replace(/\r\n/g, '\n').replace(/^model\s*[:=].*\n/gm, '');
      if (createHash('sha256').update(normalized).digest('hex') === LEGACY_AGENT_HASHES[`${toolId}:${entry.template.name}`]) return true;
      if (extension === 'toml') return existing.startsWith(`# Generated by Xirang: ${entry.template.name} `);
      const frontmatter = existing.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n/);
      if (!frontmatter) return false;
      try {
        const parsed = parseYaml(frontmatter[1]) as { metadata?: { generatedBy?: unknown; xirangAgent?: string } };
        return typeof parsed.metadata?.generatedBy === 'string' && parsed.metadata.xirangAgent === entry.template.name;
      } catch { return false; }
    })) continue;

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
    if (fs.existsSync(commandPath) && hasGeneratedSkillOwnership(await fs.promises.readFile(commandPath, 'utf8'))) {
      await fs.promises.rm(commandPath, { force: true });
      removed += 1;
    }
  }
  return removed;
}

export function hasGeneratedSkillOwnership(content: string): boolean {
  const frontmatter = content.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n/);
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
        const skillFile = path.join(skillDir, 'SKILL.md');
        const content = await fs.promises.readFile(skillFile, 'utf8').catch(() => '');
        if (!hasGeneratedSkillOwnership(content)) continue;
        await fs.promises.rm(skillFile, { force: true });
        try { await fs.promises.rmdir(skillDir); } catch (error) {
          if (!['ENOTEMPTY', 'EEXIST'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
        }
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
