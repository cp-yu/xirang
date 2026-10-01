---
operation: MODIFIED
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## MODIFIED Sections

### Section: 处理已确认设计记录

Propose SHALL 在入口读取共享 Design Record reference 并通过 `xirang record` 主动发现记录，不以 Summary 是否提及记录为前提。SHALL 完整读取可用记录并检查来源版本、上下文及与 Summary 的一致性，自编写开始将其作为确认依据。SHALL 按 Design Record 的写作规则把 normative 条目编译为完整 Semantic Delta：用户确认的例子写成 Acceptance Case 或对应 Section 的具体情形，数值、时序与例外写进宿主 Contract 而不泛化；记录结构部分的对象编成对应 Delta 条目，或在正式模型已一致时作为 no-op。说明性材料按性质进入 Plan 或 provenance。精简记录不等于完整结构目标。Propose SHALL NOT 创建、更新、重命名或丢弃记录；需要修订记录时退回 Explore。无记录时，Propose SHALL 要求 Design Summary 或当前输入声明记录决策——用户明确授予的豁免，或本次无 normative 内容的声明——SHALL NOT 将未声明的缺失当作已覆盖的默认路径，SHALL NOT 将其视为隐式豁免；两者皆未声明时 SHALL 停止 Formation 并退回 Explore 取得该决策。

- **Propose 接收精简记录**

  - 记录只覆盖部分设计而 Summary 已确认
  - 按已确认内容编译 Delta，不把精简记录当作完整结构目标

- **确认的例子写成验收情形**

  - 记录条目含“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行”
  - Delta 中出现使用这些具体标签与结果的 Acceptance Case，而非概括性描述

- **结构对象编成 Delta**

  - 记录结构部分确认 Element D 的 parent 为 X
  - Delta 中 D 的 Declaration 以 X 为 parent，不按实现关系改写

- **无记录且已声明豁免**

  - Design Summary 明确声明用户已授予豁免
  - 按当前输入照常形成 Change，不建立空记录

- **无记录且未声明任何决策**

  - 来源既无记录也未声明豁免或无 normative 内容
  - 停止 Formation 并退回 Explore 取得记录决策
  - 不将其当作隐式豁免，也不以默认覆盖继续编译

### Section: 交接已确认设计来源

存在记录时，完整 Change 通过确定性 validation 后，Propose SHALL 对记录每条 normative 条目按原子细节执行覆盖检查，并通过 `xirang record coverage` 记录结果；CLI 拒绝时 SHALL 先把缺失细节补进目标 Contract 或 Delta，再重新检查并记录，不得以笼统描述代替逐项结果。覆盖结果有效后 SHALL 通过 `xirang record consume` 向该 Change 交接；consume 因覆盖过期、结构不一致或其他前置失败而拒绝时，保留来源且不声明 Formation 完成。检查后若再修改 Delta，SHALL 重新检查并记录。豁免或无记录时 SHALL 跳过覆盖记录与消费，同时保留已声明的记录决策，不建立空记录。来源快照与覆盖结果不参与 Expected Semantic Model。

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
