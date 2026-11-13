/**
 * Internal subagent artifact generation utilities.
 *
 * Subagent artifacts are tool-native agent files, not workflow skills.
 */

import { getOptimizerSubagentTemplate } from '../templates/workflows/optimizer.js';
import { getReviewerSubagentTemplate } from '../templates/workflows/reviewer.js';
import type { SkillReferenceFile } from '../templates/types.js';
import { getExperimenterSubagentTemplate } from '../templates/workflows/experimenter.js';

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
  getExperimenterSubagentTemplate(),
] as const;

const DEFAULT_TOOLS = ['read', 'grep', 'find', 'bash'] as const;
const PI_FOREGROUND_DESCRIPTION_SUBAGENTS = new Set([
  'xirang-optimizer',
]);
const PI_FOREGROUND_DESCRIPTION_SUFFIX = ' Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.';

function piDescription(template: SubagentTemplate): string {
  return PI_FOREGROUND_DESCRIPTION_SUBAGENTS.has(template.name)
    ? `${template.description}${PI_FOREGROUND_DESCRIPTION_SUFFIX}`
    : template.description;
}

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
    write: 'Write',
    edit: 'Edit',
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
      ...(template.tools ? [`tools: ${escapeYamlString(toClaudeTools(template))}`] : []),
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
      `description: ${escapeYamlString(piDescription(template))}`,
      ...(template.tools ? [`tools: ${escapeYamlString(toolList(template).join(', '))}`] : []),
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
      `  edit: ${template.name === 'xirang-reviewer' || toolList(template).some(tool => tool === 'write' || tool === 'edit') ? 'allow' : 'deny'}`,
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
  generatedByVersion: string
): string {
  let content: string;
  switch (toolId) {
    case 'claude': content = renderClaudeMarkdown(template); break;
    case 'pi': content = renderPiMarkdown(template); break;
    case 'opencode': content = renderOpenCodeMarkdown(template); break;
    case 'codex':
      return `# Generated by Xirang: ${template.name} ${generatedByVersion}\n${renderCodexToml(template)}`;
    default: throw new Error(`Unsupported subagent artifact tool: ${toolId}`);
  }
  return content.replace(/\n---\n/, `\nmetadata:\n  generatedBy: ${escapeYamlString(generatedByVersion)}\n  xirangAgent: ${escapeYamlString(template.name)}\n---\n`);
}
