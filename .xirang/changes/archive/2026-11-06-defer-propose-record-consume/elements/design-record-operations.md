---
entity: element-declaration
identity: design-record-operations
kind: element
parent: deterministic-operations
title: Design Record Operations
definition: Design Record Operations 是管理中间设计记录的 CLI 确定性操作集合。它包含生命周期管理、完整与选择读取、局部更新及版本检查、结构校验、覆盖结果记录和门禁化交接；不承担用户意图裁决、自然语言语义判断或正式模型提升。
---

## MODIFIED Sections

### Section: 记录覆盖检查结果

`xirang record coverage` SHALL 接收显式 named Change 或 active Candidate 的状态化检查结果。每条 accepted normative 条目须有原子细节及位置，或显式声明不适用并给理由；每条 pending 条目须报告是否影响当前目标，不影响须给理由，影响而未解决则拒绝。excluded 与 informative 无须目标承诺位置。不得以记录中出现过为由要求所有条目编译，也不得漏检已采纳义务。

CLI SHALL 拒绝未知条目、缺失必需结果、空细节、未覆盖细节、无理由的不适用/不影响声明、仍影响目标的 pending 结果，以及与 nature 或 decision 不一致的结果类型。Agent 判断适用性与理由是否成立，CLI 不推断自然语言语义或用户授权。

位置在 Expected Semantic Model 或 Candidate 中须真实存在，可为 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind、Authored View。Element 位置须附当前原文摘录，忽略空白与 Markdown 强调后匹配 Declaration 的 title/definition、Section（含案例）或案例名称/正文；其余实体按 identity 校验。对 named Change，CLI SHALL 在写入 coverage 前将记录结构逐字段与 Expected Semantic Model 比对；结构对象缺失、已确认字段不一致或 `removed: true` 对象仍存在时拒绝并报告差异。Candidate 的结构门禁仍在 consume 执行。全部通过才连同 sourceVersion 与目标指纹写入 record-coverage.json；任何失败返回诊断，不写入或替换已有结果。

- accepted normative 条目少报一条，或细节摘录不存在：拒绝并指出条目与细节。
- pending 问题影响当前 Change：拒绝交接；不影响且有理由可留在来源历史。
- excluded 方案与 informative 实验依据：不要求虚构目标位置。
- 指向不存在的 Section，或只写“已覆盖”而没有原子细节：拒绝。
- Change 的结构记录确认 Element D 的 parent 为 X，目标为 Y，或标为删除的 Kind 仍存在：coverage 拒绝并逐项报告，不替换已有结果；修正后可重新记录覆盖。
