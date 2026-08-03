---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: agent-workbench-projection
title: Authoring Conventions
definition: Authoring Conventions 定义契约与变更写作规范：Requirement-Scenario 结构、behavior-first 边界、稳态命名、progressive rigor、Header 即 identity、verb-first CLI 与 structure token/填充 prose 区分。其中项目目录结构语义已被 Semantic Model 四分区存储吸收，不在此重复。
---

## Requirements

### Requirement: Behavior-First Specification Boundary

Element Contracts SHALL 表达其 owner Element 在对应 abstraction level 的可验证 intent、guarantees、constraints、requirements 与 scenarios。Contract SHALL 避免实现、refactor 与 process detail；parent Contract MUST NOT 复制 child contracts，跨 element collaboration SHALL 由 Semantic Relationships 表达。

#### Scenario: Capability-like contract 表达行为
- **WHEN** element kind 的 contract schema 定义 observable behavior
- **THEN** requirements SHALL 聚焦 externally observable behavior、interfaces、error handling 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证

#### Scenario: Parent contract 表达本层 guarantees
- **WHEN** Contract 属于包含 child elements 的 parent
- **THEN** SHALL 表达 parent 本层 aggregate intent、guarantees、cross-child invariants 或 decomposition rationale
- **AND** MUST NOT 逐条复制 child Contracts

#### Scenario: 非 contract 内容路由
- **WHEN** 内容涉及具体 library、类/函数结构、执行机制、call path、refactor rationale、rejected approach 或 exploration notes
- **THEN** SHALL 路由到 `design.md` 或 `tasks.md`
- **AND** MUST NOT 作为 Element Contract 写入

#### Scenario: Requirement 使用稳态名称
- **WHEN** 为 Contract 撰写 requirement
- **THEN** 标题 SHALL 使用持久、可验证的 contract 名称
- **AND** SHALL NOT 使用缺口、恢复、迁移等一次性 change action 命名

#### Scenario: 单一 Requirement 不打包多个能力
- **WHEN** candidate Requirement 覆盖多个互不相关 guarantees 或 behaviors
- **THEN** SHALL 拆分为独立 Requirements
#### Scenario: Writing behavior requirements
- **WHEN** element kind 的 contract schema 管理 observable behavior
- **THEN** requirements SHALL 聚焦 behavior、interfaces、errors 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证
#### Scenario: Routing non-behavior content
- **WHEN** statement 解释 implementation choice、rejected path 或 code organization
- **THEN** SHALL 路由到 `design.md`
#### Scenario: Avoiding implementation leakage
- **WHEN** details 涉及 library、class/function structure、execution mechanics 或 call paths
- **THEN** SHALL 写入 `design.md` 或 `tasks.md`
- **AND** MUST NOT 写入 Element Contract
#### Scenario: 以能力命名 Requirement
- **WHEN** contract schema 表达持久 capability
- **THEN** Requirement title SHALL 使用该 capability 的稳态名称
- **AND** SHALL NOT 使用一次性 change action 命名
### Requirement: Progressive Rigor
息壤 conventions SHALL 默认保持轻量，只在风险或协调复杂度要求时按比例提升严谨度。

#### Scenario: Routine change specification
- **WHEN** change 是本地且低风险
- **THEN** authors 使用简洁、behavior-first requirements，最小仪式

#### Scenario: High-risk or cross-boundary change specification
- **WHEN** change 跨团队、跨仓库、破坏 API contract、迁移密集或安全/隐私敏感
- **THEN** authors 按比例增加细节与显式验证期望

### Requirement: Structured Format for Behavioral Contracts

Element Contracts SHALL 使用一致、可解析的 section headers 与 normative keywords；每份 Contract 通过其宿主 Element 单元自声明绑定唯一 owner。

#### Scenario: Writing requirement sections
- **WHEN** 在 Element Contract 中记录 requirement
- **THEN** 使用 level-3 heading，格式为 `### Requirement: [Name]`
- **AND** 紧接 SHALL 或 MUST statement 描述 target behavior 或 guarantee

#### Scenario: Documenting scenarios
- **WHEN** 记录可验证 case
- **THEN** 使用 `#### Scenario: [Description]`
- **AND** 使用 bold `GIVEN`、`WHEN`、`THEN` 与 `AND` keywords

#### Scenario: Adding implementation details
- **WHEN** scenario step 需要额外可观察细节
- **THEN** MAY 使用简洁嵌套 bullets
- **AND** MUST NOT 用其承载 implementation design
#### Scenario: Following the structured spec format
- **WHEN** writing or updating Xirang specifications
- **THEN** authors SHALL use `### Requirement: ...` followed by at least one `#### Scenario: ...` section
#### Scenario: Use structured headings for behavior
- **WHEN** documenting behavioral requirements
- **THEN** use `### Requirement:` for requirements
- **AND** use `#### Scenario:` for scenarios with bold WHEN/THEN/AND keywords
#### Scenario: Writing requirement sections（稳态附录变体）
- **WHEN** documenting a requirement in a behavioral specification
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL statement describing core behavior
- **AND** keep requirement names descriptive and under 50 characters
#### Scenario: Documenting scenarios（稳态附录变体）
- **WHEN** documenting specific behaviors or use cases
- **THEN** use level-4 headings with format `#### Scenario: [Description]`
- **AND** use bullet points with bold keywords for steps:
  - **GIVEN** for initial state (optional)
  - **WHEN** for conditions or triggers
  - **THEN** for expected outcomes
  - **AND** for additional outcomes or conditions
#### Scenario: Adding implementation details（稳态附录变体）
- **WHEN** a step requires additional detail
- **THEN** use sub-bullets under the main step
- **AND** maintain consistent indentation
  - Sub-bullets provide examples or specifics
  - Keep sub-bullets concise
### Requirement: Header-Based Requirement Identification

Requirement headers SHALL 作为 Formal 与 change-local 源之间的 unique identity。Requirement operation vocabulary SHALL 只有 `ADDED`、`MODIFIED`、`REMOVED`。

#### Scenario: Matching requirements programmatically
- **WHEN** 处理 delta changes
- **THEN** SHALL 使用 normalized exact `### Requirement: <name>` header 匹配
- **AND** normalization SHALL 为 trim 后 case-sensitive equality

#### Scenario: Handling requirement renames
- **WHEN** Requirement title 变化
- **THEN** change SHALL 在 REMOVED section 声明 old title
- **AND** SHALL 在 ADDED section 包含 new title 的完整 target Requirement
- **AND** MUST NOT 使用 `## RENAMED Requirements`

#### Scenario: Validating header uniqueness
- **WHEN** 创建或修改 requirements
- **THEN** target Contract 内 SHALL 不存在 duplicate normalized headers
- **AND** validation SHALL 将 duplicates 报为 ERROR
#### Scenario: Scenario title 变化
- **WHEN** Formal 与 Target 使用不同 Scenario title 且没有 stable Scenario ID
- **THEN** SHALL 显示一个 REMOVED Scenario 与一个 ADDED Scenario
- **AND** SHALL NOT 自动推断 rename
#### Scenario: Matching requirements programmatically（稳态附录变体）
- **WHEN** processing delta changes
- **THEN** use the `### Requirement: [Name]` header as the unique identifier
- **AND** match using normalized headers: `normalize(header) = trim(header)`
- **AND** compare headers with case-sensitive equality after normalization
#### Scenario: Handling requirement renames（稳态附录变体）
- **WHEN** renaming a requirement
- **THEN** use a special `RENAMED section` section
- **AND** specify both old and new names explicitly:
  ```markdown
  RENAMED section
  - FROM: `### Requirement: Old Name`
  - TO: `### Requirement: New Name`
  ```
- **AND** if content also changes, include under MODIFIED using the NEW header
#### Scenario: Validating header uniqueness（稳态附录变体）
- **WHEN** creating or modifying requirements
- **THEN** ensure no duplicate headers exist within a spec
- **AND** validation tools SHALL flag duplicate headers as errors

#
### Requirement: Change-local contracts express target steady state

Change-local Contracts SHALL 仅使用 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections；Requirement 与 Scenario body SHALL 描述目标稳态。Scenario operation metadata MUST NOT 写入 source。

#### Scenario: ADDED 正文直接描述行为
- **WHEN** change 引入新行为
- **THEN** ADDED Requirement SHALL 使用 durable capability name 与 normative target-state text
- **AND** SHALL NOT 使用 change-log narration

#### Scenario: MODIFIED 包含完整目标状态
- **WHEN** existing Requirement 的行为或 Scenario set 变化
- **THEN** MODIFIED block SHALL 包含完整 target Requirement
- **AND** SHALL 包含全部 surviving Scenarios
- **AND** existing Requirement title SHALL 保持 exact matching

#### Scenario: Scenario operations 由 Diff IR 派生
- **WHEN** validate、diff 或 view 比较 Formal 与 Target Requirement
- **THEN** SHALL 派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED presentation
- **AND** derived operation SHALL NOT 写回 change-local source
#### Scenario: 行为定义不引用变更上下文
- **WHEN** Requirement 依赖“原有”“本次”等 change narration 才能理解
- **THEN** SHALL 改写为 target steady state
#### Scenario: Creating change proposals with additions
- **WHEN** change 增加 Requirement
- **THEN** `## ADDED Requirements` SHALL 包含完整 target Requirement 与 Scenarios
#### Scenario: Delta operation 使用三种 sections
- **WHEN** change-local Contract 增加、修改或删除 Requirement
- **THEN** SHALL 只使用 `ADDED`、`MODIFIED`、`REMOVED` sections
- **AND** body SHALL 描述 target steady state
#### Scenario: Creating change proposals with modifications
- **WHEN** change 修改 existing Requirement
- **THEN** `## MODIFIED Requirements` SHALL 使用 exact existing title
- **AND** SHALL 包含完整 target statement 与全部 surviving Scenarios
#### Scenario: Creating change proposals with removals
- **WHEN** change 删除 Requirement
- **THEN** `## REMOVED Requirements` SHALL 声明 exact title、Reason 与 Migration
#### Scenario: Scenario 删除通过省略表达
- **WHEN** existing Scenario 在目标稳态中不再存在
- **THEN** Agent-authored MODIFIED Requirement SHALL 省略该 Scenario
- **AND** MUST NOT 编写 removed Scenario block 或 operation label
#### Scenario: Scenario operation 派生
- **WHEN** `MODIFIED Requirement` 的 target Scenario set 与 Formal 不同
- **THEN** 浏览器 SHALL 通过 title 与 body 比较派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED 状态
- **AND** SHALL NOT 读取 change-local Scenario operation labels
#### Scenario: Creating change proposals with additions（稳态附录变体）
- **WHEN** creating a change proposal that adds new requirements
- **THEN** include only the new requirements under `## ADDED Requirements`
- **AND** each requirement SHALL include its complete content
- **AND** use the standard structured format for requirements and scenarios
#### Scenario: Creating change proposals with modifications（稳态附录变体）
- **WHEN** creating a change proposal that modifies existing requirements
- **THEN** include the modified requirements under `## MODIFIED Requirements`
- **AND** use the same header text as in the current spec (normalized)
- **AND** include the complete modified requirement (not a diff)
- **AND** optionally annotate what changed with inline comments like `← (was X)`
#### Scenario: Creating change proposals with removals（稳态附录变体）
- **WHEN** creating a change proposal that removes requirements
- **THEN** list them under `## REMOVED Requirements`
- **AND** use the normalized header text for identification
- **AND** include reason for removal
- **AND** document any migration path if applicable

The change `elements/` 分区的 delta 单元 SHALL contain:
- Delta units showing only what changes, one unit per affected Element
- Sections for ADDED, MODIFIED, REMOVED requirements (and REMOVED+ADDED for renames)
- Normalized header matching for requirement identification
- Complete requirements using the structured format
- Clear indication of change type for each requirement
### Requirement: spec-driven instruction 区分结构 token 和填充 prose
Spec-driven artifact instructions SHALL 明确 parse-sensitive 结构 token 保持 canonical，agent 填充的新写或改写 prose 跟随 `proseLanguage`。

#### Scenario: specs instruction 标注 Requirement 和 Scenario title 语言
- **WHEN** agent 创建 delta contract
- **THEN** instructions SHALL 指出 `### Requirement:` 和 `#### Scenario:` 标记保持 canonical
- **AND** new Requirement titles 和 new Scenario titles SHALL 跟随 `proseLanguage`
- **AND** MODIFIED section 中 exact matching 所需的 existing Requirement titles SHALL 保持原文
#### Scenario: tasks instruction 标注 task 和 check prose 语言
- **WHEN** agent 创建 `tasks.md`
- **THEN** instructions SHALL 指出 `### Task N:`、`Goal`、`Files`、`Requirements`、`Checks`、`Verifies:`、`Command:`、`Evidence:` 与 `Expect:` 等结构标签保持 canonical
- **AND** task titles、check names、requirements bullet prose、`Evidence:` 与 `Expect:` descriptions SHALL 跟随 `proseLanguage`
### Requirement: Proposal 格式

Proposal SHALL 显式记录全部变化，并提供清晰的 from/to 对比。

#### Scenario: Documenting changes

- **WHEN** 记录 what changes
- **THEN** proposal SHALL 为每项变化描述 `From:` 当前状态、`To:` 目标状态、`Reason:` 变更原因与 `Impact:` 破坏性/影响范围
#### Scenario: Documenting changes（稳态附录变体）
- **WHEN** documenting what changes
- **THEN** the proposal SHALL explicitly describe each change:

```markdown
**[Section or Behavior Name]**
- From: [current state/requirement]
- To: [future state/requirement]
- Reason: [why this change is needed]
- Impact: [breaking/non-breaking, who's affected]
```

This explicit format compensates for not having inline diffs and ensures reviewers understand exactly what will change.
### Requirement: Change Review 使用统一 Diff IR

系统 SHALL 通过同一 Diff IR 支持 Agent 与用户审阅 active change 的 effective semantic changes。

#### Scenario: Reviewing changes
- **WHEN** 审阅一个 active change
- **THEN** Agent 与用户 MAY 使用 `xirang validate --change <name>` 查看 concise preview
- **AND** MAY 在 `xirang view` 选择该 active change 查看 Contract 与结构 diff

#### Scenario: Review projections 一致
- **WHEN** 同一 Formal 与 change inputs 未变化
- **THEN** CLI、JSON 与 Web SHALL 使用一致的 identities、operations、counts 与 diagnostics
#### Scenario: Reviewing changes（稳态附录变体）
- **WHEN** reviewing proposed changes
- **THEN** reviewers can compare using:
- GitHub PR diff view when changes are committed
- Command line: `xirang validate --change <name>` 的只读 concise preview（`xirang view` 中浏览 Contract 与结构 diff）
- Any visual diff tool comparing current vs future state

The system relies on CLI diff projection rather than storing diffs.
### Requirement: Verb–Noun CLI Command Structure
Xirang CLI SHALL 优先使用动作明确的顶层 commands，但 MAY 为具有内聚 lifecycle 的 durable resource 提供稳定 noun namespace。

#### Scenario: Setup 使用动词 command
- **WHEN** 用户创建或刷新 project setup
- **THEN** SHALL 使用 `xirang setup`
- **AND** SHALL NOT 保留退役命令 alias

#### Scenario: Candidate 使用 resource namespace
- **WHEN** 用户管理 active Semantic Model Candidate
- **THEN** SHALL 使用 `xirang candidate init|status|validate|promote`
- **AND** noun namespace SHALL 只聚合该 resource 的内聚 lifecycle operations

#### Scenario: 退役 command family
- **WHEN** 用户请求退役命令
- **THEN** CLI SHALL 报告 command 不存在
- **AND** SHALL NOT 自动转发到其他命令
