import { describe, expect, it } from 'vitest';
import { extractSpecificationSection, parseDeltaSpec } from '../../../src/core/parsers/section-blocks.js';

describe('Specification section extraction', () => {
  it.each(['   ##', '# Outside Contract', 'Outside Contract\n================'])('keeps enclosing heading %j and subsequent text outside the Contract', heading => {
    const section = '### Section: Actual behavior\n\nThe system SHALL behave.';
    const parts = extractSpecificationSection(`## Specification\n\n${section}\n\n${heading}\n\nStray text.`);
    expect(parts.bodyBlocks.map(block => block.raw)).toEqual([section]);
    expect(parts.after).toBe(`\n${heading}\n\nStray text.`);
  });

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
  it.each(['```', '~~~~'])('preserves headings and operation examples inside %s fences', fence => {
    const raw = `### Section: Actual\n\nThe system SHALL preserve examples.\n\n${fence}markdown\n## MODIFIED Sections\n### Section: Fenced example\n#### Acceptance Case: Example only\n# Fenced heading\n##\nRENAMED Sections\n---------\n${fence}\n\n---\n\nTail text.`;
    const plan = parseDeltaSpec(`## ADDED Sections\n\n${raw}\n\n## REMOVED Sections\n\n### Section: Removed`);
    expect(plan.added).toEqual([{ name: 'Actual', headerLine: '### Section: Actual', raw }]);
    expect(plan.modified).toEqual([]);
    expect(plan.removed).toEqual(['Removed']);
  });

  it('keeps a real fence after an HTML block containing fence-like text', () => {
    const raw = '### Section: Actual\n\nThe system SHALL preserve examples.\n\n<div>\n```\n</div>\n\n```md\n## RENAMED Sections\n```\n\nTail text.';
    const plan = parseDeltaSpec(`## ADDED Sections\n\n${raw}`);
    expect(plan.added).toEqual([{ name: 'Actual', headerLine: '### Section: Actual', raw }]);
    expect(plan.unsupportedSections).toEqual([]);
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
