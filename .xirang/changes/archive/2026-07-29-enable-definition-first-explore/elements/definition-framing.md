---
operation: ADDED
entity: element-declaration
identity: definition-framing
kind: capability
parent: explore
title: Definition Framing
definition: Explore 中由用户选择进入、用于在 Design Exploration 前先处理 Change 结构定义的推荐阶段。
---

## ADDED Requirements

### Requirement: 澄清结构定义
Definition Framing SHALL 通过因果定义、identity 与边界澄清、单维度分解及按 BFS 顺序确认同层结构，形成用户可审查的结构目标。

#### Scenario: 结构意图仍有多个合理解释
- **WHEN** 不同 identity、Kind、parent 或 Relationship 选择会改变目标语义
- **THEN** Definition Framing 比较受限选项并一次请求一个用户裁决

### Requirement: 覆盖四类结构目标
Definition Framing SHALL 联合处理 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships，并允许目标引用当前 Semantic Model 中尚不存在但已在同一结构定义中完整声明的 Kinds 或 Elements。

#### Scenario: 新 Element 使用新 Kind
- **WHEN** 用户确认新增 Element 及其尚不存在的 Element Kind
- **THEN** Change Structural Definition 同时保存完整 Kind 目标与 Element Declaration 目标

### Requirement: 只持久化已确认结构
Definition Framing SHALL 仅在展示完整 payload、slug 与受控目标模式并获得用户明确的持久化确认后，通过 `xirang framing` 持久化结构定义。

#### Scenario: 用户只确认设计方向
- **WHEN** 用户选择方案或确认某个 section 但未作出明确的持久化确认
- **THEN** Definition Framing 不创建或更新 Change Structural Definition

### Requirement: 保持依赖设计一致
已持久化结构目标改变时，Definition Framing SHALL 标识受影响的后续设计决策并要求 Design Exploration 重新检查。

#### Scenario: 用户修改已确认 parent
- **WHEN** 新的持久化确认更新 Element 的结构位置
- **THEN** 依赖旧 hierarchy 的设计结论不得被静默保留
