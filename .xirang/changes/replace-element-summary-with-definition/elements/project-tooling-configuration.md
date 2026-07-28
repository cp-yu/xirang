---
entity: element-declaration
identity: project-tooling-configuration
kind: capability
parent: cli
title: Project and Tooling Configuration
definition: 建立和维护工作区、项目配置与所选 Agent 工具集成。
---

## MODIFIED Requirements

### Requirement: 投影共享 Element Contract 语义
Project and Tooling Configuration SHALL 从单一共享 authoring fragment 向 `xirang-build`、`xirang-explore`、`xirang-propose` 与 `xirang-snack` 投影 Element Definition 与 Element Contract 的边界及写作规则，SHALL NOT 为这些工作面维护相互独立的定义副本。

#### Scenario: 刷新 Agent 工作面
- **WHEN** CLI 生成或更新 Build、Explore、Propose 与 Snack skills
- **THEN** 四个工作面消费一致的 Definition authoring contract，且存储记法仍由独立 notation fragment 提供

## ADDED Requirements

### Requirement: 以 Project Definition 初始化根 Element
Project and Tooling Configuration SHALL 在建立新 Xirang 工作区时收集 Project Definition，并以该完整 Definition 初始化 Project Root Declaration，SHALL NOT 将紧凑 summary 作为根 Element 的规范性概念表述。

#### Scenario: 跨平台初始化项目
- **WHEN** 用户在 macOS、Linux 或 Windows 上建立新项目
- **THEN** CLI 通过平台路径 API 写入包含 `definition` 的 Project Root 单元，且结果不依赖路径分隔符
