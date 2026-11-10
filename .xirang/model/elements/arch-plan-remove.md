---
entity: element-declaration
identity: arch-plan-remove
kind: element
parent: deterministic-operations
title: Arch Plan Remove
definition: Arch Plan Remove 定义 `xirang arch plan-remove` 的删除影响规划行为：分析严格非级联删除一个 Element 所需显式处理的 containment、semantic relationships 与其他语义引用（Element 的 Contract 随宿主单元一并删除），并在选中 change 时按已处理/未处理分类。
---

## Specification

### Section: Architecture removal impact planning

系统 SHALL 提供只读命令 `xirang arch plan-remove <element-id-or-fqn>`，分析严格非级联删除一个 element 所需显式处理的 containment、semantic relationships 与其他语义引用。Element 的 Contract 随宿主单元一并删除，不构成需要显式处理的独立 binding。

- **分析 formal element**
  - 用户对 Formal Semantic Model 中存在的 element 运行 `xirang arch plan-remove`
  - 命令 SHALL 以稳定 identity 输出 descendants、incident relationships、parent context 与其他显式引用
  - SHALL NOT 修改模型或 change artifacts

- **通过当前 FQN 定位**
  - 用户传入 element 当前 FQN
  - 命令 SHALL 定位同一稳定 element
  - output SHALL 使用稳定 identity 作为 canonical subject

- **Element 不存在**
  - 用户传入不存在的 element identity 或 FQN
  - 命令 SHALL 输出明确 not-found error
  - exit code SHALL 非零

### Section: Change-aware removal planning

`--change <active-change>` SHALL 基于该 change materialized target 分析删除影响，并将依赖按 change 已显式处理与仍未处理进行分类。

- **区分 Handled 与 Unresolved**
  - selected change 已移除一条 incident relationship，但仍保留一个 child
  - output SHALL 在 `Handled` 中列出已移除 relationship
  - SHALL 在 `Unresolved` 中列出 child
  - SHALL 输出 `Required before target can validate` 数量

- **Replacement hint 不自动处理引用**
  - selected change 声明 REMOVED Element 但旧 element 的 relationship 或 descendants 未被显式 reconcile
  - 这些依赖 SHALL 保持 `Unresolved`
  - REMOVED Entry 的完整 target payload MUST NOT 被解释为自动迁移引用

- **Contract-only change**
  - selected active change 没有结构单元 delta
  - command SHALL 基于 Formal model 与 change target 的 Element 单元分析
  - SHALL NOT 要求存在结构单元 delta

### Section: Removal planning output contract

命令 SHALL 提供 deterministic human-readable 与 `--json` outputs。stdout SHALL 仅承载删除计划数据；实际警告与错误 SHALL 写入 stderr，`--json` 同时决定计划及诊断的结构化编码。诊断 SHALL 保留可用的 Change 或模型归属、路径、代码与原因。发现依赖是成功的分析结果；只有命令或 compilation error 才 SHALL 返回非零。

- **Human-readable dependencies**
  - element 有 unresolved dependencies
  - text output SHALL 分组显示 `Handled`、`Unresolved` 与 required reconciliation count
  - exit code SHALL 为 0

- **JSON dependencies**
  - 用户运行带 `--change` 的 `xirang arch plan-remove`
  - JSON SHALL 包含 subject、change、context、handled、unresolved 与 requiredCount
  - 每个 dependency SHALL 包含 type 与 canonical identity
  - 编译诊断 SHALL 通过 stderr 交付，不作为 stdout 中的 diagnostics 字段重复返回

- **警告与计划同时交付**
  - 读取模型或编译 Change 得到警告且删除计划可用
  - stdout SHALL 保留计划数据，stderr SHALL 返回实际警告，exit code SHALL 为 0
  - 无问题时 stderr SHALL 为空

- **跨平台 change path**
  - command 在 Windows、macOS 或 Linux 定位 change 与 Formal source
  - SHALL 使用 Node.js path API 与 normalized project-relative paths
  - SHALL NOT 假设路径分隔符
