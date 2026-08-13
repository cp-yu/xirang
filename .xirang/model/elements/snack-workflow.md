---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、制品定义先行写作、不生成 `tasks.md` 与自检流程。
---

## Requirements

### Requirement: Snack 条件式 reconcile artifacts

Snack SHALL 默认创建新的 Change，并 SHALL 仅在用户明确要求修改当前或已有 Change 时更新已有 Change。Snack SHALL 将 `proposal.md`、`design.md`、delta Contracts 与 Semantic Delta 分类为 missing、stale、inconsistent 或 current，仅修改 missing、stale 或 inconsistent 内容。

#### Scenario: 默认创建新 Change

- **WHEN** 用户调用 Snack 且未明确要求修改当前或已有 Change
- **THEN** Snack SHALL 从 implementation evidence 拟定新的 kebab-case Change ID
- **AND** SHALL 使用 `xirang list --json` 确认该 ID 未被占用
- **AND** SHALL 执行 `xirang new change "<name>"`
- **AND** SHALL 只创建 evidence 需要的 artifacts

#### Scenario: Implementation evidence 无法形成清晰 ID

- **WHEN** 用户未提供 Change ID 且 implementation evidence 无法形成清晰的新 ID
- **THEN** Snack SHALL 询问用户提供 Change ID
- **AND** SHALL NOT 猜测 Change ID

#### Scenario: 明确更新已有 Change

- **WHEN** 用户明确要求修改指定的已有 Change
- **THEN** Snack SHALL 使用该 Change ID 进入更新模式
- **AND** SHALL 先读取已有 artifacts
- **AND** SHALL 保留 unrelated human-authored content

#### Scenario: 明确更新当前 Change 但未命名

- **WHEN** 用户明确要求修改当前 Change 但未提供 Change ID
- **THEN** Snack SHALL 使用 `xirang list --json` 解析唯一 active Change
- **AND** active Change 为多个或不存在时 SHALL 询问目标 Change

#### Scenario: 新建 Change ID 已存在

- **WHEN** 默认新建模式拟定或接收的 Change ID 已存在且用户未明确要求更新
- **THEN** Snack SHALL 停止并要求不同的 Change ID
- **AND** SHALL NOT 将已存在的 Change ID 本身解释为更新意图
- **AND** SHALL NOT 更新该已有 Change
- **AND** SHALL NOT 自动生成替代 ID

### Requirement: Snack 收集多源代码证据

Snack SHALL 将 conversation context、working-tree diff、staged diff、HEAD diff 与用户指定 commit/range 组成 evidence union。`git diff` MUST NOT 被视为唯一 evidence。

#### Scenario: 自然语言 range

- **WHEN** 用户用自然语言指定 commit、branch 或 range
- **THEN** snack SHALL 将其解析为 evidence selector
- **AND** SHALL NOT 将其当作 CLI flag

### Requirement: Snack 定位当前架构上下文

Snack SHALL 使用 Formal Semantic Model 的 Project Root、stable elements、abstraction/refinement hierarchy、Element Contracts 与 semantic relationships 定位 context。CodeGraph 或 `rg`/`read` 仅提供 current implementation evidence。

#### Scenario: Mechanical evidence 不创建 semantic facts

- **WHEN** code 出现 file、symbol、export、import 或 call change
- **THEN** SHALL 作为 implementation evidence
- **AND** MUST NOT 直接创建 element、containment 或 relationship

#### Scenario: 不确定 mapping

- **WHEN** code 无法唯一映射到 stable elementId 或 Contract owner
- **THEN** SHALL 标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 按文件名或固定层级 pattern 猜测

### Requirement: Snack 独立判断 Behavior Source impact

Snack SHALL 独立判断 Element Contract impact。Element 的 Contract 由该 Element 的稳定 identity 定位（Contract 正文承载于宿主 Element 的 `elements/` 单元，一个 Element 至多一个 Contract）；optional element 没有 Contract 不构成 coverage gap。

#### Scenario: 新 contract module

- **WHEN** target element 的 contract 需要独立新 Contract
- **THEN** SHALL 在 change `elements/` 分区为该 Element 创建或更新 delta 单元
- **AND** SHALL 使用该 Element 的稳定 identity 定位宿主单元

#### Scenario: Behavior-preserving refactor

- **WHEN** code 只重构 implementation 且 Element Contract 不变
- **THEN** SHALL NOT 创建 delta Contract
- **AND** later Checks SHALL 使用 `Preserves:` 锚定 formal Contract

#### Scenario: Required contract 缺失

- **WHEN** Metamodel 要求 contract 且宿主 Element 没有 Contract
- **THEN** SHALL 报 source completeness gap
- **AND** MUST NOT 在 owner 未确认时自动创建 Contract 单元

### Requirement: Snack 独立判断 Architecture Source impact

Snack SHALL 仅在 Metamodel、Project Root、element identity/definition、containment、semantic relationship 或 view 发生 durable change 时声明 graph scope。Implementation-only movement MUST NOT 单独产生 graph operations。

#### Scenario: Durable graph change

- **WHEN** evidence 与 authorized decision 证明 graph fact 改变
- **THEN** proposal SHALL 声明 affected elementIds
- **AND** Semantic Delta SHALL 定义 exact graph reconciliation

#### Scenario: Graph 不变

- **WHEN** graph facts 保持不变
- **THEN** Architecture Source SHALL 为 `None`
- **AND** SHALL 省略 graph delta

#### Scenario: 未解决 impact

- **WHEN** graph impact 无法确定
- **THEN** SHALL 停止写入并询问 focused question
- **AND** MUST NOT 以 no-op 隐藏 uncertainty

### Requirement: Snack 使用 Source Impact reconcile Proposal

Snack SHALL 运行 proposal instructions，并使用 canonical `## Source Impact` 独立记录 Behavior Source 与 Architecture Source。Behavior Source 使用 Element 稳定 identity（全局寻址 `<element identity>#<Requirement name>`），与 graph 使用的 identity 属于同一 identity 空间。

#### Scenario: Current proposal 保持不变

- **WHEN** proposal 已与 evidence 和 source impact 一致
- **THEN** snack SHALL 不修改该 artifact

#### Scenario: Behavior Source 驱动 Specs

- **WHEN** snack reconcile proposal
- **THEN** New/Modified Contracts SHALL 使用宿主 Element 的稳定 identity 声明
- **AND** 同一列表 SHALL 驱动后续 delta Contracts
- **AND** MUST NOT 使用 Xirang capability ID 作为 Contract 目录名

### Requirement: Snack 始终生成 reconciliation result

Snack SHALL 始终报告一个 Semantic Model reconciliation result：有 graph change 时生成 real Semantic Delta，只有 contract changes 时省略 graph delta，未解决 decision 时停止。

#### Scenario: Contract-only reconciliation

- **WHEN** Architecture Source 为 `None` 且 elements/ 单元中的 Element Contracts 改变
- **THEN** SHALL 只 reconcile proposal、design 与 Contracts
- **AND** SHALL NOT 创建 canonical no-op graph 单元

#### Scenario: Real graph delta

- **WHEN** Architecture Source 声明 graph change
- **THEN** SHALL 基于 formal model、authorized design、Contracts 与 code evidence 生成最小 graph operations

### Requirement: Snack 不生成 tasks

Snack SHALL NOT 生成 `tasks.md`。

#### Scenario: 跳过 tasks

- **WHEN** artifact reconciliation 完成
- **THEN** snack SHALL NOT 创建 `tasks.md`

### Requirement: Snack 执行一次自检

Snack SHALL 运行 full change validation，并审阅统一 effective semantic diff。出现 ERROR/WARNING 时 SHALL 修复一轮并复检一次；validation 无 ERROR 后 SHALL 审阅 effective diff，且 MUST NOT 生成或写入 Scenario labels。

#### Scenario: 输出 reconciliation result

- **WHEN** self-check 与 diff review 完成
- **THEN** summary SHALL 披露 validation pass 或 remaining issues
- **AND** SHALL 汇总 effective Contract 与 Architecture operations
- **AND** SHALL 提供 quick sync、sync-and-archive（Sync 完成后 Archive）与 continue-development paths

#### Scenario: Unexpected effective operation

- **WHEN** Diff IR 包含 evidence 与 authorized intent 无法支持的 operation
- **THEN** Snack SHALL 修正 proposal、Contracts、design 或 Semantic Delta source
- **AND** SHALL NOT 通过编辑只读 preview 输出解决

### Requirement: 仅对已授权结构 reconciliation 应用拆分指导

Snack Workflow SHALL 仅当 conversation context、Formal Semantic Model 与 implementation evidence 共同证明本次已发生实现需要新增或重组 durable hierarchy 时消费 normalized `decomposition`。拆分指导 SHALL 帮助形成目标结构，SHALL NOT 将文件、symbol、import 或 call 变化直接提升为 Element 或 containment。

#### Scenario: 已发生实现包含结构变化

- **WHEN** 授权证据明确要求新增 Element 或改变 hierarchy
- **THEN** Snack 使用配置的方法或调用配置的 skill 形成目标 sibling set
- **AND** 仍以 Formal Semantic Model 与用户意图确定 stable identity 和边界

#### Scenario: 实现移动但结构语义不变

- **WHEN** code 只发生文件移动、重命名、import 或调用重排且 durable graph facts 不变
- **THEN** Snack 不调用 decomposition skill
- **AND** Architecture Source 保持 `None`

#### Scenario: 拆分结果无法由证据授权

- **WHEN** 方法或 skill 建议的结构超出已发生实现和用户授权
- **THEN** Snack 不写入该结构
- **AND** 标记需要用户确认而不借机重排 Formal 模型

#### Scenario: custom skill 不可用

- **WHEN** 已确认需要结构 reconciliation 但配置的 skill 找不到或调用失败
- **THEN** Snack fail closed 并报告逻辑名称
- **AND** 不生成猜测性的 hierarchy Delta

### Requirement: Snack 使用制品定义先行写作

每个 artifact 写入前，snack SHALL 读取 resolved `definition`，按内容归属判断，遵守 write policy，再执行 `instruction` 并填充 `template`。Projection、context、rules 与 reasoning MUST NOT 被复制进 artifact。

#### Scenario: Design 保持 template

- **WHEN** snack reconcile `design.md`
- **THEN** SHALL 保持 Context、Goals / Non-Goals、Decisions、Risks / Trade-offs
- **AND** inferred content SHALL 标记 `[INFERRED FROM CODE]`
