import { describe, expect, it } from 'vitest';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';

describe('optimizer subagent template', () => {
  it('composes shared context without imposing a model override', () => {
    const template = getOptimizerSubagentTemplate();
    expect(template.name).toBe('xirang-optimizer');
    expect(template.prompt).toContain('xirang-common');
    expect(template.prompt).toContain('xirang-model-context.md');
    expect(template).not.toHaveProperty('model');
    expect(template).not.toHaveProperty('instructions');
  });

  it('separates read-only inspection from authorized implementation and coordinator commits', () => {
    const prompt = getOptimizerSubagentTemplate().prompt;
    expect(prompt).toContain('Work in the assigned mode: inspection or implementation.');
    expect(prompt).toContain('without modifying it');
    expect(prompt).toContain('outside the authorized scope without implementing them');
    expect(prompt).toContain('Do not create or rewrite Git history');
    expect(prompt).not.toContain('chooses whether additional independent Review is required');
  });

  it('exposes delegated write permissions and does not register retired references', () => {
    const template = getOptimizerSubagentTemplate();
    expect(template.tools).toEqual(['read', 'grep', 'find', 'bash', 'write', 'edit']);
    expect(template.mode).toBe('workspace-write');
    expect(template.disallowedTools ?? []).toEqual([]);
    expect(template.referenceFiles ?? []).toEqual([]);
  });
});
