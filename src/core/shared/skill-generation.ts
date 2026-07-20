/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill files. Skills-only workflow surface.
 */

import {
  type SkillTemplate,
} from '../templates/skill-templates.js';
import {
  createArchiveChangeSkillTemplateForExecutionModel,
} from '../templates/workflows/archive-change.js';
import { resolveVerifyExecutionModel } from '../templates/workflows/verify-execution-model.js';
import {
  ALL_WORKFLOWS,
  WORKFLOW_TO_SKILL_DIR,
  getWorkflowSurfaces,
  type WorkflowId,
} from '../workflow-surface.js';

export const MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES = [
  'openspec-implementer',
  'openspec-reviewer',
  'openspec-optimizer',
  'openspec-impact-sweeper',
  'openspec-bootstrap-opsx',
] as const;

export function getManagedSkillDirNames(): string[] {
  return [
    ...ALL_WORKFLOWS.map((workflowId) => WORKFLOW_TO_SKILL_DIR[workflowId]),
    ...MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES,
  ];
}

const EXECUTION_MODEL_SKILL_TEMPLATES: Partial<
  Record<WorkflowId, (executionModel: ReturnType<typeof resolveVerifyExecutionModel>) => SkillTemplate>
> = {
  archive: createArchiveChangeSkillTemplateForExecutionModel,
};

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

function resolveSkillTemplate(
  workflowId: WorkflowId,
  toolId: string | undefined,
  fallback: () => SkillTemplate
): SkillTemplate {
  const createTemplate = EXECUTION_MODEL_SKILL_TEMPLATES[workflowId];
  if (createTemplate) {
    return createTemplate(resolveVerifyExecutionModel(toolId));
  }

  return fallback();
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(
  workflowFilter?: readonly string[],
  toolId?: string
): SkillTemplateEntry[] {
  const workflowSurfaces = getWorkflowSurfaces(workflowFilter).map((entry) => ({
    template: resolveSkillTemplate(entry.workflowId, toolId, entry.getSkillTemplate),
    dirName: entry.skillDirName,
    workflowId: entry.workflowId,
  }));

  return workflowSurfaces;
}

function escapeYamlString(value: string): string {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')}"`;
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The OpenSpec version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${escapeYamlString(template.name)}
description: ${escapeYamlString(template.description)}
license: ${escapeYamlString(template.license || 'MIT')}
compatibility: ${escapeYamlString(template.compatibility || 'Requires openspec CLI.')}
metadata:
  author: ${escapeYamlString(template.metadata?.author || 'openspec')}
  version: ${escapeYamlString(template.metadata?.version || '1.0')}
  generatedBy: ${escapeYamlString(generatedByVersion)}
---

${instructions}
`;
}
