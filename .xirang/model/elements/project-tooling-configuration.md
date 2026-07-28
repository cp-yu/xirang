---
entity: element-declaration
identity: project-tooling-configuration
kind: capability
parent: cli
title: Project and Tooling Configuration
definition: 建立和维护工作区、项目配置与所选 Agent 工具集成。
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

### Requirement: 投影共享 Element Contract 语义

Project and Tooling Configuration SHALL 从单一 `ELEMENT_CONTRACT_SEMANTICS` fragment 向 `xirang-build`、`xirang-propose` 与 `xirang-snack` 生成工作面投影 Element Contract、Requirement 与 Scenario 语义，SHALL NOT 为这些工作面维护相互独立的定义副本。

#### Scenario: 刷新 Agent 工作面

- **WHEN** CLI 生成或更新 Build、Propose 与 Snack skills
- **THEN** 三个工作面包含同一 fragment 的语义内容且存储记法仍由独立 notation fragment 提供
