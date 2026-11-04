import { describe, expect, it } from 'vitest';
import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { getOptimizerSubagentTemplate } from '../../src/core/templates/workflows/optimizer.js';

describe('optimizer generated prompt equivalence', () => {
  it.each(['claude', 'pi', 'opencode', 'codex'])('preserves the complete source prompt in %s', tool => {
    const template = getOptimizerSubagentTemplate();
    const generated = generateSubagentContent(template, tool, 'test');
    if (tool === 'codex') {
      const body = generated.split('developer_instructions = """\n')[1].slice(0, -5);
      expect(body.replace(/\\"/g, '"').replace(/\\\\/g, '\\')).toBe(template.prompt);
    } else {
      const body = generated.replace(/^---\n[^]*?\n---\n\n/, '').replace(/\n$/, '');
      expect(body).toBe(template.prompt);
    }
  });
});
