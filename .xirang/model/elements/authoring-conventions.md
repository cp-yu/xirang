---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: references-home
title: 共享语义写作指导
definition: 共享语义写作指导是息壤 Declaration、Contract、Change 与相关交互表达的写作契约。它独立承载抽象层级完整性、目标状态表达、Section 身份与自由载体、规范标记、制品职责分工及精简规则，并由业务规格标准进一步细化专用格式；生成路径与加载入口由共享 Reference 交付负责。
---

## Specification

### Section: Behavior-First Specification Boundary

Element Contracts SHALL 表达其 owner Element 在对应 abstraction level 的可验证 intent、guarantees、constraints、Sections 与 Acceptance Cases。Contract SHALL 避免实现、refactor 与 process detail；parent Contract MUST NOT 逐条复制 child contracts，但 SHALL 在自身抽象层级独立表达完整承诺，不为去重遗漏父级语义，跨 element collaboration SHALL 由 Semantic Relationships 表达。

- **Capability-like contract 表达行为**
  - element kind 的 contract schema 定义 observable behavior
  - Sections SHALL 聚焦 externally observable behavior、interfaces、error handling 与 constraints
  - Acceptance Cases SHALL 可测试或显式可验证

- **Parent contract 表达本层 guarantees**
  - Contract 属于包含 child elements 的 parent
  - SHALL 表达 parent 本层 aggregate intent、guarantees、cross-child invariants 或 decomposition rationale
  - MUST NOT 逐条复制 child Contracts

- **非 contract 内容路由**
  - 内容涉及具体 library、类/函数结构、执行机制、call path、refactor rationale、rejected approach 或 exploration notes
  - SHALL 路由到 `design.md` 或 `tasks.md`
  - MUST NOT 作为 Element Contract 写入

- **Section 使用稳态名称**
  - 为 Contract 撰写 Section
  - 标题 SHALL 使用持久、可验证的 contract 名称
  - SHALL NOT 使用缺口、恢复、迁移等一次性 change action 命名

- **单一 Section 不打包多个能力**
  - candidate Section 覆盖多个互不相关 guarantees 或 behaviors
  - SHALL 拆分为独立 Sections

### Section: Progressive Rigor

息壤 conventions SHALL 默认保持轻量，只在风险或协调复杂度要求时按比例提升严谨度。

- **Routine change specification**
  - change 是本地且低风险
  - authors 使用简洁、behavior-first Sections，最小仪式

- **High-risk or cross-boundary change specification**
  - change 跨团队、跨仓库、破坏 API contract、迁移密集或安全/隐私敏感
  - authors 按比例增加细节与显式验证期望

### Section: Structured Format for Behavioral Contracts

Element Contracts SHALL 使用一致、可解析的结构与规范关键词；每份 Contract 通过其宿主 Element 单元自声明绑定唯一 owner。

- 在 Element Contract 中记录规范语义时，SHALL 使用 level-3 heading 格式 `### Section: <标题>`，并紧跟 SHALL 或 MUST 语句描述目标行为或保证。
- Section 标题 SHALL 描述持久、可验证的规范承诺，并保持简洁。
- Section 正文 SHALL 使用最能完整表达该大点语义的载体；规范 SHALL NOT 强制单一载体，也 SHALL NOT 要求固定的子标题结构。组内 MAY 使用自定子标题组织内容，子标题不构成 identity。
- 承载关键验收用例时，SHALL 使用 `#### Acceptance Case: <名称>` 表达该用例，使测试团队可直接转化为自动化测试。
- Acceptance Case SHALL 表达可观察的验收结果，SHALL NOT 承载实现设计；实现选择、被否决方案与代码组织说明 SHALL 路由到 `design.md` 或 `tasks.md`。

### Section: Header-Based Section Identification

Section 标题 SHALL 作为 Formal 与 change-local 源之间的 unique identity。Section operation vocabulary SHALL 只有 `ADDED`、`MODIFIED`、`REMOVED`。

- 处理 delta changes 时，SHALL 使用 normalized exact `### Section: <标题>` header 匹配；normalization SHALL 为 trim 后 case-sensitive equality。
- Section 标题变化时，change SHALL 在 REMOVED section 声明 old title，并在 ADDED section 包含 new title 的完整目标 Section；MUST NOT 使用 `## RENAMED Sections`，因为标题即 identity。
- 创建或修改 Sections 时，target Contract 内 SHALL 不存在 duplicate normalized headers；validation SHALL 将 duplicates 报为 ERROR。
- Acceptance Case 标题变化且没有 stable identity 时，SHALL 显示一个 REMOVED 与一个 ADDED；SHALL NOT 自动推断 rename。

### Section: 变更内 Contract 表达目标稳态

Change-local Section Entries SHALL 使用 ADDED、MODIFIED、REMOVED。ADDED/MODIFIED 携带目标状态下成立的完整内容；正文不承载相对其他状态的变更叙述，MODIFIED 保留该目标中仍成立的案例及 exact Section title。REMOVED 只声明所移除 Section 的 identity，不携带正文、理由或迁移安排；这些安排属于 Change Plan。

Acceptance Cases 是宿主 Section 的内部结构，不独立携带修改语。目标中不存在的案例在完整目标 Section 中省略；呈现层可根据两状态派生案例差异，不把派生操作写回源。

- 删除一个 Section：REMOVED 只含其标题；Expected Model 不保留该 Section 或删除叙述。
- 修改一个 Section 并取消其中一个案例：目标正文直接表达仍成立的承诺和案例。
- 改名 Section：REMOVED 声明旧身份，ADDED 声明新身份及完整目标内容。

### Section: semantic-model instruction 区分结构 token 和填充 prose

写作指导 SHALL 区分解析所需的 canonical tokens 与作者填充的自然语言。`### Section:`、`#### Acceptance Case:`、修改语、identity、schema keys、路径、命令及代码标识保持原文；自然语言遵循有效 proseLanguage。业务规格的四个固定标题保持英文，MODIFIED Section 保持 exact title。

tasks.md SHALL 以 `## Goals`、稳定的 G<n> checkbox、Contract 引用与 Verify 方向组织目标。目标内容使用配置语言，具体实现文件、测试动作及执行日志由 Apply 根据项目证据安排，不写成任务制品的固定格式。

- 中文目标正文可包含 canonical 英文标记；标记不得为迎合 proseLanguage 而翻译。
- 任务引用精确指向 Element 与 Section，验证方向说明条件和可观察结果。

### Section: Proposal 格式

Proposal SHALL 说明发起 Change 的原因、变化范围、来源影响及实施影响，区分 Contract 影响与 Declaration、Relationship、Metamodel、View 的结构影响。说明须足以让用户理解当前问题、目标及破坏性影响，完整目标语义由 Semantic Delta 承载，关键决策由 design.md 承载。

### Section: Change Review 使用统一 Diff IR

系统 SHALL 通过同一 Diff IR 支持 Agent 与用户审阅 active change 的 effective semantic changes。

- **审阅变化**
  - 审阅一个 active change
  - Agent 与用户 MAY 使用 `xirang validate --change <name>` 查看 concise preview
  - MAY 在 `xirang view` 选择该 active change 查看 Contract 与结构 diff

- **Review projections 一致**
  - 同一 Formal 与 change inputs 未变化
  - CLI、JSON 与 Web SHALL 使用一致的 identities、operations、counts 与 diagnostics

### Section: Verb–Noun CLI Command Structure

CLI 命名指导 SHALL 优先采用动作明确的顶层命令；具有内聚生命周期的持久资源可使用稳定名词命名空间，命名空间只聚合该资源的相关操作。

- setup 表达工作区初始化动作。
- candidate init/status/validate/promote 聚合 Candidate 生命周期。
- 未注册命令应报告不存在，不隐式转发到其他操作。

### Section: 精简 Contract 表达

Contract SHALL 只写宿主 Element 在自身层级的职责、保证、约束与行为。Scope 写本 Element 的职责边界，Non-goals 只澄清必要职责排除，不罗列所有不负责的事情；整个 Change 范围属于 proposal，实现取舍与影响设计理解的理由属于 design。

- pi-native-markdown-preview 的“自研 HTTP 预览服务”是实现方案排除，应放 design.md，放入该 Element Contract 的 Scope and Non-goals 属于错误路由。

SHALL 直接写条件、行为和结果，删除不增加含义的解释。表达对照：“系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。”可精简为“来源版本过期时，MUST 拒绝更新，记录保持不变。”

同层同一规则 SHALL 集中表达，其他位置补充不同信息：Scope 不复述完整管线，Business Logic 讲机制，异常部分补异常条件与结果，验收用具体输入和结果验证，不换措辞重复正文。父子 Contract 在不同抽象层级的必要覆盖保持完整，不为去重使父级依赖 children 才能理解承诺。

已有表达在目标模型中仍准确且适当时 SHALL 尽量沿用，只调整受影响内容，不顺带润色整段；用户已确认且清楚的表达不为正式文档化重新包装，条件、数值、例外与时序完整保留。

### Section: 模型演进中的目标表达

模型发生变化时，Agent SHALL 在目标模型上下文中联合审视受影响 Elements 的 Declaration 与 Contract，按需修订，使语义一致，并在各自抽象层级表达完整、合适的语义，避免重复。该要求覆盖持续开发中的增长、精化、重构和精简，不仅适用于新增功能，也不以有限场景清单限制适用范围。

内容 MAY 在适当的抽象层级间迁移、改写，Sections MAY 调整、拆分、合并或消失；原文、Section 数量或位置保持不变不是语义保持的判据。增加子 Element 本身不减少父级职责：父 Contract 仍须独立表达本层完整承诺，子级进一步精化，不要求逐项复制子级细节。声明、Contract 和关系须在同一目标模型中联合判断。

Element 或 Section 消失时 SHALL 判断其承载的语义是被适当位置保留，还是确实移除；实现重构或文件删除不自动授权取消业务承诺。真正改变已确认承诺时遵循当前工作流的用户决策规则。

- **增长后形成父子**：起初一个 Element 足以讲清楚的内容，随开发需要父子 Elements 表达；细节可以移入子级，父级原 Section 可以改写或重新组织，但父级仍独立表达其本层保证。
- **重构后精简**：重构后某些 Element 或 Section 不再存在，内容更精简；仍有效的承诺由目标模型中的适当位置完整承载，不能仅因节点消失就认定承诺已取消。
- **去重时保留精化**：父级表达整体保证、子级表达具体条件与实现该保证的行为；两层必要语义均保留，同层没有换措辞重复同一条规则。
- **无关内容**：调整一个 Element 的内容归属时，仅检查和修改其实际影响范围，不顺带润色其他 Elements。
