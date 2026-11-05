---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## Specification

### Section: 复用已确认 Design Summary

Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary，以完整文档化为主要职责，不静默重做设计。 存在确认记录时 SHALL 核对 Summary 所依赖的记录版本；受影响内容变化或冲突未决时，先调和和重新确认，不能直接沿用旧 Summary。

- **Design Summary 已存在**

  - Propose 接收完整 Summary
  - Agent 忠实编译已确认决策

### Section: 补足最低语义就绪条件

缺少 Design Summary 时，Propose SHALL 先确认 problem、impact scope、approach 与 verification method 足够清晰。

- **用户直接进入 Propose**

  - 对话中没有完整 Summary
  - Agent 在编写 Change 前确认最低设计集

### Section: 查缺补漏与决策确认

Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。MAY 自主处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

改变已确认承诺、扩大范围或涉及重大业务及架构权衡时，先说明缺口、选项与推荐理由，一次一问等待确认。小范围内容或方案调整可在 Propose 内讨论确认并继续，不因任何设计讨论或记录修订都切回 Explore。需要设计实验重新判断可行性、重选方向或大幅重做设计时，SHALL 返回 Explore 完成实验与设计调整，再继续 Propose。

用户说“细枝末节的内容点的话，我觉得可以放权”时，Agent 可处理局部细节，但不能自行写很多实质内容；允许交互不等于无需确认。直接要求 Propose、不追问或 override 就绪建议都不提供缺失决策，无法确认时报告阻碍。

### Section: 编写完整 Semantic Delta

Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

- **目标设计已明确**

  - Agent 编译目标状态
  - Delta 完整表达新增、修改或移除的语义

### Section: 编写完整 Change Plan

Propose SHALL 以 Change Plan 分别解释意图与范围、关键方案决策、待完成目标及验证方向，而不以任务重新定义目标语义。`proposal.md` SHALL 表达动机、范围和语义来源影响；`design.md` SHALL 表达关键决策、理由和取舍，可保留用户确认的技术落点；`tasks.md` SHALL 用于与用户对齐实施目标和应验证的行为、边界及可观察结果。Propose SHALL NOT 预先猜测具体待修改的代码或测试文件、执行命令与一般技术实施顺序；用户明确要求的次序 SHALL 保留在 Plan 中。

- **Change 需要审查与执行**
  - Agent 形成 Plan
  - Plan 提供职责清晰且不重复维护目标语义的三份文档

### Section: 完成 Formation 审查与确认

Propose SHALL 默认连续编写完整 Change 后集中交用户审阅，用户明确要求交互推进时才 SHALL 按一项机制及其目标、验证方向分段展示实际草稿，听取反馈并继续；不按制品、Element 数量或写作依赖机械设置审阅轮次。无论模式，遇到影响当前目标的重大缺口 SHALL 先说明选项与理由、等待用户裁决；批量模式不授予猜测决策的权力。

Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过代替语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

- **默认批量**
  - 用户未要求分段交互
  - Propose SHALL 在决策齐备时形成完整 Change 再集中审阅

- **用户要求交互**
  - 用户明确希望边写边审
  - Propose SHALL 按机制展示包含对应目标与验证方向的实际草稿，反馈后再推进

### Section: 完成时披露文档化补充

Propose 完成汇报 SHALL 区分沿用的 Explore 确认或当前已确认输入、文档化时补出的内容及其依据和制品位置、Propose 内经用户确认的新决策，以及未决事项对就绪的影响；没有补充或新决策时 SHALL 明确说明。补充清单保留在会话，不新增永久台账或向规范正文混入确认过程状态。

制品齐全与 CLI 校验通过 SHALL NOT 代替语义就绪判断；影响目标行为、范围或实现方案的未决重大决策 SHALL 阻止 ready-for-apply 声明；合理推导并披露的细节不因缺少单独确认而阻塞。完成报告 SHALL 区分实际 CLI 结果、Agent 语义检查发现与仍存在的证据缺口，以简明的检查发现及相关制品位置支持就绪结论；不得以制品数量、引用合法或依赖声明代替实际覆盖、机制与可执行性检查，也不要求输出完整自查过程或新增报告制品。

### Section: 不实现项目

Propose SHALL NOT 实现项目。

- **Change 已完整形成**

  - Propose 到达出口
  - 项目实现仍由后续 Apply 落实

### Section: 不更新或关闭 Change 状态

Propose SHALL NOT 将 Semantic Delta 同步到 Semantic Model，也 SHALL NOT 关闭 Change。

- **Delta 校验通过**

  - 完整 Change 可进入 Change Implementation
  - 正式模型与活动 Change 状态保持未收束

### Section: 遵循共享 Contract 语义

Propose SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义编写 Contract Delta，并以 Section 的独立演进边界确定 Entries。

- **编写多个 Section 义务**

  - 已确认设计包含可独立变化的规范承诺
  - Propose 将其表达为独立 Section Entries，并仅以 Acceptance Cases 具体化各自宿主 Section

### Section: 编写完整 Definition 目标态

Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

- **Design Summary 已确认概念边界**

  - Propose 编译受影响 Declaration
  - Delta 携带变化后完整 Definition，而非只描述本次新增或修改的部分

- **Definition 边界仍未确认**

  - 现有证据不能唯一确定目标概念身份或边界
  - Propose 返回 Explore 或一次询问一个用户决策，且不猜测 Declaration 目标态

### Section: 处理已确认设计记录

Propose SHALL 在入口读取共享 Design Record reference，通过 `xirang record list --json` 主动发现相关 Change-context 记录，不以 Summary 是否提及为前提。开始 Formation 时按共享 **Inputs and authority** 完整读取最新记录、状态与校验结果，核对 sourceVersion、上下文与 Summary；收尾覆盖验证前再次完整读取。编写相关部分确需核对时 MAY 使用 `record show <explorationId> --entry ... --json` 选择条目，不要求每段或每次局部更新前重读全文。

Propose 与 Explore 共用记录。MAY 自主写入和维护 pending 问题、假设、建议；accepted、excluded 及既有确认的实质修改 SHALL 获用户允许，再经 CLI 局部更新，不将自行推导写成用户确认。有效上下文未发生变化时 SHALL 复用最近成功操作的 record-level `sourceVersion`、summary 和已知 identity；局部更新携带该版本，并检查返回的差异、summary 与新版本。版本冲突时重新加载当前记录并调和，不猜测或覆盖。

完整 `record show/status/validate` SHALL 只用于阶段入口、恢复入口与收尾门禁。发生上下文压缩、会话切换、相关 Semantic Model drift 或无法确定当前记录状态时，重新建立完整依据。只编译已采纳且适用的规范内容，保留条件、数值、时序、例外与具体例子；结构部分编成匹配 Delta 或确认 no-op，不按实现关系重新派生。记录不是完整 Semantic Delta；说明材料按性质进入 Plan 或 provenance。

无记录时 SHALL 核对用户明确豁免或本次无 normative 内容声明；未声明不得当作隐式豁免或默认已覆盖，先取得记录决策，不建立空记录。记录维护本身不要求返回 Explore；需要重新实验或方向重探时返回 Explore。

### Section: 验证确认内容到目标语义的覆盖

Propose 收尾 SHALL 完整读取最新记录，按内容性质、决策状态及当前 Change 适用性执行共享覆盖检查。已采纳且需落实的规范内容逐项保留条件、例外、数值、时序及正反例，并给出具体位置与当前位置摘录；无落位或摘录只含泛化规则仍算未覆盖。既有语义满足可确认 no-op，不制造 Delta。

影响当前 Change 的 pending 问题须解决，不能忽略后宣布就绪；不影响当前目标时记录理由。excluded 仅保留必要理由，informative 进入 Plan 或来源历史，不强写为 Contract 承诺。输出简明语义判断与未覆盖身份，不以位置存在或 CLI 通过证明语义完整；缺义务先补 Contract，缺决策先询问用户。豁免或无 normative 内容时显式声明无条目需覆盖。

### Section: 交接已确认设计来源

存在记录时，完整 Change 通过确定性 validation 后，Propose SHALL 按共享规则区分性质、决策状态与适用性，对需落实的已采纳规范条目执行原子细节覆盖，并检查 pending 问题对就绪的影响，并通过 `xirang record coverage` 记录结果；CLI 拒绝时 SHALL 先把缺失细节补进目标 Contract 或 Delta，再重新检查并记录，不得以笼统描述代替逐项结果。覆盖结果有效后 SHALL 通过 `xirang record consume` 向该 Change 交接；consume 因覆盖过期、结构不一致或其他前置失败而拒绝时，保留来源且不声明 Formation 完成。检查后若再修改 Delta，SHALL 重新检查并记录。豁免或无记录时 SHALL 跳过覆盖记录与消费，同时保留已声明的记录决策，不建立空记录。来源快照与覆盖结果不参与 Expected Semantic Model。

- **交接成功才完成 Formation**

  - validation 通过、覆盖结果有效且结构比对一致
  - 保存精确来源快照与覆盖结果并完成 Formation

- **覆盖检查被拒绝**

  - `xirang record coverage` 报告某条目的例子没有落位
  - 把例子写入对应 Acceptance Case 后重新检查并记录，再执行 consume

- **Consume 失败**

  - `xirang record consume` 返回失败
  - 保留来源且不声明 Formation 完成，按共享恢复协议处理

- **豁免时跳过消费但保留决策**

  - 来源已声明豁免
  - 跳过覆盖记录与消费
  - 保留该记录决策于 Formation 证据中，不建立空记录
