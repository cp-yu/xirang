import { describe, expect, it } from 'vitest';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer correctness escalation contract', () => {
  it('escalates spec contradictions while allowing cosmetic drift downgrade', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('issue CRITICAL "Implementation contradicts spec"');
    expect(instructions).toContain(
      'Downgrade to WARNING only when drift is cosmetic and does not affect observable behavior'
    );
  });

  it('escalates incomplete scenario coverage without a downgrade path', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('issue CRITICAL "Scenario not covered"');
    expect(instructions).toContain('Scenario coverage gaps are not downgrade candidates');
  });
});
