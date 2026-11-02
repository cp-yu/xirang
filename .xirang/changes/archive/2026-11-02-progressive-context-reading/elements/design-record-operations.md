---
entity: element-declaration
identity: design-record-operations
kind: element
parent: deterministic-operations
title: Design Record Operations
definition: Design Record Operations 是管理中间设计记录的 CLI 确定性操作集合。它包含生命周期管理、完整与选择读取、局部更新及版本检查、结构校验、覆盖结果记录和门禁化交接；不承担用户意图裁决、自然语言语义判断或正式模型提升。
---

## MODIFIED Sections

### Section: 提供稳定 Record JSON Contract

每个 `xirang record` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes；不输出 spinner、颜色或 stack trace。每个命令 SHALL 按职责返回最小默认投影，不得因生成操作回执而回传完整 document 或 baseline。

- **发现记录**

  - 用户或 Agent 运行 `xirang record list --json`
  - 返回记录索引、explorationId、slug、sourceVersion、状态与摘要
  - 不返回 record payload 或 baseline

- **创建或重命名记录**

  - `record create` 或 `record rename` 成功
  - 返回操作回执、记录身份、新 sourceVersion 与摘要
  - 不返回完整 document 或 baseline

- **读取与状态操作**

  - `record show` 返回完整 design payload、结构和元信息但不返回 baseline
  - `record status`、`record validate` 与 `record update` 返回状态、差异、诊断、结构比较、摘要和 sourceVersion
  - status、validate 和 update 不返回完整 document

- **Validation 发现相关 Drift**

  - command 成功读取记录但关联上下文已变化
  - JSON status 为 invalid、exit code 为 1。

### Section: 管理统一确认记录生命周期

`xirang record create|list|show|status|validate|update|rename|coverage|consume|discard` SHALL 管理非空中间设计记录，以 explorationId 寻址，Build 与 Change 使用独立实例。记录 payload 使用 schemaVersion: 4，每条条目显式包含 nature、decision、content 与 identity；缺失状态或旧格式 SHALL 明确拒绝，不将旧条目默认视为 accepted，不自动迁移、删除或创建兼容副本。list 与 status 可重新发现记录，未选择条目的 show 保留完整读取；普通命令返回值 SHALL 隔离内部 baseline，baseline 继续持久化并供确定性 drift 检查使用。CLI 不决定哪些用户内容重要，不推断用户已确认。

- 非空 pending 条目也可创建记录；条目和结构均为空仍拒绝。
- schemaVersion: 3 或缺失 decision：返回不支持格式或字段诊断，原文件保持不变。
- 不发现 `.xirang/framing/` 为有效记录，不提供 `xirang framing` 或其他兼容别名。
- `record show` 无 `--entry` 时返回完整当前 design payload、structure 与 metadata，不返回 baseline。
- `record show --entry` 继续只返回显式选择条目，不返回无关内容或 baseline。

### Section: 按部分更新记录

`xirang record update` SHALL 接收只含本次变化的输入：条目的 upsert 与按 identity 删除，结构对象的 upsert 与按语义 identity 撤回，以及可选的 relatedIdentities 变化；未提及的条目与结构对象 SHALL 保持不变。结构对象 upsert SHALL 按字段合并：提供的字段替换原值，显式列入清除列表的字段从记录中移除，未提供的字段保持不变；`parent: null` 表示 Project Root 而非清除。撤回表示该对象回到尚未确认，区别于以 `removed: true` 表达的目标删除。entries.upsert SHALL 接收完整条目目标，包括 nature 与 decision；entries.remove 沿用 identity 删除，不新增条目级写入协议。变更的 nature、decision SHALL 出现在 before / after，概况同时报告各决策状态数量；CLI 校验字段与版本，用户确认授权由 Agent 按共享协议遵守。每次 update SHALL 携带 `--source-version`；与当前记录版本不一致时 SHALL 拒绝写入并返回当前版本。写入后 SHALL 返回本次差异、记录概况（条目数、normative 条目数、各类结构对象数）与新 sourceVersion，SHALL NOT 返回完整记录内容或 baseline。

- **部分更新保留未提及内容**

  - 记录已有 18 条条目，update 只 upsert 一条新条目并修改一条
  - 其余 17 条逐字不变，返回差异与“共 19 条”的概况。

- **版本过期拒绝写入**

  - Agent 持有的 sourceVersion 已被另一次写入取代
  - update 返回 invalid 与当前 sourceVersion，记录不变。

- **字段级合并**

  - 结构部分的 Element D 已有 parent 与 kind，update 只提供 definition
  - D 保留原 parent 与 kind，并新增 definition。
