---
element: cap.cli.init-opsx-skeleton
---

# init-opsx-skeleton Specification

## Purpose
Define the first-run LikeC4 skeleton and bootstrap-arch guidance emitted by `xirang init`.
## Requirements
### Requirement: Setup SHALL 生成 formal Semantic Model skeleton
首次运行 `xirang setup` 时，SHALL 仅在目标不存在时创建 versioned `.xirang/architecture/` modules 与 empty `.xirang/specs/` directory。

#### Scenario: First-run skeleton
- **WHEN** `xirang setup` 在没有 OPSX workspace 的项目中运行
- **THEN** SHALL 创建 `specification.c4`、`model.c4`、`relations.c4` 和 `views.c4`
- **AND** SHALL 创建 Project Root 与 required metamodel skeleton
- **AND** SHALL NOT 推断 project elements 或 Specs

#### Scenario: Existing source preservation
- **WHEN** setup 在 existing workspace 中运行
- **THEN** existing Architecture 与 Specs SHALL NOT 被覆盖

### Requirement: Setup success guidance SHALL 暴露 Project Build
Setup success output SHALL 使用当前工具的 Project Build invocation 引导用户继续语义构建。

#### Scenario: 安装 Project Build workflow
- **WHEN** setup 为工具安装 fixed workflow set
- **THEN** success guidance SHALL 使用该工具的 `xirang-build` invocation
- **AND** SHALL NOT 引用 `xirang-bootstrap-arch`、`xirang bootstrap` 或 `/xirang:bootstrap`

