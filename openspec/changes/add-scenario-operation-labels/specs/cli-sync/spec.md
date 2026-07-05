## MODIFIED Requirements

### Requirement: 幂等性

`openspec sync` SHALL 保持幂等性，重复执行不得引入额外差异。对于只包含 `## REMOVED Requirements` 的 delta，当该 delta 声明的所有 requirement headers 都已从主 spec 缺失时，系统 SHALL 将该 spec delta 视为已经同步；主 spec 中仍存在的无关 requirements SHALL NOT 使该 removal-only delta 重新变为 pending。对于包含 scenario operation labels 的 ADDED 或 MODIFIED requirement，幂等性比较 SHALL 使用 sync-normalized requirement 内容：`[ADDED]` 与 `[MODIFIED]` labels 被忽略，`[REMOVED]` scenario block 被视为不存在。

#### Scenario: 重复执行产生相同结果
- **GIVEN** 已对某 change 执行过一次 sync
- **WHEN** 再次对同一 change 执行 sync
- **THEN** 主 specs 和 OPSX 文件内容与首次同步后完全一致

#### Scenario: labeled scenario 不触发重复 pending
- **GIVEN** change spec 的 `## MODIFIED Requirements` 包含 `#### Scenario: [MODIFIED] 已调整场景`
- **AND** 首次 sync 已将 formal spec 写为 `#### Scenario: 已调整场景`
- **WHEN** 再次执行 `openspec sync <change-name>`
- **THEN** sync SHALL treat that requirement delta as already applied
- **AND** SHALL NOT 仅因 change-local scenario header 包含 `[MODIFIED]` 而将 spec 报告为 pending

#### Scenario: removed scenario block 不触发重复 pending
- **GIVEN** change spec 的 `## MODIFIED Requirements` 包含 `#### Scenario: [REMOVED] 旧场景`
- **AND** 首次 sync 后 formal spec 不包含该 scenario block
- **WHEN** 再次执行 `openspec sync <change-name>`
- **THEN** sync SHALL treat that requirement delta as already applied
- **AND** SHALL NOT 重新创建或要求该 removed scenario block

#### Scenario: removal-only delta 的目标 headers 已缺失
- **GIVEN** change spec 只包含 `## REMOVED Requirements`
- **AND** 主 spec 文件仍存在
- **AND** delta 声明的所有 requirement headers 都已从主 spec 缺失
- **AND** 主 spec 仍包含无关 requirements
- **WHEN** 再次执行 `openspec sync <change-name>`
- **THEN** sync SHALL treat that spec delta as already synced
- **AND** SHALL NOT 再次尝试删除这些 headers

#### Scenario: removal-only delta 清空 spec 后重复执行
- **GIVEN** change spec 只包含 `## REMOVED Requirements`
- **AND** 首次 sync 删除了主 spec 中最后一个 requirement
- **AND** 主 spec 文件已被删除
- **WHEN** 再次执行 `openspec sync <change-name>`
- **THEN** sync SHALL treat that spec delta as already synced
- **AND** SHALL NOT 重建空的主 spec 文件

### Requirement: Sync-created specs SHALL use runtime projection
`openspec sync` 创建或重建 formal specs 时 SHALL 消费 runtime projection，使新写入的 prose 遵循 config 策略而非硬编码英文模板。Sync 写入的 formal specs SHALL NOT 在 `#### Scenario:` 标题中包含 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` 等 scenario operation labels。

#### Scenario: New formal spec uses projected prose policy
- **WHEN** sync 创建尚不存在的 formal spec
- **THEN** 命令 SHALL 对生成的 prose 内容使用 runtime projection
- **AND** SHALL 保留 canonical headers、requirement markers、scenario markers 及 normative keywords

#### Scenario: Existing formal spec update does not inject unrelated boilerplate
- **WHEN** sync 通过 delta reconciliation 更新已有 formal spec
- **THEN** 命令 SHALL 将生成的 prose 限制在 sync contract 范围内
- **AND** SHALL NOT 向未受影响 section 注入无关硬编码英文指导

#### Scenario: Scenario operation labels 不进入 formal specs
- **WHEN** sync 从包含 `#### Scenario: [ADDED] 新场景` 或 `#### Scenario: [MODIFIED] 已调整场景` 的 change-local ADDED 或 MODIFIED requirement 写入 formal spec
- **THEN** formal spec SHALL 包含去除 operation label 后的 scenario 标题
- **AND** formal spec SHALL NOT 包含 `Scenario: [ADDED]` 或 `Scenario: [MODIFIED]`

#### Scenario: Removed scenario labels 不进入 formal specs
- **WHEN** sync 从包含 `#### Scenario: [REMOVED] 旧场景` 的 change-local MODIFIED requirement 写入 formal spec
- **THEN** formal spec SHALL 省略该 scenario block
- **AND** formal spec SHALL NOT 包含 `Scenario: [REMOVED]`
