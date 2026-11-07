import { describe, expect, it } from 'vitest';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer severity escalation contract', () => {
  it('sets severity from explicit evidence rules and preserves the WARNING exception', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Missing credible evidence for required behavior is CRITICAL');
    expect(instructions).toContain('A design decision violated by implementation is CRITICAL');
    expect(instructions).toContain('If credible behavior evidence exists but the need for a persistent test is genuinely uncertain, report a WARNING');
    expect(instructions).not.toContain('prefer the lower tier');
  });

  it('retains applicable cleanliness and unauthorized-behavior checks', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Preserve applicable cleanliness and unauthorized-behavior checks');
  });
});
