---
entity: element-declaration
identity: workspace-init
kind: element
parent: workspace-init-update
title: Workspace Init
definition: Workspace Init 定义 `xirang setup` 创建完整工作区的行为：创建或保留 `.xirang` durable core、`model/{metamodel,elements,relationships,views}` 四分区 Semantic Model skeleton、changes 与 references、固定 Agent workflow 集合，支持跨平台与 non-interactive 运行，并在成功后暴露 Project Build 引导。Element Contract 与 Element Declaration 共用同一 `elements/` 单元，不存在独立的 Contracts store。
---

## Requirements

### Requirement: Xirang Setup SHALL 创建可用的 formal skeleton

`xirang setup` SHALL 创建或保留 `.xirang` durable core、project configuration、versioned formal Semantic Model skeleton，且不得声称 Project Build 已完成。Setup SHALL 创建 `.xirang/model/{metamodel,elements,relationships,views}` 四个模型分区、`changes`、`references` 与 Project Root Declaration；无 Requirements 的 optional Element SHALL 作为 `elements/` 中的 declaration-only 单元表达，不得创建 `.xirang/specs`、`contracts` 或其他平行 Contract store。

#### Scenario: 新项目 setup

- **WHEN** project 中不存在 `.xirang/` workspace
- **THEN** setup SHALL 创建 config、`model/{metamodel,elements,relationships,views}` 四分区、changes 与 references
- **AND** SHALL 创建 Project Root Declaration 骨架
- **AND** SHALL NOT 创建独立的 Contracts 目录或平行 Contract store
- **AND** SHALL NOT 从 project evidence 推断 Candidate 语义

#### Scenario: Existing project setup

- **WHEN** `.xirang/` 已存在
- **THEN** setup SHALL 保留 existing formal source、配置和用户内容
- **AND** 仅在用户明确选择工具后刷新 managed Agent surfaces

#### Scenario: First-run skeleton

- **WHEN** `xirang setup` 在没有 Xirang workspace 的项目中运行
- **THEN** SHALL 创建 `model/{metamodel,elements,relationships,views}` 四分区与 seed 单元（`metamodel/project.md`、`elements/project.root.md`）
- **AND** SHALL 创建 Project Root 骨架
- **AND** SHALL NOT 推断 project elements 或 Contracts
- **AND** SHALL NOT 创建 `.c4` 文件或 `.xirang/architecture/`

#### Scenario: 初始化 Semantic Model 结构

- **WHEN** `xirang setup` runs
- **THEN** it SHALL create `model/{metamodel,elements,relationships,views}` 四分区与 `changes`、`changes/archive`、`references` 目录
- **AND** SHALL 使用稳定 Project Root identity
- **AND** MUST NOT 创建 legacy Xirang YAML 文件

#### Scenario: Existing source preservation

- **WHEN** setup 在 existing workspace 中运行
- **THEN** existing model 分区、配置和用户内容 SHALL NOT 被覆盖

### Requirement: Xirang Setup SHALL 安装固定 Agent workflow 集合

`xirang setup` 与 `xirang update` SHALL 安装 fixed workflow set：propose、explore、apply、archive、build 和 snack。Build workflow SHALL 使用 skill name 与 directory `xirang-build`，并 SHALL NOT 生成 slash-command artifacts。

#### Scenario: 安装 Build workflow

- **WHEN** configured tool 支持 skills
- **THEN** setup SHALL 生成 `xirang-build`
- **AND** SHALL NOT 生成退役的 bootstrap workflow

### Requirement: Xirang Setup SHALL 支持跨平台与 non-interactive 运行

Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

#### Scenario: Windows setup

- **WHEN** setup 在 Windows、macOS 或 Linux 上运行
- **THEN** generated workspace paths 与 formal source content 等价
- **AND** filesystem operations SHALL 使用 path-aware APIs

#### Scenario: Non-interactive setup

- **WHEN** setup 在无 prompts 环境中运行
- **THEN** SHALL 要求显式 supported `--tools` value
- **AND** invalid values SHALL 返回 actionable diagnostics

#### Scenario: 跨平台路径处理

- **WHEN** setup runs on POSIX or Windows
- **THEN** filesystem paths SHALL use `path.join()` or `path.resolve()`
- **AND** generated model seed content SHALL 在平台上保持一致

### Requirement: Setup success guidance SHALL 暴露 Project Build

Setup success output SHALL 使用当前工具的 Project Build invocation 引导用户继续语义构建。

#### Scenario: 安装 Project Build workflow

- **WHEN** setup 为工具安装 fixed workflow set
- **THEN** success guidance SHALL 使用该工具的 `xirang-build` invocation
- **AND** SHALL NOT 引用退役的 bootstrap workflow 名称

### Requirement: Setup output messaging

Setup 命令 SHALL 显示清晰的输出，说明生成了什么。

#### Scenario: 显示目标工具

- **WHEN** setup 命令成功运行
- **THEN** 输出包含目标工具名

#### Scenario: 显示生成路径

- **WHEN** setup 命令完成
- **THEN** 输出列出全部生成的 skill 文件路径
- **AND** 列出创建的 workspace 目录（model 四分区、changes、references）

### Requirement: Setup 物化默认结构拆分方法

`xirang setup` SHALL 通过共享 project config default materialization contract 在新工作区配置中写入 `decomposition: { method: c4 }`，并 SHALL 保留 existing workspace 中用户已配置的 `decomposition.method` 或 `decomposition.skill`。

#### Scenario: 新项目获得显式默认方法

- **WHEN** setup 创建新的 `.xirang/config.yaml`
- **THEN** 配置包含 `decomposition.method: c4`
- **AND** 不包含 `decomposition.skill`

#### Scenario: Existing project 保留用户 skill

- **WHEN** existing workspace 配置包含 `decomposition: { skill: project-modeling }`
- **THEN** setup 保留该 mapping
- **AND** 不添加 `method: c4`

#### Scenario: 跨平台 setup 写入相同默认值

- **WHEN** setup 在 Windows、macOS 或 Linux 上创建项目配置
- **THEN** 使用 Node.js path API 定位配置文件
- **AND** 写入语义相同的 `decomposition.method: c4`
