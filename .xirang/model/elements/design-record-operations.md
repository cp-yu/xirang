---
entity: element-declaration
identity: design-record-operations
kind: element
parent: deterministic-operations
title: Design Record Operations
definition: Design Record Operations 是统一管理已确认设计记录的 CLI 确定性操作集合，即 `xirang record` 命令面。它封装记录的生命周期、按部分更新与版本检查、字段级差异、结构部分的确定性校验、覆盖检查结果的记录与校验，以及面向 Build 和 Change 的门禁化交接；它不包含自然语言设计裁决、语义覆盖判断或正式模型提升。
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

每个 `xirang record` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes；不输出 spinner、颜色或 stack trace。

- **Validation 发现相关 Drift**

  - command 成功读取记录但关联上下文已变化
  - JSON status 为 invalid、exit code 为 1。

### Section: 管理统一确认记录生命周期

`xirang record create|list|show|status|validate|update|rename|coverage|consume|discard` SHALL 管理非空已确认设计记录，以 explorationId 寻址，使用统一 versioned 格式和彼此独立的 Build / Change 形成实例；`show` 返回完整当前记录，`list` 与 `status` 可重新发现记录。CLI SHALL NOT 决定哪些用户内容重要。本命令面不提供 `xirang framing` 或其他兼容别名；`.xirang/framing/` 下的文件与旧 schemaVersion 记录 SHALL NOT 被发现为有效记录，遇到旧格式时明确诊断不受支持，不自动迁移、删除或建立兼容副本。

- **创建并恢复记录**

  - create 接收合法 slug、明确形成上下文与非空条目或结构对象
  - 生成稳定 explorationId 并保存到受控位置，show 返回完整当前内容。

- **空记录与旧格式不隐式转换**

  - 输入没有任何条目与结构对象，或发现旧 schemaVersion 记录
  - 拒绝空记录或报告不支持的旧格式，既有文件不被迁移或删除。

- **旧命令不可用**

  - 用户运行 `xirang framing list`
  - CLI 按未知命令处理，不转发到 `xirang record`。

### Section: 按部分更新记录

`xirang record update` SHALL 接收只含本次变化的输入：条目的 upsert 与按 identity 删除，结构对象的 upsert 与按语义 identity 撤回，以及可选的 relatedIdentities 变化；未提及的条目与结构对象 SHALL 保持不变。结构对象 upsert SHALL 按字段合并：提供的字段替换原值，显式列入清除列表的字段从记录中移除，未提供的字段保持不变；`parent: null` 表示 Project Root 而非清除。撤回表示该对象回到尚未确认，区别于以 `removed: true` 表达的目标删除。每次 update SHALL 携带 `--source-version`；与当前记录版本不一致时 SHALL 拒绝写入并返回当前版本。写入后 SHALL 返回本次差异、记录概况（条目数、normative 条目数、各类结构对象数）与新 sourceVersion，SHALL NOT 返回完整记录内容。

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

`xirang record coverage` SHALL 为显式 named Change 或 active Candidate 接收覆盖检查结果：每条 normative 条目一个结果，每个结果含至少一个原子细节，每个细节给出一个位置。CLI SHALL 校验：记录的每条 normative 条目都有结果；无未知条目；每条至少一个细节；无细节标为未覆盖；每个位置在目标模型（Change 的 Expected Semantic Model 或 Candidate）中真实存在，位置可为 Element Declaration、Element 的 Section、该 Section 中的 Acceptance Case、Relationship、Element Kind、Relationship Kind 或 Authored View。指向 Element Declaration、Section 或 Acceptance Case 的细节 SHALL 附带该位置的原文摘录，CLI SHALL 校验摘录在忽略空白与 Markdown 强调标记后确实出现在该位置的文本中（Declaration 为 title 与 definition，Section 含其 Acceptance Case，Acceptance Case 为其名称与正文）；缺少摘录或摘录不在该位置时拒绝。Relationship、Kind 与 Authored View 由 identity 完整确定，不要求摘录。全部通过时 SHALL 将结果连同记录 sourceVersion 与目标指纹写入 `record-coverage.json`；任一不通过时 SHALL 返回 invalid 与逐项诊断且不写入。CLI SHALL NOT 判断细节语义是否真的保留。

- **位置不存在被拒绝**

  - 一个细节指向目标模型中不存在的 Section 或 Acceptance Case
  - 返回 invalid 并指出该条目、细节与位置，不写入覆盖结果。

- **缺条目被拒绝**

  - 记录有 19 条 normative 条目，结果只含 18 条
  - 返回 invalid 并列出缺失的条目 identity。

- **未覆盖细节被拒绝**

  - 一个细节标为未覆盖并附理由
  - 返回 invalid 并保留理由于诊断中，不写入覆盖结果。

- **摘录不在位置中被拒绝**

  - 细节指向的 Section 真实存在，但所附摘录在该 Section 文本中找不到
  - 返回 invalid 并指出该条目与细节，不写入覆盖结果。

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
