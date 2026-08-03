---
entity: element-declaration
identity: participants
kind: domain
parent: collaboration-structure
title: Participants
definition: 参与意图授权、语义判断与项目落实的行为主体。
---

## Requirements

### Requirement: 由用户与 Agents 组成

Participants SHALL 由用户与 Agents 组成。

#### Scenario: 识别协作主体

- **WHEN** Realization 分配授权或执行职责
- **THEN** 职责归属于用户或适用 Agent

### Requirement: 用户保留意图与关键授权

Participants 的协作结构 SHALL 保留用户对意图与关键事项的授权权力。

#### Scenario: 需要关键授权

- **WHEN** 事项必须由用户判断
- **THEN** Agents 等待用户授权

### Requirement: Agents 依据语义与证据推进

Participants 的协作结构 SHALL 由 Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization。

#### Scenario: Agent 推进工作

- **WHEN** 用户已提供必要授权
- **THEN** Agent 使用规范语义与证据继续落实

### Requirement: 通过 Interaction Surfaces 操作

Participants SHALL 通过 Interaction Surfaces 完成查询、投影与确定性操作。

#### Scenario: 需要确定性查询

- **WHEN** Participant 需要模型或 Change 信息
- **THEN** 通过 Interaction Surface 获取结果
