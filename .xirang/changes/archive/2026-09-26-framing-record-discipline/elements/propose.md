---
entity: "element-declaration"
identity: "propose"
kind: "element"
parent: "intent-first-path"
title: "Propose"
definition: "Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，将规范性确认内容编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义及目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 处理已确认设计记录

Propose SHALL 完整读取可用记录并检查来源版本、上下文及与 Summary 的一致性；将规范性确认内容编译为完整 Semantic Delta，说明性材料按性质进入 Plan 或 provenance。精简记录不等于完整结构目标。无记录时，Propose SHALL 要求 Design Summary 或当前输入声明记录决策——用户明确授予的豁免，或本次无 normative 内容的声明——SHALL NOT 将未声明的缺失当作已覆盖的默认路径，SHALL NOT 将其视为隐式豁免；两者皆未声明时 SHALL 停止 Formation 并退回 Explore 取得该决策。

#### Scenario: Propose 接收精简记录

- **WHEN** 记录只覆盖部分设计而 Summary 已确认
- **THEN** 按已确认内容编译 Delta，不把精简记录当作完整结构目标

#### Scenario: 无记录且已声明豁免

- **WHEN** Design Summary 明确声明用户已授予豁免
- **THEN** 按当前输入照常形成 Change，不建立空记录

#### Scenario: 无记录且未声明任何决策

- **WHEN** 来源既无记录也未声明豁免或无 normative 内容
- **THEN** 停止 Formation 并退回 Explore 取得记录决策
- **AND** 不将其当作隐式豁免，也不以默认覆盖继续编译

### Requirement: 验证确认内容到目标语义的覆盖

存在记录时 Propose SHALL 对记录的规范性条目逐条核对落位，将每条标记为已落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View 目标，或报告为未覆盖并说明理由；未标记的条目 SHALL 计为未覆盖并阻塞 ready-for-apply。SHALL 明确说明已核对条目数与未覆盖条目身份；来源为豁免或无 normative 内容时 SHALL 显式声明该事实，不得以沉默表示核对通过。已满足内容可确认 no-op，说明材料不强造规范义务。CLI validation、结构相等或文本引用存在 SHALL NOT 替代此语义检查。缺少语义时补充适当 Contract，意图未决时请求用户裁决。

#### Scenario: 记录细节不能被共同遗漏

- **WHEN** 记录含多条规范条目且其中一条未落入任何目标
- **THEN** 该条目标为未覆盖并阻塞 ready-for-apply
- **AND** 说明未覆盖身份，补足语义或请求裁决

#### Scenario: Authored View 条目有合法落位

- **WHEN** 记录条目描述一个 Authored View 的目标状态
- **THEN** 标记其落位于 `views/<view identity>.md`
- **AND** 不因落位清单遗漏 View 而阻塞该条目

#### Scenario: 说明材料保持非规范性质

- **WHEN** 条目属于理由、备选或实施计划
- **THEN** 不强造规范义务，按性质进入 Plan 或 provenance

#### Scenario: 已经满足的语义可无操作

- **WHEN** 某条规范确认在当前语义中已完整表达
- **THEN** 确认其 no-op 并记录该判断，不重复声明

#### Scenario: 无条目可核对时显式声明

- **WHEN** 来源为已授权豁免或本次无 normative 内容
- **THEN** 显式声明没有条目需要核对
- **AND** 不将无条目等同于核对通过

### Requirement: 交接已确认设计来源

存在记录时，完整 Change 的两段覆盖复核及确定性 validation 通过后，Propose SHALL 通过 framing consume 明确向该 Change 保存精确来源快照并完成来源生命周期；失败时保留来源且不声明 Formation 完成。豁免或无记录时 SHALL 跳过 framing validation 与 consumption，同时保留已声明的记录决策，不建立空记录。记录快照不参与 Expected Semantic Model。

#### Scenario: 交接成功才完成 Formation

- **WHEN** 覆盖复核与 validation 均通过且记录来源可消费
- **THEN** 保存精确来源快照并完成 Formation

#### Scenario: Consume 失败

- **WHEN** framing consume 返回失败
- **THEN** 保留来源且不声明 Formation 完成，按共享恢复协议处理

#### Scenario: 豁免时跳过消费但保留决策

- **WHEN** 来源已声明豁免
- **THEN** 跳过 framing validation 与 consumption
- **AND** 保留该记录决策于 Formation 证据中，不建立空记录
