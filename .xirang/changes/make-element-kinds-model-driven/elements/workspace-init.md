---
operation: MODIFIED
entity: element-declaration
identity: workspace-init
kind: element
parent: workspace-init-update
title: Workspace Init
definition: Workspace Init 定义 `xirang setup` 创建完整工作区的行为：创建或保留 `.xirang` durable core、`model/{metamodel,elements,relationships,views}` 四分区 Semantic Model skeleton、changes 与 references、固定 Agent workflow 集合，支持跨平台与 non-interactive 运行，并在成功后暴露 Project Build 引导。Element Contract 与 Element Declaration 共用同一 `elements/` 单元，不存在独立的 Contracts store。
---

## MODIFIED Requirements

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