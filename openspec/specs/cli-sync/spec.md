---
capabilities:
  - cap.cli.sync
---
# Spec: cli-sync

## Purpose

`openspec sync` 命令将 change 中的 delta specs 和 OPSX delta 同步到主 specs 和 OPSX 文件，不执行归档。

## Command Syntax

```bash
openspec sync [change-name] [--no-validate]
```

选项：
- `change-name`：可选，指定 change 名称
- `--no-validate`：跳过同步后验证（不推荐）
## Requirements
### Requirement: Change 选择

`openspec sync` SHALL 同时支持交互式和直接指定两种 change 选择方式。

#### Scenario: 直接指定 change 名称
- **GIVEN** 用户执行 `openspec sync my-change`
- **WHEN** `openspec/changes/my-change/` 存在
- **THEN** 对该 change 执行同步

#### Scenario: 交互式选择
- **GIVEN** 用户执行 `openspec sync`（无参数）
- **AND** 当前存在多个活跃 change
- **THEN** 列出所有活跃 change 供用户选择
- **AND** 排除 `archive/` 目录

#### Scenario: 无活跃 change
- **GIVEN** 用户执行 `openspec sync`
- **AND** 不存在任何活跃 change
- **THEN** 输出提示信息并退出

#### Scenario: 指定的 change 不存在
- **GIVEN** 用户执行 `openspec sync nonexistent`
- **WHEN** `openspec/changes/nonexistent/` 不存在
- **THEN** 报错并退出

### Requirement: 同步执行

`openspec sync` SHALL 复用 `change-sync` 契约执行同步。在同步执行之前，系统 SHALL 检查 verify gate（通过 `checkFreshness` 和 `checkArchiveCompatibility`），除非用户传入 `--no-verify`。Sync SHALL NOT generate or write scenario operation labels into change-local specs.

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

#### Scenario: sync 不写入 scenario labels

- **WHEN** `openspec sync my-change` prepares delta specs for writing
- **THEN** sync SHALL NOT run `openspec scenario-labels my-change --write`
- **AND** SHALL NOT modify change-local spec files only to add scenario operation labels
- **AND** SHALL allow unlabeled scenarios in `## MODIFIED Requirements` to continue through sync

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

`openspec sync` SHALL NOT 触发归档或移动 change 目录。Sync MAY write formal specs and OPSX files only through the sync contract and SHALL NOT update change-local delta specs to apply scenario operation labels.

#### Scenario: 同步后 change 目录保持不变

- **WHEN** sync 成功完成
- **THEN** change 目录不被移动或删除
- **AND** change-local spec files SHALL NOT be modified by sync only to add scenario operation labels

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

#### Scenario: unlabeled scenario differences 不阻塞 sync

- **GIVEN** change spec 的 `## MODIFIED Requirements` contains unlabeled scenario differences
- **WHEN** executing `openspec sync <change-name>`
- **THEN** sync SHALL continue without requiring scenario operation labels
- **AND** sync SHALL NOT write labels back to the change-local spec

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

### Requirement: --no-verify 选项

`openspec sync` SHALL 提供 `--no-verify` 选项，跳过 verify gate 检查。

#### Scenario: --no-verify 开关

- **WHEN** 用户执行 `openspec sync my-change --no-verify`
- **THEN** `skipVerify` 设为 `true`
- **AND** 不调用 `checkFreshness` 或 `checkArchiveCompatibility`
- **AND** 同步照常执行


### Requirement: Sync 按实际 OPSX operations 判断同步需求

`change-sync` SHALL 通过 `readOpsxDelta()` 解析 `opsx-delta.yaml`，并根据解析后的实际 operations 判断 OPSX sync 工作。`ChangeSyncState.hasOpsxDelta` SHALL 表示存在至少一个实际 operation，而不是表示文件存在。

#### Scenario: 只有 canonical no-op delta
- **GIVEN** `opsx-delta.yaml` 只包含 `schema_version: 2`
- **AND** change 没有待同步 delta Specs
- **WHEN** 执行 `openspec sync <change-name> --no-verify`
- **THEN** SHALL 输出 `No sync required.`
- **AND** SHALL NOT 要求 formal OPSX bundle 或写入 OPSX

#### Scenario: Specs 与 canonical no-op 并存
- **GIVEN** change 包含待同步 delta Specs 与 canonical no-op OPSX delta
- **AND** formal OPSX bundle 不存在
- **WHEN** 执行 sync
- **THEN** SHALL 只同步 Specs
- **AND** summary SHALL 输出 `opsx: no-delta`

#### Scenario: Real delta 仍要求 formal OPSX
- **GIVEN** OPSX delta 包含至少一个实际 operation
- **AND** formal OPSX bundle 不存在
- **WHEN** 执行 sync
- **THEN** SHALL 失败并报告无法应用 OPSX delta

### Requirement: Sync 拒绝非 canonical 空 OPSX delta

Sync SHALL 始终使用 `OpsxDeltaSchema` 解析存在的 delta。`--no-validate` MUST NOT 跳过安全解析。Legacy empty mappings 或 collections MUST NOT 被清洗、忽略或迁移为 no-op。

#### Scenario: 空 section fail-fast
- **GIVEN** delta 包含 `ADDED: {}`
- **WHEN** 执行 `openspec sync <change-name> --no-validate --no-verify`
- **THEN** sync SHALL 以 `Invalid opsx-delta.yaml` 失败
- **AND** SHALL NOT 写入 formal Specs 或 OPSX

#### Scenario: 空 collection fail-fast
- **GIVEN** delta 包含 `MODIFIED.capabilities: []`
- **WHEN** sync 评估 change state
- **THEN** `readOpsxDelta()` SHALL 拒绝该文件
- **AND** SHALL NOT 报告为 `no-delta`
