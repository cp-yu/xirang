---
entity: element-declaration
identity: checkpoint
kind: element
parent: quality
title: Checkpoint
definition: Checkpoint 是 Quality 中隔离已经通过 Review 的项目状态与尚未通过 Review 的优化改动的机制。首次 Review 通过后形成 baseline checkpoint，每个优化轮次经 Apply 实现并重新通过 Review 后形成新的 successful checkpoint；优化改动未通过 Review 时项目恢复到最近的 successful checkpoint。
---

## Requirements

### Requirement: Checkpoint 隔离状态

Quality SHALL 使用 Checkpoints 隔离已经通过 Review 的项目状态与尚未通过 Review 的优化改动。

#### Scenario: Baseline checkpoint 形成

- **WHEN** 首次 Review 通过
- **THEN** 当前项目状态形成 baseline checkpoint

#### Scenario: Successful checkpoint 推进

- **WHEN** 优化轮次经 Apply 实现并重新通过 Review
- **THEN** 当前项目状态形成新的 successful checkpoint

#### Scenario: 优化失败恢复

- **WHEN** 优化轮次未通过 Review
- **THEN** 项目恢复到最近的 successful checkpoint
- **AND** 保留 Review 结论、失败方向与优化判断记录
- **AND** 基于恢复后的项目状态继续评估

#### Scenario: 最新状态成为 successful checkpoint 才完成 Quality

- **WHEN** 最新项目状态已成为 successful checkpoint
- **AND** Optimization 已收口
- **AND** Review 证据仍然有效
- **THEN** Quality 完成并允许 Change 进入 Change Closure
