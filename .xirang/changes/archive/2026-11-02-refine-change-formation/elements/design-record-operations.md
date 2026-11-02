---
operation: MODIFIED
entity: element-declaration
identity: design-record-operations
kind: "element"
parent: "deterministic-operations"
title: "Design Record Operations"
definition: "Design Record Operations 是管理中间设计记录的 CLI 确定性操作集合。它包含生命周期管理、完整与选择读取、局部更新及版本检查、结构校验、覆盖结果记录和门禁化交接；不承担用户意图裁决、自然语言语义判断或正式模型提升。"
---

## ADDED Sections

### Section: 按条目选择读取

`xirang record show <explorationId> --entry <identity>` SHALL 支持重复 --entry，一次选一条或多条。选择读取返回记录身份、当前记录级 sourceVersion 和所选条目的完整 identity、nature、decision、content，不附无关条目正文或完整模型基准快照。未知条目 SHALL 返回稳定诊断，不静默省略。无 --entry 时返回完整当前记录；读取均不修改文件。

- 选择 A 与 C：只返回 A、C 的完整条目及记录身份、sourceVersion，B 和基准快照不出现。
- 条目内容变化后，完整读与选择读返回相同的新记录级版本；不维护独立条目版本。

## MODIFIED Sections

### Section: 管理统一确认记录生命周期

`xirang record create|list|show|status|validate|update|rename|coverage|consume|discard` SHALL 管理非空中间设计记录，以 explorationId 寻址，Build 与 Change 使用独立实例。记录 payload 使用 schemaVersion: 4，每条条目显式包含 nature、decision、content 与 identity；缺失状态或旧格式 SHALL 明确拒绝，不将旧条目默认视为 accepted，不自动迁移、删除或创建兼容副本。list 与 status 可重新发现记录，未选择条目的 show 保留完整读取。CLI 不决定哪些用户内容重要，不推断用户已确认。

- 非空 pending 条目也可创建记录；条目和结构均为空仍拒绝。
- schemaVersion: 3 或缺失 decision：返回不支持格式或字段诊断，原文件保持不变。
- 不发现 .xirang/framing/ 为有效记录，不提供 xirang framing 或其他兼容别名。

### Section: 按部分更新记录

`xirang record update` SHALL 接收只含本次变化的输入：条目的 upsert 与按 identity 删除，结构对象的 upsert 与按语义 identity 撤回，以及可选的 relatedIdentities 变化；未提及的条目与结构对象 SHALL 保持不变。结构对象 upsert SHALL 按字段合并：提供的字段替换原值，显式列入清除列表的字段从记录中移除，未提供的字段保持不变；`parent: null` 表示 Project Root 而非清除。撤回表示该对象回到尚未确认，区别于以 `removed: true` 表达的目标删除。entries.upsert SHALL 接收完整条目目标，包括 nature 与 decision；entries.remove 沿用 identity 删除，不新增条目级写入协议。变更的 nature、decision SHALL 出现在 before / after，概况同时报告各决策状态数量；CLI 校验字段与版本，用户确认授权由 Agent 按共享协议遵守。每次 update SHALL 携带 `--source-version`；与当前记录版本不一致时 SHALL 拒绝写入并返回当前版本。写入后 SHALL 返回本次差异、记录概况（条目数、normative 条目数、各类结构对象数）与新 sourceVersion，SHALL NOT 返回完整记录内容。

- **部分更新保留未提及内容**

  - 记录已有 18 条条目，update 只 upsert 一条新条目并修改一条
  - 其余 17 条逐字不变，返回差异与“共 19 条”的概况。

- **版本过期拒绝写入**

  - Agent 持有的 sourceVersion 已被另一次写入取代
  - update 返回 invalid 与当前 sourceVersion，记录不变。

- **字段级合并**

  - 结构部分的 Element D 已有 parent 与 kind，update 只提供 definition
  - D 保留原 parent 与 kind，并新增 definition。

### Section: 记录覆盖检查结果

`xirang record coverage` SHALL 接收显式 named Change 或 active Candidate 的状态化检查结果。每条 accepted normative 条目须有原子细节及位置，或显式声明不适用并给理由；每条 pending 条目须报告是否影响当前目标，不影响须给理由，影响而未解决则拒绝。excluded 与 informative 无须目标承诺位置。不得以记录中出现过为由要求所有条目编译，也不得漏检已采纳义务。

CLI SHALL 拒绝未知条目、缺失必需结果、空细节、未覆盖细节、无理由的不适用/不影响声明、仍影响目标的 pending 结果，以及与 nature 或 decision 不一致的结果类型。Agent 判断适用性与理由是否成立，CLI 不推断自然语言语义或用户授权。

位置在 Expected Semantic Model 或 Candidate 中须真实存在，可为 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind、Authored View。Element 位置须附当前原文摘录，忽略空白与 Markdown 强调后匹配 Declaration 的 title/definition、Section（含案例）或案例名称/正文；其余实体按 identity 校验。全部通过才连同 sourceVersion 与目标指纹写入 record-coverage.json；任何失败返回 invalid 与逐项诊断，不写入。

- accepted normative 条目少报一条，或细节摘录不存在：拒绝并指出条目与细节。
- pending 问题影响当前 Change：拒绝交接；不影响且有理由可留在来源历史。
- excluded 方案与 informative 实验依据：不要求虚构目标位置。
- 指向不存在的 Section，或只写“已覆盖”而没有原子细节：拒绝。
