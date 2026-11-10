---
operation: MODIFIED
entity: element-declaration
identity: design-record-operations
kind: element
parent: deterministic-operations
title: "Design Record Operations"
definition: "Design Record Operations 是管理中间设计记录的 CLI 确定性操作集合。它按文件名管理记录，包含完整与选择读取、局部更新、结构与上下文校验、内部指纹绑定的覆盖记录和交接；不承担用户意图裁决、自然语言语义判断或正式模型提升。"
---

## MODIFIED Sections

### Section: 隔离受控文件路径

Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法文件名称寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 目录或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
  - 返回稳定路径错误，不跟随链接也不写入目标。

- **Windows 路径隔离**

  - 命令在 Windows 上创建、读取、更新、记录覆盖或交接
  - 使用平台 path API 和同一 containment 规则，JSON 中的路径保持 project-relative POSIX 表示。

### Section: 提供稳定 Record JSON Contract

Record 命令 SHALL 遵循 CLI 的结果与诊断通道：查询返回所请求的数据，无必要结果的成功操作静默，--json 不生成通用 envelope。普通输出 SHALL 不暴露内部内容指纹、重复摘要或完整 baseline。

- list SHALL 返回以文件名为身份的索引及识别记录所需的 context，不返回条目正文或 baseline；空列表仍返回有效查询结果。
- create 在生成文件名时 SHALL 返回该名称；rename 的目标名称由调用方给出，成功无额外结果时静默。
- show SHALL 返回请求范围的完整当前内容；status SHALL 返回当前上下文状态与实际变化，validate SHALL 只报告问题；成功且无问题的 validate 静默。
- update 默认成功静默；显式 --diff 返回本次差异。coverage、consume 与 discard 成功且无必要结果时静默。
- 相关 drift SHALL 作为具体诊断报告，validate/consume 的相关门禁失败时非零退出；JSON 诊断在 stderr，不回显整个记录。

### Section: 管理统一确认记录生命周期

xirang record 的 create、list、show、status、validate、update、rename、coverage、consume 与 discard SHALL 使用 .xirang/records/ 内的文件名称作为记录唯一标识符，不再维护 explorationId 与 slug 的双重身份，也不引入记录修订号。CLI SHALL 保留格式化和结构化编辑能力；合法文件可由用户直接编写或编辑，读取时按当前内容校验，不依赖只有 CLI 才能更新的记录版本字段。

Build 与 Change SHALL 使用独立的非空记录实例。条目 SHALL 显式包含 identity、nature、decision、content，结构只承载已确认目标；缺失状态不得默认 accepted，无法解析的格式须报错并保留文件，不自动迁移、删除或创建兼容副本。CLI SHALL 保留内部模型基准供 drift 检查，不将其作为普通命令回执。

- 非空 pending 条目可创建记录；条目和结构均为空时拒绝。
- 文件重命名后以新名称寻址，条目与结构对象的语义 identity 保持不变。
- 用户直接编辑合法条目后，show 和后续校验读取新内容；旧 coverage 不因此自动更新。
- Agent skill/reference 及相关操作提示词 SHALL 要求经 CLI 完成 Record 操作，SHALL NOT 宣告可绕过 CLI 或允许 Agent 直接编辑。
- 不发现 .xirang/framing/ 为有效记录，不提供 framing 兼容别名。

### Section: 按部分更新记录

record update SHALL 接收本次变化：entries.upsert 的完整条目目标、entries.remove 的条目 identity、结构对象按语义 identity 的 upsert/withdraw 及 relatedIdentities 变化。未提及内容 SHALL 保持不变。结构 upsert SHALL 按字段合并：提供值替换，clear 中字段移除，未提供字段保留；parent: null 表示 Project Root。withdraw 表示撤回确认，removed: true 表示确认目标删除，两者不得混同。

更新 SHALL 不要求 --source-version 或调用方记录修订号；CLI 校验当前输入、结构和上下文，用户确认授权由 Agent 协议承担。成功且没有显式请求结果时 SHALL 静默；--diff SHALL 返回本次条目和结构差异，不附整份记录或 baseline。

- 已有 18 条，新增 1 条并修改 1 条：其余 17 条逐字不变；默认不输出“共 19 条”或新 hash，--diff 只返回本次差异。
- Element D 已有 parent 与 kind，只 upsert definition：保留 parent 与 kind，补入 definition。
- 无效字段或结构引用导致更新拒绝：原文件保持不变，stderr 给出定位诊断。

### Section: 返回确认内容的相对变化

record update --diff SHALL 返回确定性差异：条目按 identity 分为 added、modified（完整 before/after）、removed（完整旧内容）；nature 与 decision 的变化包含于相应内容。结构按语义 identity 分为 added、modified、withdrawn；modified 按字段区分已确认字段修改、新字段补充与字段清除，保留适用 before/after。

--diff SHALL 同时提供相对当前模型的结构推导结果：新增、修改、删除或一致。record validate --details SHALL 按需提供这些结构比较；未请求详情时只报告问题。差异不代表自然语言冲突判断。

- Element D 的 parent 从 X 改为 Y 并补充 definition：parent 标为已确认字段修改（X → Y），definition 标为补充。
- 当前模型已存在且全部已确认字段一致：推导为一致，不错误报告新增。

### Section: 校验记录结构与上下文

create、update 与 validate SHALL 对结构部分做确定性校验：Element Kind 与 Relationship Kind SHALL 存在于当前 Metamodel 或记录中未删除的 Kind；Element parent SHALL 解析到当前模型或记录中未删除的 Element，或按 Kind 规则为 Project Root；Relationship 两端 SHALL 解析到当前模型或记录中未删除的 Element；字段 SHALL 限于对应实体已声明的字段。无正式模型的初始 Build 只以记录自身解析。Validation SHALL 同时报告格式、文件身份、显式上下文关联与模型变化，不推断自然语言冲突或完备性；相关上下文变化 SHALL 阻止复用旧检查结论。存在而损坏的模型 SHALL 报错。

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

位置在 Expected Semantic Model 或 Candidate 中须真实存在，可为 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind、Authored View。Element 位置须附当前原文摘录，忽略空白与 Markdown 强调后匹配 Declaration 的 title/definition、Section（含案例）或案例名称/正文；其余实体按 identity 校验。对 named Change，CLI SHALL 在写入 coverage 前将记录结构逐字段与 Expected Semantic Model 比对；结构对象缺失、已确认字段不一致或 `removed: true` 对象仍存在时拒绝并报告差异。Candidate 的结构门禁仍在 consume 执行。全部通过才由 CLI 自动计算当前来源内容 hash 与目标模型指纹，连同检查结果写入 record-coverage.json；调用方 SHALL 不抄传或提供 sourceVersion。目标指纹 SHALL 绑定 Expected Semantic Model 或 Candidate 模型内容，不使用递增修订号，不将 proposal.md、design.md 或 tasks.md 内容纳入模型指纹。coverage SHALL 保留活动 Record，不复制或删除来源。任何失败返回诊断，不写入或替换已有结果。

- accepted normative 条目少报一条，或细节摘录不存在：拒绝并指出条目与细节。
- pending 问题影响当前 Change：拒绝交接；不影响且有理由可留在来源历史。
- excluded 方案与 informative 实验依据：不要求虚构目标位置。
- 指向不存在的 Section，或只写“已覆盖”而没有原子细节：拒绝。
- Change 的结构记录确认 Element D 的 parent 为 X，目标为 Y，或标为删除的 Kind 仍存在：coverage 拒绝并逐项报告，不替换已有结果；修正后可重新记录覆盖。

### Section: 门禁化交接确认来源

record consume SHALL 显式选择 named Change 或 active Candidate，不从 cwd 猜测目标。执行前 SHALL 读取已有覆盖结果，自动重新计算记录内容 hash 与当前目标模型指纹并比较；缺少覆盖结果、来源内容或目标模型变化时拒绝并要求重查。调用方 SHALL 不提供 --source-version；内部指纹不作为普通成功回执。

每个已确认结构对象 SHALL 按语义 identity 与目标逐字段比对：未删除对象必须存在且已记录字段一致，removed: true 对象必须不存在；不一致须逐项报告。通过后 SHALL 先保存来源原始字节为 record-source.md，再完成适用校验，最后删除活动 Record。前置或交接失败 SHALL 保留来源与既有目标；本次产生的未完成快照须撤销。同字节已有快照可重验恢复，冲突快照必须停止。

Change 的用户接受门禁由 Propose 遵守：只有用户接受最终 Change 及其当前覆盖结果后才调用 consume。record-source.md 与 record-coverage.json SHALL 作为形成历史保留，不参与后续 Expected Semantic Model、Sync 或 Closure 的规范计算。

- coverage 后编辑 Record：consume 拒绝，来源仍在。
- coverage 后 Delta 改变 Expected Semantic Model：consume 拒绝，来源仍在。
- coverage 后只修改 tasks.md：目标模型指纹不因此失效，其他门禁仍须满足。
- 结构中 D 的 parent 是 X，目标为 Y：拒绝并报告字段差异。
- 上次复制后中断且快照字节相同：重新检查全部门禁后清理来源；快照冲突时不覆盖。
- 多个 Change 与 Candidate 同时存在：仅向显式指定的受控目标交接。

### Section: 按条目选择读取

record show <filename> --entry <identity> SHALL 支持重复 --entry，返回文件名与每个所选条目的完整 identity、nature、decision、content，不附无关条目、完整 baseline 或内部指纹。未知条目 SHALL 报错，不静默省略；不提供 --entry 时 SHALL 返回完整当前设计条目、structure、context 与相关元信息，读取不修改文件。

选择 A 与 C 时只返回 A、C 的完整条目和文件名，不包含 B。条目内容修改后，完整读取与选择读取 SHALL 反映相同当前内容，不维护独立条目版本。
