## MODIFIED Requirements

### Requirement: Scenario operation label 校验

`openspec validate` SHALL 对 change-local delta specs 中 `#### Scenario:` 标题上的 scenario operation labels 进行校验。合法 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`，且 SHALL 仅出现在 canonical `#### Scenario:` 标记之后的 scenario 标题起始处。

校验规则：
- `## MODIFIED Requirements` 下每个 scenario MUST 携带 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]`，无标签 → ERROR
- `## ADDED Requirements` 下 scenario 隐式新增，不加标签（`[ADDED]` 为冗余），`[MODIFIED]` 或 `[REMOVED]` → ERROR 并解释语义原因
- `## REMOVED Requirements` 无 scenario

#### Scenario: [MODIFIED] 合法 scenario labels 通过 change validation
- **WHEN** change spec 在 `## MODIFIED Requirements` 下每个 scenario 均携带 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]`
- **THEN** `openspec validate <change> --type change` SHALL NOT 为这些 labels 报告错误

#### Scenario: 未知 label 报错
- **WHEN** change spec 包含 `#### Scenario: [UPDATED] 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明允许的 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`

#### Scenario: 非法 label 位置报错
- **WHEN** change spec 包含 `#### [ADDED] Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 展示合法格式 `#### Scenario: [ADDED] 场景`

#### Scenario: [MODIFIED] REMOVED scenario 不允许出现在 ADDED requirement 中
- **WHEN** change spec 在 `## ADDED Requirements` 下包含 `#### Scenario: [REMOVED] 旧场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明新增 requirement 不能有 removed scenario，建议使用 `## MODIFIED Requirements` 替代

#### Scenario: [ADDED] MODIFIED label 不允许出现在 ADDED requirement 中
- **WHEN** change spec 在 `## ADDED Requirements` 下包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明新增 requirement 只能有 `[ADDED]` scenario，建议使用 `## MODIFIED Requirements` 替代

#### Scenario: [ADDED] MODIFIED requirement 下无标签 scenario 报错
- **WHEN** change spec 在 `## MODIFIED Requirements` 下包含无标签的 `#### Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明每个 scenario 必须带有 `[ADDED]` / `[MODIFIED]` / `[REMOVED]`

#### Scenario: [MODIFIED] surviving scenario 数量必须非零
- **WHEN** change spec 中某个 MODIFIED requirement 的全部 scenarios 都标记为 `[REMOVED]`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明至少需要一个 `[ADDED]` 或 `[MODIFIED]` scenario（surviving, non-removed）

#### Scenario: [ADDED] ADDED requirement 无标签 scenario 通过校验
- **WHEN** change spec 在 `## ADDED Requirements` 下包含无标签的 `#### Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL NOT 报告错误

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
