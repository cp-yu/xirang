## MODIFIED Requirements

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
