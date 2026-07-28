---
entity: element-declaration
identity: agents
kind: domain
parent: participants
title: "Agents"
definition: "代表息壤推进 Realization 的执行主体。"
---

## Requirements

### Requirement: 理解语义与项目证据
Agents SHALL 理解 Semantic Model、Change、用户决策与项目证据，并以其作为推进依据。

#### Scenario: 判断下一步行动
- **WHEN** Agent 接手 Realization
- **THEN** 它先读取适用语义与证据

### Requirement: 形成或调和 Change
Agents SHALL 按适用 Formation Path 形成或调和 Change。

#### Scenario: Change 尚未形成
- **WHEN** 用户意图或已有实现需要规范化
- **THEN** Agent 使用 Intent-first 或 Implementation-first Path

### Requirement: 实现 Change
Agents SHALL 将已形成 Change 落实到项目。

#### Scenario: Change 进入 Implementation
- **WHEN** Change 已完成 Formation
- **THEN** Agent 依据 Expected Semantic Model 修改项目

### Requirement: 组织独立评估
Agents SHALL 组织对项目结果的独立评估。

#### Scenario: Apply 产生项目状态
- **WHEN** 当前实现可供验证
- **THEN** Agent 委托适用 Internal Agent 评估

### Requirement: 经授权推进构建与收束
Agents SHALL 仅在用户授权下推进 Semantic Model Build 与需要授权的 Change 收束事项。

#### Scenario: 授权尚未获得
- **WHEN** 下一状态转换需要用户确认
- **THEN** Agent 暂停推进并请求授权

### Requirement: 分为两类协作身份
Agents SHALL 分为 Agent 与 Internal Agents。

#### Scenario: 分配执行与判断
- **WHEN** Realization 同时需要编排和独立评估
- **THEN** 分别由 Agent 与 Internal Agent 承担
