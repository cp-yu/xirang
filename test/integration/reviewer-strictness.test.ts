import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

const reviewer = generateSubagentContent(getReviewerSubagentTemplate(), 'pi', 'TEST');

describe('reviewer strictness integration contract', () => {
  it('judges evidence by observable behavior rather than one test per acceptance case', () => {
    expect(reviewer).toContain('Judge evidence by observable behavior, not by one test per Acceptance Case');
    expect(reviewer).toContain('One test may cover multiple cases, and explicitly classified one-time evidence is valid');
    expect(reviewer).toContain('Missing credible evidence for required behavior is CRITICAL');
  });

  it('treats a violated design decision as critical even when a code comment explains the deviation', () => {
    expect(reviewer).toContain('A design decision violated by implementation is CRITICAL, even if a code comment explains the deviation');
  });

  it('does not treat TODO markers alone as findings', () => {
    expect(reviewer).toContain('TODO/FIXME/HACK comments alone are not findings');
  });

  it('retains applicable cleanliness and unauthorized-behavior checks', () => {
    expect(reviewer).toContain('Preserve applicable cleanliness and unauthorized-behavior checks');
  });
});
