import { describe, expect, it } from 'vitest';

import { OPSX_COMPILATION_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';

describe('optimizer subagent template', () => {
  it('includes OPSX philosophy and finding-first optimization discipline', () => {
    const template = getOptimizerSubagentTemplate();
    const prompt = template.prompt;

    expect(prompt).toContain(OPSX_COMPILATION_PHILOSOPHY);
    expect(prompt).toContain('finding-first');
    expect(prompt).toContain('strict JSON envelope');
    expect(prompt).toContain('keyDesign');
    expect(prompt).toContain('preservationConstraints');
    expect(prompt).not.toContain('Search/Replace');
    expect(prompt).not.toContain('delete/stdlib/native/yagni/shrink');
    expect(template).not.toHaveProperty('model');
  });

  it('preserves read-only self-read and reconciliation protocol', () => {
    const template = getOptimizerSubagentTemplate();

    expect(template.name).toBe('openspec-optimizer');
    expect(template).not.toHaveProperty('instructions');
    expect(template.prompt).toContain('MUST NOT modify files');
    expect(template.prompt).toContain('failedDirections');
    expect(template.prompt).toContain('reconcile every non-terminal finding');
    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/self-read-protocol.md',
      'references/decision-rules.md',
      'references/output-protocol.md',
    ]);
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));
  });
});
