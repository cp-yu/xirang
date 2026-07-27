---
entity: element-declaration
identity: project-tooling-configuration
kind: capability
parent: cli
title: "Project and Tooling Configuration"
summary: "建立和维护工作区、项目配置与所选 Agent 工具集成。"
---

## Requirements

### Requirement: 管理项目与 Agent 工作面
Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。

#### Scenario: 建立新项目
- **WHEN** 用户选择项目与 Agent 工具
- **THEN** CLI 建立工作区、项目配置与对应工具集成

### Requirement: 保持配置一致
Project and Tooling Configuration SHALL 通过 CLI 维护项目配置和 Agent 工具集成的一致状态。

#### Scenario: 更新已配置项目
- **WHEN** 用户请求维护现有项目配置与工具集成
- **THEN** CLI 依据当前配置刷新息壤托管的工作面
