---
operation: MODIFIED
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由代码状态反复触发的正确性门禁：只要存在未经 Review 的代码变更，就必须先执行 Review。它由 Reviewer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，独立评估 Change 是否完整落实、项目行为是否正确、实现是否遵循决策与约束、必要清理是否完成，并判断当前结果是否符合 Expected Semantic Model。
---

## MODIFIED Requirements

### Requirement: 通过状态具备 Checkpoint 资格

Review 通过时，当前项目状态 SHALL 有资格成为 baseline 或 successful checkpoint。

#### Scenario: 当前状态通过 Review
- **WHEN** 没有阻塞问题且证据充分
- **THEN** Quality 可保存该状态为 Checkpoint

### Requirement: 修改后重新 Review

任何项目修改 SHALL 要求修改后的状态重新执行 Review。

#### Scenario: Apply 实现修正或优化
- **WHEN** 项目产生新状态
- **THEN** 该状态成为 `dirty`
- **AND** Quality 再次进入 Review
