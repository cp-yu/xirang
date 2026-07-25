## ADDED Requirements

### Requirement: Scenario operation label 校验

`openspec validate` SHALL 对 change-local delta specs 中 `#### Scenario:` 标题上的 scenario operation labels 进行校验。合法 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`，且 SHALL 仅出现在 canonical `#### Scenario:` 标记之后的 scenario 标题起始处。

#### Scenario: 合法 scenario labels 通过 change validation
- **WHEN** change spec 在 `## MODIFIED Requirements` 下包含 `#### Scenario: [ADDED] 新场景`、`#### Scenario: [MODIFIED] 已调整场景`、`#### Scenario: [REMOVED] 旧场景`
- **AND** requirement 在去除 `[REMOVED]` scenario block 后仍有至少一个 surviving scenario
- **THEN** `openspec validate <change> --type change` SHALL NOT 为这些 labels 报告错误

#### Scenario: 未知 label 报错
- **WHEN** change spec 包含 `#### Scenario: [UPDATED] 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明允许的 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`

#### Scenario: 非法 label 位置报错
- **WHEN** change spec 包含 `#### [ADDED] Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 展示合法格式 `#### Scenario: [ADDED] 场景`

#### Scenario: REMOVED scenario 不允许出现在 ADDED requirement 中
- **WHEN** change spec 在 `## ADDED Requirements` 下包含 `#### Scenario: [REMOVED] 旧场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明 `[REMOVED]` scenario 应归属到 `## MODIFIED Requirements` 下

#### Scenario: surviving scenario 数量必须非零
- **WHEN** change spec 中某个 ADDED 或 MODIFIED requirement 的全部 scenarios 都标记为 `[REMOVED]`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明至少需要一个 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario 在 sync 后存活

### Requirement: Formal spec scenario label 清洁度

`openspec validate --specs` 及 spec content validation SHALL 拒绝 formal specs 中的 scenario operation labels。Formal specs SHALL 包含无需 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation metadata 的 canonical `#### Scenario:` 标题。

#### Scenario: Formal spec 含 ADDED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [ADDED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 MODIFIED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 REMOVED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [REMOVED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Clean formal scenario 通过清洁度校验
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: 场景`
- **AND** scenario 标题不以 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]` 开头
- **THEN** scenario label 清洁度校验 SHALL NOT 报告问题

### Requirement: Task Verifies scenario label 归一化

Task structure validation SHALL 使用 label-free scenario title 将 `Verifies:` scenario 引用与 change-local specs 匹配。Scenario operation labels SHALL NOT 作为对外引用的 scenario title 的一部分。

#### Scenario: Verifies 通过 clean title 匹配 labeled scenario
- **WHEN** change-local spec 包含 `#### Scenario: [MODIFIED] 已调整场景`
- **AND** `tasks.md` 包含 `Verifies: specs/<capability>/spec.md / Requirement "能力" / Scenario "已调整场景"`
- **THEN** task structure validation SHALL treat the scenario reference as valid

#### Scenario: Verifies 不应要求 label 文本
- **WHEN** change-local spec 包含 `#### Scenario: [ADDED] 新场景`
- **AND** `tasks.md` 包含 `Verifies: specs/<capability>/spec.md / Requirement "能力" / Scenario "新场景"`
- **THEN** task structure validation SHALL treat the scenario reference as valid
- **AND** SHALL NOT 要求 `Scenario "[ADDED] 新场景"`
