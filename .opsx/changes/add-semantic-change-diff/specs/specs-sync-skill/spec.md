## MODIFIED Requirements

### Requirement: Delta Reconciliation Logic

Agent SHALL 使用 `ADDED`、`MODIFIED`、`REMOVED` Requirement headers 将 change-local完整 target blocks reconcile 到 Formal Specs。合入 SHALL 对 normalized Requirement identity 做显式查找，并 MUST NOT 解析 `RENAMED Requirements` 或 Scenario operation labels。

#### Scenario: ADDED requirements
- **WHEN** delta 包含 ADDED Requirement 且 Formal Spec 不存在同名 identity
- **THEN** SHALL 将完整 Requirement 添加到 target Spec

#### Scenario: ADDED requirement already exists
- **WHEN** ADDED identity 已存在于 Formal Spec
- **THEN** SHALL 报 identity precondition ERROR
- **AND** SHALL NOT 将 ADDED 静默解释为 MODIFIED

#### Scenario: MODIFIED requirements
- **WHEN** delta 包含 MODIFIED Requirement 且 Formal Spec 存在同名 identity
- **THEN** SHALL 用完整 target block 替换 Formal Requirement
- **AND** omitted Formal Scenario SHALL 不进入 target

#### Scenario: REMOVED requirements
- **WHEN** delta 包含 REMOVED identity 且 Formal Spec 存在
- **THEN** SHALL 从 target Spec 删除该 Requirement

#### Scenario: REMOVED requirements already absent
- **WHEN** removal-only delta 的全部 identities 已从 Formal Spec 缺失
- **THEN** SHALL 将该 delta 视为 already reconciled

#### Scenario: RENAMED section 被拒绝
- **WHEN** delta 包含 `## RENAMED Requirements`
- **THEN** SHALL 报 ERROR
- **AND** SHALL 指引使用 REMOVED old 与 ADDED new

#### Scenario: Scenario operation label 被拒绝
- **WHEN** change-local Scenario heading 包含 operation-like label
- **THEN** SHALL 在 sync 前 validation 失败
- **AND** MUST NOT 清洗后继续写入

#### Scenario: New Spec
- **WHEN** Formal Specs 中不存在对应 new Spec ID
- **THEN** SHALL 在 `.opsx/specs/<spec-id>/spec.md` 创建 target Spec
- **AND** SHALL 使用 Node.js path API 构造路径

### Requirement: Skill Output

Skill SHALL 清晰反馈每个 Spec 的 ADDED、MODIFIED、REMOVED counts，并使用统一 Diff IR 的 operation identities。

#### Scenario: Show applied changes
- **WHEN** reconciliation 成功
- **THEN** SHALL 显示每个 Spec 的 requirements added、modified、removed counts
- **AND** SHALL NOT 显示独立 renamed count

#### Scenario: Show Architecture sync summary
- **WHEN** Architecture reconciliation 成功
- **THEN** SHALL 显示 elements、relationships 与 Metamodel kinds 的 added、modified、removed counts

#### Scenario: No changes needed
- **WHEN** Formal target 已与 delta target 一致
- **THEN** SHALL 显示 `Specs already in sync - no changes needed`
