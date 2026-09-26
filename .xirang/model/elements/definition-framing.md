---
entity: element-declaration
identity: definition-framing
kind: element
parent: explore
title: Definition Framing
definition: Definition Framing 是项目意图形成过程中澄清并保留已确认关键设计的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的确认依据形成方式，包含关键内容的识别、确认、冲突调和与记录修订；结构分解是其中适用的活动，而非全部范围。它不负责生成完整 Semantic Model 或 Change，也不承担项目实现。
---

## Requirements

### Requirement: 澄清结构定义

Definition Framing SHALL 作为 Build 与 Explore 可持续使用的方法，按需要澄清关键设计；处理结构时通过因果定义、identity 与边界澄清、单维度分解及 BFS 确认形成可审查的结构片段，SHALL NOT 将完整结构草稿设为全部设计讨论的前置条件。

#### Scenario: 结构意图仍有多个合理解释

- **WHEN** 不同 identity、Kind、parent 或 Relationship 选择会改变目标语义
- **THEN** Definition Framing 比较受限选项并一次请求一个用户裁决

### Requirement: 保持依赖设计一致

已确认设计记录变化时，Definition Framing SHALL 标识受影响的设计、Summary 与覆盖结论，要求消费者重载并重新检查；未受影响内容保持不变，不得复用已经失效的确认。

#### Scenario: 记录修订使结论失效

- **WHEN** 一个已确认条件或结构位置被授权修订
- **THEN** 依赖旧条目的设计与 Summary 不再视为有效，重新核对后才能继续交接。

### Requirement: 按项目拆分指导确认结构目标

Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：完整读取解析路径指向的指导文件并按其指导形成结构。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对本次记录内容的显式确认。

#### Scenario: 指导文件驱动结构讨论

- **WHEN** Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效
- **THEN** Agent 在结构讨论前完整读取该指导文件
- **AND** 再以单维度、MECE 与 BFS 检查该层结构

#### Scenario: 拆分指导不可读时停止

- **WHEN** 解析路径的指导文件缺失或不可读
- **THEN** Definition Framing 停止形成受影响结构目标并询问用户
- **AND** SHALL NOT 创建或更新 framing payload

#### Scenario: 拆分指导不覆盖 Formal 语义

- **WHEN** 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
- **THEN** Agent 报告冲突并请求用户裁决
- **AND** SHALL NOT 用拆分指导静默替换规范语义

### Requirement: 捕获已确认关键设计

Definition Framing SHALL 默认捕获下游生成不得擅自改变的关键确认，完整保留条件、数值、例外、时序及已确认结构片段。用户明确要求记录的材料 SHALL 优先保存，不得因 Agent 判定不重要而省略。一般讨论、备选方案、完整理由与实施/测试计划不自动记录；用户明确要求时 MAY 保存，但不得擅自改变其规范或说明性质。

#### Scenario: 用户指定细节优先

- **WHEN** 用户明确要求记录一个 Agent 原先认为次要的例外或说明
- **THEN** 将该材料纳入待确认写入内容，保留细节和性质，不以重要性筛选丢弃。

#### Scenario: 未要求保留全部讨论

- **WHEN** 对话同时包含已确认行为与未采用的备选讨论
- **THEN** 默认仅提取关键确认，不把全部讨论和计划写成确认记录。

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

### Requirement: 完整读取并调和后更新记录

更新前 SHALL 使用 xirang framing show 读取完整当前记录，以当前内容加本次明确获准变化组合新状态。SHALL 在保存前识别新旧冲突并说明影响，由用户裁决；SHALL NOT 默认最新陈述覆盖先前确认。保存后 SHALL 审查 added / modified / removed 差异，未经授权消失的条目必须调和后才继续。

#### Scenario: 冲突先裁决后写入

- **WHEN** 新设计与记录中的已确认条件相矛盾
- **THEN** 说明冲突和影响，请求用户裁决；裁决不等于保存授权，持久化仍另行确认。

#### Scenario: 未改条目保持完整

- **WHEN** 用户只授权修订一个条目
- **THEN** 以完整读取的现状更新该条目，保留其他条目，保存后核对 diff。

#### Scenario: diff 暴露遗忘

- **WHEN** 保存后的 removed 显示未经确认删除的条目
- **THEN** 停止后续交接，调和并经授权修复记录，再检查依赖结论。

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
