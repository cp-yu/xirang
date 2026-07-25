---
element: cap.cli.diff
---
# cli-diff Specification

## Purpose
This specification records behavior introduced by change add-semantic-change-diff. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Change semantic diff command

系统 SHALL 提供 `xirang diff --change <name>`，从同一 immutable Formal snapshot 将 active change materialize 为 Target Semantic Model，并输出 Formal 与 Target 的完整 semantic text diff。默认执行 SHALL 只读且 SHALL NOT 创建或修改文件。

#### Scenario: 默认输出完整文本 diff
- **WHEN** 用户运行 `xirang diff --change payment-update`
- **THEN** 命令 SHALL 输出 Specs 与 Architecture 的 ADDED、MODIFIED、REMOVED summary
- **AND** SHALL 展示 Requirement、Scenario、element、relationship、Metamodel kind 与 property 的有效变化
- **AND** SHALL NOT 写入 change directory

#### Scenario: Active change 不存在
- **WHEN** 用户指定不存在或已进入 `.xirang/changes/archive/` 的 change
- **THEN** 命令 SHALL 输出 unknown active change error
- **AND** exit code SHALL 非零

#### Scenario: 存在 semantic changes 不是错误
- **WHEN** change 可成功 materialize 且包含一个或多个 effective changes
- **THEN** exit code SHALL 为 0
- **AND** SHALL NOT 使用非零状态表示“存在差异”

### Requirement: Diff projections share one result

`xirang diff` SHALL 支持 text、scope-filtered 与 JSON projections，所有 projections MUST 来自同一份 Diff IR，并保持 identity、operation、summary 与 diagnostics 一致。

#### Scenario: 只显示 Specs
- **WHEN** 用户运行 `xirang diff --change payment-update --scope specs`
- **THEN** 命令 SHALL 只渲染 Specs entries 与 Specs diagnostics
- **AND** overall validity SHALL 仍反映完整 change compilation result

#### Scenario: 只显示 Architecture
- **WHEN** 用户运行 `xirang diff --change payment-update --scope architecture`
- **THEN** 命令 SHALL 只渲染 Architecture entries 与 Architecture diagnostics

#### Scenario: JSON 输出完整 Diff IR
- **WHEN** 用户运行 `xirang diff --change payment-update --json`
- **THEN** 命令 SHALL 输出包含 schema version、fingerprints、valid、summary、entries 与 diagnostics 的 JSON
- **AND** entries SHALL 包含结构化 before、after、derived children 与可选 replacement association

### Requirement: Effective change review artifact

`xirang diff --change <name> --write` SHALL 在输出当前 text diff 的同时，以原子方式生成 `.xirang/changes/<name>/effective-change.md`。该文件 SHALL 是 deterministic generated review artifact，MUST NOT 作为 validation、sync 或 target materialization 输入。

#### Scenario: 写入有效报告
- **WHEN** change validation 通过且用户运行 `xirang diff --change payment-update --write`
- **THEN** 系统 SHALL 写入 validation status、formal/change fingerprints、summary、完整 Specs diff、完整 Architecture diff 与 diagnostics
- **AND** SHALL 按 canonical identity 稳定排序
- **AND** SHALL NOT 写入 `generatedAt`

#### Scenario: 相同输入生成相同文件
- **GIVEN** Formal snapshot 与 change source 均未变化
- **WHEN** 在 Windows、macOS 或 Linux 重复运行 `xirang diff --change payment-update --write`
- **THEN** `effective-change.md` 内容 SHALL 字节一致
- **AND** path SHALL 通过 Node.js path API 构造

#### Scenario: 无效 change 覆盖旧报告
- **WHEN** change 当前无法完整 validation
- **AND** 用户运行 `xirang diff --change payment-update --write`
- **THEN** 系统 SHALL 写入 `Status: Failed` 与当前 diagnostics
- **AND** SHALL 替换同一路径下过期的成功报告
- **AND** exit code SHALL 非零

### Requirement: Partial diff diagnostics

Diff compilation SHALL 在 Specs 或 Architecture 一侧失败时保留另一侧可计算的 entries，并明确标记整体 invalid。部分结果 MUST NOT 被表示为完整有效 change。

#### Scenario: Specs 失败而 Architecture 可计算
- **WHEN** Specs 包含 parse ERROR 且 Architecture target 可 materialize
- **THEN** text 与 JSON output SHALL 包含 Specs diagnostics 和 Architecture diff
- **AND** overall `valid` SHALL 为 false
- **AND** exit code SHALL 非零

#### Scenario: Architecture 失败而 Specs 可计算
- **WHEN** Architecture delta 包含 validation ERROR 且 Specs target 可 materialize
- **THEN** output SHALL 包含 Architecture diagnostics 和 Specs diff
- **AND** SHALL NOT 丢弃可计算的 Requirement/Scenario entries

