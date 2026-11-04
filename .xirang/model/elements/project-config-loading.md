---
entity: element-declaration
identity: project-config-loading
kind: element
parent: project-config-management
title: Project Config Loading
definition: Project Config Loading 定义 `.xirang/config.yaml` 的发现、解析、校验与安全回退行为：支持 `.yml` 别名、`proseLanguage` 优先、resilient field-by-field 解析、context 大小限制、git 配置节点加载与校验、normalized projection 输入暴露，以及退役配置节点的静默忽略。
---

## Specification

### Section: Load project config from .xirang/config.yaml

系统 SHALL 读取并解析位于 `.xirang/config.yaml` 的项目配置文件，包括 `proseLanguage` 和 `docLanguage` 字段，其中 `proseLanguage` 优先。

- **Valid config file exists**

  - `.xirang/config.yaml` 存在且包含有效 YAML 内容
  - 系统解析文件并返回 ProjectConfig 对象

- **Config file does not exist**

  - `.xirang/config.yaml` 不存在
  - 系统返回 null，不报错

- **Config file has invalid YAML syntax**

  - `.xirang/config.yaml` 包含格式错误的 YAML
  - 系统记录警告信息并返回 null

- **proseLanguage field is valid**

  - config 包含 `proseLanguage: "中文"`
  - proseLanguage 字段包含在返回的配置中

- **docLanguage field is valid (legacy)**

  - config 包含 `docLanguage: "zh-CN"` 且不包含 `proseLanguage`
  - 系统将 `docLanguage` 值迁移到 `proseLanguage` 字段

- **Config path uses .xirang on all platforms**

  - 系统在 Windows、macOS 或 Linux 查找项目配置
  - 系统 SHALL 使用 `path.join(projectRoot, '.xirang', 'config.yaml')` 构建路径
  - SHALL NOT 硬编码斜杠分隔符

- **Config file has valid YAML but invalid schema**

  - `.xirang/config.yaml` 包含有效 YAML 但 Zod schema 验证失败
  - 系统记录带验证详情的警告信息并返回 null

- **proseLanguage field is missing**

  - config 不包含 `proseLanguage` 和 `docLanguage`
  - 返回的配置中不包含 proseLanguage 覆盖

- **Both proseLanguage and docLanguage are present**

  - config 同时包含 `proseLanguage: "中文"` 和 `docLanguage: "zh-CN"`
  - `proseLanguage` 优先，`docLanguage` 被忽略

### Section: Support .yml file extension alias

系统 SHALL 同时接受 `.yaml` 与 `.yml` 扩展名。

- **Config file uses .yml extension**

  - `.xirang/config.yml` 存在且 `.xirang/config.yaml` 不存在
  - 系统从 `.xirang/config.yml` 读取

- **Both .yaml and .yml exist**

  - 两个文件都存在
  - 系统优先 `.xirang/config.yaml`

### Section: Use resilient field-by-field parsing

系统 SHALL 逐字段独立解析配置，收集有效字段并对无效字段告警，而不整体拒绝配置。

- **Schema field is valid**

  - config 包含 `schema: "semantic-model"`
  - schema field 包含在返回配置中

- **Schema field is invalid type**

  - config 包含 `schema: 123`（数字而非字符串）
  - 记录警告且 schema field 不包含在返回配置中

- **Context field is valid**

  - config 包含 `context: "Tech stack: TypeScript"`
  - context field 包含在返回配置中

- **Rules 字段结构合法**

  - config 包含 `rules: { proposal: ["Rule 1"], specs: ["Rule 2"] }`
  - rules field 包含在返回配置中且规则合法

- **Rules 字段非数组值**

  - config 包含 `rules: { proposal: "not an array", specs: ["Valid"] }`
  - 对 proposal 记录 warning，specs 的规则仍包含在返回配置中

- **Rules 数组含非字符串元素**

  - config 包含 `rules: { proposal: ["Valid rule", 123, ""] }`
  - 只保留 "Valid rule"，对无效元素记录 warning

- **有效与无效字段混合**

  - config 含有效 schema、无效 context 类型与有效 rules
  - 返回配置包含 schema 与 rules 字段，并对 context 记录 warning

- **Schema field is missing**

  - config 缺少 `schema` 字段
  - 不记录 warning（该字段在解析层可选）

- **docLanguage field is missing**

  - config 缺少 `docLanguage` 字段
  - 不记录 warning 且返回配置不包含文档语言覆盖

- **Schema field is empty string**

  - config contains `schema: ""`
  - warning is logged and schema field is not included in returned config

- **proseLanguage field is invalid type**

  - config 包含 `proseLanguage: 123`（数字而非字符串）
  - 记录警告，proseLanguage 字段不包含在返回的配置中

- **Context field is invalid type**

  - config contains `context: 123` (number instead of string)
  - warning is logged and context field is not included in returned config

- **docLanguage field is invalid type**

  - config contains `docLanguage: 123` (number instead of string)
  - warning is logged and docLanguage field is not included in returned config

- **Rules field has non-array value for artifact**

  - config contains `rules: { proposal: "not an array", specs: ["Valid"] }`
  - warning is logged for proposal, but specs rules are still included in returned config

- **Rules array contains non-string elements**

  - config contains `rules: { proposal: ["Valid rule", 123, ""] }`
  - only "Valid rule" is included, warning logged about invalid elements

- **Mix of valid and invalid fields**

  - config contains valid schema, invalid context type, valid rules
  - config is returned with schema and rules fields, warning logged about context

- **docLanguage field is valid（字段解析）**

  - config 包含 `docLanguage: "zh-CN"`
  - docLanguage field 包含在返回配置中

### Section: Enforce context size limit

系统 SHALL 拒绝超过 50KB 的 context 字段并记录 warning。

- **Context within size limit**

  - config 包含 1KB 的 context
  - context 包含在返回配置中

- **Context at size limit**

  - config 包含恰好 50KB 的 context
  - context 包含在返回配置中

- **Context exceeds size limit**

  - config 包含 51KB 的 context
  - 记录含 size 与 limit 的 warning，context 字段不包含在返回配置中

### Section: Defer artifact ID validation to instruction loading

系统 SHALL NOT 在 config 加载时校验 rules 中的 artifact IDs；校验发生在 schema 已知的 instruction 加载阶段。

- **Config with rules is loaded**

  - config 包含 `rules: { unknownartifact: [...] }`
  - config 被成功加载且无 validation errors

- **Validation happens at instruction load time**

  - instructions 为任意 artifact 加载且 config 的 rules 含未知 artifact IDs
  - 在 instruction 加载时发出未知 artifact ID warnings

### Section: Gracefully handle config errors without halting

系统 SHALL 在 config 加载或解析失败时以默认值继续运行。

- **Config parse failure during command execution**

  - config 文件有语法错误且用户运行 `xirang new change`
  - 命令使用默认 schema 执行

- **Warning is visible to user**

  - config loading 失败
  - 系统向 stderr 输出含失败详情的 warning message

### Section: Project config SHALL expose normalized inputs for projection consumers

`.xirang/config.yaml` 的已验证字段 SHALL 以稳定、可组合的形式暴露给配置投影层，使 prompt projection 与 runtime projection 共享同一份 source-of-truth 输入，而不是各自重新读取和解释原始 YAML。

- **Valid fields become projection inputs**

  - project config 含有效 `docLanguage`、`context` 或 `rules`
  - config loading SHALL 将这些字段作为 normalized projection inputs 暴露
  - downstream prompt/runtime projection consumers SHALL 观察到相同的已验证值

- **Invalid fields do not leak into projection**

  - config 字段未通过校验
  - config loading SHALL 将该字段从 projection inputs 中排除
  - projection consumers SHALL 以其余有效字段与默认行为继续

### Section: 加载 git 配置节点

`.xirang/config.yaml` 的项目配置加载器 SHALL 解析顶层 `git` 节点，并支持 `commitMessage.boundary`、`commitMessage.archive`、`commitMessage.merge`、`merge.strategy`、`branch.deleteAfterArchive` 字段。`commitMessage.*` 三个字段 SHALL 为可选的项目根相对 POSIX 路径，指向用户自有 commit message 模板，无默认值。

- **完整 git 节点**

  - config 包含完整的 `git` 节点（commitMessage、merge.strategy、branch.deleteAfterArchive）
  - 加载器 SHALL 返回的 ProjectConfig 中包含完整 `git` 字段
  - `commitMessage.archive` 与 `commitMessage.merge` SHALL 保留配置的路径值

- **git 节点缺失时填默认值**

  - config 不含 `git` 节点
  - 加载器 SHALL 把 `git.merge.strategy` 默认为 `no-ff`
  - SHALL 把 `git.branch.deleteAfterArchive` 默认为 `false`
  - `git.commitMessage` 下 SHALL NOT 出现任何默认路径值

- **陈旧 messageFrom 字段被忽略**

  - config 包含 `git.merge.messageFrom`
  - 加载器 SHALL NOT 将 `messageFrom` 暴露到 ProjectConfig

- **部分字段缺失时混合默认值**

  - config 仅含 `git: { merge: { strategy: ff-only } }`
  - 加载器 SHALL 保留 `merge.strategy: ff-only`
  - SHALL 把 `branch.deleteAfterArchive` 默认为 `false`
  - `commitMessage` 下 SHALL NOT 出现任何默认路径值

### Section: git 配置字段 Zod schema 校验

加载器 SHALL 通过 Zod schema 校验 `git` 节点字段类型与取值，并对非法值输出 warning 后丢弃该字段、回退默认行为。对已删除的 `git.autoCommit`、`git.archive.commitMessage.convention`、`git.merge.commitMessage.convention` 残留字段，加载器 SHALL 输出废弃 warning 且不将其暴露到 ProjectConfig。

- **残留 autoCommit 字段输出废弃 warning**

  - config 包含 `git.autoCommit: manual`
  - 加载器 SHALL 输出 warning 指明 `git.autoCommit` 已废弃
  - SHALL NOT 将 `autoCommit` 暴露到 ProjectConfig
  - SHALL 保留 config 中其他合法字段

- **commitMessage 路径非法值**

  - `git.commitMessage.archive` 为绝对路径、包含 `..` 上溯、使用反斜杠分隔、或非字符串类型
  - 加载器 SHALL 输出 warning 指明该路径非法
  - SHALL 丢弃该字段
  - SHALL 保留 config 中其他合法字段

- **merge.strategy 非法值**

  - `git.merge.strategy` 为 `rebase`（不在枚举中）
  - 加载器 SHALL 输出 warning 并把 `merge.strategy` 回退为默认 `no-ff`
  - SHALL 保留 config 中其他合法字段

- **deleteAfterArchive 类型校验**

  - `git.branch.deleteAfterArchive` 为 `"true"` 字符串而非布尔
  - 加载器 SHALL 输出 warning 并回退为默认 `false`

- **残留 convention 字段输出废弃 warning**

  - config 包含 `git.archive.commitMessage.convention` 或 `git.merge.commitMessage.convention`
  - 加载器 SHALL 输出 warning 指明 convention 字段已废弃、模板由 `.xirang/references/` 与 `git.commitMessage.*` 路径覆盖决定
  - SHALL NOT 将 convention 字段暴露到 ProjectConfig

- **commitMessage 路径合法值**

  - `git.commitMessage.boundary`、`git.commitMessage.archive` 或 `git.commitMessage.merge` 为项目根相对 POSIX 路径字符串
  - schema SHALL 接受该值

- **merge.strategy 合法值**

  - `git.merge.strategy` 为 `no-ff`、`ff-only` 或 `squash`
  - schema SHALL 接受该值

### Section: git 配置暴露给 projection 消费者

加载器 SHALL 把 `git` 节点（含填充后的默认值）作为 normalized projection 输入暴露给 prompt projection 与 runtime projection 消费者。archive skill/agent SHALL 把 `commitMessage.*` 路径用于 commit message 模板路由，把 `merge.strategy` 与 `branch.deleteAfterArchive` 用于归档后的 git 工作流。

- **projection 输入包含 git 节点**

  - 项目配置加载完成
  - projection 输入 SHALL 包含 `git.commitMessage.boundary`、`git.commitMessage.archive`、`git.commitMessage.merge`（未配置的键值为空）、`git.merge.strategy`、`git.branch.deleteAfterArchive`
  - projection 输入 SHALL NOT 包含 `git.autoCommit`、退役 convention 字段或 `git.merge.messageFrom`

- **archive prompt projection 投出 git 段**

  - archive surface 请求 prompt projection
  - projection SHALL 把 `git` 段渲染为 archive skill 可消费的指令片段
  - SHALL 保留字段名与路径值的 canonical 形式
  - SHALL 表达 `commitMessage.*` 已配置时读用户模板、未配置时读 `.xirang/references/` 内置模板的路由语义

### Section: 跨平台路径与默认值

加载器 SHALL 在 Windows、macOS、Linux 上对 `git` 配置节点行为一致，且 `branch.deleteAfterArchive` 不依赖任何平台特定 git 行为。

- **Windows 上读取 git 节点**

  - 在 Windows 上加载项目配置
  - 加载器 SHALL 通过 `path.join()` 构建路径
  - SHALL 与 Unix 系统返回相同结构的 `git` 配置对象

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

### Section: Project config 静默忽略退役的 Propose routing 配置

Project config loader SHALL 将顶层 `propose` routing 节点视为退役配置。它 MUST NOT 将 `propose.smartRouting`、`propose.requireExplore` 或整个 `propose` 节点暴露到 ProjectConfig、normalized config 或 config projection，且 MUST NOT 因这些退役字段输出 warning 或改写用户配置文件。

- **旧 Propose routing 节点静默忽略**

  - `.xirang/config.yaml` 包含 `propose.smartRouting` 或 `propose.requireExplore`
  - loader SHALL 继续解析其他有效字段
  - 返回的 ProjectConfig SHALL NOT 包含 `propose`
  - SHALL NOT 输出退役或非法字段 warning
  - SHALL NOT 修改 `.xirang/config.yaml`

- **退役节点不进入 projection**

  - project config 包含旧 `propose` 节点
  - NormalizedProjectConfig 与 artifact instructions 的 configProjection SHALL NOT 包含 `propose`
  - Propose workflow behavior SHALL NOT 受该节点影响

### Section: 加载结构拆分配置

项目配置加载器 SHALL 将顶层 `decomposition` 解析为单个非空字符串，并由 CLI 机械解析为指导文件路径：值包含 `/` 时 SHALL 作为项目根相对路径原样保留；否则 SHALL 作为裸名称解析为 `.xirang/references/<值>`，值不以 `.md` 结尾时补 `.md`。路径形态 SHALL 拒绝 posix 与 win32 绝对路径、反斜杠与 `..` 穿越；裸名称 SHALL 限于 `[A-Za-z0-9._-]+`。加载器 SHALL NOT 维护方法名单、解释方法论内容或检查文件存在性；指导文件不可读时由消费端 fail-closed。

- **路径形态原样保留**

  - config 包含 `decomposition: .pi/skills/xirang-project-decomposition/SKILL.md`
  - ProjectConfig 与 normalized projection 保留该项目根相对路径
  - CLI 不解释该文件内容或其所属工具目录

- **裸名称解析到共享指导目录**

  - config 包含 `decomposition: c4`
  - normalized 解析结果为 `.xirang/references/c4.md`
  - CLI 不附加任何方法论内容

- **带扩展名裸名不重复补后缀**

  - config 包含 `decomposition: xirang-semantic-refinement.md`
  - normalized 解析结果为 `.xirang/references/xirang-semantic-refinement.md`
  - 解析结果不出现重复的 `.md` 后缀

- **字段缺失时使用默认指导文件**

  - config 不包含 `decomposition`
  - 有效项目配置使用 `xirang-semantic-refinement.md` 作为功能性默认值
  - normalized 解析结果为 `.xirang/references/xirang-semantic-refinement.md`

- **非法值不回退默认**

  - `decomposition` 为非字符串值、空串、绝对路径、包含反斜杠或 `..` 穿越，或裸名称包含 `[A-Za-z0-9._-]` 之外的字符
  - 加载器对该字段输出 warning 并从返回配置中省略 `decomposition`
  - SHALL NOT 回退为默认指导文件
  - 其他有效配置字段继续返回

- **yaml 与 yml 使用相同结构拆分语义**

  - 项目在 Windows、macOS 或 Linux 上从 `.xirang/config.yaml` 或其 `.yml` alias 加载有效 `decomposition`
  - 加载器通过现有 Node.js path 解析规则返回相同指导文件路径

### Section: 诊断退役优化配置

optimization.directionLimit、optimization.directionRetries 与 optimization.minImpactLevel SHALL 不进入有效配置、默认值或投影；读取残留值时给出字段级明确退役诊断，不静默解释为新控制、不改写磁盘配置或自动迁移，其余有效字段按既有规则处理。optimization.enabled 保留默认 true。

- **旧项目 YAML**：包含任一退役键时报告其路径，投影不包含该值，用户文件字节不变；新 setup/update 默认物化只添加 enabled，不自动删除已有键。Windows、macOS、Linux 的 .yaml/.yml 使用同一诊断规则。
