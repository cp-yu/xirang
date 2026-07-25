---
element: cap.cli.arch-plan-remove
---
# arch-plan-remove-command Specification

## Purpose
This specification records behavior introduced by change add-semantic-change-diff. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Architecture removal impact planning

系统 SHALL 提供只读命令 `xirang arch plan-remove <element-id-or-fqn>`，分析严格非级联删除一个 element 所需显式处理的 containment、semantic relationships、Element Contracts 与其他语义引用。

#### Scenario: 分析 formal element
- **WHEN** 用户对 Formal Architecture 中存在的 element 运行 `xirang arch plan-remove payment.authorize`
- **THEN** 命令 SHALL 以 stable element identity 输出 descendants、incident relationships、Spec bindings、parent context 与其他显式引用
- **AND** SHALL NOT 修改 Architecture、Specs 或 change artifacts

#### Scenario: 通过当前 FQN 定位
- **WHEN** 用户传入 element 当前 FQN
- **THEN** 命令 SHALL 定位同一 stable element
- **AND** output SHALL 使用 stable identity 作为 canonical subject

#### Scenario: Element 不存在
- **WHEN** 用户传入不存在的 element identity 或 FQN
- **THEN** 命令 SHALL 输出明确 not-found error
- **AND** exit code SHALL 非零

### Requirement: Change-aware removal planning

`--change <active-change>` SHALL 基于该 change materialized target 分析删除影响，并将依赖按 change 已显式处理与仍未处理进行分类。

#### Scenario: 区分 Handled 与 Unresolved
- **WHEN** selected change 已移除一条 incident relationship，但仍保留一个 child 与一个 Spec binding
- **THEN** output SHALL 在 `Handled` 中列出已移除 relationship
- **AND** SHALL 在 `Unresolved` 中列出 child 与 Spec binding
- **AND** SHALL 输出 `Required before target can validate` 数量

#### Scenario: Replacement hint 不自动处理引用
- **WHEN** selected change 使用 `replace element old.id with new.id`
- **AND** 旧 element 的 relationship 或 Spec binding 未被显式 reconcile
- **THEN** 这些依赖 SHALL 保持 `Unresolved`
- **AND** hint MUST NOT 被解释为自动迁移

#### Scenario: Specs-only change
- **WHEN** selected active change 没有 `architecture-delta.c4`
- **THEN** command SHALL 使用 Formal Architecture 与 change-local contract target 分析 bindings
- **AND** SHALL NOT 要求存在 graph delta

### Requirement: Removal planning output contract

命令 SHALL 提供 deterministic human-readable 与 `--json` outputs。发现依赖是成功的分析结果；只有命令或 compilation error 才 SHALL 返回非零。

#### Scenario: Human-readable dependencies
- **WHEN** element 有 unresolved dependencies
- **THEN** text output SHALL 分组显示 `Handled`、`Unresolved` 与 required reconciliation count
- **AND** exit code SHALL 为 0

#### Scenario: JSON dependencies
- **WHEN** 用户运行 `xirang arch plan-remove payment.authorize --change refactor-payment --json`
- **THEN** JSON SHALL 包含 subject、change、handled、unresolved、requiredCount 与 diagnostics
- **AND** 每个 dependency SHALL 包含 type 与 canonical identity

#### Scenario: 跨平台 change path
- **WHEN** command 在 Windows、macOS 或 Linux 定位 `.xirang/changes/<name>` 与 Specs
- **THEN** SHALL 使用 Node.js path API 与 normalized project-relative paths
- **AND** SHALL NOT 假设路径分隔符

