---
entity: element-declaration
identity: project-tooling-configuration
kind: element
parent: cli
title: Project and Tooling Configuration
definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
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

Project and Tooling Configuration SHALL 从单一共享 authoring fragment 向 `xirang-build`、`xirang-explore`、`xirang-propose` 与 `xirang-snack` 投影 Element Definition 与 Element Contract 的边界及写作规则，SHALL NOT 为这些工作面维护相互独立的定义副本。

#### Scenario: 刷新 Agent 工作面

- **WHEN** CLI 生成或更新 Build、Explore、Propose 与 Snack skills
- **THEN** 四个工作面消费一致的 Definition authoring contract，且存储记法仍由独立 notation fragment 提供

### Requirement: 以 Project Definition 初始化根 Element

Project and Tooling Configuration SHALL 在建立新 Xirang 工作区时收集 Project Definition，并以该完整 Definition 初始化 Project Root Declaration，SHALL NOT 将紧凑 summary 作为根 Element 的规范性概念表述。

#### Scenario: 跨平台初始化项目

- **WHEN** 用户在 macOS、Linux 或 Windows 上建立新项目
- **THEN** CLI 通过平台路径 API 写入包含 `definition` 的 Project Root 单元，且结果不依赖路径分隔符

### Requirement: 投影共享 Definition Framing 协议

Project and Tooling Configuration SHALL 从 Xirang 托管的单一生成源向 Explore skill 与 `.xirang/references/xirang-definition-framing.md` 投影 Definition Framing 规则，SHALL NOT 运行时依赖用户级 `problem-framing` skill 或直接编辑 generated artifacts。

#### Scenario: 刷新 Explore 工作面

- **WHEN** CLI 同步所选 Agent 工具集成
- **THEN** generated Explore skill 引用同版本 Xirang-owned Definition Framing reference

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
