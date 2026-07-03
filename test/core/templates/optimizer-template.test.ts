import { describe, expect, it } from 'vitest';

import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';

describe('optimizer subagent template', () => {
  it('preserves behavior-preserving Search/Replace-only optimization protocol', () => {
    const template = getOptimizerSubagentTemplate();

    expect(template.name).toBe('openspec-optimizer');
    expect(template).not.toHaveProperty('instructions');
    expect(template.prompt).toContain('Search/Replace blocks');
    expect(template.prompt).toContain('MUST NOT modify files');
    expect(template.prompt).toContain('failedDirections');
    expect(template.prompt).toContain('No optimization opportunities found');
    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/self-read-protocol.md',
      'references/decision-rules.md',
      'references/output-protocol.md',
    ]);
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));
  });
});
