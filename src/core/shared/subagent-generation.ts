/**
 * Internal subagent artifact generation utilities.
 *
 * Subagent artifacts are tool-native agent files, not workflow skills.
 */

import { getImpactSweeperSubagentTemplate } from '../templates/workflows/impact-sweeper.js';
import { getOptimizerSubagentTemplate } from '../templates/workflows/optimizer.js';
import { getReviewerSubagentTemplate } from '../templates/workflows/reviewer.js';
import type { SkillReferenceFile } from '../templates/types.js';

export type SubagentArtifactFormat = 'markdown' | 'toml';

export interface SubagentTemplate {
  name: string;
  description: string;
  prompt: string;
  tools?: readonly string[];
  disallowedTools?: readonly string[];
  model?: string;
  mode?: string;
  metadata?: Record<string, string>;
  referenceFiles?: readonly SkillReferenceFile[];
}

export const INTERNAL_SUBAGENT_TEMPLATES: readonly SubagentTemplate[] = [
  getReviewerSubagentTemplate(),
  getOptimizerSubagentTemplate(),
  getImpactSweeperSubagentTemplate(),
] as const;

const DEFAULT_TOOLS = ['read', 'grep', 'find', 'bash'] as const;
function escapeYamlString(value: string): string {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')}"`;
}

function escapeTomlString(value: string): string {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')}"`;
}

function escapeTomlMultilineString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"\\"\\"')
    .replace(/\r/g, '\\r');
}

function toolList(template: SubagentTemplate): readonly string[] {
  return template.tools ?? DEFAULT_TOOLS;
}

function toClaudeTools(template: SubagentTemplate): string {
  const mapping: Record<string, string> = {
    read: 'Read',
    grep: 'Grep',
    search: 'Grep',
    find: 'Glob',
    glob: 'Glob',
    bash: 'Bash',
  };

  return toolList(template)
    .map((tool) => mapping[tool] ?? tool)
    .filter((tool, index, all) => all.indexOf(tool) === index)
    .join(', ');
}

function renderMarkdownBody(frontmatter: string, prompt: string): string {
  return `---\n${frontmatter}---\n\n${prompt}\n`;
}

function renderClaudeMarkdown(template: SubagentTemplate): string {
  return renderMarkdownBody(
    [
      `name: ${template.name}`,
      `description: ${escapeYamlString(template.description)}`,
      `tools: ${escapeYamlString(toClaudeTools(template))}`,
      ...(template.model && template.model !== 'inherit'
        ? [`model: ${escapeYamlString(template.model)}`]
        : []),
      '',
    ].join('\n'),
    template.prompt
  );
}

function renderPiMarkdown(template: SubagentTemplate): string {
  return renderMarkdownBody(
    [
      `name: ${template.name}`,
      `description: ${escapeYamlString(template.description)}`,
      `tools: ${escapeYamlString(toolList(template).join(', '))}`,
      ...(template.model && template.model !== 'inherit'
        ? [`model: ${escapeYamlString(template.model)}`]
        : []),
      '',
    ].join('\n'),
    template.prompt
  );
}

function renderOpenCodeMarkdown(template: SubagentTemplate): string {
  return renderMarkdownBody(
    [
      `description: ${escapeYamlString(template.description)}`,
      'mode: subagent',
      ...(template.model && template.model !== 'inherit'
        ? [`model: ${escapeYamlString(template.model)}`]
        : []),
      'permission:',
      '  edit: deny',
      '  bash: ask',
      '',
    ].join('\n'),
    template.prompt
  );
}

function renderCodexToml(template: SubagentTemplate): string {
  return [
    `name = ${escapeTomlString(template.name)}`,
    `description = ${escapeTomlString(template.description)}`,
    ...(template.model && template.model !== 'inherit'
      ? [`model = ${escapeTomlString(template.model)}`]
      : []),
    `sandbox_mode = ${escapeTomlString(template.mode ?? 'read-only')}`,
    '',
    'developer_instructions = """',
    escapeTomlMultilineString(template.prompt),
    '"""',
    '',
  ].join('\n');
}

export function generateSubagentContent(
  template: SubagentTemplate,
  toolId: string,
  _generatedByVersion: string
): string {
  switch (toolId) {
    case 'claude':
      return renderClaudeMarkdown(template);
    case 'pi':
      return renderPiMarkdown(template);
    case 'opencode':
      return renderOpenCodeMarkdown(template);
    case 'codex':
      return renderCodexToml(template);
    default:
      throw new Error(`Unsupported subagent artifact tool: ${toolId}`);
  }
}
