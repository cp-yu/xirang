---
entity: element-declaration
identity: arch-plan-remove
kind: capability
parent: deterministic-operations
title: Arch Plan Remove
definition: Arch Plan Remove 定义 `xirang arch plan-remove` 的删除影响规划行为：分析严格非级联删除一个 Element 所需显式处理的 containment、semantic relationships 与其他语义引用（Element 的 Contract 随宿主单元一并删除），并在选中 change 时按已处理/未处理分类。
---

## Requirements

### Requirement: Architecture removal impact planning

系统 SHALL 提供只读命令 `xirang arch plan-remove <element-id-or-fqn>`，分析严格非级联删除一个 element 所需显式处理的 containment、semantic relationships 与其他语义引用。Element 的 Contract 随宿主单元一并删除，不构成需要显式处理的独立 binding。

#### Scenario: 分析 formal element
- **WHEN** 用户对 Formal Semantic Model 中存在的 element 运行 `xirang arch plan-remove`
- **THEN** 命令 SHALL 以稳定 identity 输出 descendants、incident relationships、parent context 与其他显式引用
- **AND** SHALL NOT 修改模型或 change artifacts

#### Scenario: 通过当前 FQN 定位
- **WHEN** 用户传入 element 当前 FQN
- **THEN** 命令 SHALL 定位同一稳定 element
- **AND** output SHALL 使用稳定 identity 作为 canonical subject

#### Scenario: Element 不存在
- **WHEN** 用户传入不存在的 element identity 或 FQN
- **THEN** 命令 SHALL 输出明确 not-found error
- **AND** exit code SHALL 非零

### Requirement: Change-aware removal planning

`--change <active-change>` SHALL 基于该 change materialized target 分析删除影响，并将依赖按 change 已显式处理与仍未处理进行分类。

#### Scenario: 区分 Handled 与 Unresolved
- **WHEN** selected change 已移除一条 incident relationship，但仍保留一个 child
- **THEN** output SHALL 在 `Handled` 中列出已移除 relationship
- **AND** SHALL 在 `Unresolved` 中列出 child
- **AND** SHALL 输出 `Required before target can validate` 数量

#### Scenario: Replacement hint 不自动处理引用
- **WHEN** selected change 声明 REMOVED Element 但旧 element 的 relationship 或 descendants 未被显式 reconcile
- **THEN** 这些依赖 SHALL 保持 `Unresolved`
- **AND** REMOVED Entry 的完整 target payload MUST NOT 被解释为自动迁移引用

#### Scenario: Contract-only change
- **WHEN** selected active change 没有结构单元 delta
- **THEN** command SHALL 基于 Formal model 与 change target 的 Element 单元分析
- **AND** SHALL NOT 要求存在结构单元 delta

### Requirement: Removal planning output contract

命令 SHALL 提供 deterministic human-readable 与 `--json` outputs。发现依赖是成功的分析结果；只有命令或 compilation error 才 SHALL 返回非零。

#### Scenario: Human-readable dependencies
- **WHEN** element 有 unresolved dependencies
- **THEN** text output SHALL 分组显示 `Handled`、`Unresolved` 与 required reconciliation count
- **AND** exit code SHALL 为 0

#### Scenario: JSON dependencies
- **WHEN** 用户运行带 `--change` 的 `xirang arch plan-remove`
- **THEN** JSON SHALL 包含 subject、change、handled、unresolved、requiredCount 与 diagnostics
- **AND** 每个 dependency SHALL 包含 type 与 canonical identity

#### Scenario: 跨平台 change path
- **WHEN** command 在 Windows、macOS 或 Linux 定位 change 与 Formal source
- **THEN** SHALL 使用 Node.js path API 与 normalized project-relative paths
- **AND** SHALL NOT 假设路径分隔符
