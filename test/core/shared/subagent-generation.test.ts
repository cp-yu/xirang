import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import {
  INTERNAL_SUBAGENT_TEMPLATES,
  generateSubagentContent,
  type SubagentTemplate,
} from '../../../src/core/shared/subagent-generation.js';

function markdownFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  expect(match).toBeTruthy();
  return parseYaml(match![1]) as Record<string, unknown>;
}

describe('subagent generation', () => {
  it('registers exactly the three internal subagent templates', () => {
    const names = INTERNAL_SUBAGENT_TEMPLATES.map((template) => template.name);

    expect(names).toEqual([
      'openspec-reviewer',
      'openspec-optimizer',
      'openspec-impact-sweeper',
    ]);
    expect(names).not.toContain('openspec-implementer');

    for (const template of INTERNAL_SUBAGENT_TEMPLATES) {
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.prompt).toBeTruthy();
      expect(template).not.toHaveProperty('display_name');
      expect(template).not.toHaveProperty('sandbox_mode');
      expect(template).not.toHaveProperty('permission');
    }
  });

  it('renders Claude markdown agent frontmatter without other tool fields', () => {
    const reviewer = INTERNAL_SUBAGENT_TEMPLATES.find(
      (template) => template.name === 'openspec-reviewer'
    );
    expect(reviewer).toBeDefined();

    const content = generateSubagentContent(reviewer!, 'claude', 'TEST');
    const frontmatter = markdownFrontmatter(content);

    expect(content).toMatch(/^---\n/);
    expect(frontmatter).toMatchObject({
      name: 'openspec-reviewer',
      description: reviewer!.description,
      model: 'inherit',
    });
    expect(String(frontmatter.tools)).toContain('Read');
    expect(String(frontmatter.tools)).toContain('Grep');
    expect(String(frontmatter.tools)).toContain('Glob');
    expect(String(frontmatter.tools)).toContain('Bash');
    expect(frontmatter).not.toHaveProperty('display_name');
    expect(frontmatter).not.toHaveProperty('sandbox_mode');
    expect(frontmatter).not.toHaveProperty('permission');
    expect(content).toContain(reviewer!.prompt);
  });

  it('renders Pi and OpenCode markdown agent permissions', () => {
    const reviewer = INTERNAL_SUBAGENT_TEMPLATES.find(
      (template) => template.name === 'openspec-reviewer'
    );
    expect(reviewer).toBeDefined();

    const pi = markdownFrontmatter(generateSubagentContent(reviewer!, 'pi', 'TEST'));
    expect(pi).toMatchObject({
      display_name: 'OpenSpec Reviewer',
      enabled: true,
      model: 'inherit',
    });
    expect(String(pi.tools)).toContain('read');
    expect(String(pi.tools)).toContain('grep');
    expect(String(pi.tools)).toContain('find');
    expect(String(pi.tools)).toContain('bash');
    expect(String(pi.disallowed_tools)).toContain('write');
    expect(String(pi.disallowed_tools)).toContain('edit');

    const opencode = markdownFrontmatter(generateSubagentContent(reviewer!, 'opencode', 'TEST'));
    expect(opencode).toMatchObject({
      mode: 'subagent',
      model: 'inherit',
      permission: {
        edit: 'deny',
      },
    });
  });

  it('renders Codex TOML with escaped multiline developer instructions', () => {
    const template: SubagentTemplate = {
      name: 'openspec-reviewer',
      description: 'A reviewer with "quotes"',
      prompt: 'Line 1 with triple quotes """\nLine 2 with slash C:\\temp',
      tools: ['read', 'grep', 'find', 'bash'],
      disallowedTools: ['write', 'edit'],
      model: 'inherit',
      mode: 'read-only',
    };

    const content = generateSubagentContent(template, 'codex', 'TEST');

    expect(content).not.toMatch(/^---\n/);
    expect(content).toContain('name = "openspec-reviewer"');
    expect(content).toContain('description = "A reviewer with \\"quotes\\""');
    expect(content).toContain('model = "inherit"');
    expect(content).toContain('sandbox_mode = "read-only"');
    expect(content).toContain('developer_instructions = """');
    expect(content).toContain('\\"\\"\\"');
    expect(content).toContain('C:\\\\temp');
    expect(content).toMatch(/developer_instructions = """[\s\S]*\n"""\n$/);
  });
});
