import { describe, expect, it } from 'vitest';
import { extractRequirementsSection, parseDeltaSpec } from '../../../src/core/parsers/requirement-blocks.js';

describe('requirement section extraction', () => {
  it('ignores Requirement headings inside fenced code blocks', () => {
    const parts = extractRequirementsSection(`## Requirements

\`\`\`md
### Requirement: Example only
The example SHALL not be indexed.
\`\`\`

### Requirement: Actual behavior
The system SHALL behave.
`);

    expect(parts.bodyBlocks.map(block => block.name)).toEqual(['Actual behavior']);
    expect(parts.preamble).toContain('### Requirement: Example only');
  });
});

describe('requirement delta parsing', () => {
  it.each(['ADDED', 'MODIFIED', 'REMOVED', 'UPDATED'])('reports [%s] Scenario metadata with a source line', prefix => {
    const plan = parseDeltaSpec(`## MODIFIED Requirements

### Requirement: 能力
系统 SHALL 工作。

#### Scenario: [${prefix}] 场景
- **WHEN** A
- **THEN** B
`);

    expect(plan.scenarioOperationLabels).toEqual([
      { line: 6, prefix, title: '场景' },
    ]);
  });

  it('ignores bracketed examples inside fenced code blocks', () => {
    const plan = parseDeltaSpec(`## ADDED Requirements

### Requirement: 文档示例
系统 SHALL 保留示例。

\`\`\`md
#### Scenario: [ADDED] 示例
\`\`\`

#### Scenario: 正式场景
- **WHEN** A
- **THEN** B
`);

    expect(plan.scenarioOperationLabels).toEqual([]);
  });

  it('marks RENAMED Requirements as an unsupported operation section', () => {
    const plan = parseDeltaSpec(`## RENAMED Requirements

FROM: ### Requirement: Old
TO: ### Requirement: New
`);

    expect(plan.unsupportedSections).toEqual(['RENAMED Requirements']);
    expect(plan.added).toEqual([]);
    expect(plan.modified).toEqual([]);
    expect(plan.removed).toEqual([]);
  });
});
