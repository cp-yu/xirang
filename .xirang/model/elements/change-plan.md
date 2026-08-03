---
entity: element-declaration
identity: change-plan
kind: element
parent: change
title: Change Plan
definition: Change Plan 是 Change 的辅助性组成。它通过 `proposal.md`、`design.md` 与 `tasks.md` 共同解释该 Change 的意图与路径；它帮助用户审查 Change，并帮助 Agent 生产与执行 Semantic Delta，但不独立定义目标语义。
---

## Requirements

### Requirement: Proposal 说明意图与影响
`proposal.md` SHALL 说明发起 Change 的原因、范围与影响面。

#### Scenario: 审查 Change 原因
- **WHEN** 用户或 Agent 读取 proposal
- **THEN** 可理解为何发起 Change 及其边界

### Requirement: Design 记录决策与策略
`design.md` SHALL 记录关键决策、理由与实现策略。

#### Scenario: 理解实现路径
- **WHEN** Agent 读取 design
- **THEN** 可获得已确认决策及其理由

### Requirement: Tasks 安排待执行工作
当实现尚未发生时，`tasks.md` SHALL 安排执行步骤与验证检查。

#### Scenario: Intent-first Change 进入实现
- **WHEN** 项目改动尚待落实
- **THEN** tasks 提供执行与验证安排

### Requirement: Implementation-first 不生成 Tasks
当实现已经发生时，Snack SHALL NOT 生成 `tasks.md`。

#### Scenario: 从已有实现形成 Change
- **WHEN** Change 通过 Implementation-first Path 形成
- **THEN** Plan 不虚构执行任务清单

### Requirement: Change Plan 仅作辅助
Change Plan SHALL 帮助用户审查 Change 并帮助 Agent 生产和执行 Semantic Delta，但 SHALL NOT 独立定义目标语义。

#### Scenario: Plan 与 Delta 冲突
- **WHEN** Plan 描述与 Delta 不一致
- **THEN** 目标语义由 Semantic Delta 决定
