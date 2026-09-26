---
entity: "element-declaration"
identity: "definition-framing"
kind: "element"
parent: "explore"
title: "Definition Framing"
definition: "Definition Framing 是项目意图形成过程中澄清并保留已确认关键设计的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的确认依据形成方式，包含关键内容的识别、确认、冲突调和与记录修订；结构分解是其中适用的活动，而非全部范围。它不负责生成完整 Semantic Model 或 Change，也不承担项目实现。"
contract: "optional"
---

## ADDED Requirements

### Requirement: 在交接前落定记录决策

Definition Framing SHALL 在形成过程交接前落定恰好一个记录决策：已持久化记录、用户明确授予的豁免、或本次确认不含 normative 内容的声明。存在 normative 确认而三者皆缺时 SHALL 停止交接。豁免 SHALL 由用户授予并将其理由记录于 Design Summary 与 provenance。SHALL NOT 以静默跳过代替任何一态，SHALL NOT 为满足决策而创建空记录，并在后续新增 normative 确认时重新开启已豁免的决策。

#### Scenario: 有规范确认却未落定决策

- **WHEN** 已确认设计含至少一条 normative 确认，且用户既未建立记录也未授予豁免
- **THEN** 停止交接并向用户请求在记录与豁免之间裁决
- **AND** 不创建空记录，也不以无记录继续

#### Scenario: 用户授予豁免

- **WHEN** 用户明确表示本次不建立记录
- **THEN** 记录该豁免及其理由，进入 Design Summary 与 provenance 并可被下游验证
- **AND** 后续新增 normative 确认时重新开启记录决策

#### Scenario: 本次无规范内容

- **WHEN** 已确认设计仅含说明性材料、备选讨论或实施计划
- **THEN** 显式声明本次无 normative 内容，不要求建立记录
- **AND** 声明而非沉默构成交接依据

### Requirement: 逐条核对确认内容的落位

Definition Framing SHALL 在交接前对记录的规范性条目逐条核对落位，将每条标记为已落位于目标模型或报告为未覆盖并说明理由。未标记的条目 SHALL 计为未覆盖并阻塞交接。合法落位目标 SHALL 覆盖 Declaration、Contract、Relationship、Metamodel 与 Authored View。核对结果 SHALL 记录在对话中，SHALL NOT 建立持久审计账本。豁免或本次无 normative 内容时 SHALL 显式声明该事实，不得以沉默表示核对通过。

#### Scenario: 条目未标记即阻塞

- **WHEN** 记录含若干规范性条目，其中一条既未标记落位也未报告未覆盖
- **THEN** 该条目计为未覆盖并阻塞交接
- **AND** 需补充对应 Contract、报告缺口或请求用户裁决后才继续

#### Scenario: Authored View 条目有合法落位

- **WHEN** 用户确认的条目描述一个 Authored View 的目标状态
- **THEN** 标记其落位于 `views/<view identity>.md`
- **AND** 不因落位清单未列 View 而将该条目判为未覆盖

#### Scenario: 无条目可核对时显式声明

- **WHEN** 来源为已授权豁免或本次无 normative 内容
- **THEN** 显式声明没有条目需要核对
- **AND** 不将无条目等同于核对通过

## MODIFIED Requirements

### Requirement: 只持久化明确授权的确认内容

每次记录创建、更新或修订 SHALL 先展示完整拟保存内容、记录身份及受控目标，再取得独立的持久化确认并使用 xirang framing 保存；对方案、设计方向或段落的确认 SHALL NOT 自动授予写入权限。确认 SHALL 按设计段落聚合：一个设计段落结束后一次性展示本段产出的全部待写条目并取得该批决策，SHALL NOT 就单个条目反复打断。聚合 SHALL 只改变确认发生的时机，SHALL NOT 减少一次创建或更新所需的独立授权；未被用户在该批中处理并确认的条目 SHALL NOT 视为已确认。批量 SHALL NOT 放宽设计本身的一次一问纪律。

#### Scenario: 用户只确认设计方向

- **WHEN** 用户选择方案或说可以，但没有明确确认本次记录写入
- **THEN** 继续设计，不创建或更新记录。

#### Scenario: 确认具体记录写入

- **WHEN** 用户已看过本次完整待写内容与目标并明确授权保存
- **THEN** 仅通过 CLI 保存获准内容，不附加未确认条目。

#### Scenario: 按设计段落批量确认

- **WHEN** 一个设计段落产出多条待写条目且用户已确认该段落方向
- **THEN** 一次性展示本段全部待写条目并取得一次批量决策
- **AND** 不逐条打断，且每条仍只在其获准的创建或更新中写入

#### Scenario: 批中未处理的条目不算确认

- **WHEN** 批量展示的条目中有一条用户未予处理
- **THEN** 该条目不算已确认，不随同批获准条目写入
- **AND** 该批的获准不覆盖它

#### Scenario: 批量不放宽一次一问

- **WHEN** 同一段落内仍有未决的设计问题
- **THEN** 设计问题仍按一次一问澄清，批量只适用于已确认条目的持久化决策
