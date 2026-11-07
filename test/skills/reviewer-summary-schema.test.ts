import { describe, expect, it } from 'vitest';
import { commandSchemas } from '../../src/core/quality/command-schema.js';
import { renderQualityPayloadSchema } from '../../src/core/quality/protocol.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

const review = { reviewKind: 'full-change', commit: 'a'.repeat(40), result: 'PASS', summary: 'Reviewed fixture implementation.', findings: [] };

describe('reviewer output schema binding', () => {
  it('embeds the runtime Review opinion schema', () => {
    expect(getReviewerSubagentTemplate().prompt).toContain(renderQualityPayloadSchema('review'));
  });

  it('accepts strict commit-bound Review opinions', () => {
    expect(commandSchemas.review.parse(review)).toEqual(review);
    expect(commandSchemas.review.safeParse({ ...review, gitDiffSummary: 'not allowed' }).success).toBe(false);
  });
});
