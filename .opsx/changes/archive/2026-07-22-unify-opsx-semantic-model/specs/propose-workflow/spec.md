---
element: ai_integration.propose_smart_routing
---
## MODIFIED Requirements

### Requirement: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Specs、`design.md`、`tasks.md` 与架构变化所需的 `architecture-delta.c4`。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 OPSX Semantic Model 的 module scopes。

#### Scenario: [MODIFIED] 创建新 change
- **WHEN** 用户明确要求创建 new change
- **AND** semantic readiness 已通过或用户已明确 override
- **AND** 派生 change ID 不存在
- **THEN** workflow SHALL 执行 `opsx new change`
- **AND** SHALL 按 artifact dependency order 生成 apply 所需制品

#### Scenario: [MODIFIED] Readiness 未通过时不创建 change
- **WHEN** semantic readiness 不完整且用户未 override
- **THEN** SHALL 报告缺失项并停止
- **AND** SHALL NOT 创建 change directory

#### Scenario: [MODIFIED] 更新 existing change
- **WHEN** 用户明确要求更新 existing change
- **THEN** SHALL 原地更新
- **AND** SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

#### Scenario: [MODIFIED] New change ID 冲突
- **WHEN** 用户要求 new change 且 ID 已存在
- **THEN** SHALL 停止并要求另一个 ID
- **AND** SHALL NOT 覆盖或自动改名

#### Scenario: [MODIFIED] Identity 不明确且 ID 已存在
- **WHEN** 用户意图未明确区分 update existing change 或 create new change
- **AND** 派生 ID 已存在
- **THEN** SHALL 一次询问用户选择
- **AND** non-interactive mode SHALL fail fast

#### Scenario: [MODIFIED] Workflow stage 边界
- **WHEN** 生成 propose skill
- **THEN** SHALL 声明 PROPOSE 只允许 change artifacts
- **AND** SHALL 禁止 implementation 与 change directory 外写入

### Requirement: Proposal 分离 behavior 与 architecture source impact

Proposal SHALL 保留 canonical `## Source Impact` 兼容结构，并分别声明 contract module scope 与 graph module scope。两部分 SHALL 明确属于同一个 OPSX Semantic Model；Spec ID 与 stable `elementId` 必须分离，Spec SHALL 通过 singular frontmatter binding 对应一个 element。

#### Scenario: [ADDED] Contract scope 使用 Spec ID
- **WHEN** Element Contract behavior 或 guarantee 变化
- **THEN** New/Modified Specs SHALL 使用 Spec IDs
- **AND** change-local Specs SHALL 只为这些 entries 创建或修改

#### Scenario: [ADDED] Graph scope 使用 elementId
- **WHEN** Metamodel、element、containment、summary、relationship 或 view 变化
- **THEN** Architecture Source SHALL 使用 stable `elementId` 或明确的新 element identity
- **AND** exact graph operations SHALL 定义在 `architecture-delta.c4`

#### Scenario: [ADDED] Source module 不变化
- **WHEN** 某 module scope 确认不变
- **THEN** 对应 section SHALL 写 `None`
- **AND** unresolved impact MUST NOT 表示为 `None`

#### Scenario: [ADDED] Optional contract 缺失不创建 Spec
- **WHEN** optional element 没有 Spec
- **THEN** propose MUST NOT 仅凭该状态创建 New Spec
- **AND** required element 缺失 contract SHALL 作为 source completeness gap 处理

#### Scenario: [REMOVED] Behavior Source 使用 Spec ID
- **WHEN** observable behavior 发生变化
- **THEN** `New Specs` 与 `Modified Specs` SHALL 使用 `specs/<spec-id>/spec.md` 对应的 Spec ID
- **AND** change-local Specs SHALL 只为这些 entries 创建或修改

#### Scenario: [REMOVED] Architecture Source 使用 OPSX ID
- **WHEN** durable architecture 发生变化
- **THEN** Architecture Source SHALL 声明受影响的 OPSX nodes、responsibilities、ownership、boundaries 或 relation scope
- **AND** exact target-state operations SHALL 只定义在 `opsx-delta.yaml`

#### Scenario: [REMOVED] Source 不变化
- **WHEN** 某类 source 经确认不变化
- **THEN** 对应 section SHALL 写 `None`
- **AND** unresolved impact MUST NOT 被表示为 `None`

#### Scenario: [REMOVED] 缺失 capability coverage 不创建 Spec
- **WHEN** OPSX capability 不在任何 Spec frontmatter 的 `capabilities` 数组中
- **THEN** propose MUST NOT 仅凭该缺口创建 New Spec
- **AND** 只有 genuinely new observable behavior 才 SHALL 产生 New Spec

### Requirement: Propose 在 OPSX delta 前 reconcile architecture scope

Specs 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal OPSX Semantic Model 与 implementation evidence，再生成 `architecture-delta.c4`。Workflow SHALL 联合检查 change-local Specs 的 singular element bindings。

#### Scenario: [ADDED] Design 改变 graph scope
- **WHEN** design 确认 graph impact 与 proposal 初稿不同
- **THEN** SHALL 更新 proposal Architecture Source
- **AND** exact target graph SHALL 写入 `architecture-delta.c4`

#### Scenario: [ADDED] 无 graph change
- **WHEN** Architecture Source 为 `None`
- **THEN** SHALL 省略 `architecture-delta.c4`
- **AND** SHALL NOT 从 contract change 发明 graph operations

#### Scenario: [ADDED] Binding 指向同一 delta 新 element
- **WHEN** Spec 的 `element` 只存在于同一 graph delta
- **THEN** propose SHALL 在 Target Semantic Model 上联合验证
- **AND** MUST NOT 将其误报为 formal model missing element

#### Scenario: [REMOVED] Design 改变架构判断
- **WHEN** design 确认 durable architecture impact 与 proposal 初稿不同
- **THEN** workflow SHALL 更新 proposal Architecture Source
- **AND** exact reconciliation SHALL 写入 `opsx-delta.yaml`

#### Scenario: [REMOVED] 无架构变化生成 canonical no-op
- **WHEN** Architecture Source 为 `None`
- **THEN** `opsx-delta.yaml` SHALL 只包含 `schema_version: 2`
- **AND** SHALL NOT 从 behavior changes 发明 OPSX operations

### Requirement: Post-propose validation 使用分级 gate

Artifact generation 后，workflow SHALL 检查 compilation scaffolding，并运行一次 combined Semantic Delta validation。Validation SHALL 联合 graph 与 contract modules 构造 Target Semantic Model；ERROR 最多修复一轮并复检一次，残留 ERROR 阻塞 apply，WARNING 只披露。

#### Scenario: [ADDED] Combined Semantic Delta validation
- **WHEN** apply-required artifacts 已生成
- **THEN** SHALL 运行 `opsx validate --change "<name>" --json`
- **AND** SHALL 联合验证 graph syntax、elements、containment、relationships、Spec bindings 与 contracts
- **AND** MUST NOT 执行 `opsx sync`

#### Scenario: [MODIFIED] Lightweight scaffolding checks
- **WHEN** 检查 proposal、design 与 tasks
- **THEN** SHALL 使用 resolved definitions/templates 与 deterministic task structure validation
- **AND** SHALL NOT 发明额外 lint

#### Scenario: [ADDED] ERROR 阻塞
- **WHEN** validation 产生 ERROR
- **THEN** SHALL 最多修复并复检一轮
- **AND** 残留 ERROR SHALL 阻塞 ready-for-apply

#### Scenario: [ADDED] WARNING 不阻塞
- **WHEN** 仅剩 WARNING
- **THEN** final summary SHALL 披露 warnings
- **AND** MAY 声明 ready-for-apply

#### Scenario: [MODIFIED] Validation 全部通过
- **WHEN** scaffolding 与 combined Semantic Delta validation 均无 ERROR
- **THEN** SHALL 继续 scenario label preview/write
- **AND** final summary SHALL 声明 ready-for-apply

#### Scenario: [REMOVED] Combined semantic-source delta validation
- **WHEN** apply-required artifacts 已生成
- **THEN** workflow SHALL 运行 `opsx validate --change "<name>" --json`
- **AND** SHALL 将该命令作为 Specs delta 与 OPSX delta 的 combined validation
- **AND** SHALL NOT 强制重复运行 Specs-scoped 与 OPSX-delta-scoped validation
- **AND** MUST NOT 执行 `opsx sync`

#### Scenario: [REMOVED] Validation ERROR 阻塞
- **WHEN** 初次 validation 或 scaffolding check 产生 ERROR
- **THEN** workflow SHALL 最多执行一轮修复并复检一次
- **AND** 单轮修复后仍有 ERROR 时 SHALL 报告 blockers
- **AND** SHALL NOT 声明 ready-for-apply

#### Scenario: [REMOVED] Validation WARNING 不阻塞
- **WHEN** validation 通过且仅剩 WARNING
- **THEN** final summary SHALL 披露 remaining warnings
- **AND** workflow MAY 声明 ready-for-apply
