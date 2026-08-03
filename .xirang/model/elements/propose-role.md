---
entity: element-declaration
identity: propose-role
kind: element
parent: agent
title: Propose Role
definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它以已确认设计为依据形成 Change，并复用 Explore 已形成的 Design Summary；Explore 形成了 Change Structural Definition 时，它通过 CLI 将该定义纳入目标 Change，并把其中已确认的结构目标编译为相应的 Semantic Delta Entries。
---

## Requirements

### Requirement: 写入 Change 制品

Propose Role MAY 在授权范围内写入 Semantic Delta 与 Change Plan 制品。

#### Scenario: Propose 编译完整 Change

- **WHEN** 目标语义与路径已明确
- **THEN** Agent 写入对应 Change 目录

### Requirement: 交付可进入实现的 Change

Propose Role SHALL 将 Propose 完成的完整 Change 交付给 Change Implementation。

#### Scenario: Propose 活动完成

- **WHEN** Delta、Plan、审查与确认均完整
- **THEN** Agent 报告该 Change 可进入 Change Implementation

### Requirement: 不修改项目或正式模型

Propose Role SHALL NOT 修改项目实现，也 SHALL NOT 将 Delta 应用于 Semantic Model。

#### Scenario: Change 已形成

- **WHEN** Propose 到达出口
- **THEN** 项目实现与正式模型保持未落实该 Change 的状态

### Requirement: 编排结构定义消费

Explore 形成了 Change Structural Definition 时，Propose Role SHALL 在完整 Change 通过 validation 与 structural coverage 后调用 `xirang framing consume`，并仅在 provenance 冻结与源 lifecycle 成功时交付 Change Formation 结果；Explore 未形成 Change Structural Definition 时，SHALL 直接按既有 Propose 路径交付完整 Change。

#### Scenario: 带结构定义的完整 Change 已生成

- **WHEN** validation 没有 ERROR 且 Change Structural Definition coverage 完整
- **THEN** Agent 消费对应 exploration identity 并确认 frozen path

#### Scenario: Explore 未形成结构定义

- **WHEN** 完整 Change 仅由 Semantic Model 与已确认设计形成
- **THEN** Agent 不调用 framing consume
