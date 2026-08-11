---
entity: element-declaration
identity: definition-framing
kind: element
parent: explore
title: Definition Framing
definition: Definition Framing 是 Explore 中由用户选择进入的推荐阶段，用于在 Design Exploration 前先处理 Change 的结构定义。它以 Semantic Model 与项目证据为依据，通过因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认同层结构，逐步确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。
---

## ADDED Requirements

### Requirement: 按项目拆分指导确认结构目标

Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：对 `method` 使用 Agent 已有方法知识，对 `skill` 调用用户提供的逻辑 skill。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对完整结构 payload 的显式确认。

#### Scenario: 方法指导同层分解

- **WHEN** Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效 `method`
- **THEN** Agent 使用该方法选择分解维度
- **AND** 再以单维度、MECE 与 BFS 检查该层结构

#### Scenario: skill 指导自定义分解

- **WHEN** 配置有效 `skill`
- **THEN** Explore 在结构讨论前调用该 skill
- **AND** 主 Explore Agent 继续遵守一次一问、只读边界与独立 persistence confirmation

#### Scenario: 拆分指导不可用

- **WHEN** 方法无法明确理解或 skill 无法调用
- **THEN** Definition Framing 停止形成受影响结构目标并询问用户
- **AND** SHALL NOT 创建或更新 framing payload

#### Scenario: 拆分指导不覆盖 Formal 语义

- **WHEN** 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
- **THEN** Agent 报告冲突并请求用户裁决
- **AND** SHALL NOT 用拆分指导静默替换规范语义
