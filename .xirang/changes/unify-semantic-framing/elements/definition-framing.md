---
operation: "MODIFIED"
entity: "element-declaration"
identity: "definition-framing"
kind: "element"
parent: "explore"
title: "Definition Framing"
definition: "Definition Framing 是项目意图形成过程中澄清并保留已确认关键设计的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的确认依据形成方式，包含关键内容的识别、确认、冲突调和与记录修订；结构分解是其中适用的活动，而非全部范围。它不负责生成完整 Semantic Model 或 Change，也不承担项目实现。"
contract: "optional"
---

## MODIFIED Requirements

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
Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：对框架默认 `semantic-refinement` 读取框架随附指导，对其他显式 `method` 使用 Agent 已有方法知识，对 `skill` 调用用户提供的逻辑 skill。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对本次记录内容 的显式确认。

#### Scenario: 方法指导同层分解
- **WHEN** Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效 `method`
- **THEN** Agent 使用该方法选择分解维度
- **AND** 再以单维度、MECE 与 BFS 检查该层结构

#### Scenario: skill 指导自定义分解
- **WHEN** 配置有效 `skill`
- **THEN** Agent 在结构讨论前调用该 skill
- **AND** 消费该指导的 Agent 继续遵守一次一问、只读边界与独立 persistence confirmation

#### Scenario: 拆分指导不可用
- **WHEN** 方法无法明确理解或 skill 无法调用
- **THEN** Definition Framing 停止形成受影响结构目标并询问用户
- **AND** SHALL NOT 创建或更新 framing payload

#### Scenario: 拆分指导不覆盖 Formal 语义
- **WHEN** 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
- **THEN** Agent 报告冲突并请求用户裁决
- **AND** SHALL NOT 用拆分指导静默替换规范语义

## ADDED Requirements

### Requirement: 捕获已确认关键设计
Definition Framing SHALL 默认捕获下游生成不得擅自改变的关键确认，完整保留条件、数值、例外、时序及已确认结构片段。用户明确要求记录的材料 SHALL 优先保存，不得因 Agent 判定不重要而省略。一般讨论、备选方案、完整理由与实施/测试计划不自动记录；用户明确要求时 MAY 保存，但不得擅自改变其规范或说明性质。

#### Scenario: 用户指定细节优先
- **WHEN** 用户明确要求记录一个 Agent 原先认为次要的例外或说明
- **THEN** 将该材料纳入待确认写入内容，保留细节和性质，不以重要性筛选丢弃。

#### Scenario: 未要求保留全部讨论
- **WHEN** 对话同时包含已确认行为与未采用的备选讨论
- **THEN** 默认仅提取关键确认，不把全部讨论和计划写成确认记录。

### Requirement: 只持久化明确授权的确认内容
每次记录创建、更新或修订 SHALL 先展示完整拟保存内容、记录身份及受控目标，再取得独立的持久化确认并使用 xirang framing 保存；对方案、设计方向或段落的确认 SHALL NOT 自动授予写入权限。

#### Scenario: 用户只确认设计方向
- **WHEN** 用户选择方案或说可以，但没有明确确认本次记录写入
- **THEN** 继续设计，不创建或更新记录。

#### Scenario: 确认具体记录写入
- **WHEN** 用户已看过本次完整待写内容与目标并明确授权保存
- **THEN** 仅通过 CLI 保存获准内容，不附加未确认条目。

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

## REMOVED Requirements

### Requirement: 覆盖四类结构目标

### Requirement: 只持久化已确认结构

### Requirement: 组合替换前读取当前完整结构
