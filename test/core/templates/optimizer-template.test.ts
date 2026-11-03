import { describe, expect, it } from 'vitest';
import { XIRANG_PHILOSOPHY, XIRANG_SHARED_CONTEXT } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';

describe('optimizer subagent template', () => {
  it('composes shared context without imposing a model override', () => {
    const template = getOptimizerSubagentTemplate();
    expect(template.name).toBe('xirang-optimizer');
    expect(template.prompt).toContain(XIRANG_PHILOSOPHY);
    expect(template.prompt).toContain(XIRANG_SHARED_CONTEXT);
    expect(template).not.toHaveProperty('model');
    expect(template).not.toHaveProperty('instructions');
  });

  it('exposes delegated write permissions and does not register retired references', () => {
    const template = getOptimizerSubagentTemplate();
    expect(template.tools).toEqual(['read', 'grep', 'find', 'bash', 'write', 'edit']);
    expect(template.mode).toBe('workspace-write');
    expect(template.disallowedTools ?? []).toEqual([]);
    expect(template.referenceFiles ?? []).toEqual([]);
  });
});
