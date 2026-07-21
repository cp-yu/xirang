## MODIFIED Requirements

### Requirement: 同步执行

`openspec sync` SHALL 复用 `change-sync` 契约执行同步。在同步执行之前，系统 SHALL 检查 verify gate（通过 `checkFreshness` 和 `checkArchiveCompatibility`），除非用户传入 `--no-verify`。在准备 sync 输出前，系统 SHALL automatically handle scenario operation labels for change-local specs after validation.

同步完成后，`applyPreparedChangeSync` SHALL 自动刷新 `.verify-result.json` 中与 sync 输出重叠的 evidence 文件哈希，使 verify 结果不因合法的 sync 写入而失效。

#### Scenario: verify gate 失败输出可操作指引

- **GIVEN** 用户执行 `openspec sync my-change`
- **AND** `.verify-result.json` 存在但 freshness 为 STALE
- **WHEN** verify gate 检查失败
- **THEN** 错误输出 SHALL 包含变更文件列表
- **AND** 包含建议重新 verify 的命令
- **AND** 包含 `--no-verify` 跳过选项
- **AND** exit code 非 0

#### Scenario: verify gate 通过后执行同步

- **GIVEN** 用户执行 `openspec sync my-change`
- **AND** freshness 为 FRESH 且 archiveCompatibility 为 compatible
- **WHEN** verify gate 检查通过
- **THEN** 继续执行同步流程
- **AND** 输出同步摘要

#### Scenario: --no-verify 跳过 verify gate

- **GIVEN** 用户执行 `openspec sync my-change --no-verify`
- **AND** freshness 为 STALE
- **WHEN** 命令执行
- **THEN** 跳过 verify gate 直接进入同步
- **AND** 不输出 `formatVerifyGateFailure` 结果

#### Scenario: sync 前自动处理 scenario labels

- **WHEN** `openspec sync my-change` prepares delta specs for writing
- **THEN** sync SHALL apply the same scenario label handling as `openspec fix-scenario-labels my-change --write`
- **AND** the updated change-local specs SHALL be used for sync output

#### Scenario: 同步后 evidence fingerprint 自动刷新

- **GIVEN** 用户执行 `openspec sync my-change`
- **AND** sync 前 `.verify-result.json` 为 FRESH
- **AND** evidence 中包含 `openspec/project.opsx.yaml`
- **AND** sync 写入了 OPSX delta
- **WHEN** sync 完成
- **THEN** `.verify-result.json` 中 `openspec/project.opsx.yaml` 的 hash SHALL 被更新为当前文件内容的哈希
- **AND** `evidenceFingerprint` SHALL 基于更新后的 entries 重新计算
- **AND** 后续 `openspec verify status my-change --json` SHALL 返回 FRESH

### Requirement: 不触发归档

`openspec sync` SHALL NOT 触发归档或移动 change 目录。Sync MAY update change-local delta specs only to apply deterministic scenario operation labels before writing formal specs.

#### Scenario: 同步后 change 目录保持不变
- **WHEN** sync 成功完成
- **THEN** change 目录不被移动或删除
- **AND** change 目录中除自动生成 scenario operation labels 之外的内容不被修改

### Requirement: 幂等性

`openspec sync` SHALL 保持幂等性，重复执行不得引入额外差异。对于只包含 `## REMOVED Requirements` 的 delta，当该 delta 声明的所有 requirement headers 都已从当前主 spec 缺失时，系统 SHALL 将该 spec delta 视为已经同步；主 spec 中仍存在的无关 requirements SHALL NOT 使该 removal-only delta 重新变为 pending。对于包含 scenario operation labels 的 ADDED 或 MODIFIED requirement，幂等性比较 SHALL 使用 sync-normalized requirement 内容：`[ADDED]` 与 `[MODIFIED]` labels 被忽略，`[REMOVED]` scenario block 被视为不存在。

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

#### Scenario: 自动 scenario labels 不破坏 sync 幂等性
- **GIVEN** change spec 的 `## MODIFIED Requirements` initially contains unlabeled scenario differences
- **AND** `openspec sync <change-name>` has applied scenario labels and synced formal specs
- **WHEN** executing `openspec sync <change-name>` again
- **THEN** sync SHALL report no additional spec updates when formal specs already match the sync-normalized delta
