---
entity: element-declaration
identity: propose-role
kind: capability
parent: agent
title: "Propose Role"
definition: "将已确认 Change 雏形编译为完整 Change 的 Agent 工作身份。"
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
