---
entity: element-declaration
identity: config-projection
kind: element
parent: project-config-management
title: Config Projection
definition: Config Projection 定义项目配置编译为 prompt/runtime projections 的契约：投影结构、共享 projection contract、prose language 字段边界、英文术语嵌入、projection fragment 作用域、surface-specific projection 与 legacy docLanguage fallback。
---

## Specification

### Section: Projection 结构契约

PromptProjection 和 RuntimeProjection SHALL 向消费 workflow surface 暴露 normalized config、compiled fragments 与 canonical token policy。

- **PromptProjection 包含必要字段**

  - 投影构建函数被调用
  - 输出包含 normalized、prompt.fragments、prompt.compiledLines 与 prompt.canonicalTokenPolicy

- **RuntimeProjection 包含运行时字段**

  - 运行时投影函数被调用
  - 输出包含 fragments、proseLanguage、preserveCanonicalTokens、forbidHardcodedEnglishBoilerplate 与 canonicalTokenPolicy

### Section: Workflow surfaces 共享统一 projection contract

所有会创建或改写制品的 workflow 和 skill surfaces SHALL 消费同一套 config projection contract。

- **Projection contract 应用于所有 workflow surfaces**

  - propose、apply、sync、archive、quality workflow 创建 artifacts
  - 生成的 instructions 消费共享的 prompt projection contract
  - contract 保留 canonical tokens（SHALL、MUST、template headings、`### Section:` 与 `#### Acceptance Case:` headers、normative keywords、IDs、schema keys、relation types、paths、commands 与 code identifiers）

- **Projection 语义对所有消费者保持一致**

  - 多个 surfaces 在相同 config 下为同一 artifact 消费 projection
  - projection 内容对每个消费者的语义相同
  - 消费者 SHALL NOT 通过读取 raw config 字段重新解释语义

- **不增加额外语言扫描**

  - artifact 已消费共享 language contract
  - workflow SHALL NOT 增加独立的 per-artifact English prose scan

### Section: Prose language 字段边界定义

Config projection SHALL 明确定义哪些 artifact 字段是受 proseLanguage 约束的 natural-language prose，哪些是 canonical tokens。

- **Prose 字段清单**

  - proseLanguage fragment 生成时
  - 它 SHALL 列出 prose 字段：task titles、check names、Section titles、Acceptance Case titles、bullet descriptions、Expect/Evidence descriptions、rationale、goals、risks、summaries

- **语言指令强化**

  - proseLanguage 被配置
  - fragment SHALL 在结尾追加 CRITICAL 级别强化指令，使用 `CRITICAL: All natural-language prose you newly write or revise in artifact bodies MUST use <proseLanguage>. This overrides any default writing behavior.` 格式

- **Canonical token 保持原文**

  - proseLanguage 被配置
  - projection SHALL 保留 template headings、`### Section:` 与 `#### Acceptance Case:` headers、normative keywords、IDs、schema keys、relation types、paths、commands 与 code identifiers

- **MODIFIED 块中的 existing Section titles**

  - artifact 更新现有 Sections
  - projection SHALL 允许 existing Section titles 保持原文以用于 exact matching

- **examples 不改变 proseLanguage 约束**

  - schema instruction 包含英文示例
  - instructions SHALL 明确 examples 只展示结构格式
  - agent SHALL NOT 将示例中的普通英文 prose 风格照搬到配置了非英文 `proseLanguage` 的 artifact 内容中

### Section: 英文术语可嵌入目标语言 prose

Config projection SHALL 允许英文项目术语嵌入目标语言 prose，同时对普通句子强制目标语言。

- **英文术语保留在目标语言 prose 中**

  - artifact prose 包含息壤或工程术语
  - projection 允许 artifact、workflow、proseLanguage、Section、Acceptance Case、apply、propose 等术语保留英文
  - 普通英文句子、task titles、check names 必须跟随 proseLanguage

- **混合 prose 验证**

  - proseLanguage 是 zh-CN
  - "生成 artifact 的 workflow 调用 propose" 是合法的（混合）
  - 纯英文普通句子是非法的

### Section: Projection fragment 作用域

Config projection SHALL 将 fragments 作用域标记为 global（所有 artifacts）或 artifact-specific。

- **Global fragments**

  - proseLanguage 或 context 被配置
  - fragment scope 是 'global'

- **Artifact-specific fragments**

  - config.rules[artifactId] 存在
  - fragment scope 是 'artifact'，仅应用于该 artifact

### Section: Surface-specific projection

Config projection SHALL 根据 workflow surface 生成不同的 fragments。

- **Archive surface 包含 git projection**

  - surface 是 'archive' 且 config.git 存在
  - projection 包含 git.merge.strategy、git.branch.deleteAfterArchive 与 git.commitMessage.*

- **Apply surface 包含 isolation projection**

  - surface 是 'apply' 且 config.apply 存在
  - projection 包含 apply.defaultIsolation

### Section: Context 注入经投影编译且保留原样

Project `context` SHALL 通过共享 config projection pipeline 注入 artifact instructions，内容以 `<context>` 标签包裹且不修改、不转义、不解释。

- **Context 注入保留原样**

  - config 包含 context 且生成 instructions
  - 内容以 `<context>` 标签包裹且不修改、不转义、不解释

- **缺失 context 省略投影片段**

  - config 省略 context
  - config projection SHALL 省略 context fragment
  - instruction output SHALL 不包含注入的 context section

- **Context 出现在 template 之前**

  - 生成带 context 的 instructions
  - `<context>` section SHALL 出现在 `<template>` section 之前

- **Context 应用于全部 artifacts**

  - 为任意 artifact 加载 instructions 且 config 包含 context
  - context section SHALL 出现在全部 instruction outputs 中

- **Config has context field**

  - config contains `context: "Tech stack: TypeScript, React"`
  - instruction output includes `<context>\nTech stack: TypeScript, React\n</context>`

- **Context is multi-line string**

  - config contains context with multiple lines
  - instruction output preserves line breaks within `<context>` tags

- **Context tag structure**

  - context is injected into instructions
  - format is exactly `<context>\n{content}\n</context>\n\n`

- **Context contains special characters**

  - context includes characters like `<`, `>`, `&`, quotes
  - characters are preserved exactly as written in the config

- **Context becomes prompt projection content**

  - instructions are generated for any artifact and config contains `context`
  - the system SHALL compile that content into the prompt projection bundle
  - instruction consumers SHALL receive the compiled context guidance without needing to re-read raw config

- **Config has no context field**

  - config omits the context field or context is undefined
  - instruction output does not include `<context>` tags

- **Missing context omits the projection fragment**

  - config omits `context`
  - the config projection SHALL omit the context fragment
  - instruction output SHALL continue without an injected context section

- **Context contains URLs**

  - context includes URLs like "docs at https://example.com"
  - URLs are preserved exactly in the injected content

- **Context contains Markdown**

  - context includes Markdown formatting like `**bold**` or `[links](url)`
  - Markdown is preserved without rendering or escaping

### Section: Rules 按 artifact 匹配注入

Per-artifact `rules` SHALL 仅当 artifact ID 匹配 config rules 键时注入对应 artifact 的 instructions，以 `<rules>` 标签与 bullet list 呈现；rules 对象缺失、数组为空或该 artifact 无匹配时 SHALL 不输出 `<rules>` 标签。

- **Rules 按 artifact 匹配注入**

  - 加载某 artifact 的 instructions 且 config.rules 含该 artifact ID
  - 输出以 `<rules>` 标签与 bullet list 注入该 artifact 的规则

- **无匹配 artifact 不注入**

  - 加载的 artifact 不在 config.rules 中或该数组为空
  - instruction output SHALL 不包含 `<rules>` 标签

- **多个 artifacts 不同规则集**

  - config 为不同 artifact 定义不同 rules
  - 每个 artifact 的 instructions SHALL 只显示其自身规则集

- **Rules exist for the artifact**

  - loading instructions for "proposal" and config has `rules: { proposal: ["Rule 1", "Rule 2"] }`
  - instruction output includes rules section with both rules

- **Single rule for artifact**

  - config has `rules: { proposal: ["Include rollback plan"] }`
  - instruction output includes `<rules>\n- Include rollback plan\n</rules>\n\n`

- **Matching artifact receives compiled rules**

  - config defines rules for the requested artifact ID
  - the projection pipeline SHALL emit an artifact-scoped rules fragment for that artifact
  - instruction loading SHALL expose that compiled fragment without requiring workflow templates to interpret raw config

- **No rules for the artifact**

  - loading instructions for "design" and config has `rules: { proposal: [...] }`
  - instruction output does not include `<rules>` tags

- **Rules object is undefined**

  - config omits the rules field or rules is undefined
  - instruction output does not include `<rules>` tags for any artifact

- **Rules array is empty for artifact**

  - config has `rules: { proposal: [] }`
  - instruction output does not include `<rules>` tags

- **Multiple rules for artifact**

  - config has `rules: { proposal: ["Rule 1", "Rule 2", "Rule 3"] }`
  - instruction output includes each rule as separate bullet point

- **Rules appear after context and before template**

  - instructions are generated with both context and rules
  - order is `<context>` then `<rules>` then `<template>`

- **Some artifacts have rules, others do not**

  - config has rules for proposal and specs only
  - design and tasks instructions have no `<rules>` section

- **Non-matching artifact receives no rules fragment**

  - config defines rules for other artifact IDs but not the requested one
  - the projection pipeline SHALL omit rules for the requested artifact
  - instruction output SHALL not fabricate empty rule sections

### Section: 保留 rule 原文

系统 SHALL 注入 rule 文本而不修改、转义或解释。

- **Rule 含 markdown**

  - rule 包含 `**Given/When/Then**` 等 markdown
  - markdown SHALL 在注入内容中被保留

- **Rule 含特殊字符**

  - rule 包含 `<`、`>`、引号等字符
  - 这些字符 SHALL 按原样写入

- **Rule 为多行字符串**

  - rule 文本含换行
  - 换行 SHALL 在 bullet item 内被保留

- **Rule contains special characters**

  - rule includes characters like `<`, `>`, quotes
  - characters are preserved exactly as written

- **Rule is multi-line string**

  - rule text contains line breaks
  - line breaks are preserved within the bullet point

### Section: Rules 对 schema guidance 是 additive

系统 SHALL 将 config rules 添加到 schema 的内置 artifact instruction 之上，而不是替换它。

- **Artifact 同时有 schema instruction 与 config rules**

  - artifact 有来自 schema 的内置 instruction 且 config 提供 rules
  - final instruction SHALL 同时包含 schema guidance 与 config rules

- **Artifact has schema instruction and config rules**

  - artifact has built-in instruction from schema and config provides rules
  - final instruction contains both schema guidance and config rules

- **Rules provide additional constraints**

  - schema says "create proposal" and config rules say "include rollback plan"
  - agent sees both the schema template and the additional rule

### Section: 校验 rules artifact IDs

系统 SHALL 在加载 instructions 时针对 schema 校验 config rules 中的 artifact IDs，并对未知 IDs 发出警告；同一 session 内每个唯一警告 SHALL 只显示一次。

- **全部 artifact IDs 合法**

  - instructions 加载且 config rules 的 artifact IDs 对该 schema 均合法
  - SHALL 不产生 validation warning

- **未知 artifact ID**

  - instructions 加载且 config rules 含该 schema 不存在的 artifact ID
  - SHALL 发出 "Unknown artifact ID in rules" 警告并列出现行合法 IDs

- **同一 session 告警只显示一次**

  - 同一 CLI session 内多次加载 instructions
  - 每个唯一 validation warning SHALL 只显示一次（缓存）

- **多个未知 artifact IDs**

  - instructions 加载且 config rules 含多个未知 artifact IDs
  - 对每个未知 artifact ID 分别发出 warning

### Section: Apply instructions 包含配置投影

`xirang instructions apply --change <name> --json` 的输出 SHALL 包含 `configProjection` 字段，其结构与 artifact instructions 中的 `configProjection` 相同；非 JSON 文本输出 SHALL 包含 `<config_projection>` 区块。

- **JSON 输出包含 configProjection**

  - 用户执行 `xirang instructions apply --change "<name>" --json`
  - 输出 JSON SHALL 包含 `configProjection` 字段
  - `configProjection.normalized` 包含 `proseLanguage`、`apply`、`git` 与 `rules` 字段
  - `configProjection.prompt.fragments` 包含适用于 apply 上下文的投影片段

- **缺少 config.yaml 时返回最小投影**

  - 项目不存在 `.xirang/config.yaml`
  - `configProjection.normalized` SHALL 返回 `{ "rules": {} }`
  - `configProjection.prompt.fragments` 为空数组
  - 命令以 exit code 0 退出

- **文本输出包含配置投影**

  - 用户执行 `xirang instructions apply --change "<name>"`（不带 `--json`）
  - 输出 SHALL 包含 `<config_projection>` 区块
  - 区块包含来自 config 的 proseLanguage 与 apply isolation 指令

### Section: Legacy docLanguage fallback

Config projection SHALL 将 docLanguage 作为 proseLanguage 的 legacy fallback。

- **proseLanguage 优先级更高**

  - proseLanguage 与 docLanguage 同时存在
  - projection 使用 proseLanguage

- **docLanguage fallback**

  - 仅 docLanguage 存在
  - projection 使用 docLanguage 作为 proseLanguage

### Section: 原样投影结构拆分选择

Config Projection SHALL 向结构形成 workflow 暴露经过项目配置加载器解析的 `decomposition` 指导文件路径字符串，并保持解析结果稳定。Projection SHALL NOT 维护方法名单、映射 CLI 内建方法论或猜测工具专属路径。

- **投影解析后的指导路径**

  - normalized project config 包含 `decomposition: c4`
  - `xirang config project --json` 与适用 prompt projection 输出 `.xirang/references/c4.md`
  - 输出不包含任何由 CLI 生成的拆分步骤

- **投影路径形态原样输出**

  - normalized project config 包含路径形态的 `decomposition` 值
  - 适用结构形成 workflow 获得相同的项目根相对路径
  - projection 不猜测 `.pi`、`.claude`、`.codex` 或其他工具目录之外的额外路径

- **非结构 workflow 不消费拆分指导**

  - Apply、Archive、Quality、Reviewer 或 Optimizer surface 构建 projection
  - 这些 surface SHALL NOT 获得要求其重新形成 Semantic Model hierarchy 的 guidance

- **非法配置不产生隐式 projection**

  - config loading 因非法 `decomposition` 省略该字段
  - projection SHALL 同样省略结构拆分选择
  - SHALL NOT 注入默认指导路径作为修复
