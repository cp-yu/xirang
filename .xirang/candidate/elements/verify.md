---
entity: element-declaration
identity: verify
kind: domain
parent: change-implementation
title: Verify
definition: Verify 是 Change Implementation 中独立评估并改进项目结果的活动，由 Review 与 Optimization 共同完成。Review 在每次 Apply 修改项目后执行；Optimization 仅在 Review 通过后执行；当最新项目状态通过 Review 且 Optimization 确认无需继续执行时，Verify 以仍然有效的验证证据确认 Change Implementation 可以进入 Change Closure。
---

## Requirements

### Requirement: 每次修改后先执行 Review
Verify SHALL 在每次 Apply 修改项目后先执行 clean-context Review。

#### Scenario: Apply 产生新状态
- **WHEN** 当前项目被修改
- **THEN** Verify 进入 Review

### Requirement: Review 通过后建立 Baseline
首次 Review 通过的项目状态 SHALL 成为 baseline checkpoint。

#### Scenario: 初始实现通过 Review
- **WHEN** 当前状态首次满足正确性门禁
- **THEN** Verify 保存 baseline checkpoint

### Requirement: Baseline 后执行 Optimization
Verify SHALL 仅在 Review 通过并保存 Checkpoint 后执行 clean-context Optimization。

#### Scenario: Baseline 已建立
- **WHEN** 正确性门禁通过
- **THEN** Verify 进入 Optimization

### Requirement: 成功优化推进 Checkpoint
每个优化事项经 Apply 实现并重新通过 Review 后，当前项目状态 SHALL 成为新的 successful checkpoint。

#### Scenario: 优化实现通过 Review
- **WHEN** speculative state 满足正确性门禁
- **THEN** Verify 推进 successful checkpoint

### Requirement: 失败优化恢复 Checkpoint
优化事项未通过 Review 时，Verify SHALL 恢复最近的 successful checkpoint。

#### Scenario: 优化产生不合格状态
- **WHEN** speculative state 未通过 Review
- **THEN** Verify 回到最近成功状态

### Requirement: 保留失败方向与优化历史
失败优化恢复后，Verify SHALL 保留 Review 结论、失败方向与 Optimization 历史。

#### Scenario: 恢复成功状态
- **WHEN** Verify 丢弃未通过的 speculative state
- **THEN** 后续评估仍可读取失败证据与历史

### Requirement: 仅以最新成功状态完成
Verify SHALL 仅在最新项目状态已成为 successful checkpoint 时完成。

#### Scenario: 当前状态尚未通过 Review
- **WHEN** 最新修改仍是 speculative state
- **THEN** Verify 不得完成

### Requirement: Optimization 必须完成
Verify SHALL 仅在 Optimization 确认不存在需要继续执行的事项时完成。

#### Scenario: 仍有选中优化事项
- **WHEN** Optimization 返回后续工作
- **THEN** Verify 将事项交回 Apply

### Requirement: 验证证据必须仍然有效
Verify SHALL 仅在用于判断的验证证据仍然有效时完成。

#### Scenario: 当前状态不再由证据覆盖
- **WHEN** Verify 无法以现有证据支持结论
- **THEN** 它重新获取或执行验证
