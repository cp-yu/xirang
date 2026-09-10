---
entity: element-declaration
identity: project-config-loading
kind: element
parent: project-config-management
title: Project Config Loading
definition: Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。
---
## MODIFIED Requirements

### Requirement: Materialize functional project config defaults

项目配置层 SHALL 暴露共享的 functional default materialization contract 供磁盘写入使用，使 `xirang setup` 与 `xirang update` 使用相同的项目配置功能性默认值。

#### Scenario: Default materialization includes decomposition, optimization, apply, and git

- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL 包含 `decomposition.method: c4`、`optimization.enabled: true`、`optimization.directionLimit: 3`、`optimization.directionRetries: 2`、`apply.defaultIsolation: ask`、`git.merge.strategy: no-ff` 与 `git.branch.deleteAfterArchive: false`
- **AND** SHALL NOT 包含 `optimization.optRetries`、`git.autoCommit`、退役 convention 字段、`git.commitMessage` 路径默认值或 `git.merge.messageFrom`

#### Scenario: Default materialization excludes non-functional optional fields

- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL NOT 添加 `docLanguage`、`context` 或 `rules`
- **AND** SHALL NOT 添加 `propose` 节点

#### Scenario: Missing-only merge preserves user values

- **WHEN** materialized defaults 被合并进既有 YAML config 文档
- **THEN** merge SHALL 只添加缺失的 mapping keys
- **AND** SHALL NOT 替换既有 `decomposition.method` 或 `decomposition.skill` mapping、scalar 或其他 nested mapping 值
- **AND** SHALL 保留未知顶层与嵌套用户字段

#### Scenario: Cross-platform config path handling

- **WHEN** default materialization reads or writes project config files
- **THEN** it SHALL build paths with Node.js path utilities
- **AND** SHALL preserve the `.yaml` preference and `.yml` fallback behavior consistently across Windows, macOS, and Linux
