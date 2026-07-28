---
entity: element-declaration
identity: deterministic-operations
---

## ADDED Requirements

### Requirement: 通过 Validation 呈现 Change 差异

Deterministic Operations SHALL 通过 `xirang validate --change <name>` 提供 Change 的只读文本差异预览与 JSON summary、entries 和 diagnostics，SHALL NOT 注册独立 `xirang diff` command 或将该差异持久化为 Change artifact。

#### Scenario: 校验 Change 并查看文本差异

- **WHEN** 用户或 Agent 运行 `xirang validate --change sample`
- **THEN** CLI 在校验结果中呈现当前 Semantic Model 与 Expected Semantic Model 的差异且不创建文件

#### Scenario: 获取结构化校验结果

- **WHEN** 用户或 Agent 运行 `xirang validate --change sample --json`
- **THEN** CLI 返回 validation status、summary、concise entries 与 diagnostics

#### Scenario: 调用已删除的 Diff command

- **WHEN** 用户或脚本运行 `xirang diff --change sample`
- **THEN** CLI 以 unknown command 失败且不修改 Change directory
