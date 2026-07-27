---
entity: element-declaration
identity: project.root
kind: project
parent: null
title: "息壤（Xirang）"
summary: "面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。"
---

## Requirements

### Requirement: 以用户意图驱动项目演进
息壤 SHALL 以 Semantic Model 表达用户意图，以 Change 承载新的演进意图，并通过 Realization 落实项目构建与变更。

#### Scenario: 推进项目演进
- **WHEN** 用户表达项目目标或新的变更意图
- **THEN** Agent 依据相应 Semantic Model 或 Change 推进 Realization

### Requirement: 保留用户授权
息壤 SHALL 由用户保留意图确认和无法由语义与项目证据确定之决策的授权权力。

#### Scenario: 遇到未决语义
- **WHEN** 目标层级、契约或关系无法从权威依据确定
- **THEN** Agent 请求用户裁决而不自行猜测
