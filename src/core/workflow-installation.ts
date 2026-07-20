import * as fs from 'fs';
import path from 'path';
import { getAITool } from './config.js';
import {
  ALL_WORKFLOWS,
  getCommandSlug,
  normalizeWorkflowIds,
  type WorkflowId,
} from './workflow-surface.js';
import {
  getSkillTemplates,
  getManagedSkillDirNames,
  type SkillTemplateEntry,
} from './shared/skill-generation.js';
import { collectSharedReferenceFiles } from './templates/sync-engine.js';
import { INTERNAL_SUBAGENT_TEMPLATES } from './shared/subagent-generation.js';

export { MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES } from './shared/skill-generation.js';

export interface WorkflowArtifactPlan {
  workflows: readonly WorkflowId[];
  managedWorkflows: readonly WorkflowId[];
  shouldGenerateSkills: boolean;
  skillTemplates: SkillTemplateEntry[];
  expectedSkillDirNames: string[];
  managedSkillDirNames: string[];
}

export function resolveEffectiveWorkflows(
  projectPath: string,
  workflows: readonly string[]
): readonly WorkflowId[] {
  const effective = new Set<WorkflowId>(normalizeWorkflowIds(workflows));
  const bootstrapDir = path.join(projectPath, 'openspec', 'bootstrap');

  try {
    if (fs.statSync(bootstrapDir).isDirectory()) {
      effective.add('bootstrap-arch');
    }
  } catch {
    // No bootstrap workspace; keep the requested workflows unchanged.
  }

  return ALL_WORKFLOWS.filter((workflowId) => effective.has(workflowId));
}

export function createWorkflowArtifactPlan(
  workflows: readonly string[],
  projectPath?: string
): WorkflowArtifactPlan {
  const normalizedWorkflows = projectPath
    ? resolveEffectiveWorkflows(projectPath, workflows)
    : normalizeWorkflowIds(workflows);
  const skillTemplates = getSkillTemplates(normalizedWorkflows);

  return {
    workflows: normalizedWorkflows,
    managedWorkflows: ALL_WORKFLOWS,
    shouldGenerateSkills: true,
    skillTemplates,
    expectedSkillDirNames: skillTemplates.map((entry) => entry.dirName),
    managedSkillDirNames: getManagedSkillDirNames(),
  };
}

export function createToolWorkflowArtifactPlan(
  toolId: string,
  workflows: readonly string[],
  projectPath?: string
): WorkflowArtifactPlan {
  const normalizedWorkflows = projectPath
    ? resolveEffectiveWorkflows(projectPath, workflows)
    : normalizeWorkflowIds(workflows);
  const skillTemplates = getSkillTemplates(normalizedWorkflows, toolId);

  return {
    workflows: normalizedWorkflows,
    managedWorkflows: ALL_WORKFLOWS,
    shouldGenerateSkills: true,
    skillTemplates,
    expectedSkillDirNames: skillTemplates.map((entry) => entry.dirName),
    managedSkillDirNames: getManagedSkillDirNames(),
  };
}

export interface PlannedToolArtifacts {
  skillFiles: string[];
  agentFiles: string[];
  commandFiles: string[];
}

export function getPlannedToolArtifacts(
  projectPath: string,
  toolId: string,
  plan: WorkflowArtifactPlan
): PlannedToolArtifacts {
  const tool = getAITool(toolId);
  if (!tool?.skillsDir) {
    return { skillFiles: [], agentFiles: [], commandFiles: [] };
  }

  const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
  const subagentTemplates = tool.agentsDir && tool.agentFormat ? INTERNAL_SUBAGENT_TEMPLATES : [];
  const referenceFiles = collectSharedReferenceFiles([
    ...plan.skillTemplates,
    ...subagentTemplates.map((template) => ({ template, workflowId: template.name })),
  ]).map((referenceFile) =>
    path.join(projectPath, 'openspec', 'references', referenceFile.fileName)
  );
  const skillFiles = plan.skillTemplates.map((entry) =>
    path.join(skillsDir, entry.dirName, 'SKILL.md')
  );
  skillFiles.push(...referenceFiles);

  const agentFiles = tool.agentsDir && tool.agentFormat
    ? subagentTemplates.map((template) =>
        path.join(
          projectPath,
          tool.agentsDir!,
          'agents',
          `${template.name}.${tool.agentFormat === 'toml' ? 'toml' : 'md'}`
        )
      )
    : [];

  return { skillFiles, agentFiles, commandFiles: [] };
}
