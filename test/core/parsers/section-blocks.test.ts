import { describe, expect, it } from 'vitest';
import { extractSpecificationSection, parseDeltaSpec } from '../../../src/core/parsers/section-blocks.js';

describe('Specification section extraction', () => {
  it('ignores Section headings inside fenced code blocks', () => {
    const parts = extractSpecificationSection(`## Specification

\`\`\`md
### Section: Example only
The example SHALL not be indexed.
\`\`\`

### Section: Actual behavior
The system SHALL behave.
`);

    expect(parts.bodyBlocks.map(block => block.name)).toEqual(['Actual behavior']);
    expect(parts.preamble).toContain('### Section: Example only');
  });
});

describe('Section delta parsing', () => {
  it('marks RENAMED Sections as an unsupported operation section', () => {
    const plan = parseDeltaSpec(`## RENAMED Sections

FROM: ### Section: Old
TO: ### Section: New
`);

    expect(plan.unsupportedSections).toEqual(['RENAMED Sections']);
    expect(plan.added).toEqual([]);
    expect(plan.modified).toEqual([]);
    expect(plan.removed).toEqual([]);
  });
});
