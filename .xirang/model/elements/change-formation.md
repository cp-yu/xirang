---
entity: element-declaration
identity: change-formation
kind: domain
parent: change-realization
title: "Change Formation"
definition: "形成完整 Semantic Delta 与 Change Plan 并完成必要确认的阶段。"
---

## Requirements

### Requirement: 产出完整 Semantic Delta
Change Formation SHALL 产出完整 Semantic Delta。

#### Scenario: 目标语义已明确
- **WHEN** Formation 完成
- **THEN** Delta 完整表达该 Change 的目标语义

### Requirement: 产出适用的完整 Change Plan
Change Formation SHALL 产出对所选形成路径完整且适用的 Change Plan。

#### Scenario: Intent-first Formation
- **WHEN** 实现尚未发生
- **THEN** Plan 包含意图、决策、执行与验证安排

#### Scenario: Implementation-first Formation
- **WHEN** 实现已经发生
- **THEN** Plan 包含意图与决策说明且不虚构 tasks

### Requirement: 完成 Formation 审查与确认
Change Formation SHALL 在本阶段内完成必要审查与确认。

#### Scenario: Change 存在未决目标语义
- **WHEN** 关键语义尚未确认
- **THEN** Formation 不得完成

### Requirement: 选择 Formation Path
Change Formation SHALL 通过 Intent-first Path 或 Implementation-first Path 完成。

#### Scenario: 选择形成路径
- **WHEN** Agent 判断实现是否已经发生
- **THEN** 使用与事实相符的 Formation Path

### Requirement: 形成可进入实现的 Change
Change Formation 完成后，完整 Change SHALL 可进入 Change Implementation。

#### Scenario: Formation 出口
- **WHEN** Delta、Plan、审查和确认均已完成
- **THEN** Change 进入 Change Implementation
