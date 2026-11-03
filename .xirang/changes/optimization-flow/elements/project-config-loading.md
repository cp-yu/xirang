---
entity: "element-declaration"
identity: "project-config-loading"
kind: "element"
parent: "project-config-management"
title: "Project Config Loading"
definition: "Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。"
---

## MODIFIED Sections

### Section: Materialize functional project config defaults

项目配置层 SHALL 暴露共享的 functional default materialization contract 供磁盘写入使用，使 `xirang setup` 与 `xirang update` 使用相同的项目配置功能性默认值。

- **Default materialization includes decomposition, optimization, apply, and git**

  - project config defaults 被 materialize 用于磁盘输出
  - materialized defaults SHALL 包含 `decomposition: xirang-semantic-refinement.md`、`optimization.enabled: true`、`apply.defaultIsolation: ask`、`git.merge.strategy: no-ff` 与 `git.branch.deleteAfterArchive: false`
  - SHALL NOT 包含 `optimization.directionLimit`、`optimization.directionRetries`、`optimization.minImpactLevel`、`optimization.optRetries`、`git.autoCommit`、退役 convention 字段、`git.commitMessage` 路径默认值或 `git.merge.messageFrom`

- **Default materialization excludes non-functional optional fields**

  - project config defaults 被 materialize 用于磁盘输出
  - materialized defaults SHALL NOT 添加 `docLanguage`、`context` 或 `rules`
  - SHALL NOT 添加 `propose` 节点

- **Missing-only merge preserves user values**

  - materialized defaults 被合并进既有 YAML config 文档
  - merge SHALL 只添加缺失的 mapping keys
  - SHALL NOT 替换既有 `decomposition` 值（scalar 或 mapping）或其他 nested mapping 值
  - SHALL 保留未知顶层与嵌套用户字段

- **Cross-platform config path handling**

  - default materialization reads or writes project config files
  - it SHALL build paths with Node.js path utilities
  - SHALL preserve the `.yaml` preference and `.yml` fallback behavior consistently across Windows, macOS, and Linux

## ADDED Sections

### Section: 诊断退役优化配置

optimization.directionLimit、optimization.directionRetries 与 optimization.minImpactLevel SHALL 不进入有效配置、默认值或投影；读取残留值时给出字段级明确退役诊断，不静默解释为新控制、不改写磁盘配置或自动迁移，其余有效字段按既有规则处理。optimization.enabled 保留默认 true。

- **旧项目 YAML**：包含任一退役键时报告其路径，投影不包含该值，用户文件字节不变；新 setup/update 默认物化只添加 enabled，不自动删除已有键。Windows、macOS、Linux 的 .yaml/.yml 使用同一诊断规则。
