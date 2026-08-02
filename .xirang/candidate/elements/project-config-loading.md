---
entity: element-declaration
identity: project-config-loading
kind: capability
parent: project-config-management
title: Project Config Loading
definition: Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。
---

## Requirements

### Requirement: Load project config from .xirang/config.yaml

系统 SHALL 读取并解析位于 `.xirang/config.yaml` 的项目配置文件，包括 `proseLanguage` 和 `docLanguage` 字段，其中 `proseLanguage` 优先。

#### Scenario: Valid config file exists

- **WHEN** `.xirang/config.yaml` 存在且包含有效 YAML 内容
- **THEN** 系统解析文件并返回 ProjectConfig 对象

#### Scenario: Config file does not exist

- **WHEN** `.xirang/config.yaml` 不存在
- **THEN** 系统返回 null，不报错

#### Scenario: Config file has invalid YAML syntax

- **WHEN** `.xirang/config.yaml` 包含格式错误的 YAML
- **THEN** 系统记录警告信息并返回 null

#### Scenario: proseLanguage field is valid

- **WHEN** config 包含 `proseLanguage: "中文"`
- **THEN** proseLanguage 字段包含在返回的配置中

#### Scenario: docLanguage field is valid (legacy)

- **WHEN** config 包含 `docLanguage: "zh-CN"` 且不包含 `proseLanguage`
- **THEN** 系统将 `docLanguage` 值迁移到 `proseLanguage` 字段

#### Scenario: Config path uses .xirang on all platforms

- **WHEN** 系统在 Windows、macOS 或 Linux 查找项目配置
- **THEN** 系统 SHALL 使用 `path.join(projectRoot, '.xirang', 'config.yaml')` 构建路径
- **AND** SHALL NOT 硬编码斜杠分隔符
#### Scenario: Config file has valid YAML but invalid schema
- **WHEN** `.xirang/config.yaml` 包含有效 YAML 但 Zod schema 验证失败
- **THEN** 系统记录带验证详情的警告信息并返回 null
#### Scenario: proseLanguage field is missing
- **WHEN** config 不包含 `proseLanguage` 和 `docLanguage`
- **THEN** 返回的配置中不包含 proseLanguage 覆盖
#### Scenario: Both proseLanguage and docLanguage are present
- **WHEN** config 同时包含 `proseLanguage: "中文"` 和 `docLanguage: "zh-CN"`
- **THEN** `proseLanguage` 优先，`docLanguage` 被忽略
### Requirement: Support .yml file extension alias

系统 SHALL 同时接受 `.yaml` 与 `.yml` 扩展名。

#### Scenario: Config file uses .yml extension
- **WHEN** `.xirang/config.yml` 存在且 `.xirang/config.yaml` 不存在
- **THEN** 系统从 `.xirang/config.yml` 读取

#### Scenario: Both .yaml and .yml exist
- **WHEN** 两个文件都存在
- **THEN** 系统优先 `.xirang/config.yaml`

### Requirement: Use resilient field-by-field parsing

系统 SHALL 逐字段独立解析配置，收集有效字段并对无效字段告警，而不整体拒绝配置。

#### Scenario: Schema field is valid
- **WHEN** config 包含 `schema: "spec-driven"`
- **THEN** schema field 包含在返回配置中

#### Scenario: Schema field is invalid type
- **WHEN** config 包含 `schema: 123`（数字而非字符串）
- **THEN** 记录警告且 schema field 不包含在返回配置中

#### Scenario: Context field is valid
- **WHEN** config 包含 `context: "Tech stack: TypeScript"`
- **THEN** context field 包含在返回配置中

#### Scenario: Rules 字段结构合法
- **WHEN** config 包含 `rules: { proposal: ["Rule 1"], specs: ["Rule 2"] }`
- **THEN** rules field 包含在返回配置中且规则合法

#### Scenario: Rules 字段非数组值
- **WHEN** config 包含 `rules: { proposal: "not an array", specs: ["Valid"] }`
- **THEN** 对 proposal 记录 warning，specs 的规则仍包含在返回配置中

#### Scenario: Rules 数组含非字符串元素
- **WHEN** config 包含 `rules: { proposal: ["Valid rule", 123, ""] }`
- **THEN** 只保留 "Valid rule"，对无效元素记录 warning

#### Scenario: 有效与无效字段混合
- **WHEN** config 含有效 schema、无效 context 类型与有效 rules
- **THEN** 返回配置包含 schema 与 rules 字段，并对 context 记录 warning
#### Scenario: Schema field is missing
- **WHEN** config 缺少 `schema` 字段
- **THEN** 不记录 warning（该字段在解析层可选）
#### Scenario: docLanguage field is missing
- **WHEN** config 缺少 `docLanguage` 字段
- **THEN** 不记录 warning 且返回配置不包含文档语言覆盖
#### Scenario: Schema field is empty string
- **WHEN** config contains `schema: ""`
- **THEN** warning is logged and schema field is not included in returned config
#### Scenario: proseLanguage field is invalid type
- **WHEN** config 包含 `proseLanguage: 123`（数字而非字符串）
- **THEN** 记录警告，proseLanguage 字段不包含在返回的配置中
#### Scenario: Context field is invalid type
- **WHEN** config contains `context: 123` (number instead of string)
- **THEN** warning is logged and context field is not included in returned config
#### Scenario: docLanguage field is invalid type
- **WHEN** config contains `docLanguage: 123` (number instead of string)
- **THEN** warning is logged and docLanguage field is not included in returned config
#### Scenario: Rules field has non-array value for artifact
- **WHEN** config contains `rules: { proposal: "not an array", specs: ["Valid"] }`
- **THEN** warning is logged for proposal, but specs rules are still included in returned config
#### Scenario: Rules array contains non-string elements
- **WHEN** config contains `rules: { proposal: ["Valid rule", 123, ""] }`
- **THEN** only "Valid rule" is included, warning logged about invalid elements
#### Scenario: Mix of valid and invalid fields
- **WHEN** config contains valid schema, invalid context type, valid rules
- **THEN** config is returned with schema and rules fields, warning logged about context
#### Scenario: docLanguage field is valid（字段解析）
- **WHEN** config 包含 `docLanguage: "zh-CN"`
- **THEN** docLanguage field 包含在返回配置中
### Requirement: Enforce context size limit

系统 SHALL 拒绝超过 50KB 的 context 字段并记录 warning。

#### Scenario: Context within size limit
- **WHEN** config 包含 1KB 的 context
- **THEN** context 包含在返回配置中

#### Scenario: Context at size limit
- **WHEN** config 包含恰好 50KB 的 context
- **THEN** context 包含在返回配置中

#### Scenario: Context exceeds size limit
- **WHEN** config 包含 51KB 的 context
- **THEN** 记录含 size 与 limit 的 warning，context 字段不包含在返回配置中

### Requirement: Defer artifact ID validation to instruction loading

系统 SHALL NOT 在 config 加载时校验 rules 中的 artifact IDs；校验发生在 schema 已知的 instruction 加载阶段。

#### Scenario: Config with rules is loaded
- **WHEN** config 包含 `rules: { unknownartifact: [...] }`
- **THEN** config 被成功加载且无 validation errors

#### Scenario: Validation happens at instruction load time
- **WHEN** instructions 为任意 artifact 加载且 config 的 rules 含未知 artifact IDs
- **THEN** 在 instruction 加载时发出未知 artifact ID warnings

### Requirement: Gracefully handle config errors without halting

系统 SHALL 在 config 加载或解析失败时以默认值继续运行。

#### Scenario: Config parse failure during command execution
- **WHEN** config 文件有语法错误且用户运行 `xirang new change`
- **THEN** 命令使用默认 schema 执行

#### Scenario: Warning is visible to user
- **WHEN** config loading 失败
- **THEN** 系统向 stderr 输出含失败详情的 warning message

### Requirement: Project config SHALL expose normalized inputs for projection consumers
`.xirang/config.yaml` 的已验证字段 SHALL 以稳定、可组合的形式暴露给配置投影层，使 prompt projection 与 runtime projection 共享同一份 source-of-truth 输入，而不是各自重新读取和解释原始 YAML。

#### Scenario: Valid fields become projection inputs
- **WHEN** project config 含有效 `docLanguage`、`context` 或 `rules`
- **THEN** config loading SHALL 将这些字段作为 normalized projection inputs 暴露
- **AND** downstream prompt/runtime projection consumers SHALL 观察到相同的已验证值

#### Scenario: Invalid fields do not leak into projection
- **WHEN** config 字段未通过校验
- **THEN** config loading SHALL 将该字段从 projection inputs 中排除
- **AND** projection consumers SHALL 以其余有效字段与默认行为继续

### Requirement: 加载 git 配置节点

`.xirang/config.yaml` 的项目配置加载器 SHALL 解析顶层 `git` 节点，并支持 `commitMessage.boundary`、`commitMessage.archive`、`commitMessage.merge`、`merge.strategy`、`branch.deleteAfterArchive` 字段。`commitMessage.*` 三个字段 SHALL 为可选的项目根相对 POSIX 路径，指向用户自有 commit message 模板，无默认值。

#### Scenario: 完整 git 节点

- **WHEN** config 包含完整的 `git` 节点（commitMessage、merge.strategy、branch.deleteAfterArchive）
- **THEN** 加载器 SHALL 返回的 ProjectConfig 中包含完整 `git` 字段
- **AND** `commitMessage.archive` 与 `commitMessage.merge` SHALL 保留配置的路径值

#### Scenario: git 节点缺失时填默认值

- **WHEN** config 不含 `git` 节点
- **THEN** 加载器 SHALL 把 `git.merge.strategy` 默认为 `no-ff`
- **AND** SHALL 把 `git.branch.deleteAfterArchive` 默认为 `false`
- **AND** `git.commitMessage` 下 SHALL NOT 出现任何默认路径值

#### Scenario: 陈旧 messageFrom 字段被忽略

- **WHEN** config 包含 `git.merge.messageFrom`
- **THEN** 加载器 SHALL NOT 将 `messageFrom` 暴露到 ProjectConfig
#### Scenario: 部分字段缺失时混合默认值
- **WHEN** config 仅含 `git: { merge: { strategy: ff-only } }`
- **THEN** 加载器 SHALL 保留 `merge.strategy: ff-only`
- **AND** SHALL 把 `branch.deleteAfterArchive` 默认为 `false`
- **AND** `commitMessage` 下 SHALL NOT 出现任何默认路径值
### Requirement: git 配置字段 Zod schema 校验

加载器 SHALL 通过 Zod schema 校验 `git` 节点字段类型与取值，并对非法值输出 warning 后丢弃该字段、回退默认行为。对已删除的 `git.autoCommit`、`git.archive.commitMessage.convention`、`git.merge.commitMessage.convention` 残留字段，加载器 SHALL 输出废弃 warning 且不将其暴露到 ProjectConfig。

#### Scenario: 残留 autoCommit 字段输出废弃 warning

- **WHEN** config 包含 `git.autoCommit: manual`
- **THEN** 加载器 SHALL 输出 warning 指明 `git.autoCommit` 已废弃
- **AND** SHALL NOT 将 `autoCommit` 暴露到 ProjectConfig
- **AND** SHALL 保留 config 中其他合法字段

#### Scenario: commitMessage 路径非法值

- **WHEN** `git.commitMessage.archive` 为绝对路径、包含 `..` 上溯、使用反斜杠分隔、或非字符串类型
- **THEN** 加载器 SHALL 输出 warning 指明该路径非法
- **AND** SHALL 丢弃该字段
- **AND** SHALL 保留 config 中其他合法字段

#### Scenario: merge.strategy 非法值

- **WHEN** `git.merge.strategy` 为 `rebase`（不在枚举中）
- **THEN** 加载器 SHALL 输出 warning 并把 `merge.strategy` 回退为默认 `no-ff`
- **AND** SHALL 保留 config 中其他合法字段

#### Scenario: deleteAfterArchive 类型校验

- **WHEN** `git.branch.deleteAfterArchive` 为 `"true"` 字符串而非布尔
- **THEN** 加载器 SHALL 输出 warning 并回退为默认 `false`
#### Scenario: 残留 convention 字段输出废弃 warning
- **WHEN** config 包含 `git.archive.commitMessage.convention` 或 `git.merge.commitMessage.convention`
- **THEN** 加载器 SHALL 输出 warning 指明 convention 字段已废弃、模板由 `.xirang/references/` 与 `git.commitMessage.*` 路径覆盖决定
- **AND** SHALL NOT 将 convention 字段暴露到 ProjectConfig
#### Scenario: commitMessage 路径合法值
- **WHEN** `git.commitMessage.boundary`、`git.commitMessage.archive` 或 `git.commitMessage.merge` 为项目根相对 POSIX 路径字符串
- **THEN** schema SHALL 接受该值
#### Scenario: merge.strategy 合法值
- **WHEN** `git.merge.strategy` 为 `no-ff`、`ff-only` 或 `squash`
- **THEN** schema SHALL 接受该值
### Requirement: git 配置暴露给 projection 消费者

加载器 SHALL 把 `git` 节点（含填充后的默认值）作为 normalized projection 输入暴露给 prompt projection 与 runtime projection 消费者。archive skill/agent SHALL 把 `commitMessage.*` 路径用于 commit message 模板路由，把 `merge.strategy` 与 `branch.deleteAfterArchive` 用于归档后的 git 工作流。

#### Scenario: projection 输入包含 git 节点

- **WHEN** 项目配置加载完成
- **THEN** projection 输入 SHALL 包含 `git.commitMessage.boundary`、`git.commitMessage.archive`、`git.commitMessage.merge`（未配置的键值为空）、`git.merge.strategy`、`git.branch.deleteAfterArchive`
- **AND** projection 输入 SHALL NOT 包含 `git.autoCommit`、退役 convention 字段或 `git.merge.messageFrom`
#### Scenario: archive prompt projection 投出 git 段
- **WHEN** archive surface 请求 prompt projection
- **THEN** projection SHALL 把 `git` 段渲染为 archive skill 可消费的指令片段
- **AND** SHALL 保留字段名与路径值的 canonical 形式
- **AND** SHALL 表达 `commitMessage.*` 已配置时读用户模板、未配置时读 `.xirang/references/` 内置模板的路由语义
### Requirement: 跨平台路径与默认值

加载器 SHALL 在 Windows、macOS、Linux 上对 `git` 配置节点行为一致，且 `branch.deleteAfterArchive` 不依赖任何平台特定 git 行为。

#### Scenario: Windows 上读取 git 节点

- **WHEN** 在 Windows 上加载项目配置
- **THEN** 加载器 SHALL 通过 `path.join()` 构建路径
- **AND** SHALL 与 Unix 系统返回相同结构的 `git` 配置对象

### Requirement: Materialize functional project config defaults

项目配置层 SHALL 暴露共享的 functional default materialization contract 供磁盘写入使用，使 `xirang setup` 与 `xirang update` 使用相同的项目配置功能性默认值。

#### Scenario: Default materialization includes optimization, apply, and git

- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL 包含 `optimization.enabled: true`、`optimization.optRetries: 2`、`apply.defaultIsolation: ask`、`git.merge.strategy: no-ff` 与 `git.branch.deleteAfterArchive: false`
- **AND** SHALL NOT 包含 `git.autoCommit`、退役 convention 字段、`git.commitMessage` 路径默认值或 `git.merge.messageFrom`

#### Scenario: Default materialization excludes non-functional optional fields

- **WHEN** project config defaults 被 materialize 用于磁盘输出
- **THEN** materialized defaults SHALL NOT 添加 `docLanguage`、`context` 或 `rules`
- **AND** SHALL NOT 添加 `propose` 节点

#### Scenario: Missing-only merge preserves user values

- **WHEN** materialized defaults 被合并进既有 YAML config 文档
- **THEN** merge SHALL 只添加缺失的 mapping keys
- **AND** SHALL NOT 替换既有 scalar 或 nested mapping 值
- **AND** SHALL 保留未知顶层与嵌套用户字段
#### Scenario: Cross-platform config path handling
- **WHEN** default materialization reads or writes project config files
- **THEN** it SHALL build paths with Node.js path utilities
- **AND** SHALL preserve the `.yaml` preference and `.yml` fallback behavior consistently across Windows, macOS, and Linux
### Requirement: Project config 静默忽略退役的 Propose routing 配置

Project config loader SHALL 将顶层 `propose` routing 节点视为退役配置。它 MUST NOT 将 `propose.smartRouting`、`propose.requireExplore` 或整个 `propose` 节点暴露到 ProjectConfig、normalized config 或 config projection，且 MUST NOT 因这些退役字段输出 warning 或改写用户配置文件。

#### Scenario: 旧 Propose routing 节点静默忽略
- **WHEN** `.xirang/config.yaml` 包含 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** loader SHALL 继续解析其他有效字段
- **AND** 返回的 ProjectConfig SHALL NOT 包含 `propose`
- **AND** SHALL NOT 输出退役或非法字段 warning
- **AND** SHALL NOT 修改 `.xirang/config.yaml`

#### Scenario: 退役节点不进入 projection
- **WHEN** project config 包含旧 `propose` 节点
- **THEN** NormalizedProjectConfig 与 artifact instructions 的 configProjection SHALL NOT 包含 `propose`
- **AND** Propose workflow behavior SHALL NOT 受该节点影响
