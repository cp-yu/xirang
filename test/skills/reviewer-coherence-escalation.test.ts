import { describe, expect, it } from 'vitest';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer coherence escalation contract', () => {
  it('blocks unexplained design violations', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('A design decision violated by implementation is CRITICAL');
  });
});
