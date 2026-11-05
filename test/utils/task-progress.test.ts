import { describe, expect, it } from 'vitest';

import { countTasksFromContent } from '../../src/utils/task-progress.js';

const content = `## Goals

- [x] G1: Complete the first goal
- [ ] G2: Complete the second goal

## Required Corrections

- [ ] [code_fix] Fix a discovered defect
`;

describe('countTasksFromContent', () => {
  it('counts only target-level goal checkboxes', () => {
    expect(countTasksFromContent(content)).toEqual({ total: 2, completed: 1 });
  });

  it('does not count legacy checkbox lists without a Goals section', () => {
    expect(countTasksFromContent('- [x] Old action\n- [ ] Old check\n')).toEqual({ total: 0, completed: 0 });
  });

  it('does not count Required Corrections as goals', () => {
    expect(countTasksFromContent(`## Goals\n\n- [x] G1: Done\n\n## Required Corrections\n\n- [ ] [artifact_fix] Repair artifact\n`))
      .toEqual({ total: 1, completed: 1 });
  });
});
