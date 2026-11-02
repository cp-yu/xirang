---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: agent-workbench-projection
title: Authoring Conventions
definition: Authoring Conventions 定义契约与变更写作规范：Section 结构与自由载体、behavior-first 边界、稳态命名、progressive rigor、Header 即 identity、verb-first CLI 与 structure token/填充 prose 区分。其中项目目录结构语义已被 Semantic Model 四分区存储吸收，不在此重复。
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

Change-local Contracts SHALL 仅使用 `ADDED`、`MODIFIED`、`REMOVED` Section sections；Section 与 Acceptance Case body SHALL 描述目标稳态。Acceptance Case operation metadata MUST NOT 写入 source。

- **ADDED 正文直接描述行为**
  - change 引入新行为
  - ADDED Section SHALL 使用 durable capability name 与 normative target-state text
  - SHALL NOT 使用 change-log narration

- **MODIFIED 包含完整目标状态**
  - existing Section 的行为或 Acceptance Case set 变化
  - MODIFIED block SHALL 包含完整 target Section
  - SHALL 包含全部 surviving Acceptance Cases
  - existing Section 标题 SHALL 保持 exact matching

- **Acceptance Case operations 由 Diff IR 派生**
  - validate、diff 或 view 比较 Formal 与 Target Section
  - SHALL 派生 Acceptance Case ADDED、MODIFIED、REMOVED 或 UNCHANGED presentation
  - derived operation SHALL NOT 写回 change-local source

- **行为定义不引用变更上下文**
  - Section 依赖“原有”“本次”等 change narration 才能理解
  - SHALL 改写为 target steady state

- **Creating change proposals with additions**
  - change 增加 Section
  - `## ADDED Sections` SHALL 包含完整 target Section 与 Acceptance Cases

- **Delta operation 使用三种 sections**
  - change-local Contract 增加、修改或删除 Section
  - SHALL 只使用 `ADDED`、`MODIFIED`、`REMOVED` sections
  - body SHALL 描述 target steady state

- **Creating change proposals with modifications**
  - change 修改 existing Section
  - `## MODIFIED Sections` SHALL 使用 exact existing title
  - SHALL 包含完整 target statement 与全部 surviving Acceptance Cases

- **Creating change proposals with removals**
  - change 删除 Section
  - `## REMOVED Sections` SHALL 声明 exact title、Reason 与 Migration

- **Acceptance Case 删除通过省略表达**
  - existing Acceptance Case 在目标稳态中不再存在
  - Agent-authored MODIFIED Section SHALL 省略该 Acceptance Case
  - MUST NOT 编写 removed Acceptance Case block 或 operation label

- **Acceptance Case operation 派生**
  - `MODIFIED Section` 的 target Acceptance Case set 与 Formal 不同
  - 浏览器 SHALL 通过 title 与 body 比较派生 Acceptance Case ADDED、MODIFIED、REMOVED 或 UNCHANGED 状态
  - SHALL NOT 读取 change-local Acceptance Case operation labels

Change `elements/` 分区的 delta 单元 SHALL：
- 只表达变化本身，每个受影响的 Element 一个单元
- 以 `## ADDED`、`## MODIFIED`、`## REMOVED` Sections 分节；rename 表达为 REMOVED 旧标题加 ADDED 新标题
- 以 normalized header 匹配 Section identity
- ADDED 与 MODIFIED 的 Section 携带完整目标内容
- 每个 Section 的修改语明确

### Section: semantic-model instruction 区分结构 token 和填充 prose

Semantic-model artifact instructions SHALL 明确 parse-sensitive 结构 token 保持 canonical，agent 填充的新写或改写 prose 跟随 `proseLanguage`。

- **specs instruction 标注 Section 与 Acceptance Case 标题语言**
  - agent 创建 delta contract
  - instructions SHALL 指出 `### Section:` 和 `#### Acceptance Case:` 标记保持 canonical
  - new Section 标题 与 new Acceptance Case 标题 SHALL 跟随 `proseLanguage`，但业务规格的四个固定 Section 标题 SHALL 保留英文 canonical 形式
  - MODIFIED section 中 exact matching 所需的 existing Section 标题 SHALL 保持原文

- **tasks instruction 标注 task 与 check prose 语言**
  - agent 创建 `tasks.md`
  - instructions SHALL 指出 `### Task N:`、`Goal`、`Files`、`Sections`、`Checks`、`Verifies:`、`Command:`、`Evidence:` 与 `Expect:` 等结构标签保持 canonical
  - task titles、check names、Sections bullet prose、`Evidence:` 与 `Expect:` descriptions SHALL 跟随 `proseLanguage`

### Section: Proposal 格式

Proposal SHALL 显式记录全部变化，并提供清晰的 from/to 对比。

- **记录变化**
  - 记录 what changes
  - proposal SHALL 为每项变化描述 `From:` 当前状态、`To:` 目标状态、`Reason:` 变更原因与 `Impact:` 破坏性/影响范围

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

Xirang CLI SHALL 优先使用动作明确的顶层 commands，但 MAY 为具有内聚 lifecycle 的 durable resource 提供稳定 noun namespace。

- **Setup 使用动词 command**
  - 用户创建或刷新 project setup
  - SHALL 使用 `xirang setup`
  - SHALL NOT 保留退役命令 alias

- **Candidate 使用 resource namespace**
  - 用户管理 active Semantic Model Candidate
  - SHALL 使用 `xirang candidate init|status|validate|promote`
  - noun namespace SHALL 只聚合该 resource 的内聚 lifecycle operations

- **退役 command family**
  - 用户请求退役命令
  - CLI SHALL 报告 command 不存在
  - SHALL NOT 自动转发到其他命令

### Section: 精简 Contract 表达

Contract SHALL 只写宿主 Element 在自身层级的职责、保证、约束与行为。Scope 写本 Element 的职责边界，Non-goals 只澄清必要职责排除，不罗列所有不负责的事情；整个 Change 范围属于 proposal，实现取舍与影响设计理解的理由属于 design。

- pi-native-markdown-preview 的“自研 HTTP 预览服务”是实现方案排除，应放 design.md，放入该 Element Contract 的 Scope and Non-goals 属于错误路由。

SHALL 直接写条件、行为和结果，删除不增加含义的解释。表达对照：“系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。”可精简为“来源版本过期时，MUST 拒绝更新，记录保持不变。”

同层同一规则 SHALL 集中表达，其他位置补充不同信息：Scope 不复述完整管线，Business Logic 讲机制，异常部分补异常条件与结果，验收用具体输入和结果验证，不换措辞重复正文。父子 Contract 在不同抽象层级的必要覆盖保持完整，不为去重使父级依赖 children 才能理解承诺。

已有表达准确时 SHALL 尽量沿用，只改受影响行为，不顺带润色整段；用户已确认且清楚的表达不为正式文档化重新包装，条件、数值、例外与时序完整保留。
