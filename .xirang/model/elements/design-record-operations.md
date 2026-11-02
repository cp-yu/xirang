---
entity: element-declaration
identity: design-record-operations
kind: element
parent: deterministic-operations
title: Design Record Operations
definition: Design Record Operations 是管理中间设计记录的 CLI 确定性操作集合。它包含生命周期管理、完整与选择读取、局部更新及版本检查、结构校验、覆盖结果记录和门禁化交接；不承担用户意图裁决、自然语言语义判断或正式模型提升。
---

## Specification

### Section: 隔离受控文件路径

Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 目录或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
  - 返回稳定路径错误，不跟随链接也不写入目标。

- **Windows 路径隔离**

  - 命令在 Windows 上创建、读取、更新、记录覆盖或交接
  - 使用平台 path API 和同一 containment 规则，JSON 中的路径保持 project-relative POSIX 表示。

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

### Section: 返回确认内容的相对变化

update SHALL 返回确定性差异：条目按 identity 分为 added、modified（含完整 before / after）与 removed（含完整旧内容）；结构对象按语义 identity 分为 added、modified 与 withdrawn，modified 细到字段级并分开报告“修改已确认字段”（含 before / after）、“补充新字段”与“移除字段”。update 与 validate SHALL 对照当前模型为每个结构对象报告推导结果：新增、修改、删除或与当前模型一致。差异供 Agent 报告，不代表语义冲突判断。

- **区分修改与补充**

  - update 把 Element D 的 parent 从 X 改为 Y，并补充 definition
  - 差异中 parent 列为修改已确认字段（X → Y），definition 列为补充新字段。

- **推导随模型更新**

  - 结构对象在当前模型中已存在且字段一致
  - 报告为与当前模型一致，而非新增。

### Section: 校验记录结构与上下文

create、update 与 validate SHALL 对结构部分做确定性校验：Element Kind 与 Relationship Kind SHALL 存在于当前 Metamodel 或记录中未删除的 Kind；Element parent SHALL 解析到当前模型或记录中未删除的 Element，或按 Kind 规则为 Project Root；Relationship 两端 SHALL 解析到当前模型或记录中未删除的 Element；字段 SHALL 限于对应实体已声明的字段。无正式模型的初始 Build 只以记录自身解析。Validation SHALL 同时报告格式、稳定身份、显式上下文关联与版本变化，不推断自然语言冲突或完备性；相关上下文变化 SHALL 阻止复用旧检查结论。存在而损坏的模型 SHALL 报错。

- **结构引用无法解析**

  - 结构对象使用不存在的 kind，或 parent、Relationship 端点既不在当前模型也不在记录中
  - 返回带对象 identity、字段与原因的稳定诊断，拒绝写入。

- **合法缺失与损坏分离**

  - 首次 Build 没有正式模型，或已有模型损坏
  - 前者可按记录自身解析并保存，后者失败并保持记录不变。

- **格式合法不等于意图完整**

  - 记录通过格式与结构校验但仍可能遗漏某个行为例外
  - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。

### Section: 记录覆盖检查结果

`xirang record coverage` SHALL 接收显式 named Change 或 active Candidate 的状态化检查结果。每条 accepted normative 条目须有原子细节及位置，或显式声明不适用并给理由；每条 pending 条目须报告是否影响当前目标，不影响须给理由，影响而未解决则拒绝。excluded 与 informative 无须目标承诺位置。不得以记录中出现过为由要求所有条目编译，也不得漏检已采纳义务。

CLI SHALL 拒绝未知条目、缺失必需结果、空细节、未覆盖细节、无理由的不适用/不影响声明、仍影响目标的 pending 结果，以及与 nature 或 decision 不一致的结果类型。Agent 判断适用性与理由是否成立，CLI 不推断自然语言语义或用户授权。

位置在 Expected Semantic Model 或 Candidate 中须真实存在，可为 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind、Authored View。Element 位置须附当前原文摘录，忽略空白与 Markdown 强调后匹配 Declaration 的 title/definition、Section（含案例）或案例名称/正文；其余实体按 identity 校验。全部通过才连同 sourceVersion 与目标指纹写入 record-coverage.json；任何失败返回 invalid 与逐项诊断，不写入。

- accepted normative 条目少报一条，或细节摘录不存在：拒绝并指出条目与细节。
- pending 问题影响当前 Change：拒绝交接；不影响且有理由可留在来源历史。
- excluded 方案与 informative 实验依据：不要求虚构目标位置。
- 指向不存在的 Section，或只写“已覆盖”而没有原子细节：拒绝。

### Section: 门禁化交接确认来源

`xirang record consume` SHALL 显式选择 named Change 或 active Candidate 并核对 `--source-version`；执行前 SHALL 要求目标中存在有效覆盖结果，且其绑定的 sourceVersion 与目标指纹仍与当前一致，否则拒绝并要求重新检查。随后 SHALL 将记录结构部分的每个对象与目标模型按语义 identity 逐字段比对：未删除对象必须存在且记录中出现的每个字段与目标一致，`removed: true` 的对象必须不存在；任一不一致即拒绝并逐项报告。通过后 SHALL 先保存精确来源快照 `record-source.md`，再完成适用校验，最后删除活动记录；任何前置失败 SHALL 保留活动记录与原有目标。同字节快照允许重验后恢复，冲突快照必须停止。CLI SHALL NOT 从当前目录猜测目标。

- **目标变化使覆盖失效**

  - 记录覆盖结果后 Delta 又被修改
  - consume 因目标指纹不一致而拒绝，要求重新执行覆盖检查。

- **结构不一致被拒绝**

  - 记录确认 Element D 的 parent 为 X，而 Change 的 Expected Semantic Model 中 D 的 parent 为 Y
  - consume 拒绝并报告 D 的 parent 字段不一致，保留活动记录。

- **相同快照恢复交接**

  - 上次交接在复制后中断且来源与目标快照字节相同
  - 重验源版本、覆盖结果与目标后完成清理，不覆盖来源快照。

- **显式选择消费目标**

  - 同一项目存在活动 Candidate 与多个 Changes
  - 只向命令明确指定的合法目标交接。

### Section: 按条目选择读取

`xirang record show <explorationId> --entry <identity>` SHALL 支持重复 --entry，一次选一条或多条。选择读取返回记录身份、当前记录级 sourceVersion 和所选条目的完整 identity、nature、decision、content，不附无关条目正文或完整模型基准快照。未知条目 SHALL 返回稳定诊断，不静默省略。无 --entry 时返回完整当前记录；读取均不修改文件。

- 选择 A 与 C：只返回 A、C 的完整条目及记录身份、sourceVersion，B 和基准快照不出现。
- 条目内容变化后，完整读与选择读返回相同的新记录级版本；不维护独立条目版本。
