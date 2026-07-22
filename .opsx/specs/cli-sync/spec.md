---
capabilities:
  - cap.cli.sync
---
# Spec: cli-sync

## Purpose

`opsx sync` 命令将 change 中的 delta specs 和 OPSX delta 同步到主 specs 和 OPSX 文件，不执行归档。

## Command Syntax

```bash
opsx sync [change-name] [--no-validate]
```

选项：
- `change-name`：可选，指定 change 名称
- `--no-validate`：跳过同步后验证（不推荐）
## Requirements
### Requirement: Change 选择

`opsx sync` SHALL 同时支持交互式和直接指定两种 change 选择方式。

#### Scenario: 直接指定 change 名称
- **GIVEN** 用户执行 `opsx sync my-change`
- **WHEN** `.opsx/changes/my-change/` 存在
- **THEN** 对该 change 执行同步

#### Scenario: 交互式选择
- **GIVEN** 用户执行 `opsx sync`（无参数）
- **AND** 当前存在多个活跃 change
- **THEN** 列出所有活跃 change 供用户选择
- **AND** 排除 `archive/` 目录

#### Scenario: 无活跃 change
- **GIVEN** 用户执行 `opsx sync`
- **AND** 不存在任何活跃 change
- **THEN** 输出提示信息并退出

#### Scenario: 指定的 change 不存在
- **GIVEN** 用户执行 `opsx sync nonexistent`
- **WHEN** `.opsx/changes/nonexistent/` 不存在
- **THEN** 报错并退出

### Requirement: 同步执行

`opsx sync` SHALL 在 verify gate 通过后，将 change-local graph 与 contract modules 作为一个 Semantic Delta prepare、联合验证并原子写入 formal OPSX Semantic Model。Sync SHALL NOT 生成 scenario labels，也 SHALL NOT 静默迁移 language version。

#### Scenario: verify gate 失败输出指引
- **WHEN** freshness 为 STALE 或 archive compatibility 不满足
- **THEN** SHALL 输出 changed files、重新 verify 命令与 `--no-verify` option
- **AND** exit code SHALL 非零

#### Scenario: verify gate 通过后执行同步
- **WHEN** freshness 为 FRESH 且 archive compatible
- **THEN** SHALL 构造 Target Semantic Model 并执行 combined validation
- **AND** validation 通过后 SHALL 原子写入 graph 与 Specs

#### Scenario: --no-verify 跳过 gate
- **WHEN** 用户运行 `opsx sync <change> --no-verify`
- **THEN** SHALL 跳过 freshness gate
- **AND** MUST NOT 跳过 Semantic Model syntax 与 integrity validation

#### Scenario: sync 不写入 scenario labels
- **WHEN** sync prepares contract deltas
- **THEN** MUST NOT 运行 scenario-label write
- **AND** MUST NOT 仅为 labels 修改 change-local Specs

#### Scenario: 同步后 evidence fingerprint 刷新
- **WHEN** sync 成功写入 formal graph 或 Specs
- **THEN** SHALL 只刷新与实际 outputs 重叠的 evidence hashes
- **AND** SHALL 使用当前 `.opsx/architecture/` 与 `.opsx/specs/` paths

### Requirement: 不触发归档

`opsx sync` SHALL NOT 触发归档或移动 change 目录。Sync MAY write formal specs and OPSX files only through the sync contract and SHALL NOT update change-local delta specs to apply scenario operation labels.

#### Scenario: 同步后 change 目录保持不变

- **WHEN** sync 成功完成
- **THEN** change 目录不被移动或删除
- **AND** change-local spec files SHALL NOT be modified by sync only to add scenario operation labels

### Requirement: 幂等性

`opsx sync` SHALL 保持幂等性，重复执行不得引入额外差异。对于只包含 `## REMOVED Requirements` 的 delta，当该 delta 声明的所有 requirement headers 都已从当前主 spec 缺失时，系统 SHALL 将该 spec delta 视为已经同步；主 spec 中仍存在的无关 requirements SHALL NOT 使该 removal-only delta 重新变为 pending。对于包含 scenario operation labels 的 ADDED 或 MODIFIED requirement，幂等性比较 SHALL 使用 sync-normalized requirement 内容：`[ADDED]` 与 `[MODIFIED]` labels 被忽略，`[REMOVED]` scenario block 被视为不存在。

#### Scenario: 重复执行产生相同结果

- **GIVEN** 已对某 change 执行过一次 sync
- **WHEN** 再次对同一 change 执行 sync
- **THEN** 主 specs 和 OPSX 文件内容与首次同步后完全一致

#### Scenario: labeled scenario 不触发重复 pending

- **GIVEN** change spec 的 `## MODIFIED Requirements` 包含 `#### Scenario: [MODIFIED] 已调整场景`
- **AND** 首次 sync 已将 formal spec 写为 `#### Scenario: 已调整场景`
- **WHEN** 再次执行 `opsx sync <change-name>`
- **THEN** sync SHALL treat that requirement delta as already applied
- **AND** SHALL NOT 仅因 change-local scenario header 包含 `[MODIFIED]` 而将 spec 报告为 pending

#### Scenario: removed scenario block 不触发重复 pending

- **GIVEN** change spec 的 `## MODIFIED Requirements` 包含 `#### Scenario: [REMOVED] 旧场景`
- **AND** 首次 sync 后 formal spec 不包含该 scenario block
- **WHEN** 再次执行 `opsx sync <change-name>`
- **THEN** sync SHALL treat that requirement delta as already applied
- **AND** SHALL NOT 重新创建或要求该 removed scenario block

#### Scenario: removal-only delta 的目标 headers 已缺失

- **GIVEN** change spec 只包含 `## REMOVED Requirements`
- **AND** 主 spec 文件仍存在
- **AND** delta 声明的所有 requirement headers 都已从主 spec 缺失
- **AND** 主 spec 仍包含无关 requirements
- **WHEN** 再次执行 `opsx sync <change-name>`
- **THEN** sync SHALL treat that spec delta as already synced
- **AND** SHALL NOT 再次尝试删除这些 headers

#### Scenario: removal-only delta 清空 spec 后重复执行

- **GIVEN** change spec 只包含 `## REMOVED Requirements`
- **AND** 首次 sync 删除了主 spec 中最后一个 requirement
- **AND** 主 spec 文件已被删除
- **WHEN** 再次执行 `opsx sync <change-name>`
- **THEN** sync SHALL treat that spec delta as already synced
- **AND** SHALL NOT 重建空的主 spec 文件

#### Scenario: unlabeled scenario differences 不阻塞 sync

- **GIVEN** change spec 的 `## MODIFIED Requirements` contains unlabeled scenario differences
- **WHEN** executing `opsx sync <change-name>`
- **THEN** sync SHALL continue without requiring scenario operation labels
- **AND** sync SHALL NOT write labels back to the change-local spec

### Requirement: Sync-created specs SHALL use runtime projection
`opsx sync` 创建或重建 formal specs 时 SHALL 消费 runtime projection，使新写入的 prose 遵循 config 策略而非硬编码英文模板。Sync 写入的 formal specs SHALL NOT 在 `#### Scenario:` 标题中包含 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` 等 scenario operation labels。

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

`opsx sync` SHALL 提供 `--no-verify` 选项，跳过 verify gate 检查。

#### Scenario: --no-verify 开关

- **WHEN** 用户执行 `opsx sync my-change --no-verify`
- **THEN** `skipVerify` 设为 `true`
- **AND** 不调用 `checkFreshness` 或 `checkArchiveCompatibility`
- **AND** 同步照常执行

### Requirement: Sync 按实际 OPSX operations 判断同步需求

Sync SHALL 根据 parsed `architecture-delta.c4` graph operations 与 change-local contract operations 判断是否需要同步，而不是仅根据文件存在。省略 graph delta SHALL 表示 graph scope 无变化；空 operation block SHALL 被拒绝。

#### Scenario: 无 graph delta 且无 contract delta
- **WHEN** change 没有待同步 graph 或 contract operations
- **THEN** SHALL 输出 `No sync required.`

#### Scenario: 只有 contract delta
- **WHEN** change 只有待同步 Specs
- **THEN** SHALL 只更新 contract modules
- **AND** SHALL 在完整 Target Semantic Model 上检查 binding 与 contractPolicy

#### Scenario: Real graph delta 要求 formal model
- **WHEN** graph delta 包含实际 operations 且 formal graph 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model

### Requirement: Sync 拒绝非 canonical 空 OPSX delta

Sync SHALL 始终使用对应 language version 的 graph delta parser。`--no-validate` MUST NOT 绕过 syntax 与 integrity validation；空 `extend`、空 OPSX annotation collection 或无法解析 operation MUST NOT 被当作 no-op。

#### Scenario: 空 graph operation fail-fast
- **WHEN** `architecture-delta.c4` 包含无任何 target change 的 operation block
- **THEN** sync SHALL 失败
- **AND** MUST NOT 写入 formal graph 或 Specs

#### Scenario: Invalid dialect syntax fail-fast
- **WHEN** delta 声明不受支持 language version 或 invalid OPSX annotation
- **THEN** sync SHALL 返回 structured ERROR
- **AND** MUST NOT 部分应用 contract deltas

### Requirement: Semantic Delta SHALL 原子提升

Sync SHALL 在 temporary workspace 中完成 graph merge、contract reconciliation、registry rebuild 与 full validation，随后一次提交全部 formal writes。任一 write 或 validation failure SHALL 回滚整个 Semantic Delta。

#### Scenario: Graph 与 contract 联合成功
- **WHEN** graph 新增 element 且 Spec 绑定该 element
- **AND** Target Semantic Model validation 通过
- **THEN** 两类 modules SHALL 同时写入
- **AND** formal registry SHALL 可立即查询该 binding

#### Scenario: Contract failure 回滚 graph
- **WHEN** graph merge 成功但 Spec binding 或 required contract validation 失败
- **THEN** graph change SHALL NOT 留在 formal source
- **AND** formal model SHALL 保持同步前内容

#### Scenario: Windows 原子 sync
- **WHEN** sync 在 Windows filesystem 执行
- **THEN** temporary 与 target paths SHALL 使用 Node.js path API
- **AND** rollback SHALL 恢复 graph 与 Spec files

