---
entity: "element-declaration"
identity: "project-config-loading"
kind: "element"
parent: "project-config-management"
title: "Project Config Loading"
definition: "Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: Materialize functional project config defaults
项目配置层 SHALL 暴露共享的 functional default materialization contract 供磁盘写入使用，使 `xirang setup` 与 `xirang update` 使用相同的项目配置功能性默认值。

#### Scenario: Default materialization includes decomposition, optimization, apply, and git
- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL 包含 `decomposition: xirang-semantic-refinement.md`、`optimization.enabled: true`、`optimization.directionLimit: 3`、`optimization.directionRetries: 2`、`apply.defaultIsolation: ask`、`git.merge.strategy: no-ff` 与 `git.branch.deleteAfterArchive: false`
- **AND** SHALL NOT 包含 `optimization.optRetries`、`git.autoCommit`、退役 convention 字段、`git.commitMessage` 路径默认值或 `git.merge.messageFrom`

#### Scenario: Default materialization excludes non-functional optional fields
- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL NOT 添加 `docLanguage`、`context` 或 `rules`
- **AND** SHALL NOT 添加 `propose` 节点

#### Scenario: Missing-only merge preserves user values
- **WHEN** materialized defaults 被合并进既有 YAML config 文档
- **THEN** merge SHALL 只添加缺失的 mapping keys
- **AND** SHALL NOT 替换既有 `decomposition` 值（scalar 或 mapping）或其他 nested mapping 值
- **AND** SHALL 保留未知顶层与嵌套用户字段

#### Scenario: Cross-platform config path handling
- **WHEN** default materialization reads or writes project config files
- **THEN** it SHALL build paths with Node.js path utilities
- **AND** SHALL preserve the `.yaml` preference and `.yml` fallback behavior consistently across Windows, macOS, and Linux

### Requirement: 加载结构拆分配置
项目配置加载器 SHALL 将顶层 `decomposition` 解析为单个非空字符串，并由 CLI 机械解析为指导文件路径：值包含 `/` 时 SHALL 作为项目根相对路径原样保留；否则 SHALL 作为裸名称解析为 `.xirang/references/<值>`，值不以 `.md` 结尾时补 `.md`。路径形态 SHALL 拒绝 posix 与 win32 绝对路径、反斜杠与 `..` 穿越；裸名称 SHALL 限于 `[A-Za-z0-9._-]+`。加载器 SHALL NOT 维护方法名单、解释方法论内容或检查文件存在性；指导文件不可读时由消费端 fail-closed。

#### Scenario: 路径形态原样保留
- **WHEN** config 包含 `decomposition: .pi/skills/xirang-project-decomposition/SKILL.md`
- **THEN** ProjectConfig 与 normalized projection 保留该项目根相对路径
- **AND** CLI 不解释该文件内容或其所属工具目录

#### Scenario: 裸名称解析到共享指导目录
- **WHEN** config 包含 `decomposition: c4`
- **THEN** normalized 解析结果为 `.xirang/references/c4.md`
- **AND** CLI 不附加任何方法论内容

#### Scenario: 带扩展名裸名不重复补后缀
- **WHEN** config 包含 `decomposition: xirang-semantic-refinement.md`
- **THEN** normalized 解析结果为 `.xirang/references/xirang-semantic-refinement.md`
- **AND** 解析结果不出现重复的 `.md` 后缀

#### Scenario: 字段缺失时使用默认指导文件
- **WHEN** config 不包含 `decomposition`
- **THEN** 有效项目配置使用 `xirang-semantic-refinement.md` 作为功能性默认值
- **AND** normalized 解析结果为 `.xirang/references/xirang-semantic-refinement.md`

#### Scenario: 非法值不回退默认
- **WHEN** `decomposition` 为非字符串值、空串、绝对路径、包含反斜杠或 `..` 穿越，或裸名称包含 `[A-Za-z0-9._-]` 之外的字符
- **THEN** 加载器对该字段输出 warning 并从返回配置中省略 `decomposition`
- **AND** SHALL NOT 回退为默认指导文件
- **AND** 其他有效配置字段继续返回

#### Scenario: yaml 与 yml 使用相同结构拆分语义
- **WHEN** 项目在 Windows、macOS 或 Linux 上从 `.xirang/config.yaml` 或其 `.yml` alias 加载有效 `decomposition`
- **THEN** 加载器通过现有 Node.js path 解析规则返回相同指导文件路径
