import { describe, expect, it } from 'vitest';
import { validateTaskStructure } from '../../../src/core/parsers/task-structure.js';

const targetTasks = `## Goals

- [ ] G1: Reject unsupported task layouts
  - Contract: \`task-decomposition\` / Section "Checks 是任务进度源"
  - Verify: Old Files/Checks and Actions/Checks layouts are rejected.
- [x] G2: Track goal completion
  - Contract: \`tasks-document\` / Section "Checks 按可观察行为组织"
  - Verify: Progress counts only goal checkboxes.

## Required Corrections

- [ ] [code_fix] Fix a discovered defect
`;

describe('validateTaskStructure', () => {
  it('accepts goal-level tasks with Contract references and verification directions', () => {
    const result = validateTaskStructure(targetTasks);
    expect(result.valid).toBe(true);
    expect(result.actions).toEqual(['G1', 'G2']);
    expect(result.checks).toEqual([]);
    expect(result.format).toBe('goal-level');
  });

  it('rejects Actions/Checks layouts instead of retaining a legacy parser', () => {
    const result = validateTaskStructure(`## 1. Actions\n\n- [ ] A1 Implement\n\n## 2. Checks\n\n- [ ] C1 Verify\n  - Covers: A1\n  - Test action: one-time\n  - Evidence: checked\n`);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('unsupported-task-format');
  });

  it('rejects coarse Tasks with Files and nested Checks', () => {
    const result = validateTaskStructure(`### Task 1: Legacy\n\n**Goal**: Implement behavior.\n\n**Files**:\n- Modify: \`src/example.ts\`\n\n**Sections**:\n- Implement it\n\n#### Checks\n- [ ] C1 Verify\n  - Test action: one-time\n  - Evidence: checked\n`);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('unsupported-task-format');
  });

  it('rejects goal entries without a verification direction', () => {
    const result = validateTaskStructure(`## Goals\n\n- [ ] G1: Implement behavior\n  - Contract: \`some-element\` / Section "Behavior"\n`);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('missing-goal-verification');
  });
});
