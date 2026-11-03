import { describe, expect, it } from 'vitest';
import { commandSchemas } from '../../src/core/quality/command-schema.js';
import { renderQualityPayloadSchema } from '../../src/core/quality/protocol.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('reviewer output schema binding', () => {
  it('embeds the runtime submit schema instead of a separate report schema', () => {
    expect(getReviewerSubagentTemplate().prompt).toContain(renderQualityPayloadSchema('reviewSubmit'));
  });

  it.each([
    { completeness: { tasksCompleted: 1, tasksTotal: 1 }, cleanliness: { checked: true, unaccountedChangesFound: 0 }, gitDiffSummary: 'Fixture paths inspected.' },
    { assignment: 'Shared helper repair', examinedFiles: ['src/helper.ts'], gitDiffSummary: 'Only repair and callers inspected.' },
  ])('accepts truthful full or scoped summaries without a top-level diff field', summary => {
    const payload = { result: 'PASS', issues: [], evidenceFiles: ['src/helper.ts'], summary, writeBackPlan: [] };
    expect(commandSchemas.reviewSubmit.parse(payload)).toEqual(payload);
    expect(commandSchemas.reviewSubmit.safeParse({ ...payload, gitDiffSummary: 'outside summary' }).success).toBe(false);
  });

  it('requires an exact checkbox for unmark and null taskLine for appended corrections', () => {
    const payload = {
      result: 'FAIL_NEEDS_CORRECTIONS',
      issues: [{ severity: 'CRITICAL', message: 'Missing behavior.' }],
      evidenceFiles: ['src/helper.ts'], summary: 'Fixture repair evidence.',
      writeBackPlan: [{ action: 'append_correction', taskLine: null, correctionType: 'code_fix', summary: 'Repair missing behavior.' }],
    };
    expect(commandSchemas.reviewSubmit.safeParse(payload).success).toBe(true);
    expect(commandSchemas.reviewSubmit.safeParse({ ...payload, writeBackPlan: [{ ...payload.writeBackPlan[0], taskLine: '- [x] task' }] }).success).toBe(false);
    expect(commandSchemas.reviewSubmit.safeParse({ ...payload, writeBackPlan: [{ ...payload.writeBackPlan[0], action: 'unmark' }] }).success).toBe(false);
    expect(commandSchemas.reviewSubmit.safeParse({ ...payload, writeBackPlan: [{ ...payload.writeBackPlan[0], action: 'unmark', taskLine: '- [x] task' }] }).success).toBe(true);
  });
});
