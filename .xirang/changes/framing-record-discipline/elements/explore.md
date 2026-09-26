---
entity: "element-declaration"
identity: "explore"
kind: "element"
parent: "intent-first-path"
title: "Explore"
definition: "Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中可通过 Definition Framing 持续确认并记录关键设计，记录的每次持久化需单独授权。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 支持可选 Definition Framing

Explore SHALL 通过 Design Exploration 推进设计，并 SHALL 在过程中持续使用 Definition Framing 记录关键确认。存在 normative 确认时，Explore SHALL 在交接前落定恰好一个记录决策——已持久化记录、用户明确授予的豁免、或本次无 normative 内容的声明——三者皆缺即阻塞交接。记录更新后 SHALL 重查受影响设计与 Summary，不得将结构 Framing 固定为所有设计的先行阶段。

#### Scenario: 有规范确认时落定决策

- **WHEN** 采用的设计含 normative 确认
- **THEN** 在交接前取得记录、豁免或无 normative 内容声明之一
- **AND** 不将无记录继续作为默认路径

#### Scenario: 已确认内容修订

- **WHEN** 记录中的行为或结构确认被授权更新
- **THEN** 重载记录并重新检查依赖旧条目的设计结论

### Requirement: 形成不持久化的 Design Summary

Explore SHALL 在适用设计确认后输出 conversation-only Design Summary。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并一起交付该记录身份及受核对版本；带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

#### Scenario: 带记录完成 Explore

- **WHEN** 当前完整记录与拟议设计无未决冲突且适用设计已确认
- **THEN** 输出 Design Summary 并交付记录身份及该次核对版本，不把 Summary 另存为记录。

#### Scenario: 带豁免完成 Explore

- **WHEN** 用户已授予豁免且设计已确认
- **THEN** 输出 Design Summary 并交付无记录声明及其理由

#### Scenario: 无规范内容完成 Explore

- **WHEN** 设计已确认但仅含说明性材料
- **THEN** 输出 Design Summary 并显式声明本次无 normative 内容，不建立记录
