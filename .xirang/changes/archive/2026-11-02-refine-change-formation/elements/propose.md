---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## MODIFIED Sections

### Section: 查缺补漏与决策确认

Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。MAY 自主处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

改变已确认承诺、扩大范围或涉及重大业务及架构权衡时，先说明缺口、选项与推荐理由，一次一问等待确认。小范围内容或方案调整可在 Propose 内讨论确认并继续，不因任何设计讨论或记录修订都切回 Explore。需要设计实验重新判断可行性、重选方向或大幅重做设计时，SHALL 返回 Explore 完成实验与设计调整，再继续 Propose。

用户说“细枝末节的内容点的话，我觉得可以放权”时，Agent 可处理局部细节，但不能自行写很多实质内容；允许交互不等于无需确认。直接要求 Propose、不追问或 override 就绪建议都不提供缺失决策，无法确认时报告阻碍。

### Section: 完成 Formation 审查与确认

Propose SHALL 根据复杂度安排用户审阅：简单变更先写完整草稿，再集中呈现具体差异及待决问题；复杂变更围绕一项机制或一组相关 Elements 分段编写、审阅，确认后继续，不机械地逐个 Element 请求确认。

Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过替代语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

### Section: 处理已确认设计记录

Propose SHALL 在入口读取共享 Design Record reference，通过 xirang record 主动发现相关记录，不以 Summary 是否提及为前提。开始编写时完整读取最新记录，核对 sourceVersion、上下文与 Summary；收尾覆盖验证时再完整读取最新记录，不依赖早前长对话记忆。编写相关部分确需核对时 MAY 按条目选择读取；不要求每段或每次调整重读全文。

Propose 与 Explore 共用记录。MAY 自主写入和维护 pending 问题、假设、建议；accepted、excluded 及既有确认的实质修改 SHALL 获用户允许，再经 CLI 局部更新，不将自行推导写成用户确认。只编译已采纳、适用的规范内容，保留原样条件、数值、时序、例外与具体例子；结构部分编成匹配 Delta 或确认 no-op，不按实现关系重新派生。记录非完整结构目标，说明材料按性质进入 Plan 或 provenance。

无记录时 SHALL 核对用户明确豁免或本次无 normative 内容声明；未声明不得当作隐式豁免或默认已覆盖，先取得记录决策，不建立空记录。记录维护本身不要求返回 Explore；方案需要重新实验或方向重探时返回 Explore。

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
