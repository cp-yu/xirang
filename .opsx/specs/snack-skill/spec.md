---
element: project.root/domain.ai_integration/cap.ai.snack-reconciliation
---

# snack-skill Specification

## Purpose

定义 snack 从已写代码反向 reconcile proposal、delta Specs、design 与 architecture delta 的 code-first workflow；不生成 `tasks.md`。
## Requirements
### Requirement: Snack 条件式 reconcile artifacts

Snack SHALL 支持新建 change 与更新已有 change，并将 `proposal.md`、`design.md`、delta Specs 与 `architecture-delta.c4` 分类为 missing、stale、inconsistent 或 current。仅 missing、stale 或 inconsistent 内容 SHALL 被修改。

#### Scenario: 新 change
- **WHEN** 目标 change 不存在
- **THEN** snack SHALL 执行 `opsx new change "<name>"`
- **AND** SHALL 只创建 evidence 需要的 artifacts

#### Scenario: 已有 change
- **WHEN** 目标 change 已存在
- **THEN** snack SHALL 先读取已有 artifacts
- **AND** SHALL 保留 unrelated human-authored content

### Requirement: Snack 收集多源代码证据

Snack SHALL 将 conversation context、working-tree diff、staged diff、HEAD diff 与用户指定 commit/range 组成 evidence union。`git diff` MUST NOT 被视为唯一 evidence。

#### Scenario: 自然语言 range
- **WHEN** 用户用自然语言指定 commit、branch 或 range
- **THEN** snack SHALL 将其解析为 evidence selector
- **AND** SHALL NOT 将其当作 OPSX CLI flag

### Requirement: Snack 定位当前架构上下文

Snack SHALL 使用 formal OPSX Semantic Model 的 Project Root、stable elements、abstraction/refinement hierarchy、Element Contracts 与 semantic relationships 定位 context。CodeGraph 或 ACE/`rg`/`read` 仅提供 current implementation evidence。

#### Scenario: Mechanical evidence 不创建 semantic facts
- **WHEN** code 出现 file、symbol、export、import 或 call change
- **THEN** SHALL 作为 implementation evidence
- **AND** MUST NOT 直接创建 element、containment 或 relationship

#### Scenario: 不确定 mapping
- **WHEN** code 无法唯一映射到 stable elementId 或 Spec owner
- **THEN** SHALL 标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 按文件名或固定 domain/capability pattern 猜测

### Requirement: Snack 独立判断 Behavior Source impact

Snack SHALL 独立判断 Element Contract module impact。New/Modified Specs 使用 Spec IDs，每份 Spec 必须 singular bind 一个 stable `elementId`；optional element 没有 Spec 不构成 coverage gap。

#### Scenario: Existing Spec 管理目标 contract
- **WHEN** code change 修改 existing element-owned Spec 管理的 contract
- **THEN** SHALL 声明该 Spec 为 Modified Spec
- **AND** SHALL 保持其 singular owner binding

#### Scenario: 新 contract module
- **WHEN** target element 的 contract 需要独立新 Spec
- **THEN** SHALL 创建 New Spec ID
- **AND** SHALL 声明 `element: <elementId>`

#### Scenario: Required contract 缺失
- **WHEN** Metamodel 要求 contract 且没有 Spec
- **THEN** SHALL 报 source completeness gap
- **AND** MUST NOT 在 owner 未确认时自动创建 Spec

#### Scenario: Behavior-preserving refactor
- **WHEN** code 只重构 implementation 且 Element Contract 不变
- **THEN** SHALL NOT 创建 delta Spec
- **AND** later Checks SHALL 使用 `Preserves:` 锚定 formal Spec

### Requirement: Snack 独立判断 Architecture Source impact

Snack SHALL 仅在 Metamodel、Project Root、element identity/summary、containment、semantic relationship 或 view 发生 durable change 时声明 graph scope。Implementation-only movement MUST NOT 单独产生 graph operations。

#### Scenario: Durable graph change
- **WHEN** evidence 与 authorized decision 证明 graph fact 改变
- **THEN** proposal SHALL 声明 affected elementIds
- **AND** `architecture-delta.c4` SHALL 定义 exact graph reconciliation

#### Scenario: Graph 不变
- **WHEN** graph facts 保持不变
- **THEN** Architecture Source SHALL 为 `None`
- **AND** SHALL 省略 graph delta

#### Scenario: 未解决 impact
- **WHEN** graph impact 无法确定
- **THEN** SHALL 停止写入并询问 focused question
- **AND** MUST NOT 以 no-op 隐藏 uncertainty

### Requirement: Snack 使用 Source Impact reconcile Proposal

Snack SHALL 运行 proposal instructions，并使用 canonical `## Source Impact` 独立记录 Behavior Source 与 Architecture Source。Spec IDs 与 OPSX node IDs MUST 保持分离。

#### Scenario: Behavior Source 驱动 Specs
- **WHEN** snack reconcile proposal
- **THEN** New/Modified Specs SHALL 使用 Spec IDs
- **AND** 同一列表 SHALL 驱动后续 delta Specs
- **AND** MUST NOT 使用 OPSX capability ID 作为 Spec 目录名

#### Scenario: Current proposal 保持不变
- **WHEN** proposal 已与 evidence 和 source impact 一致
- **THEN** snack SHALL 不修改该 artifact

### Requirement: Snack 使用 definition-first authoring

每个 artifact 写入前，snack SHALL 读取 resolved `definition`，按 `content.includes`/`content.excludes` 判断内容归属，遵守 `writePolicy`，再执行 `instruction` 并填充 `template`。Projection、context、rules 与 reasoning MUST NOT 被复制进 artifact。

#### Scenario: Specs 使用 Spec ID 路径
- **WHEN** snack reconcile delta Specs
- **THEN** SHALL 使用 `specs/<spec-id>/spec.md`
- **AND** SHALL 遵守 ADDED/MODIFIED/REMOVED/RENAMED、exact title matching 与 scenario label guidance

#### Scenario: Design 保持 template
- **WHEN** snack reconcile `design.md`
- **THEN** SHALL 保持 Context、Goals / Non-Goals、Decisions、Risks / Trade-offs
- **AND** inferred content SHALL 标记 `[INFERRED FROM CODE]`

### Requirement: Snack 始终生成 OPSX reconciliation result

Snack SHALL 始终报告一个 OPSX Semantic Model reconciliation result：有 graph change 时生成 real `architecture-delta.c4`，只有 contract changes 时省略 graph delta，未解决 decision 时停止。

#### Scenario: Real graph delta
- **WHEN** Architecture Source 声明 graph change
- **THEN** SHALL 基于 formal model、authorized design、Specs 与 code evidence 生成最小 graph operations

#### Scenario: Contract-only reconciliation
- **WHEN** Architecture Source 为 `None` 且 contract modules 改变
- **THEN** SHALL 只 reconcile proposal、design 与 Specs
- **AND** SHALL NOT 创建 canonical no-op graph file

### Requirement: Snack 不生成 tasks

Snack SHALL NOT 生成 `tasks.md`。

#### Scenario: 跳过 tasks
- **WHEN** artifact reconciliation 完成
- **THEN** snack SHALL NOT 创建 `tasks.md`

### Requirement: Snack 执行一次自检与程序化 labels

Snack SHALL 运行 full change validation。出现 ERROR/WARNING 时 SHALL 修复一轮并复检一次。最终 validation 后 SHALL 执行 `opsx scenario-labels "<name>" --write`，且 SHALL NOT 仅因 labels 再运行 validate。

#### Scenario: 输出结果
- **WHEN** 自检完成
- **THEN** summary SHALL 披露 pass 或 remaining issues
- **AND** SHALL 提供 quick sync、quick archive、sync-and-archive 与 continue-development 路径
