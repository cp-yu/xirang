import { describe, expect, it } from 'vitest';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer correctness escalation contract', () => {
  it('treats unsupported behavior and violated design decisions as critical', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('A behavior change not supported by a goal, Delta Section or design decision is CRITICAL');
    expect(instructions).toContain('A design decision violated by implementation is CRITICAL');
  });

  it('escalates missing credible behavior evidence and weak tests', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).not.toContain('AcceptanceCase coverage gaps are not downgrade candidates');
    expect(instructions).toContain('Missing credible evidence for required behavior is CRITICAL');
    expect(instructions).toContain('a weak test whose assertion would survive an obvious behavior mutation, is CRITICAL');
  });
});
