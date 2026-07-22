## MODIFIED Requirements

### Requirement: Project Structure

OPSX 项目 SHALL 使用一致目录保存同一个 OPSX Semantic Model 的 graph modules、contract modules、change-local Semantic Delta 与可再生 review artifact。

#### Scenario: 初始化与 change 目录结构
- **WHEN** 初始化 OPSX 项目或创建 change
- **THEN** SHALL 使用 `.opsx/architecture/`、`.opsx/specs/`、`.opsx/changes/<name>/` 与 `.opsx/changes/archive/`
- **AND** active change MAY 包含 `proposal.md`、`design.md`、`tasks.md`、`architecture-delta.c4`、`specs/<spec-id>/spec.md` 与 generated `effective-change.md`
- **AND** `effective-change.md` SHALL NOT 被解释为 semantic source

### Requirement: Header-Based Requirement Identification

Requirement headers SHALL 作为 Formal 与 change-local Specs 之间的 unique identity。Requirement operation vocabulary SHALL 只有 `ADDED`、`MODIFIED`、`REMOVED`。

#### Scenario: Matching requirements programmatically
- **WHEN** processing delta changes
- **THEN** SHALL 使用 normalized exact `### Requirement: <name>` header 匹配
- **AND** normalization SHALL 为 trim 后 case-sensitive equality

#### Scenario: Handling requirement renames
- **WHEN** Requirement title 变化
- **THEN** change SHALL 在 `## REMOVED Requirements` 声明 old title
- **AND** SHALL 在 `## ADDED Requirements` 包含 new title 的完整 target Requirement
- **AND** MUST NOT 使用 `## RENAMED Requirements`

#### Scenario: Validating header uniqueness
- **WHEN** creating or modifying requirements
- **THEN** target Spec 内 SHALL 不存在 duplicate normalized headers
- **AND** validation SHALL 将 duplicates 报为 ERROR

### Requirement: Change Storage Convention

Change proposals SHALL 保存 target-state semantic operations，而不是完整未来 project snapshot。`architecture-delta.c4` 与 change-local Specs SHALL 共同构成一个 Semantic Delta；durable operations SHALL 只位于稳定 identity，Scenario/property operations SHALL 由 diff 派生。

#### Scenario: Graph 与 contract modules 同属一个 delta
- **WHEN** change 同时修改 graph 与 Element Contracts
- **THEN** Architecture identity operations SHALL 写入 `architecture-delta.c4`
- **AND** Requirement operations SHALL 写入对应 change-local Specs
- **AND** 系统 SHALL 共同 materialize 一个 Target Semantic Model

#### Scenario: Delta operation 使用三种 sections
- **WHEN** change-local Spec 增加、修改或删除 Requirement
- **THEN** SHALL 只使用 `ADDED`、`MODIFIED`、`REMOVED` sections
- **AND** body SHALL 描述 target steady state

#### Scenario: Creating change proposals with additions
- **WHEN** change 增加 Requirement
- **THEN** `## ADDED Requirements` SHALL 包含完整 target Requirement 与 Scenarios

#### Scenario: Creating change proposals with modifications
- **WHEN** change 修改 existing Requirement
- **THEN** `## MODIFIED Requirements` SHALL 使用 exact existing title
- **AND** SHALL 包含完整 target statement 与全部 surviving Scenarios

#### Scenario: Creating change proposals with removals
- **WHEN** change 删除 Requirement
- **THEN** `## REMOVED Requirements` SHALL 声明 exact title、Reason 与 Migration

#### Scenario: Using standard output symbols
- **WHEN** CLI 显示 semantic operations
- **THEN** SHALL 使用 `+`、`~`、`-` 表示 ADDED、MODIFIED、REMOVED
- **AND** SHALL NOT 定义独立 RENAMED symbol

### Requirement: Archive Process Enhancement

Sync SHALL 按 identity-level operations materialize Target Specs 与 Architecture；archive SHALL 在确认 sync 完成后生成最终 review artifact 并封存 change。

#### Scenario: Applying Requirement operations
- **WHEN** sync reconciles contract operations
- **THEN** SHALL 按 REMOVED、MODIFIED、ADDED 的 target result 验证 normalized identities
- **AND** SHALL 将完整 MODIFIED block 写为 formal target Requirement
- **AND** MUST NOT 解析 RENAMED section 或 Scenario operation labels

#### Scenario: Handling conflicts during sync or archive
- **WHEN** Formal snapshot、identity precondition 或 target integrity 与 change 冲突
- **THEN** SHALL 报告具体 conflict
- **AND** SHALL 要求 resolution 后重新 validate 与 diff
- **AND** MUST NOT partial write 或 archive

### Requirement: Change Review

系统 SHALL 通过同一 Diff IR 支持 Agent 与用户审阅 active change 的 effective semantic changes。

#### Scenario: Reviewing changes
- **WHEN** reviewing an active change
- **THEN** Agent 与用户 MAY 使用 `opsx validate --change <name>` 查看 concise preview
- **AND** MAY 使用 `opsx diff --change <name>` 查看完整 text diff
- **AND** MAY 使用 `opsx diff --change <name> --write` 生成 `effective-change.md`
- **AND** MAY 在 `opsx view` 选择该 active change 查看 Specs 与 Architecture diff

#### Scenario: Review projections 一致
- **WHEN**同一 Formal 与 change inputs 未变化
- **THEN** CLI、JSON、generated Markdown 与 Web SHALL 使用一致 identities、operations、counts 与 diagnostics

### Requirement: Change-local specs express target steady state

Change-local Specs SHALL 仅使用 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections；Requirement 与 Scenario body SHALL 描述目标稳态。Scenario operation metadata MUST NOT 写入 source。

#### Scenario: ADDED 正文直接描述行为
- **WHEN** change 引入新行为
- **THEN** ADDED Requirement SHALL 使用 durable capability name 与 normative target-state text
- **AND** SHALL NOT 使用 change-log narration

#### Scenario: MODIFIED 包含完整目标状态
- **WHEN** existing Requirement 的行为或 Scenario set 变化
- **THEN** MODIFIED block SHALL 包含完整 target Requirement
- **AND** SHALL 包含全部 surviving Scenarios
- **AND** existing Requirement title SHALL 保持 exact matching

#### Scenario: Scenario 删除通过省略表达
- **WHEN** existing Scenario 在目标稳态中不再存在
- **THEN** Agent-authored MODIFIED Requirement SHALL 省略该 Scenario
- **AND** MUST NOT 编写 removed Scenario block 或 operation label

#### Scenario: Scenario operations 由 Diff IR 派生
- **WHEN** validate、diff 或 view 比较 Formal 与 Target Requirement
- **THEN** SHALL 派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED presentation
- **AND** derived operation SHALL NOT 写回 change-local Spec
