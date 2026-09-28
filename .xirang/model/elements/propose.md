---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，将规范性确认内容编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义及目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
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

Propose MAY 将已确认机制展开为完整正文、图示、验收案例及任务和验证安排，并修正遗漏、重复、表达或推导错误，前提是不改变已确认承诺、不选择新的行为或架构。需要在不同结果、范围或设计方案之间作选择时，Propose SHALL 说明缺口、选项及推荐理由，一次询问一个问题并等待确认后再写成确定内容；完成时告知不替代决策前确认。

孤立缺口 MAY 在 Propose 内确认；大幅重做设计或修订已持久化记录时 SHALL 返回 Explore，并遵循已有记录授权与交接协议。直接 Propose、要求不追问或 override 就绪建议不构成缺失决策的答案；无法获得所需确认时 SHALL 报告阻碍。

### Section: 编写完整 Semantic Delta

Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

- **目标设计已明确**

  - Agent 编译目标状态
  - Delta 完整表达新增、修改或移除的语义

### Section: 编写完整 Change Plan

Propose SHALL 以 Change Plan 解释意图与实现路径。

- **Change 需要审查与执行**

  - Agent 形成 Plan
  - Plan 提供适用的意图、决策和执行安排

### Section: 完成 Formation 审查与确认

Propose SHALL 在 Change Formation 内完成必要审查与确认，对照已确认来源检查完整机制与制品一致性，以适用的边界或竞争序列检验规范承诺，不能仅依赖制品之间一致或 CLI 通过。新确认的决策 SHALL 贯穿相关 Delta 与 Plan。

- **Change 仍有未决内容**

  - 目标语义或实现路径尚未确认
  - Propose 不得完成

### Section: 完成时披露文档化补充

Propose 完成汇报 SHALL 区分沿用的 Explore 确认或当前已确认输入、文档化时补出的内容及其依据和制品位置、Propose 内经用户确认的新决策，以及未决事项对就绪的影响；没有补充或新决策时 SHALL 明确说明。补充清单保留在会话，不新增永久台账或向规范正文混入确认过程状态。

制品齐全与 CLI 校验通过 SHALL NOT 代替语义就绪判断；影响目标行为、范围或实现方案的未决决策 SHALL 阻止 ready-for-apply 声明。

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

Propose SHALL 完整读取可用记录并检查来源版本、上下文及与 Summary 的一致性；将规范性确认内容编译为完整 Semantic Delta，说明性材料按性质进入 Plan 或 provenance。精简记录不等于完整结构目标。无记录时，Propose SHALL 要求 Design Summary 或当前输入声明记录决策——用户明确授予的豁免，或本次无 normative 内容的声明——SHALL NOT 将未声明的缺失当作已覆盖的默认路径，SHALL NOT 将其视为隐式豁免；两者皆未声明时 SHALL 停止 Formation 并退回 Explore 取得该决策。

- **Propose 接收精简记录**

  - 记录只覆盖部分设计而 Summary 已确认
  - 按已确认内容编译 Delta，不把精简记录当作完整结构目标

- **无记录且已声明豁免**

  - Design Summary 明确声明用户已授予豁免
  - 按当前输入照常形成 Change，不建立空记录

- **无记录且未声明任何决策**

  - 来源既无记录也未声明豁免或无 normative 内容
  - 停止 Formation 并退回 Explore 取得记录决策
  - 不将其当作隐式豁免，也不以默认覆盖继续编译

### Section: 验证确认内容到目标语义的覆盖

存在记录时 Propose SHALL 对记录的规范性条目逐条核对落位，将每条标记为已落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View 目标，或报告为未覆盖并说明理由；未标记的条目 SHALL 计为未覆盖并阻塞 ready-for-apply。SHALL 明确说明已核对条目数与未覆盖条目身份；来源为豁免或无 normative 内容时 SHALL 显式声明该事实，不得以沉默表示核对通过。已满足内容可确认 no-op，说明材料不强造规范义务。CLI validation、结构相等或文本引用存在 SHALL NOT 替代此语义检查。缺少语义时补充适当 Contract，意图未决时请求用户裁决。

- **记录细节不能被共同遗漏**

  - 记录含多条规范条目且其中一条未落入任何目标
  - 该条目标为未覆盖并阻塞 ready-for-apply
  - 说明未覆盖身份，补足语义或请求裁决

- **Authored View 条目有合法落位**

  - 记录条目描述一个 Authored View 的目标状态
  - 标记其落位于 `views/<view identity>.md`
  - 不因落位清单遗漏 View 而阻塞该条目

- **说明材料保持非规范性质**

  - 条目属于理由、备选或实施计划
  - 不强造规范义务，按性质进入 Plan 或 provenance

- **已经满足的语义可无操作**

  - 某条规范确认在当前语义中已完整表达
  - 确认其 no-op 并记录该判断，不重复声明

- **无条目可核对时显式声明**

  - 来源为已授权豁免或本次无 normative 内容
  - 显式声明没有条目需要核对
  - 不将无条目等同于核对通过

### Section: 交接已确认设计来源

存在记录时，完整 Change 的两段覆盖复核及确定性 validation 通过后，Propose SHALL 通过 framing consume 明确向该 Change 保存精确来源快照并完成来源生命周期；失败时保留来源且不声明 Formation 完成。豁免或无记录时 SHALL 跳过 framing validation 与 consumption，同时保留已声明的记录决策，不建立空记录。记录快照不参与 Expected Semantic Model。

- **交接成功才完成 Formation**

  - 覆盖复核与 validation 均通过且记录来源可消费
  - 保存精确来源快照并完成 Formation

- **Consume 失败**

  - framing consume 返回失败
  - 保留来源且不声明 Formation 完成，按共享恢复协议处理

- **豁免时跳过消费但保留决策**

  - 来源已声明豁免
  - 跳过 framing validation 与 consumption
  - 保留该记录决策于 Formation 证据中，不建立空记录
