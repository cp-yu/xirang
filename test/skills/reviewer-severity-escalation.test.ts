import { describe, expect, it } from 'vitest';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer severity escalation contract', () => {
  it('uses strict severity assignment instead of lower-tier fallback', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Default stance: Strict');
    expect(instructions).toContain('When uncertain: Escalate to CRITICAL');
    expect(instructions).not.toContain('prefer the lower tier');
    expect(instructions).not.toContain('SUGGESTION over WARNING, WARNING over CRITICAL');
  });

  it('treats refactor and migration residue as critical severity input', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain(
      'OR residue from refactor/migration (orphaned code, stale markers, incomplete migration)'
    );
  });
});
