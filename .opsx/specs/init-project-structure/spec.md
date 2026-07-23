---
element: project.root/domain.cli/cap.cli.project-setup
---

# init-project-structure Specification

## Purpose
Define the reviewed Project Setup and Update contract for init SHALL 生成 LikeC4 架构目录.
## Requirements
### Requirement: setup SHALL 生成 LikeC4 架构目录
`opsx setup` SHALL 创建 versioned formal Semantic Model skeleton，其中包含 LikeC4 graph modules、一个 Project Root、metamodel relationship kinds、views 和 empty Specs directory。

#### Scenario: 初始化 Semantic Model 结构
- **WHEN** `opsx setup` runs
- **THEN** it SHALL create `.opsx/architecture/`, `.opsx/specs/`, and the canonical graph module files
- **AND** SHALL use an explicit language version and stable Project Root identity
- **AND** MUST NOT create legacy OPSX YAML files

#### Scenario: 跨平台路径处理
- **WHEN** setup runs on POSIX or Windows
- **THEN** filesystem paths SHALL use `path.join()` or `path.resolve()`
- **AND** generated LikeC4 content SHALL use canonical DSL references

