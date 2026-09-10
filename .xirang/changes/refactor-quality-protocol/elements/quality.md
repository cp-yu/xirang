---
operation: ADDED
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中评估并改进项目结果代码质量的环节，由 Review 与 Optimization 两个活动共同完成。它以当前代码是否已经过 Review 作为唯一驱动：存在未经 Review 的代码变更时必须先执行 Review，只有当前代码已通过 Review 才可以执行 Optimization，二者交替进行直到当前代码已通过 Review 且不存在需要继续执行的优化事项。它包含代码状态判定、两个活动的进入与收口、优化过程中的判断记录，以及确认 Change Implementation 可以进入 Change Closure 的证据；它不包含 Apply 如何产生改动、Change Closure 如何收束，也不包含两个活动各自的判断标准。
---

## ADDED Requirements

### Requirement: 每次修改后先执行 Review
Quality SHALL 在每次 Apply 修改项目后先执行 clean-context Review。

#### Scenario: 项目状态被修改
- **WHEN** Apply 完成一轮写入
- **THEN** Quality 进入 Review

### Requirement: 代码状态决定进入的活动
Quality SHALL 以当前代码是否已经过 Review 作为选择活动的唯一依据。存在未经 Review 的代码变更时 SHALL 进入 Review；当前代码已通过 Review 时才可以进入 Optimization。

#### Scenario: 存在未检测的代码变更
- **WHEN** 当前代码与最近一条通过的 Review 记录不一致，或尚无 Review 记录
- **THEN** Quality 的状态为 `dirty`
- **AND** 只有 Review 可以继续

#### Scenario: 当前代码已通过 Review
- **WHEN** 存在一条 Review 记录，其 result 为 `PASS` 或 `PASS_WITH_WARNINGS`，且其 fingerprint 与当前代码一致
- **THEN** Quality 的状态为 `clean`
- **AND** Optimization 可以开始

### Requirement: Review 通过后建立 Baseline
首次 Review 通过的项目状态 SHALL 成为 baseline checkpoint。

#### Scenario: 初始实现通过 Review
- **WHEN** 当前状态首次满足正确性门禁
- **THEN** Quality 保存 baseline checkpoint

### Requirement: 成功优化推进 Checkpoint
每个优化轮次经 Apply 实现并重新通过 Review 后，当前项目状态 SHALL 成为新的 successful checkpoint。

#### Scenario: 优化实现通过 Review
- **WHEN** 优化轮次产生的代码变更通过 Review
- **THEN** Quality 推进 successful checkpoint

### Requirement: 失败优化恢复 Checkpoint
优化轮次未通过 Review 时，Quality SHALL 恢复最近的 successful checkpoint。

#### Scenario: 优化产生不合格状态
- **WHEN** 优化轮次产生的代码变更未通过 Review
- **THEN** Quality 回到最近成功状态

### Requirement: 保留失败方向与优化历史
失败轮次恢复后，Quality SHALL 保留 Review 结论、失败方向与优化判断记录，使后续评估仍可读取失败证据与历史。

#### Scenario: 恢复成功状态
- **WHEN** Quality 丢弃未通过的优化改动
- **THEN** 恢复后的状态仍可读取失败方向与轮次记录

### Requirement: 仅以最新成功状态完成
Quality SHALL 仅在最新项目状态已成为 successful checkpoint 时完成。

#### Scenario: 当前状态尚未通过 Review
- **WHEN** 最新修改仍是未通过 Review 的状态
- **THEN** Quality 不得完成

### Requirement: 收口后确认可进入 Change Closure
Quality SHALL 仅在当前代码已通过 Review、Optimization 已收口且终态不是 `ABORTED_UNSAFE`、且用于判断的证据仍然有效时，确认 Change Implementation 可以进入 Change Closure。

#### Scenario: Optimization 尚未收口
- **WHEN** 还没有任何收口记录
- **THEN** Quality 不得确认进入 Change Closure

#### Scenario: 验证证据必须仍然有效
- **WHEN** Quality 无法以现有记录支持当前代码已通过 Review 的结论
- **THEN** 它要求重新执行 Review
