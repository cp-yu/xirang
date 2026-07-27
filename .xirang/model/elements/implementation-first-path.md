---
entity: element-declaration
identity: implementation-first-path
kind: domain
parent: change-formation
title: "Implementation-first Path"
summary: "从已经发生的项目实现出发形成完整 Change 的路径。"
---

## Requirements

### Requirement: 从已发生实现出发
Implementation-first Path SHALL 以已经发生的项目实现为形成 Change 的起点。

#### Scenario: 实现先于 Change
- **WHEN** 项目改动已经存在
- **THEN** Agent 不重做标准 Apply

### Requirement: 通过 Snack 对照模型与证据
Implementation-first Path SHALL 通过 Snack 对照 Semantic Model 与实现证据。

#### Scenario: 识别语义影响
- **WHEN** Snack 检查已有实现
- **THEN** 它结合模型与证据识别影响面

### Requirement: 形成完整 Change
Implementation-first Path SHALL 通过 Snack 形成完整 Change。

#### Scenario: Snack Formation 完成
- **WHEN** Delta 与适用 Plan 已完整并确认
- **THEN** 已有实现获得对应的完整 Change

### Requirement: 不生成执行任务清单
Implementation-first Path SHALL 因实现已经完成而不生成 `tasks.md`。

#### Scenario: 编写 Change Plan
- **WHEN** Snack 记录已有实现的意图与决策
- **THEN** Plan 不包含执行任务清单

### Requirement: 移交验证与收束
Implementation-first Path 形成完整 Change 后 SHALL 进入后续验证与 Change Closure。

#### Scenario: 已有实现完成调和
- **WHEN** Formation 审查与确认通过
- **THEN** 当前实现交由 Verify 独立评估
