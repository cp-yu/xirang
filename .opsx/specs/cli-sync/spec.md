---
element: cap.cli.sync
---

# Spec: cli-sync

## Purpose

`opsx sync` 命令将 change 中的 delta Specs 与 architecture delta 同步到 formal Specs 和 LikeC4 architecture modules，不执行归档。

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

`opsx sync` SHALL 在 verify gate 通过后，从 immutable Formal snapshot 将 change-local graph 与 contract operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 review metadata 或静默迁移 language version。

#### Scenario: verify gate 失败输出指引
- **WHEN** freshness 为 STALE 或 archive compatibility 不满足
- **THEN** SHALL 输出 changed files、重新 verify 命令与 `--no-verify` option
- **AND** exit code SHALL 非零

#### Scenario: verify gate 通过后执行同步
- **WHEN** freshness 为 FRESH 且 archive compatible
- **THEN** SHALL 构造 Target Semantic Model 与内部 Diff IR
- **AND** validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 graph 与 Specs

#### Scenario: --no-verify 跳过 gate
- **WHEN** 用户运行 `opsx sync <change> --no-verify`
- **THEN** SHALL 跳过 verify freshness gate
- **AND** MUST NOT 跳过 syntax、identity、integrity、fingerprint 与 target validation

#### Scenario: sync 不修改 change review source
- **WHEN** sync prepares Semantic Delta
- **THEN** MUST NOT 修改 change-local Specs、Architecture delta 或 `effective-change.md`
- **AND** MUST NOT 生成 Scenario operation metadata

#### Scenario: 同步后 evidence fingerprint 刷新
- **WHEN** sync 成功写入 formal graph 或 Specs
- **THEN** SHALL 只刷新与实际 outputs 重叠的 evidence hashes
- **AND** SHALL 使用当前 `.opsx/architecture/` 与 `.opsx/specs/` paths

### Requirement: 不触发归档

`opsx sync` SHALL NOT 归档或移动 change directory。Sync 只 MAY 通过 prepared transaction 写入 formal Specs 与 Architecture modules。

#### Scenario: 同步后 change 目录保持不变
- **WHEN** sync 成功完成
- **THEN** active change directory 与其中 artifacts SHALL 保持原路径
- **AND** generated review artifact SHALL NOT 因 sync 被创建、更新或删除

### Requirement: 幂等性

`opsx sync` SHALL 保持 target-state 幂等性。重复执行不得引入额外 graph、contract 或 formatting differences；identity operations 已全部反映在 Formal Model 时 SHALL 被判断为 already synchronized。

#### Scenario: 重复执行产生相同结果
- **GIVEN** 已对某 change 成功执行 sync
- **WHEN** Formal target 未被其他 change 修改且再次执行 sync
- **THEN** formal Specs 与 Architecture SHALL 与首次同步后字节一致

#### Scenario: removal-only delta 的目标 headers 已缺失
- **GIVEN** change Spec 只包含 `## REMOVED Requirements`
- **AND** 所有 target headers 已从 Formal Spec 缺失
- **WHEN** 再次执行 sync
- **THEN** SHALL 将该 contract delta 视为已同步

#### Scenario: removal-only delta 清空 Spec
- **GIVEN**首次 sync 删除了 Formal Spec 最后一个 Requirement 并删除该 Spec file
- **WHEN** 再次执行 sync
- **THEN** SHALL 将该 delta 视为已同步
- **AND** SHALL NOT 重建空 Spec

#### Scenario: 完整 MODIFIED Requirement 已同步
- **WHEN** Formal Requirement 已与 change-local完整 target block 相同
- **THEN** sync SHALL 将 operation 视为已应用
- **AND** SHALL NOT 依赖 Scenario labels 判断等价性

### Requirement: Sync-created specs SHALL use runtime projection

`opsx sync` 创建或重建 Formal Specs 时 SHALL 消费 runtime projection，并写入 canonical unlabeled Scenario headings。任何 Scenario operation-like label SHALL 在 validation 阶段阻止 sync，而不是在写入时被清洗。

#### Scenario: New formal spec uses projected prose policy
- **WHEN** sync 创建尚不存在的 Formal Spec
- **THEN** SHALL 对生成 prose 使用 runtime projection
- **AND** SHALL 保留 canonical headers、normative keywords 与 BDD keywords

#### Scenario: Existing formal spec update does not inject unrelated boilerplate
- **WHEN** sync 更新 existing Formal Spec
- **THEN** SHALL 将写入限制在 target reconciliation 范围
- **AND** SHALL NOT 修改 unrelated sections

#### Scenario: Scenario label 阻止 sync
- **WHEN** change-local Spec 包含 Scenario operation-like label
- **THEN** combined validation SHALL 失败
- **AND** sync SHALL NOT 写入任何 Formal modules

### Requirement: --no-verify 选项

`opsx sync` SHALL 提供 `--no-verify` 选项，跳过 verify gate 检查。

#### Scenario: --no-verify 开关

- **WHEN** 用户执行 `opsx sync my-change --no-verify`
- **THEN** `skipVerify` 设为 `true`
- **AND** 不调用 `checkFreshness` 或 `checkArchiveCompatibility`
- **AND** 同步照常执行

### Requirement: Sync 按实际 Semantic Delta operations 判断同步需求

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

### Requirement: Sync 拒绝非 canonical 空 architecture delta

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

Sync SHALL 在 temporary workspace 中完成 target materialization、registry rebuild、full validation、Diff IR generation 与 Formal fingerprint recheck，随后一次提交全部 formal writes。

#### Scenario: Graph 与 contract 联合成功
- **WHEN** graph 新增 element 且 Spec 绑定该 element
- **AND** Target validation 与 fingerprint recheck 通过
- **THEN** 两类 modules SHALL 同时写入
- **AND** Formal registry SHALL 可立即查询该 binding

#### Scenario: Contract failure 回滚 graph
- **WHEN** graph materialization 成功但 Spec binding 或 contract validation 失败
- **THEN** graph change SHALL NOT 留在 Formal source

#### Scenario: Stale Formal snapshot
- **WHEN** prepare 后检测到 Formal fingerprint 改变
- **THEN** sync SHALL 拒绝全部 writes
- **AND** SHALL 指引重新 validate 与 diff

#### Scenario: Windows 原子 sync
- **WHEN** sync 在 Windows filesystem 执行
- **THEN** temporary、backup 与 target paths SHALL 使用 Node.js path API
- **AND** rollback SHALL 恢复全部 graph 与 Spec files

### Requirement: Sync 按实际 OPSX operations 判断同步需求

Sync SHALL 根据 parsed identity-level Architecture operations 与 Requirement operations 判断同步需求。缺失 `architecture-delta.c4` SHALL 表示 graph no-op；存在的 graph delta 必须含真实 operation。

#### Scenario: 无 graph delta 且无 contract delta
- **WHEN** change 没有待同步 operations
- **THEN** SHALL 输出 `No sync required.`

#### Scenario: 只有 contract delta
- **WHEN** change 只有待同步 Specs
- **THEN** SHALL 只更新 contract modules
- **AND** SHALL 在完整 Target Semantic Model 上检查 bindings 与 contract policy

#### Scenario: Real graph delta 要求 Formal Model
- **WHEN** graph delta 包含 operation 且 Formal graph 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model

### Requirement: Sync 拒绝非 canonical 空 OPSX delta

Sync SHALL 使用 target language version 的 Architecture delta parser。`--no-validate` MUST NOT 绕过 syntax 与 integrity validation；空 section、只有 replacement hint 或 raw `extend` MUST NOT 被当作 no-op。

#### Scenario: 空 graph operation fail-fast
- **WHEN** `architecture-delta.c4` 无真实 target operation
- **THEN** sync SHALL 失败
- **AND** MUST NOT 写入 Formal graph 或 Specs

#### Scenario: Invalid dialect syntax fail-fast
- **WHEN** delta 使用不受支持 version、raw `extend` 或 invalid operation
- **THEN** SHALL 返回 structured ERROR
- **AND** MUST NOT partial apply contract deltas

