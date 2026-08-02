---
entity: element-declaration
identity: propose
kind: capability
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的 Change Structural Definition；Change Structural Definition 存在时，它将其中已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries；两条路径均写出完整 Change Plan，并在 Formation 内完成必要审查与确认。
---

## Requirements

### Requirement: 复用已确认 Design Summary

Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary。

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

### Requirement: 处理已确认结构定义

Explore 形成了 Change Structural Definition 时，Propose SHALL 读取其完整 payload，重新检查 Semantic Model drift 与 impacts，并将其中已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries；Explore 未形成 Change Structural Definition 时，Propose SHALL 依据 Semantic Model 与已确认设计直接形成 Semantic Delta。

#### Scenario: Propose 接收 Definition Framing 输出

- **WHEN** explorationId 可解析且 relevant baseline 未漂移
- **THEN** Propose 联合结构定义与 Design Summary 形成完整 Change

#### Scenario: Explore 未形成结构定义

- **WHEN** Propose 只接收已确认设计
- **THEN** Propose 不以 Change Structural Definition 为形成完整 Change 的前提

### Requirement: 验证结构降低覆盖

Change Structural Definition 存在时，Propose SHALL 在完成前验证 Semantic Delta 对其中 ADDED、MODIFIED、REMOVED 与 no-op 目标进行了确定性完整覆盖。

#### Scenario: 一个确认目标缺少 Delta Entry

- **WHEN** baseline 与目标要求结构变化但完整 Change 未表达该变化
- **THEN** Propose 不得完成 Formation

### Requirement: 冻结结构定义来源

Change Structural Definition 存在且完整 Change validation 与 coverage 通过后，Propose SHALL 通过 `xirang framing consume` 将来源冻结为 `change-structural-definition.md` 并完成隐藏源清理。

#### Scenario: Consume 失败

- **WHEN** provenance 冲突、相关 drift 或清理前校验失败
- **THEN** Propose 保留隐藏源且不得声明 Formation 完成
