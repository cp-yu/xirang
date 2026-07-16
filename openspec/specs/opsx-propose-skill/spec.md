# opsx-propose-skill Specification

## Purpose
定义 `/opsx:propose` 在生成工件后执行轻量校验、单轮修复以及最终 warning 汇总的行为边界。
## Requirements
### Requirement: Post-propose warning validation

`/opsx:propose` 在生成 apply-required artifacts 后 SHALL 执行一次 post-propose warning validation。该 validation SHALL 只包含程序化、可复现的文档结构检查；它 SHALL NOT 使用大语言模型执行语义质量判断。

#### Scenario: Validation runs after artifact generation
- **WHEN** agent 完成 `proposal.md`、`specs/`、`design.md`、`tasks.md` 以及适用时的 `opsx-delta.yaml` 生成
- **THEN** agent SHALL 在最终总结前执行一次文档体检
- **AND** 该体检 SHALL 发生在 "Ready for implementation" 输出之前

#### Scenario: Validation is warning-only
- **WHEN** post-propose validation 发现问题
- **THEN** 结果 SHALL 以 warning 形式呈现
- **AND** SHALL NOT 将 `propose` 转变为阻断式 gate
- **AND** 最终仍 MAY 宣告 ready for apply

#### Scenario: Actions and Checks structure is checked programmatically
- **WHEN** agent 执行 post-propose warning validation
- **AND** `tasks.md` 已生成
- **THEN** validation SHALL programmatically check that `tasks.md` contains `Actions` and `Checks` sections
- **AND** SHALL check that action checkboxes use `A` IDs
- **AND** SHALL check that check checkboxes use `C` IDs
- **AND** SHALL check that every check contains a `Covers:` field
- **AND** SHALL check that every `Covers:` reference points to an existing action ID
- **AND** SHALL check that every action ID is referenced by at least one `Covers:` field

#### Scenario: Check fields are structurally validated
- **WHEN** post-propose validation inspects `Checks`
- **THEN** validation SHALL programmatically check that every check contains at least one executable evidence field from the allowed set: `Command:`, `Evidence:`, or `Expect:`
- **AND** validation SHALL NOT judge whether the command, evidence, or expectation is semantically sufficient

#### Scenario: Programmatic task warnings remain repair-only
- **WHEN** programmatic task structure validation finds missing sections, malformed IDs, missing `Covers:`, dangling `Covers:` references, or missing evidence fields
- **THEN** agent SHALL 将问题记录为 warning
- **AND** SHALL 最多执行一轮 `tasks.md` 修复
- **AND** SHALL NOT 阻断 apply-ready 输出

#### Scenario: Semantic suitability is deferred to verify
- **WHEN** post-propose validation checks `tasks.md`
- **THEN** validation SHALL NOT classify actions as trivial or non-trivial
- **AND** SHALL NOT judge whether a bugfix, validation, or refactor check is semantically appropriate
- **AND** semantic sufficiency SHALL be evaluated later by the verify/reviewer workflow against the generated artifacts and implementation evidence

### Requirement: Specs validation aligns with downstream sync/archive semantics
`specs` 的 post-propose 校验 SHALL 与后续 `sync` / `archive` 使用的 delta spec 校验语义保持基本一致。对于 change-local specs 中的 scenario operation labels，post-propose validation SHALL 使用与 `openspec validate <change> --type change` 相同的结构检查，并将 labels 视为 change-local metadata。

#### Scenario: Delta spec structure is checked
- **WHEN** agent 校验 change 下的 generated specs
- **THEN** SHALL 检查 delta section 结构是否合法
- **AND** SHALL 检查 `ADDED` / `MODIFIED` requirement 是否包含规范性文本
- **AND** SHALL 检查 requirement 是否包含至少一个 `#### Scenario:`
- **AND** SHALL 与后续 change delta validation 的主要失败条件保持一致

#### Scenario: Scenario operation labels 被检查
- **WHEN** generated change specs 包含 `#### Scenario: [ADDED] 场景`、`#### Scenario: [MODIFIED] 场景` 或 `#### Scenario: [REMOVED] 场景`
- **THEN** post-propose validation SHALL 在满足下游 change validation 规则的情况下将这些 labels 视为合法 change-local metadata
- **AND** SHALL 对未知或非法 labels 使用与下游 validation 相同的允许 labels 集报告 warning

#### Scenario: Removed scenario labels 需要 surviving scenarios
- **WHEN** generated change specs 中某个 ADDED 或 MODIFIED requirement 的全部 scenarios 都标记为 `[REMOVED]`
- **THEN** post-propose validation SHALL report warning
- **AND** SHALL 引导 agent 至少保留一个 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario 在 sync 后存活

#### Scenario: Scenario labels 不是 formal spec 内容
- **WHEN** generated change specs 使用 scenario operation labels 以提升审阅清晰度
- **THEN** post-propose validation SHALL NOT 要求这些 labels 出现在 formal specs 中
- **AND** final guidance SHALL 保留边界：sync/archive 清洗 `[ADDED]` 和 `[MODIFIED]` labels，并省略 `[REMOVED]` scenario blocks

### Requirement: OPSX validation aligns with downstream sync/archive semantics

`opsx-delta.yaml` 的 post-propose validation SHALL 通过 artifact-scoped CLI 命令执行，而非由 Agent 手动模拟 merge。`openspec validate --change "<name>" --artifacts opsx-delta --json` SHALL 通过 `Validator.validateOpsxDelta()` 执行 OPSX v2 schema parsing、formal two-file bundle dry-run merge、referential integrity 与 `RelationDefinitionRegistry` semantic validation。Validation MUST NOT 读取、生成或要求 code-map。

#### Scenario: OPSX delta against current formal bundle
- **GIVEN** formal `project.opsx.yaml` 与 `project.opsx.relations.yaml` 存在
- **AND** change 中存在 `opsx-delta.yaml`
- **WHEN** Agent 执行 artifact-scoped validation
- **THEN** SHALL 对完整 formal bundle 执行 dry-run merge
- **AND** SHALL 检查 referential integrity 与 Registry semantic contract
- **AND** MUST NOT 调用 code-map validation

#### Scenario: Formal OPSX 不存在时优雅跳过
- **GIVEN** formal OPSX bundle 不存在
- **WHEN** change 中存在 `opsx-delta.yaml`
- **THEN** `Validator.validateOpsxDelta()` SHALL 优雅跳过 formal merge
- **AND** SHALL 返回可诊断的 skipped result 而非读取 code-map 或猜测 baseline

### Requirement: Auxiliary artifact checks stay lightweight
`proposal.md`、`design.md`、`tasks.md` 的 post-propose 检查 SHALL 保持轻量，并以当前 schema template 为准。

#### Scenario: Lightweight template-based checks
- **WHEN** agent 校验 `proposal.md`、`design.md`、`tasks.md`
- **THEN** SHALL 仅检查关键模板结构是否存在
- **AND** SHALL 使用当前 schema template 作为结构依据
- **AND** SHALL NOT 引入独立于 template 的重语义 lint 规则

### Requirement: Single repair pass
发现 warning 后，agent SHALL 进行单轮文档修复，而不是无限循环。

#### Scenario: Agent fixes warnings once
- **WHEN** 初次 post-propose validation 产生 warning
- **THEN** agent SHALL 先尝试修复文档
- **AND** SHALL 仅进行一轮修复
- **AND** 修复后 SHALL 再检查一次并输出结果

### Requirement: Final summary reports fixed and remaining warnings
`/opsx:propose` 的最终总结 SHALL 区分已修复 warning 与剩余 warning。

#### Scenario: Final summary with residual warnings
- **WHEN** 单轮修复后仍存在 warning
- **THEN** 最终总结 SHALL 列出 remaining warnings
- **AND** SHALL 明确这些 warning 主要需要继续修正文档
- **AND** SHALL 允许继续进入 `/opsx:apply`

#### Scenario: Final summary with all warnings fixed
- **WHEN** 单轮修复后 warning 已消除
- **THEN** 最终总结 SHALL 说明 post-propose validation 已通过
- **AND** SHALL 输出 ready for apply


### Requirement: OPSX delta validation 先解析后执行 formal merge

Post-propose OPSX validation SHALL 始终先通过 `OpsxDeltaSchema` 解析 `opsx-delta.yaml`。只有包含实际 operations 时，formal OPSX bundle 才用于 dry-run merge；缺少 formal OPSX SHALL 只跳过 merge，不得跳过 Schema parsing。

#### Scenario: Canonical no-op 独立通过解析
- **WHEN** delta 只包含 `schema_version: 2`
- **THEN** validation SHALL 通过 Schema parsing
- **AND** SHALL NOT 要求 formal OPSX bundle

#### Scenario: 缺少 formal OPSX 不隐藏非法 delta
- **WHEN** formal OPSX 不存在
- **AND** delta 包含 legacy empty section 或 collection
- **THEN** validation SHALL 报告 delta Schema error
- **AND** SHALL NOT 将整个 artifact validation 静默跳过
