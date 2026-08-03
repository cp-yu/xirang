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
