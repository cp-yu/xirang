---
element: ai_integration.snack_skill
---
## MODIFIED Requirements

### Requirement: Snack 定位当前架构上下文

Snack SHALL 使用 formal OPSX Semantic Model 的 Project Root、stable elements、abstraction/refinement hierarchy、Element Contracts 与 semantic relationships 定位 context。CodeGraph 或 ACE/`rg`/`read` 仅提供 current implementation evidence。

#### Scenario: [ADDED] Mechanical evidence 不创建 semantic facts
- **WHEN** code 出现 file、symbol、export、import 或 call change
- **THEN** SHALL 作为 implementation evidence
- **AND** MUST NOT 直接创建 element、containment 或 relationship

#### Scenario: [MODIFIED] 不确定 mapping
- **WHEN** code 无法唯一映射到 stable elementId 或 Spec owner
- **THEN** SHALL 标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 按文件名或固定 domain/capability pattern 猜测

#### Scenario: [REMOVED] Mechanical edges 只是 evidence
- **WHEN** 代码出现 file、symbol、export、import 或 call 变化
- **THEN** snack SHALL 将其作为 implementation evidence
- **AND** MUST NOT 直接创建 capability 或 semantic relation

### Requirement: Snack 独立判断 Behavior Source impact

Snack SHALL 独立判断 Element Contract module impact。New/Modified Specs 使用 Spec IDs，每份 Spec 必须 singular bind 一个 stable `elementId`；optional element 没有 Spec 不构成 coverage gap。

#### Scenario: [ADDED] Existing Spec 管理目标 contract
- **WHEN** code change 修改 existing element-owned Spec 管理的 contract
- **THEN** SHALL 声明该 Spec 为 Modified Spec
- **AND** SHALL 保持其 singular owner binding

#### Scenario: [ADDED] 新 contract module
- **WHEN** target element 的 contract 需要独立新 Spec
- **THEN** SHALL 创建 New Spec ID
- **AND** SHALL 声明 `element: <elementId>`

#### Scenario: [ADDED] Required contract 缺失
- **WHEN** Metamodel 要求 contract 且没有 Spec
- **THEN** SHALL 报 source completeness gap
- **AND** MUST NOT 在 owner 未确认时自动创建 Spec

#### Scenario: [MODIFIED] Behavior-preserving refactor
- **WHEN** code 只重构 implementation 且 Element Contract 不变
- **THEN** SHALL NOT 创建 delta Spec
- **AND** later Checks SHALL 使用 `Preserves:` 锚定 formal Spec

#### Scenario: [REMOVED] Existing Spec 管理目标行为
- **WHEN** 代码变化修改已有 formal Spec 管理的 behavior
- **THEN** snack SHALL 将该 Spec ID 声明为 `Modified Specs`
- **AND** SHALL reconcile `specs/<spec-id>/spec.md`

#### Scenario: [REMOVED] 新行为需要 New Spec
- **WHEN** 代码引入 existing Specs 均未管理的 genuinely new observable behavior
- **THEN** snack SHALL 声明新的 Spec ID
- **AND** SHALL 创建 `specs/<spec-id>/spec.md`

#### Scenario: [REMOVED] Coverage 缺失不自动创建 Spec
- **WHEN** OPSX capability 未出现在任何 Spec 的 `capabilities` 数组
- **THEN** snack MUST NOT 仅凭该缺口创建 New Spec
- **AND** SHALL 标记 `[REVIEW NEEDED]`

### Requirement: Snack 独立判断 Architecture Source impact

Snack SHALL 仅在 Metamodel、Project Root、element identity/summary、containment、semantic relationship 或 view 发生 durable change 时声明 graph scope。Implementation-only movement MUST NOT 单独产生 graph operations。

#### Scenario: [ADDED] Durable graph change
- **WHEN** evidence 与 authorized decision 证明 graph fact 改变
- **THEN** proposal SHALL 声明 affected elementIds
- **AND** `architecture-delta.c4` SHALL 定义 exact graph reconciliation

#### Scenario: [ADDED] Graph 不变
- **WHEN** graph facts 保持不变
- **THEN** Architecture Source SHALL 为 `None`
- **AND** SHALL 省略 graph delta

#### Scenario: [MODIFIED] 未解决 impact
- **WHEN** graph impact 无法确定
- **THEN** SHALL 停止写入并询问 focused question
- **AND** MUST NOT 以 no-op 隐藏 uncertainty

#### Scenario: [REMOVED] Durable architecture 变化
- **WHEN** evidence 与 change decisions 证明 durable architecture fact 改变
- **THEN** proposal Architecture Source SHALL 声明 scope
- **AND** `opsx-delta.yaml` SHALL 定义 exact reconciliation

#### Scenario: [REMOVED] 架构不变
- **WHEN** durable architecture facts 保持不变
- **THEN** proposal Architecture Source SHALL 为 `None`
- **AND** OPSX delta SHALL 使用 canonical no-op

### Requirement: Snack 始终生成 OPSX reconciliation result

Snack SHALL 始终报告一个 OPSX Semantic Model reconciliation result：有 graph change 时生成 real `architecture-delta.c4`，只有 contract changes 时省略 graph delta，未解决 decision 时停止。

#### Scenario: [ADDED] Real graph delta
- **WHEN** Architecture Source 声明 graph change
- **THEN** SHALL 基于 formal model、authorized design、Specs 与 code evidence 生成最小 graph operations

#### Scenario: [ADDED] Contract-only reconciliation
- **WHEN** Architecture Source 为 `None` 且 contract modules 改变
- **THEN** SHALL 只 reconcile proposal、design 与 Specs
- **AND** SHALL NOT 创建 canonical no-op graph file

#### Scenario: [REMOVED] Real delta
- **WHEN** Architecture Source 声明 durable change
- **THEN** snack SHALL 基于 proposal scope、completed Specs、design、formal OPSX 与 code evidence 生成最小 operations

#### Scenario: [REMOVED] Canonical no-op
- **WHEN** Architecture Source 为 `None`
- **THEN** delta SHALL 只包含 `schema_version: 2`
- **AND** SHALL NOT 包含空 operation sections
