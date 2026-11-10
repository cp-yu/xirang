---
entity: element-declaration
identity: arch-plan-remove
kind: element
parent: deterministic-operations
title: Arch Plan Remove
definition: Arch Plan Remove 定义 `xirang arch plan-remove` 的删除影响规划行为：分析严格非级联删除一个 Element 所需显式处理的 containment、semantic relationships 与其他语义引用（Element 的 Contract 随宿主单元一并删除），并在选中 change 时按已处理/未处理分类。
---

## MODIFIED Sections

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
