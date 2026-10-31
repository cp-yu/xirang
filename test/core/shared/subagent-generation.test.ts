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
  it('registers the three internal subagent templates', () => {
    const names = INTERNAL_SUBAGENT_TEMPLATES.map((template) => template.name);

    expect(names).toEqual([
      'xirang-reviewer',
      'xirang-optimizer',
      'xirang-experimenter',
    ]);
    expect(names).not.toContain('opsx-implementer');

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
      (template) => template.name === 'xirang-reviewer'
    );
    expect(reviewer).toBeDefined();

    const content = generateSubagentContent(reviewer!, 'claude', 'TEST');
    const frontmatter = markdownFrontmatter(content);

    expect(content).toMatch(/^---\n/);
    expect(frontmatter).toMatchObject({
      name: 'xirang-reviewer',
      description: reviewer!.description,
    });
    expect(frontmatter).not.toHaveProperty('model');
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
      (template) => template.name === 'xirang-reviewer'
    );
    expect(reviewer).toBeDefined();

    const pi = markdownFrontmatter(generateSubagentContent(reviewer!, 'pi', 'TEST'));
    expect(pi).toMatchObject({
      name: 'xirang-reviewer',
      description: `${reviewer!.description} Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`,
    });
    expect(pi).not.toHaveProperty('model');
    expect(String(pi.tools)).toContain('read');
    expect(String(pi.tools)).toContain('grep');
    expect(String(pi.tools)).toContain('find');
    expect(String(pi.tools)).toContain('bash');
    expect(pi).not.toHaveProperty('display_name');
    expect(pi).not.toHaveProperty('disallowed_tools');
    expect(pi).not.toHaveProperty('enabled');

    const opencode = markdownFrontmatter(generateSubagentContent(reviewer!, 'opencode', 'TEST'));
    expect(opencode).toMatchObject({
      mode: 'subagent',
      permission: {
        edit: 'deny',
      },
    });
    expect(opencode).not.toHaveProperty('model');
  });

  it('adds Pi-only foreground/no-timeout guidance only to evaluation roles', () => {
    const suffix = ' Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.';

    for (const template of INTERNAL_SUBAGENT_TEMPLATES) {
      const pi = markdownFrontmatter(generateSubagentContent(template, 'pi', 'TEST'));
      const claude = markdownFrontmatter(generateSubagentContent(template, 'claude', 'TEST'));
      const opencode = markdownFrontmatter(generateSubagentContent(template, 'opencode', 'TEST'));
      const codex = generateSubagentContent(template, 'codex', 'TEST');

      expect(pi.description).toBe(template.name === 'xirang-experimenter' ? template.description : `${template.description}${suffix}`);
      expect(claude.description).toBe(template.description);
      expect(opencode.description).toBe(template.description);
      expect(codex).toContain(`description = "${template.description.replace(/"/g, '\\"')}"`);
    }
  });

  it.each(['xirang-reviewer', 'xirang-optimizer', 'xirang-experimenter'])('按 %s 能力渲染四工具权限和模型', name => {
    const template = INTERNAL_SUBAGENT_TEMPLATES.find(item => item.name === name)!;
    expect(template).toBeDefined();
    const writable = name === 'xirang-experimenter';
    const claude = markdownFrontmatter(generateSubagentContent(template, 'claude', 'TEST'));
    const pi = markdownFrontmatter(generateSubagentContent(template, 'pi', 'TEST'));
    for (const [metadata, write, edit] of [[claude, 'Write', 'Edit'], [pi, 'write', 'edit']] as const) {
      const tools = String(metadata.tools).split(', ');
      expect(tools.includes(write)).toBe(writable);
      expect(tools.includes(edit)).toBe(writable);
    }
    expect(markdownFrontmatter(generateSubagentContent(template, 'opencode', 'TEST')).permission)
      .toEqual({ edit: writable ? 'allow' : 'deny', bash: 'ask' });
    expect(generateSubagentContent(template, 'codex', 'TEST')).toContain(`sandbox_mode = "${writable ? 'workspace-write' : 'read-only'}"`);
    for (const tool of ['claude', 'pi', 'opencode', 'codex']) {
      expect(generateSubagentContent({ ...template, model: 'custom-model' }, tool, 'TEST')).toMatch(/^model[: =]+"custom-model"/m);
      expect(generateSubagentContent({ ...template, model: 'inherit' }, tool, 'TEST')).not.toMatch(/^model[: =]/m);
    }
  });

  it('renders Codex TOML with escaped multiline developer instructions', () => {
    const template: SubagentTemplate = {
      name: 'xirang-reviewer',
      description: 'A reviewer with "quotes"',
      prompt: 'Line 1 with triple quotes """\nLine 2 with slash C:\\temp',
      tools: ['read', 'grep', 'find', 'bash'],
      disallowedTools: ['write', 'edit'],
      model: 'inherit',
      mode: 'read-only',
    };

    const content = generateSubagentContent(template, 'codex', 'TEST');

    expect(content).not.toMatch(/^---\n/);
    expect(content).toContain('name = "xirang-reviewer"');
    expect(content).toContain('description = "A reviewer with \\"quotes\\""');
    expect(content).not.toContain('model =');
    expect(content).toContain('sandbox_mode = "read-only"');
    expect(content).toContain('developer_instructions = """');
    expect(content).toContain('\\"\\"\\"');
    expect(content).toContain('C:\\\\temp');
    expect(content).toMatch(/developer_instructions = """[\s\S]*\n"""\n$/);
  });
});
