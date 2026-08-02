---
entity: element-declaration
identity: config-projection
kind: capability
parent: project-config-management
title: Config Projection
definition: Config Projection 定义项目配置编译为 prompt/runtime projections 的契约：投影结构、共享 projection contract、prose language 字段边界、英文术语嵌入、projection fragment 作用域、surface-specific projection 与 legacy docLanguage fallback。
---

## Requirements

### Requirement: Projection 结构契约
PromptProjection 和 RuntimeProjection SHALL 向消费 workflow surface 暴露 normalized config、compiled fragments 与 canonical token policy。

#### Scenario: PromptProjection 包含必要字段
- **WHEN** 投影构建函数被调用
- **THEN** 输出包含 normalized、prompt.fragments、prompt.compiledLines 与 prompt.canonicalTokenPolicy

#### Scenario: RuntimeProjection 包含运行时字段
- **WHEN** 运行时投影函数被调用
- **THEN** 输出包含 fragments、proseLanguage、preserveCanonicalTokens、forbidHardcodedEnglishBoilerplate 与 canonicalTokenPolicy

### Requirement: Workflow surfaces 共享统一 projection contract
所有会创建或改写制品的 workflow 和 skill surfaces SHALL 消费同一套 config projection contract。

#### Scenario: Projection contract 应用于所有 workflow surfaces
- **WHEN** propose、apply、sync、archive、verify workflow 创建 artifacts
- **THEN** 生成的 instructions 消费共享的 prompt projection contract
- **AND** contract 保留 canonical tokens（SHALL、MUST、section headers、requirement headers、scenario headers、BDD keywords、IDs、schema keys、paths、commands）

#### Scenario: Projection 语义对所有消费者保持一致
- **WHEN** 多个 surfaces 在相同 config 下为同一 artifact 消费 projection
- **THEN** projection 内容对每个消费者的语义相同
- **AND** 消费者 SHALL NOT 通过读取 raw config 字段重新解释语义
#### Scenario: 不增加额外语言扫描
- **WHEN** artifact 已消费共享 language contract
- **THEN** workflow SHALL NOT 增加独立的 per-artifact English prose scan
### Requirement: Prose language 字段边界定义
Config projection SHALL 明确定义哪些 artifact 字段是受 proseLanguage 约束的 natural-language prose，哪些是 canonical tokens。

#### Scenario: Prose 字段清单
- **WHEN** proseLanguage fragment 生成时
- **THEN** 它 SHALL 列出 prose 字段：task titles、check names、Requirement titles、Scenario titles、bullet descriptions、Expect/Evidence descriptions、rationale、goals、risks、summaries

#### Scenario: 语言指令强化
- **WHEN** proseLanguage 被配置
- **THEN** fragment SHALL 在结尾追加 CRITICAL 级别强化指令，使用 `CRITICAL: All natural-language prose you newly write or revise in artifact bodies MUST use <proseLanguage>. This overrides any default writing behavior.` 格式

#### Scenario: Canonical token 保持原文
- **WHEN** proseLanguage 被配置
- **THEN** projection SHALL 保留 template headings、normative keywords、BDD keywords、section headers、IDs、schema keys、relation types、paths、commands 与 code identifiers
#### Scenario: MODIFIED 块中的 existing Requirement titles
- **WHEN** artifact 更新现有 Requirements
- **THEN** projection SHALL 允许 existing Requirement titles 保持原文以用于 exact matching
#### Scenario: examples 不改变 proseLanguage 约束
- **WHEN** schema instruction 包含英文示例
- **THEN** instructions SHALL 明确 examples 只展示结构格式
- **AND** agent SHALL NOT 将示例中的普通英文 prose 风格照搬到配置了非英文 `proseLanguage` 的 artifact 内容中
### Requirement: 英文术语可嵌入目标语言 prose
Config projection SHALL 允许英文项目术语嵌入目标语言 prose，同时对普通句子强制目标语言。

#### Scenario: 英文术语保留在目标语言 prose 中
- **WHEN** artifact prose 包含息壤或工程术语
- **THEN** projection 允许 artifact、workflow、proseLanguage、Requirement、Scenario、apply、propose 等术语保留英文
- **AND** 普通英文句子、task titles、check names 必须跟随 proseLanguage
#### Scenario: 混合 prose 验证
- **WHEN** proseLanguage 是 zh-CN
- **THEN** "生成 artifact 的 workflow 调用 propose" 是合法的（混合）
- **AND** 纯英文普通句子是非法的
### Requirement: Projection fragment 作用域
Config projection SHALL 将 fragments 作用域标记为 global（所有 artifacts）或 artifact-specific。

#### Scenario: Global fragments
- **WHEN** proseLanguage 或 context 被配置
- **THEN** fragment scope 是 'global'

#### Scenario: Artifact-specific fragments
- **WHEN** config.rules[artifactId] 存在
- **THEN** fragment scope 是 'artifact'，仅应用于该 artifact

### Requirement: Surface-specific projection
Config projection SHALL 根据 workflow surface 生成不同的 fragments。

#### Scenario: Archive surface 包含 git projection
- **WHEN** surface 是 'archive' 且 config.git 存在
- **THEN** projection 包含 git.merge.strategy、git.branch.deleteAfterArchive 与 git.commitMessage.*

#### Scenario: Apply surface 包含 isolation projection
- **WHEN** surface 是 'apply' 且 config.apply 存在
- **THEN** projection 包含 apply.defaultIsolation

### Requirement: Context 注入经投影编译且保留原样

Project `context` SHALL 通过共享 config projection pipeline 注入 artifact instructions，内容以 `<context>` 标签包裹且不修改、不转义、不解释。

#### Scenario: Context 注入保留原样
- **WHEN** config 包含 context 且生成 instructions
- **THEN** 内容以 `<context>` 标签包裹且不修改、不转义、不解释

#### Scenario: 缺失 context 省略投影片段
- **WHEN** config 省略 context
- **THEN** config projection SHALL 省略 context fragment
- **AND** instruction output SHALL 不包含注入的 context section
#### Scenario: Context 出现在 template 之前
- **WHEN** 生成带 context 的 instructions
- **THEN** `<context>` section SHALL 出现在 `<template>` section 之前
#### Scenario: Context 应用于全部 artifacts
- **WHEN** 为任意 artifact 加载 instructions 且 config 包含 context
- **THEN** context section SHALL 出现在全部 instruction outputs 中
#### Scenario: Config has context field
- **WHEN** config contains `context: "Tech stack: TypeScript, React"`
- **THEN** instruction output includes `<context>\nTech stack: TypeScript, React\n</context>`
#### Scenario: Context is multi-line string
- **WHEN** config contains context with multiple lines
- **THEN** instruction output preserves line breaks within `<context>` tags
#### Scenario: Context tag structure
- **WHEN** context is injected into instructions
- **THEN** format is exactly `<context>\n{content}\n</context>\n\n`
#### Scenario: Context contains special characters
- **WHEN** context includes characters like `<`, `>`, `&`, quotes
- **THEN** characters are preserved exactly as written in the config
#### Scenario: Context becomes prompt projection content
- **WHEN** instructions are generated for any artifact and config contains `context`
- **THEN** the system SHALL compile that content into the prompt projection bundle
- **AND** instruction consumers SHALL receive the compiled context guidance without needing to re-read raw config
#### Scenario: Config has no context field
- **WHEN** config omits the context field or context is undefined
- **THEN** instruction output does not include `<context>` tags
#### Scenario: Missing context omits the projection fragment
- **WHEN** config omits `context`
- **THEN** the config projection SHALL omit the context fragment
- **AND** instruction output SHALL continue without an injected context section
#### Scenario: Context contains URLs
- **WHEN** context includes URLs like "docs at https://example.com"
- **THEN** URLs are preserved exactly in the injected content
#### Scenario: Context contains Markdown
- **WHEN** context includes Markdown formatting like `**bold**` or `[links](url)`
- **THEN** Markdown is preserved without rendering or escaping
### Requirement: Rules 按 artifact 匹配注入

Per-artifact `rules` SHALL 仅当 artifact ID 匹配 config rules 键时注入对应 artifact 的 instructions，以 `<rules>` 标签与 bullet list 呈现；rules 对象缺失、数组为空或该 artifact 无匹配时 SHALL 不输出 `<rules>` 标签。

#### Scenario: Rules 按 artifact 匹配注入
- **WHEN** 加载某 artifact 的 instructions 且 config.rules 含该 artifact ID
- **THEN** 输出以 `<rules>` 标签与 bullet list 注入该 artifact 的规则

#### Scenario: 无匹配 artifact 不注入
- **WHEN** 加载的 artifact 不在 config.rules 中或该数组为空
- **THEN** instruction output SHALL 不包含 `<rules>` 标签

#### Scenario: 多个 artifacts 不同规则集
- **WHEN** config 为不同 artifact 定义不同 rules
- **THEN** 每个 artifact 的 instructions SHALL 只显示其自身规则集
#### Scenario: Rules exist for the artifact
- **WHEN** loading instructions for "proposal" and config has `rules: { proposal: ["Rule 1", "Rule 2"] }`
- **THEN** instruction output includes rules section with both rules
#### Scenario: Single rule for artifact
- **WHEN** config has `rules: { proposal: ["Include rollback plan"] }`
- **THEN** instruction output includes `<rules>\n- Include rollback plan\n</rules>\n\n`
#### Scenario: Matching artifact receives compiled rules
- **WHEN** config defines rules for the requested artifact ID
- **THEN** the projection pipeline SHALL emit an artifact-scoped rules fragment for that artifact
- **AND** instruction loading SHALL expose that compiled fragment without requiring workflow templates to interpret raw config
#### Scenario: No rules for the artifact
- **WHEN** loading instructions for "design" and config has `rules: { proposal: [...] }`
- **THEN** instruction output does not include `<rules>` tags
#### Scenario: Rules object is undefined
- **WHEN** config omits the rules field or rules is undefined
- **THEN** instruction output does not include `<rules>` tags for any artifact
#### Scenario: Rules array is empty for artifact
- **WHEN** config has `rules: { proposal: [] }`
- **THEN** instruction output does not include `<rules>` tags
#### Scenario: Multiple rules for artifact
- **WHEN** config has `rules: { proposal: ["Rule 1", "Rule 2", "Rule 3"] }`
- **THEN** instruction output includes each rule as separate bullet point
#### Scenario: Rules appear after context and before template
- **WHEN** instructions are generated with both context and rules
- **THEN** order is `<context>` then `<rules>` then `<template>`
#### Scenario: Some artifacts have rules, others do not
- **WHEN** config has rules for proposal and specs only
- **THEN** design and tasks instructions have no `<rules>` section
#### Scenario: Non-matching artifact receives no rules fragment
- **WHEN** config defines rules for other artifact IDs but not the requested one
- **THEN** the projection pipeline SHALL omit rules for the requested artifact
- **AND** instruction output SHALL not fabricate empty rule sections
### Requirement: 保留 rule 原文

系统 SHALL 注入 rule 文本而不修改、转义或解释。

#### Scenario: Rule 含 markdown
- **WHEN** rule 包含 `**Given/When/Then**` 等 markdown
- **THEN** markdown SHALL 在注入内容中被保留

#### Scenario: Rule 含特殊字符
- **WHEN** rule 包含 `<`、`>`、引号等字符
- **THEN** 这些字符 SHALL 按原样写入

#### Scenario: Rule 为多行字符串
- **WHEN** rule 文本含换行
- **THEN** 换行 SHALL 在 bullet item 内被保留
#### Scenario: Rule contains special characters
- **WHEN** rule includes characters like `<`, `>`, quotes
- **THEN** characters are preserved exactly as written
#### Scenario: Rule is multi-line string
- **WHEN** rule text contains line breaks
- **THEN** line breaks are preserved within the bullet point
### Requirement: Rules 对 schema guidance 是 additive

系统 SHALL 将 config rules 添加到 schema 的内置 artifact instruction 之上，而不是替换它。

#### Scenario: Artifact 同时有 schema instruction 与 config rules
- **WHEN** artifact 有来自 schema 的内置 instruction 且 config 提供 rules
- **THEN** final instruction SHALL 同时包含 schema guidance 与 config rules
#### Scenario: Artifact has schema instruction and config rules
- **WHEN** artifact has built-in instruction from schema and config provides rules
- **THEN** final instruction contains both schema guidance and config rules
#### Scenario: Rules provide additional constraints
- **WHEN** schema says "create proposal" and config rules say "include rollback plan"
- **THEN** agent sees both the schema template and the additional rule
### Requirement: 校验 rules artifact IDs

系统 SHALL 在加载 instructions 时针对 schema 校验 config rules 中的 artifact IDs，并对未知 IDs 发出警告；同一 session 内每个唯一警告 SHALL 只显示一次。

#### Scenario: 全部 artifact IDs 合法
- **WHEN** instructions 加载且 config rules 的 artifact IDs 对该 schema 均合法
- **THEN** SHALL 不产生 validation warning

#### Scenario: 未知 artifact ID
- **WHEN** instructions 加载且 config rules 含该 schema 不存在的 artifact ID
- **THEN** SHALL 发出 "Unknown artifact ID in rules" 警告并列出现行合法 IDs

#### Scenario: 同一 session 告警只显示一次
- **WHEN** 同一 CLI session 内多次加载 instructions
- **THEN** 每个唯一 validation warning SHALL 只显示一次（缓存）
#### Scenario: 多个未知 artifact IDs
- **WHEN** instructions 加载且 config rules 含多个未知 artifact IDs
- **THEN** 对每个未知 artifact ID 分别发出 warning
### Requirement: Apply instructions 包含配置投影

`xirang instructions apply --change <name> --json` 的输出 SHALL 包含 `configProjection` 字段，其结构与 artifact instructions 中的 `configProjection` 相同；非 JSON 文本输出 SHALL 包含 `<config_projection>` 区块。

#### Scenario: JSON 输出包含 configProjection
- **WHEN** 用户执行 `xirang instructions apply --change "<name>" --json`
- **THEN** 输出 JSON SHALL 包含 `configProjection` 字段
- **AND** `configProjection.normalized` 包含 `proseLanguage`、`apply`、`git` 与 `rules` 字段
- **AND** `configProjection.prompt.fragments` 包含适用于 apply 上下文的投影片段

#### Scenario: 缺少 config.yaml 时返回最小投影
- **WHEN** 项目不存在 `.xirang/config.yaml`
- **THEN** `configProjection.normalized` SHALL 返回 `{ "rules": {} }`
- **AND** `configProjection.prompt.fragments` 为空数组
- **AND** 命令以 exit code 0 退出

#### Scenario: 文本输出包含配置投影
- **WHEN** 用户执行 `xirang instructions apply --change "<name>"`（不带 `--json`）
- **THEN** 输出 SHALL 包含 `<config_projection>` 区块
- **AND** 区块包含来自 config 的 proseLanguage 与 apply isolation 指令

### Requirement: Legacy docLanguage fallback
Config projection SHALL 将 docLanguage 作为 proseLanguage 的 legacy fallback。

#### Scenario: proseLanguage 优先级更高
- **WHEN** proseLanguage 与 docLanguage 同时存在
- **THEN** projection 使用 proseLanguage

#### Scenario: docLanguage fallback
- **WHEN** 仅 docLanguage 存在
- **THEN** projection 使用 docLanguage 作为 proseLanguage
