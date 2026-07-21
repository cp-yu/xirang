---
capabilities:
  - cap.ai.snack-skill
---
# snack-skill Specification

## Purpose

定义 snack 从已写代码反向 reconcile proposal、delta Specs、design 与 OPSX delta 的 code-first workflow；不生成 `tasks.md`。

## Requirements

### Requirement: Snack 条件式 reconcile artifacts

Snack SHALL 支持新建 change 与更新已有 change，并将 `proposal.md`、`design.md`、delta Specs 与 `opsx-delta.yaml` 分类为 missing、stale、inconsistent 或 current。仅 missing、stale 或 inconsistent 内容 SHALL 被修改。

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

Snack SHALL 使用 formal OPSX capability intents、ownership、boundaries 与 relations 定位受影响架构区域。CodeGraph MAY 加速 symbol/call/import discovery；否则 SHALL 使用 ACE、`rg` 与 `read`。Code evidence MUST NOT 单独证明 OPSX change。

#### Scenario: Mechanical edges 只是 evidence
- **WHEN** 代码出现 file、symbol、export、import 或 call 变化
- **THEN** snack SHALL 将其作为 implementation evidence
- **AND** MUST NOT 直接创建 capability 或 semantic relation

#### Scenario: 不确定 mapping
- **WHEN** 代码无法唯一映射到当前架构
- **THEN** snack SHALL 标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 仅按文件名创建 capability

### Requirement: Snack 独立判断 Behavior Source impact

Snack SHALL 根据 observable behavior change 决定 `New Specs` 与 `Modified Specs`，不得根据 OPSX capability coverage 缺失自动创建 Spec。

#### Scenario: Existing Spec 管理目标行为
- **WHEN** 代码变化修改已有 formal Spec 管理的 behavior
- **THEN** snack SHALL 将该 Spec ID 声明为 `Modified Specs`
- **AND** SHALL reconcile `specs/<spec-id>/spec.md`

#### Scenario: 新行为需要 New Spec
- **WHEN** 代码引入 existing Specs 均未管理的 genuinely new observable behavior
- **THEN** snack SHALL 声明新的 Spec ID
- **AND** SHALL 创建 `specs/<spec-id>/spec.md`

#### Scenario: Coverage 缺失不自动创建 Spec
- **WHEN** OPSX capability 未出现在任何 Spec 的 `capabilities` 数组
- **THEN** snack MUST NOT 仅凭该缺口创建 New Spec
- **AND** SHALL 标记 `[REVIEW NEEDED]`

#### Scenario: Behavior-preserving refactor
- **WHEN** 代码只重构实现且 observable behavior 不变
- **THEN** snack SHALL NOT 创建 delta Spec
- **AND** preserved behavior SHALL 由后续 `Preserves:` Check 锚定 formal Spec

### Requirement: Snack 独立判断 Architecture Source impact

Snack SHALL 仅在 durable capability responsibility、domain boundary、ownership 或 semantic relation 变化时声明 Architecture Source impact。Implementation-only movement、symbol rename、helper extraction 或 mechanical call/import change MUST NOT 单独产生 OPSX operations。

#### Scenario: Durable architecture 变化
- **WHEN** evidence 与 change decisions 证明 durable architecture fact 改变
- **THEN** proposal Architecture Source SHALL 声明 scope
- **AND** `opsx-delta.yaml` SHALL 定义 exact reconciliation

#### Scenario: 架构不变
- **WHEN** durable architecture facts 保持不变
- **THEN** proposal Architecture Source SHALL 为 `None`
- **AND** OPSX delta SHALL 使用 canonical no-op

#### Scenario: 未解决 impact
- **WHEN** architecture impact 无法确定
- **THEN** snack SHALL 停止 artifact 写入并询问一个 focused question
- **AND** MUST NOT 使用 `None`、canonical no-op 或猜测的 operations 隐藏不确定性

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

Snack SHALL 在架构变化时生成 real delta，在确认架构不变时生成只含 `schema_version: 2` 的 canonical no-op。未解决 decision MUST NOT 被跳过。

#### Scenario: Real delta
- **WHEN** Architecture Source 声明 durable change
- **THEN** snack SHALL 基于 proposal scope、completed Specs、design、formal OPSX 与 code evidence 生成最小 operations

#### Scenario: Canonical no-op
- **WHEN** Architecture Source 为 `None`
- **THEN** delta SHALL 只包含 `schema_version: 2`
- **AND** SHALL NOT 包含空 operation sections

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
