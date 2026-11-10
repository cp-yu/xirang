---
operation: MODIFIED
entity: element-declaration
identity: config-projection
kind: element
parent: project-config-management
title: "Config Projection"
definition: "Config Projection 是配置加载结果到消费者之间的共享语义边界。它提供归一化有效数据及运行时投影，并由共享工作指导规定语言、canonical tokens、context、制品 rules 和 surface 的适用方式；支持按需消费而不重新解释 raw YAML，不负责 Change 推进状态或制品内容创作。"
---

## MODIFIED Sections

### Section: Projection 结构契约

共享配置编译 SHALL 保留完整 normalized config 与运行时需要的 RuntimeProjection。Agent SHALL 经 config project 查询当前有效配置，按共享 skill/reference 的配置遵循规则使用，不通过 instructions 接收重复的 prompt fragments、compiledLines 或 normalized 副本。按需选择 SHALL 保留字段原义，运行时与 Agent 消费同一归一化语义。

### Section: Workflow surfaces 共享统一 projection contract

所有会创建或改写制品的 workflow/skill SHALL 使用共享有效配置契约。Propose、Apply、Sync、Archive 与 Quality 消费相同配置时，语言、canonical tokens、context、适用 rules 及运行时配置的语义 SHALL 一致；不得直接读取 raw YAML 重新解释默认值。静态规则由共享 reference 按需交付，不要求逐制品重复查询已知且未变的配置。不得额外引入逐制品英文散文扫描。

### Section: Prose language 字段边界定义

共享指导 SHALL 将 proseLanguage 应用于新写或改写的自然语言 prose，包括目标和案例标题、Section 标题、描述、理由、目标、风险与总结。规范词 SHALL/MUST、template headings、结构头、IDs、schema keys、relation types、paths、commands 与 code identifiers SHALL 保留原文。

业务规格四个 Section 标题 Scope and Non-goals、Business Logic、Edge Cases and Exception Handling、Key Acceptance Cases SHALL 保持英文。MODIFIED 引用既有 Section 时 SHALL 保留 exact title。示例只提供结构，不覆盖所配置的 proseLanguage。语言规则 SHALL 在共享指导中明确表达，不通过每次配置查询重复展开强化段落。

### Section: Projection fragment 作用域

配置遵循规则 SHALL 将 proseLanguage 与 context 作用于所有适用制品，将 rules[artifactId] 仅作用于匹配制品；数据选择不改变这些语义。缺失 context 或空/不匹配 rules SHALL 不产生虚构的配置义务。

### Section: Surface-specific projection

适用工作流 SHALL 按需读取有效配置：Archive 消费 git.merge.strategy、git.branch.deleteAfterArchive 与 git.commitMessage.*，Apply 消费 apply.defaultIsolation。无关 surface SHALL 不因共享指导而获得不适用的配置指令。

### Section: Context 注入经投影编译且保留原样

有效配置中的 context SHALL 由共享归一化管线提供，适用于全部制品。Agent 按需查询并在当前工作中遵循，不要求每个 artifact 重复加载。查询 SHALL 原样保留内容、换行、Markdown、URL、<、>、& 和引号；JSON 必需的语法转义不得改变解码后的文本。缺失 context 时省略，不生成空 context 标签或包装段落。

### Section: Rules 按 artifact 匹配注入

有效 rules SHALL 仅作用于匹配的 artifact ID。config project --artifact <id> SHALL 只返回该制品规则，不附其它制品的规则；未匹配或规则数组为空时返回空 rules 对象，不生成空规则提示段落。

配置 proposal 有 Rule 1 与 Rule 2 时，proposal 查询 SHALL 完整保留两条规则，design 查询 SHALL 不收到它们。Agent SHALL 将这些规则作为当前制品的附加要求。

### Section: 保留 rule 原文

系统 SHALL 保留每条有效 rule 原文，不改写、解释或丢弃其中的 Markdown、特殊字符和多行内容。JSON 语法转义解码后 SHALL 恢复同一内容；多行 rule 不得拆成不同规则。

### Section: Rules 对 schema guidance 是 additive

项目 rules SHALL 作为共享制品定义、写作指导与模板之外的附加约束，不替换内置指导。内置指导要求创建 proposal、项目 rule 要求 include rollback plan 时，Agent SHALL 同时遵循两者；选择读取不使未重复输出的内置规则失效。

### Section: 校验 rules artifact IDs

加载项目有效配置时 SHALL 按当前 schema 的合法 artifact IDs 校验 rules 键；未知 ID SHALL 在 stderr 发出具体警告并列出合法 IDs，同一 CLI 进程内每个唯一警告只显示一次。多个未知 ID 须分别可定位；全部合法则不产生该警告。显式 --artifact 参数本身非法时 SHALL 作为请求错误拒绝，不视为无匹配规则。

### Section: 原样投影结构拆分选择

Config Projection SHALL 向结构形成 workflow 暴露经过项目配置加载器解析的 `decomposition` 指导文件路径字符串，并保持解析结果稳定。Projection SHALL NOT 维护方法名单、映射 CLI 内建方法论或猜测工具专属路径。

- **投影解析后的指导路径**

  - normalized project config 包含 `decomposition: c4`
  - `xirang config project --json` 与适用工作流查询 输出 `.xirang/references/c4.md`
  - 输出不包含任何由 CLI 生成的拆分步骤

- **投影路径形态原样输出**

  - normalized project config 包含路径形态的 `decomposition` 值
  - 适用结构形成 workflow 获得相同的项目根相对路径
  - projection 不猜测 `.pi`、`.claude`、`.codex` 或其他工具目录之外的额外路径

- **非结构 workflow 不消费拆分指导**

  - Apply、Archive、Quality、Reviewer 或 Optimizer surface 消费配置
  - 这些 surface SHALL NOT 获得要求其重新形成 Semantic Model hierarchy 的 guidance

- **非法配置不产生隐式 projection**

  - config loading 因非法 `decomposition` 省略该字段
  - projection SHALL 同样省略结构拆分选择
  - SHALL NOT 注入默认指导路径作为修复

## ADDED Sections

### Section: 工作流按需消费配置

Apply 及其它工作流 SHALL 按当前工作读取有效配置并遵循共享规则；默认 architecture、proseLanguage、isolation 等来自共享归一化结果，不以缺少 instructions 响应为由忽略。配置缺失时保留有效默认，不生成不存在的 context、rules 或语言覆盖。已知配置未变时可复用；配置修改后的下一次 CLI 查询 SHALL 反映新的有效值。

## REMOVED Sections

### Section: Apply instructions 包含配置投影
