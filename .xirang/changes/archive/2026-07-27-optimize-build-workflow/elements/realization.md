---
entity: element-declaration
identity: realization
kind: domain
parent: project.root
title: "Realization"
summary: "由推进过程与协作结构共同表达的项目意图落实过程。"
---

## ADDED Requirements

### Requirement: 以两个维度完整描述落实
Realization SHALL 由推进过程完整描述 Activity 或 Stage 的入口、推进、约束与结果，并由协作结构完整描述 Participant 或 Agent 工作身份的授权、责任、判断、操作、协调与交付。

#### Scenario: 理解同一落实工作
- **WHEN** 用户或 Agent 查看一个 Realization 工作
- **THEN** 推进过程说明工作如何成立且协作结构说明主体承担什么职责

### Requirement: 允许跨维度语义覆盖
推进过程与协作结构 MAY 在各自维度表达相互覆盖的规范语义，且任一维度 SHALL NOT 被表达为另一维度的差量。

#### Scenario: Role 承担 Activity
- **WHEN** Agent 工作身份描述其承担 Activity 的相关职责
- **THEN** Activity 与 Role Contracts 分别保持各自维度的完整语义
