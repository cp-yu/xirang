import { describe, expect, it } from 'vitest';

import {
  normalizeScenarioOperationLabelsForSync,
  parseScenarioOperationLabel,
  stripScenarioOperationLabel,
} from '../../../src/core/parsers/requirement-blocks.js';

describe('scenario operation labels', () => {
  it('parses only canonical scenario operation labels', () => {
    expect(parseScenarioOperationLabel('#### Scenario: [ADDED] 新场景')).toEqual({
      operation: 'ADDED',
      title: '新场景',
    });
    expect(parseScenarioOperationLabel('#### Scenario: 普通场景')).toBeNull();
    expect(parseScenarioOperationLabel('#### [ADDED] Scenario: 错误位置')).toBeNull();
  });

  it('strips ADDED and MODIFIED labels without changing bodies', () => {
    const raw = `### Requirement: 能力
系统 SHALL 工作。

#### Scenario: [ADDED] 新场景
- **WHEN** A
- **THEN** B

#### Scenario: [MODIFIED] 已调整场景
- **WHEN** C
- **THEN** D`;

    expect(normalizeScenarioOperationLabelsForSync(raw)).toBe(`### Requirement: 能力
系统 SHALL 工作。

#### Scenario: 新场景
- **WHEN** A
- **THEN** B

#### Scenario: 已调整场景
- **WHEN** C
- **THEN** D`);
  });

  it('omits REMOVED scenario blocks during sync normalization', () => {
    const raw = `### Requirement: 能力
系统 SHALL 工作。

#### Scenario: 保留场景
- **WHEN** A
- **THEN** B

#### Scenario: [REMOVED] 旧场景
- **WHEN** old
- **THEN** gone

#### Scenario: [ADDED] 新场景
- **WHEN** C
- **THEN** D`;

    expect(normalizeScenarioOperationLabelsForSync(raw)).toBe(`### Requirement: 能力
系统 SHALL 工作。

#### Scenario: 保留场景
- **WHEN** A
- **THEN** B

#### Scenario: 新场景
- **WHEN** C
- **THEN** D`);
  });

  it('leaves unlabeled scenarios and label-like body text unchanged', () => {
    const raw = `### Requirement: 能力
系统 SHALL 工作。

#### Scenario: 普通场景
- **WHEN** body says [ADDED] but is not a heading
- **THEN** unchanged`;

    expect(stripScenarioOperationLabel('#### Scenario: 普通场景')).toBe('#### Scenario: 普通场景');
    expect(normalizeScenarioOperationLabelsForSync(raw)).toBe(raw);
  });
});
