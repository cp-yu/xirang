import { getCommonSkillTemplate } from '../templates/workflows/common.js';
import { COMMON_SKILL_NAME } from '../templates/fragments/guidance-loading.js';
/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill files. Skills-only workflow surface.
 */

import type { SkillTemplate } from '../templates/skill-templates.js';
import {
  ALL_WORKFLOWS,
  WORKFLOW_TO_SKILL_DIR,
  getWorkflowSurfaces,
} from '../workflow-surface.js';

export const MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES = [
  'opsx-implementer',
  'xirang-reviewer',
  'xirang-optimizer',
  'xirang-impact-sweeper',
  'opsx-impact-sweeper',
  'opsx-bootstrap-opsx',
  'xirang-bootstrap-arch',
] as const;

export function getManagedSkillDirNames(): string[] {
  return [
    COMMON_SKILL_NAME,
    ...ALL_WORKFLOWS.map((workflowId) => WORKFLOW_TO_SKILL_DIR[workflowId]),
    ...MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES,
  ];
}

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  return getWorkflowSurfaces(workflowFilter).map((entry) => ({
    template: entry.getSkillTemplate(),
    dirName: entry.skillDirName,
    workflowId: entry.workflowId,
  }));
}

/** Installed skills include the explicitly registered shared prerequisite. */
export function getInstallableSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const workflows = getSkillTemplates(workflowFilter);
  if (!workflows.length) return [];
  return [
    { template: getCommonSkillTemplate(), dirName: COMMON_SKILL_NAME, workflowId: COMMON_SKILL_NAME },
    ...workflows,
  ];
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
 * @param generatedByVersion - The Xirang version to embed in the file
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
compatibility: ${escapeYamlString(template.compatibility || 'Requires xirang CLI.')}
metadata:
  author: ${escapeYamlString(template.metadata?.author || 'xirang')}
  version: ${escapeYamlString(template.metadata?.version || '1.0')}
  generatedBy: ${escapeYamlString(generatedByVersion)}
---

${instructions}
`;
}
