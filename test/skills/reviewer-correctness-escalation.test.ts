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

  it('escalates missing behavior evidence and weak assertions', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).not.toContain('Scenario coverage gaps are not downgrade candidates');
    expect(instructions).toContain('no credible evidence');
    expect(instructions).toContain('weak assertion');
  });
});
