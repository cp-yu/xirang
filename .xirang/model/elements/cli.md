---
entity: element-declaration
identity: cli
kind: domain
parent: interaction-surfaces
title: "CLI"
summary: "息壤的项目配置与确定性操作界面。"
---

## Requirements

### Requirement: 提供一致可复现的操作
CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化和原子状态转换。

#### Scenario: Agent 执行确定性操作
- **WHEN** Agent 需要查询、校验、同步、提升或归档
- **THEN** CLI 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作

### Requirement: 保持 Agent 与 CLI 职责分离
CLI SHALL 负责可确定性复现的操作，SHALL NOT 替代用户授权或 Agent、Reviewer、Optimizer 的语义判断。

#### Scenario: 操作需要目标语义决策
- **WHEN** 输入不足以唯一决定目标层级或行为
- **THEN** CLI 报告问题而不创作或规范化语义
