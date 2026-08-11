---
entity: element-declaration
identity: project-tooling-configuration
kind: element
parent: cli
title: Project and Tooling Configuration
definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
---

## ADDED Requirements

### Requirement: 管理 Outline Element Definition 深度配置

Project and Tooling Configuration SHALL 将 `architecture.outline.elementDefinitionDepth` 作为项目级 functional configuration 管理。该字段 SHALL 为非负整数，缺失时有效默认值 SHALL 为 `2`；默认值 SHALL 由同一配置常量用于 setup/update 磁盘物化、resilient parsing 后的 effective config、normalized projection 与 `arch outline` command resolution。

#### Scenario: 新项目物化默认值

- **WHEN** `xirang setup` 或 config default migration 创建项目配置
- **THEN** `.xirang/config.yaml` SHALL 包含 `architecture.outline.elementDefinitionDepth: 2`
- **AND** SHALL 使用现有 functional default materialization path，而不是独立硬编码

#### Scenario: 既有项目补充缺失默认值

- **WHEN** update 或 default migration 处理未声明 outline config 的既有 `.yaml` 或 `.yml` 配置
- **THEN** CLI SHALL 只补充缺失的 nested mapping keys
- **AND** SHALL NOT 覆盖用户已有的合法 `elementDefinitionDepth`

#### Scenario: 读取合法配置值

- **WHEN** 项目配置包含 `architecture.outline.elementDefinitionDepth: 4`
- **THEN** normalized project config 与未显式覆盖的 `arch outline` SHALL 使用值 `4`
- **AND** SHALL NOT 将该值解释为模型结构裁剪深度

#### Scenario: 非法配置回退有效默认值

- **WHEN** 配置值为负数、非整数或 nested shape 非法
- **THEN** resilient parser SHALL 输出 field-specific warning
- **AND** effective normalized projection 与 `arch outline` SHALL 使用默认值 `2`
- **AND** 其他有效项目配置字段 SHALL 继续可用

#### Scenario: config project 显示有效值

- **WHEN** 用户运行 `xirang config project --json`
- **THEN** normalized output SHALL 包含有效 `architecture.outline.elementDefinitionDepth`
- **AND** 缺失 raw config 时 SHALL 仍显示默认值 `2`

#### Scenario: Agent config projection 显示有效值

- **WHEN** CLI 为 Agent-facing artifact instructions 构建 `configProjection.prompt.fragments`
- **THEN** projection SHALL 包含 `architecture` fragment 与 `architecture.outline.elementDefinitionDepth: <effective value>`
- **AND** fragment SHALL 只投影有效值，不重复静态 Semantic Model 恢复协议

#### Scenario: 跨平台配置路径一致

- **WHEN** 在 Windows、macOS 或 Linux 上读取、创建或迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
- **THEN** CLI SHALL 使用 Node.js path utilities
- **AND** 两种扩展名 SHALL 产生相同 outline configuration semantics
