---
element: cli.sync
---
## MODIFIED Requirements

### Requirement: 同步执行

`opsx sync` SHALL 在 verify gate 通过后，将 change-local graph 与 contract modules 作为一个 Semantic Delta prepare、联合验证并原子写入 formal OPSX Semantic Model。Sync SHALL NOT 生成 scenario labels，也 SHALL NOT 静默迁移 language version。

#### Scenario: [ADDED] verify gate 失败输出指引
- **WHEN** freshness 为 STALE 或 archive compatibility 不满足
- **THEN** SHALL 输出 changed files、重新 verify 命令与 `--no-verify` option
- **AND** exit code SHALL 非零

#### Scenario: [MODIFIED] verify gate 通过后执行同步
- **WHEN** freshness 为 FRESH 且 archive compatible
- **THEN** SHALL 构造 Target Semantic Model 并执行 combined validation
- **AND** validation 通过后 SHALL 原子写入 graph 与 Specs

#### Scenario: [ADDED] --no-verify 跳过 gate
- **WHEN** 用户运行 `opsx sync <change> --no-verify`
- **THEN** SHALL 跳过 freshness gate
- **AND** MUST NOT 跳过 Semantic Model syntax 与 integrity validation

#### Scenario: [MODIFIED] sync 不写入 scenario labels
- **WHEN** sync prepares contract deltas
- **THEN** MUST NOT 运行 scenario-label write
- **AND** MUST NOT 仅为 labels 修改 change-local Specs

#### Scenario: [ADDED] 同步后 evidence fingerprint 刷新
- **WHEN** sync 成功写入 formal graph 或 Specs
- **THEN** SHALL 只刷新与实际 outputs 重叠的 evidence hashes
- **AND** SHALL 使用当前 `.opsx/architecture/` 与 `.opsx/specs/` paths

#### Scenario: [REMOVED] verify gate 失败输出可操作指引

- **GIVEN** 用户执行 `opsx sync my-change`
- **AND** `.verify-result.json` 存在但 freshness 为 STALE
- **WHEN** verify gate 检查失败
- **THEN** 错误输出 SHALL 包含变更文件列表
- **AND** 包含建议重新 verify 的命令
- **AND** 包含 `--no-verify` 跳过选项
- **AND** exit code 非 0

#### Scenario: [REMOVED] --no-verify 跳过 verify gate

- **GIVEN** 用户执行 `opsx sync my-change --no-verify`
- **AND** freshness 为 STALE
- **WHEN** 命令执行
- **THEN** 跳过 verify gate 直接进入同步
- **AND** 不输出 `formatVerifyGateFailure` 结果

#### Scenario: [REMOVED] 同步后 evidence fingerprint 自动刷新

- **GIVEN** 用户执行 `opsx sync my-change`
- **AND** sync 前 `.verify-result.json` 为 FRESH
- **AND** evidence 中包含 `opsx/project.opsx.yaml`
- **AND** sync 写入了 OPSX delta
- **WHEN** sync 完成
- **THEN** `.verify-result.json` 中 `opsx/project.opsx.yaml` 的 hash SHALL 被更新为当前文件内容的哈希
- **AND** `evidenceFingerprint` SHALL 基于更新后的 entries 重新计算
- **AND** 后续 `opsx verify status my-change --json` SHALL 返回 FRESH

### Requirement: Sync 按实际 OPSX operations 判断同步需求

Sync SHALL 根据 parsed `architecture-delta.c4` graph operations 与 change-local contract operations 判断是否需要同步，而不是仅根据文件存在。省略 graph delta SHALL 表示 graph scope 无变化；空 operation block SHALL 被拒绝。

#### Scenario: [ADDED] 无 graph delta 且无 contract delta
- **WHEN** change 没有待同步 graph 或 contract operations
- **THEN** SHALL 输出 `No sync required.`

#### Scenario: [ADDED] 只有 contract delta
- **WHEN** change 只有待同步 Specs
- **THEN** SHALL 只更新 contract modules
- **AND** SHALL 在完整 Target Semantic Model 上检查 binding 与 contractPolicy

#### Scenario: [ADDED] Real graph delta 要求 formal model
- **WHEN** graph delta 包含实际 operations 且 formal graph 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model

#### Scenario: [REMOVED] 只有 canonical no-op delta
- **GIVEN** `opsx-delta.yaml` 只包含 `schema_version: 2`
- **AND** change 没有待同步 delta Specs
- **WHEN** 执行 `opsx sync <change-name> --no-verify`
- **THEN** SHALL 输出 `No sync required.`
- **AND** SHALL NOT 要求 formal OPSX bundle 或写入 OPSX

#### Scenario: [REMOVED] Specs 与 canonical no-op 并存
- **GIVEN** change 包含待同步 delta Specs 与 canonical no-op OPSX delta
- **AND** formal OPSX bundle 不存在
- **WHEN** 执行 sync
- **THEN** SHALL 只同步 Specs
- **AND** summary SHALL 输出 `opsx: no-delta`

#### Scenario: [REMOVED] Real delta 仍要求 formal OPSX
- **GIVEN** OPSX delta 包含至少一个实际 operation
- **AND** formal OPSX bundle 不存在
- **WHEN** 执行 sync
- **THEN** SHALL 失败并报告无法应用 OPSX delta

### Requirement: Sync 拒绝非 canonical 空 OPSX delta

Sync SHALL 始终使用对应 language version 的 graph delta parser。`--no-validate` MUST NOT 绕过 syntax 与 integrity validation；空 `extend`、空 OPSX annotation collection 或无法解析 operation MUST NOT 被当作 no-op。

#### Scenario: [ADDED] 空 graph operation fail-fast
- **WHEN** `architecture-delta.c4` 包含无任何 target change 的 operation block
- **THEN** sync SHALL 失败
- **AND** MUST NOT 写入 formal graph 或 Specs

#### Scenario: [ADDED] Invalid dialect syntax fail-fast
- **WHEN** delta 声明不受支持 language version 或 invalid OPSX annotation
- **THEN** sync SHALL 返回 structured ERROR
- **AND** MUST NOT 部分应用 contract deltas

#### Scenario: [REMOVED] 空 section fail-fast
- **GIVEN** delta 包含 `ADDED: {}`
- **WHEN** 执行 `opsx sync <change-name> --no-validate --no-verify`
- **THEN** sync SHALL 以 `Invalid opsx-delta.yaml` 失败
- **AND** SHALL NOT 写入 formal Specs 或 OPSX

#### Scenario: [REMOVED] 空 collection fail-fast
- **GIVEN** delta 包含 `MODIFIED.capabilities: []`
- **WHEN** sync 评估 change state
- **THEN** `readOpsxDelta()` SHALL 拒绝该文件
- **AND** SHALL NOT 报告为 `no-delta`

## ADDED Requirements

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
