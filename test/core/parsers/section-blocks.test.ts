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
  it.each(['-     ### Section: Existing', '-     `### Section: Existing`'])('does not use an indented code block inside a removal item as a selector (%j)', selector => {
    const plan = parseDeltaSpec(`## REMOVED Sections\n\n${selector}`);
    expect(plan.removed).toEqual([]);
    expect(plan.removedContentLines).toEqual([3]);
  });

  it.each(['```', '~~~~'])('preserves headings and operation examples inside %s fences', fence => {
    const raw = `### Section: Actual\n\nThe system SHALL preserve examples.\n\n${fence}markdown\n## MODIFIED Sections\n### Section: Fenced example\n#### Acceptance Case: Example only\n# Fenced heading\n##\nRENAMED Sections\n---------\n${fence}\n\n---\n\nTail text.`;
    const plan = parseDeltaSpec(`## ADDED Sections\n\n${raw}\n\n## REMOVED Sections\n\n### Section: Removed`);
    expect(plan.added).toMatchObject([{ name: 'Actual', headerLine: '### Section: Actual', raw }]);
    expect(plan.modified).toEqual([]);
    expect(plan.removed).toEqual(['Removed']);
  });

  it.each([
    '~~~md\n    ## RENAMED Sections\n~~~',
    '* Top item\n  * Nested item\n\n    ## RENAMED Sections',
  ])('keeps an over-indented example inside a fenced or nested Markdown block (%j)', example => {
    const section = `### Section: Actual\n\nRoot SHALL preserve examples.\n\n${example}`;
    const plan = parseDeltaSpec(`## ADDED Sections\n\n${section}`);
    expect(plan.malformedOperationLines).toEqual([]);
    expect(plan.unsupportedSections).toEqual([]);
    expect(plan.added.map(block => block.raw)).toEqual([section]);
  });

  it('detects unscoped Sections, not example headings in a fence', () => {
    const plan = parseDeltaSpec([
      '```md', '### Section: Example', '```', '### Section: Unscoped',
      '## ADDED Sections', '### Section: Scoped', 'The system SHALL keep this behavior.',
    ].join('\n'));
    expect(plan.unscopedSections).toEqual(['Unscoped']);
    expect(plan.added.map(section => section.name)).toEqual(['Scoped']);
  });

  it.each(['    ```md', '\t~~~md', '```not`a valid info string'])('does not treat an invalid opening fence as hiding operation headings (%j)', opening => {
    const plan = parseDeltaSpec([
      '## ADDED Sections', '### Section: Actual', 'The system SHALL keep this behavior.',
      opening, '## RENAMED Sections', '### Section: Old',
    ].join('\n'));
    expect(plan.unsupportedSections).toEqual(['RENAMED Sections']);
    expect(plan.added.map(section => section.name)).toEqual(['Actual']);
  });

  it('keeps headings inside a real fence when a proposed closing line has four leading spaces', () => {
    const plan = parseDeltaSpec([
      '## ADDED Sections', '### Section: Actual', 'The system SHALL keep this behavior.',
      '   ```md', '    ```', '## RENAMED Sections', '### Section: Example only', '   ```',
      '## REMOVED Sections', '### Section: Retired',
    ].join('\n'));
    expect(plan.unsupportedSections).toEqual([]);
    expect(plan.removed).toEqual(['Retired']);
    expect(plan.added[0].raw).toContain('## RENAMED Sections');
  });

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
