---
entity: element-declaration
identity: project-config-loading
kind: element
parent: project-config-management
title: Project Config Loading
definition: Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。
---

## ADDED Requirements

### Requirement: 加载结构拆分配置

项目配置加载器 SHALL 将顶层 `decomposition` 解析为恰有一个分支的 tagged union：`{ method: string }` 或 `{ skill: string }`；两个值均 SHALL 在 trim 后非空。`method` SHALL 作为 opaque 名称保留，加载器 SHALL NOT 维护方法名单、解释或展开方法论；`skill` SHALL 作为逻辑 skill 名称保留，加载器 SHALL NOT 检查工具安装状态。

#### Scenario: 加载方法名

- **WHEN** config 包含 `decomposition: { method: c4 }`
- **THEN** ProjectConfig 与 normalized projection 保留 `{ method: "c4" }`
- **AND** CLI 不附加 C4 方法论内容

#### Scenario: 加载 skill 名

- **WHEN** config 包含 `decomposition: { skill: xirang-project-decomposition }`
- **THEN** ProjectConfig 与 normalized projection 保留该逻辑 skill 名称
- **AND** config loading 不检查任一工具目录中的 skill 文件

#### Scenario: 字段缺失时使用默认方法

- **WHEN** config 不包含 `decomposition`
- **THEN** 有效项目配置使用 `{ method: "c4" }` 作为功能性默认值

#### Scenario: 非法 tagged union 不回退默认方法

- **WHEN** `decomposition` 同时包含 `method` 与 `skill`、两个分支都缺失、包含未知子键或所选值 trim 后为空
- **THEN** 加载器对该字段输出 warning 并从返回配置中省略 `decomposition`
- **AND** SHALL NOT 将该非法字段回退为 `{ method: "c4" }`
- **AND** 其他有效配置字段继续返回

#### Scenario: yaml 与 yml 使用相同结构拆分语义

- **WHEN** 项目在 Windows、macOS 或 Linux 上从 `.xirang/config.yaml` 或其 `.yml` alias 加载有效 `decomposition`
- **THEN** 加载器通过现有 Node.js path 解析规则返回相同 tagged union

## MODIFIED Requirements

### Requirement: Materialize functional project config defaults

项目配置层 SHALL 暴露共享的 functional default materialization contract 供磁盘写入使用，使 `xirang setup` 与 `xirang update` 使用相同的项目配置功能性默认值。

#### Scenario: Default materialization includes decomposition, optimization, apply, and git

- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL 包含 `decomposition.method: c4`、`optimization.enabled: true`、`optimization.optRetries: 2`、`apply.defaultIsolation: ask`、`git.merge.strategy: no-ff` 与 `git.branch.deleteAfterArchive: false`
- **AND** SHALL NOT 包含 `git.autoCommit`、退役 convention 字段、`git.commitMessage` 路径默认值或 `git.merge.messageFrom`

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
