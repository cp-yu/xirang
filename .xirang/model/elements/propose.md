---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，将规范性确认内容编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义及目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## Requirements

### Requirement: 复用已确认 Design Summary

Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary。 存在确认记录时 SHALL 核对 Summary 所依赖的记录版本；受影响内容变化或冲突未决时，先调和和重新确认，不能直接沿用旧 Summary。

#### Scenario: Design Summary 已存在

- **WHEN** Propose 接收完整 Summary
- **THEN** Agent 忠实编译已确认决策

### Requirement: 补足最低语义就绪条件

缺少 Design Summary 时，Propose SHALL 先确认 problem、impact scope、approach 与 verification method 足够清晰。

#### Scenario: 用户直接进入 Propose

- **WHEN** 对话中没有完整 Summary
- **THEN** Agent 在编写 Change 前确认最低设计集

### Requirement: 编写完整 Semantic Delta

Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

#### Scenario: 目标设计已明确

- **WHEN** Agent 编译目标状态
- **THEN** Delta 完整表达新增、修改或移除的语义

### Requirement: 编写完整 Change Plan

Propose SHALL 以 Change Plan 解释意图与实现路径。

#### Scenario: Change 需要审查与执行

- **WHEN** Agent 形成 Plan
- **THEN** Plan 提供适用的意图、决策和执行安排

### Requirement: 完成 Formation 审查与确认

Propose SHALL 在 Change Formation 内完成必要审查与确认。

#### Scenario: Change 仍有未决内容

- **WHEN** 目标语义或实现路径尚未确认
- **THEN** Propose 不得完成

### Requirement: 不实现项目

Propose SHALL NOT 实现项目。

#### Scenario: Change 已完整形成

- **WHEN** Propose 到达出口
- **THEN** 项目实现仍由后续 Apply 落实

### Requirement: 不更新或关闭 Change 状态

Propose SHALL NOT 将 Semantic Delta 同步到 Semantic Model，也 SHALL NOT 关闭 Change。

#### Scenario: Delta 校验通过

- **WHEN** 完整 Change 可进入 Change Implementation
- **THEN** 正式模型与活动 Change 状态保持未收束

### Requirement: 遵循共享 Contract 语义

Propose SHALL 按共享 Element Contract、Requirement 与 Scenario 语义编写 Contract Delta，并以 Requirement 的独立演进边界确定 Entries。

#### Scenario: 编写多个 Requirement 义务

- **WHEN** 已确认设计包含可独立变化的规范承诺
- **THEN** Propose 将其表达为独立 Requirement Entries，并仅以 Scenarios 具体化各自宿主 Requirement

### Requirement: 编写完整 Definition 目标态

Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

#### Scenario: Design Summary 已确认概念边界

- **WHEN** Propose 编译受影响 Declaration
- **THEN** Delta 携带变化后完整 Definition，而非只描述本次新增或修改的部分

#### Scenario: Definition 边界仍未确认

- **WHEN** 现有证据不能唯一确定目标概念身份或边界
- **THEN** Propose 返回 Explore 或一次询问一个用户决策，且不猜测 Declaration 目标态

### Requirement: 处理已确认设计记录

Propose SHALL 完整读取可用记录并检查来源版本、上下文及与 Summary 的一致性；将规范性确认内容编译为完整 Semantic Delta，说明性材料按性质进入 Plan 或 provenance。精简记录不等于完整结构目标，缺少记录不阻止按已确认设计形成 Change。

#### Scenario: Propose 接收精简记录

- **WHEN** 记录只包含关键行为和部分结构片段
- **THEN** 联合有效 Summary、模型与证据形成完整 Change，不要求用户先补全结构数组，也不丢弃行为细节。

#### Scenario: 没有记录直接形成 Change

- **WHEN** Propose 只有已确认设计
- **THEN** 按原有流程编写完整 Delta 与 Plan，不要求空记录或 framing consume。

### Requirement: 验证确认内容到目标语义的覆盖

存在记录时 Propose SHALL 由 Agent 逐项核对当前确认内容的去向，确认规范内容在 Expected Semantic Model 中完整表达，并保留条件、数值、例外与时序；已经满足的内容可确认 no-op，说明材料不强造规范义务。CLI validation、结构相等或文本引用存在 SHALL NOT 替代此语义检查。缺少语义时补充适当 Contract，意图未决时请求用户裁决。

#### Scenario: 记录细节不能被共同遗漏

- **WHEN** Delta、design 与 tasks 相互一致但都遗漏已确认例外
- **THEN** 形成仍不完成；先在宿主 Contract 补足目标语义，再调整下游制品。

#### Scenario: 说明材料保持非规范性质

- **WHEN** 记录包含用户要求保留的理由或未采用方案
- **THEN** 保留到适当 Plan 或 provenance，不自动新增行为承诺。

#### Scenario: 已经满足的语义可无操作

- **WHEN** 确认条目已完整满足于当前模型且没有目标变化
- **THEN** 核对并说明 no-op，不为了覆盖制造无意义 Delta。

### Requirement: 交接已确认设计来源

存在记录时，完整 Change 的两段覆盖复核及确定性 validation 通过后，Propose SHALL 通过 framing consume 明确向该 Change 保存精确来源快照并完成来源生命周期；失败时保留来源且不声明 Formation 完成。记录快照不参与 Expected Semantic Model。

#### Scenario: 交接成功才完成 Formation

- **WHEN** 完整目标与任务已覆盖且校验通过
- **THEN** 向明确 Change 交接受核对版本，检查返回目标与来源清理结果后报告完成。

#### Scenario: Consume 失败

- **WHEN** 来源版本变化、provenance 冲突或清理前校验失败
- **THEN** 保留来源和既有目标，不声明 Formation 完成。
