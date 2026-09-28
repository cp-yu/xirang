---
entity: element-declaration
identity: authoring-help
kind: element
parent: deterministic-operations
title: Authoring Help
definition: Authoring Help 定义 schema-backed authoring help 行为：`xirang help authoring` 从当前 Semantic Model 的 Metamodel 只读投影 Relationship Kinds，并输出文件级 authoring help、relation authoring help、JSON 输出与 Commander help 兼容。
---

## Specification

### Section: 文件级 authoring help
CLI SHALL 提供 `xirang help authoring [file]`；不提供 file 时列出 active authoring topics，提供 file 时渲染其 purpose、compilation role、includes、excludes、write policy 与 validation commands。

- **List authoring topics**
  - 用户运行 `xirang help authoring`
  - output SHALL 只列出 active authoring topics

### Section: Relation authoring help
Authoring help SHALL 从当前 Semantic Model 的 Metamodel 投影 active relation kinds 与 authoring rules。

- **Relation help is requested**
  - 用户运行 `xirang help authoring semantic-delta`
  - output SHALL 包含 active relation meaning、endpoints、use guidance 与 examples

### Section: Authoring help JSON 输出
`--json` 形式 SHALL 返回稳定的机器可读 file definition 与 relation metadata。

- **Agent requests JSON**
  - 用户添加 `--json`
  - stdout SHALL 是包含 `file`、`definition` 与 Metamodel 派生的 relation kinds 的合法 JSON

### Section: Commander help 兼容
同一 `xirang help` 命令 SHALL 继续解析普通 Commander command paths。

- **Command help is requested**
  - topics 不以 authoring 开头
  - CLI SHALL 显示匹配的 command help 或对未知 path 明确失败

### Section: Schema-backed file definition help
Authoring help SHALL 从内置 schema 解析 file definition，且 SHALL NOT 在 command code 中重复其语义。

- **Definition is unavailable**
  - active schema 缺少请求的 artifact definition
  - help SHALL 失败而不是编造 guidance
