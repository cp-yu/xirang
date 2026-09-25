---
operation: "MODIFIED"
entity: "element-declaration"
identity: "explore"
kind: "element"
parent: "intent-first-path"
title: "Explore"
definition: "Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中可通过 Definition Framing 持续确认并记录关键设计，记录的每次持久化需单独授权。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 澄清 Element Definition 影响
Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。已确认片段可在单独授权后通过 Definition Framing 保存；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

#### Scenario: Change 改变 Element 概念边界
- **WHEN** 不同 Definition 边界会产生不同 Semantic Delta
- **THEN** Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

### Requirement: 支持可选 Definition Framing
Explore SHALL 通过 Design Exploration 推进设计，并 MAY 在过程中持续使用 Definition Framing 记录关键确认；记录不是强制的前置制品。记录更新后 SHALL 重查受影响设计与 Summary，不得将结构 Framing 固定为所有设计的先行阶段。

#### Scenario: 无记录仍能探索
- **WHEN** 用户没有建立确认记录
- **THEN** 按通常设计澄清与自审继续，不制造空记录。

#### Scenario: 已确认内容修订
- **WHEN** 记录中的行为或结构确认被授权更新
- **THEN** 重载记录并重新检查依赖旧条目的设计结论。

### Requirement: 形成不持久化的 Design Summary
Explore SHALL 在适用设计确认后输出 conversation-only Design Summary；存在记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并一起交付该记录身份及受核对版本。没有记录时执行普通自审，不强制记录。

#### Scenario: 带记录完成 Explore
- **WHEN** 当前完整记录与拟议设计无未决冲突且适用设计已确认
- **THEN** 输出 Design Summary 并交付记录身份及该次核对版本，不把 Summary 另存为记录。

#### Scenario: 无记录完成 Explore
- **WHEN** 设计已确认且没有确认记录
- **THEN** 自审后只以 conversation-only Design Summary 交接。
