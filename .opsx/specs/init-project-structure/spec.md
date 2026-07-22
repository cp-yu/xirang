---
element: project.root/domain.cli/cap.cli.project-setup
---

# init-project-structure Specification

## Purpose
Define the reviewed Project Setup and Update contract for init SHALL 生成 LikeC4 架构目录.

## Requirements
### Requirement: init SHALL 生成 LikeC4 架构目录

`opsx init` SHALL 创建新版 OPSX Semantic Model skeleton：LikeC4 graph modules、Project Root、versioned Metamodel、views 与空 Specs directory。它 MUST NOT 创建 legacy OPSX YAML files。

#### Scenario: 初始化 Semantic Model 结构
- **WHEN** 运行 `opsx init`
- **THEN** SHALL 创建 `.opsx/architecture/`、`.opsx/specs/` 与所需 graph module files
- **AND** SHALL 使用显式常量清单生成 `specification.c4`、Project Root module、`relations.c4` 与 `views.c4`
- **AND** MUST NOT 创建 `.opsx/project.opsx.yaml` 或 `.opsx/project.opsx.relations.yaml`

#### Scenario: specification 模板内容
- **WHEN** init 生成新版 Metamodel
- **THEN** SHALL 声明受支持 language version
- **AND** SHALL 定义唯一 root project kind 与 required Project Contract policy
- **AND** SHALL 提供默认 semantic relationship kinds：`invokes`、`produces`、`consumes`、`precedes`、`constrains`、`validates`
- **AND** MUST NOT 定义 persisted `belongs_to` relationship

#### Scenario: Project Root 模板内容
- **WHEN** init 生成 Project Root
- **THEN** root SHALL 包含唯一 stable `elementId`、title 与 non-empty summary placeholder
- **AND** SHALL 无 parent

#### Scenario: views 模板内容
- **WHEN** init 生成 views
- **THEN** SHALL 包含基础 index view
- **AND** SHALL 从 Project Root 提供逐层 refinement navigation

#### Scenario: 跨平台路径处理
- **WHEN** init 在 POSIX 或 Windows 创建目录和文件
- **THEN** 所有 filesystem paths SHALL 使用 `path.join()` 或 `path.resolve()`
- **AND** generated LikeC4 references SHALL 使用 DSL 所需 canonical path representation
