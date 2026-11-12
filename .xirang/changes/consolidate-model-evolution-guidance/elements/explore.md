---
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: "Explore"
definition: "Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。"
---

## MODIFIED Sections

### Section: 澄清 Element Definition 影响

Explore SHALL 在概念身份或范围变化时，澄清影响目标、范围或方案的重要选择，并在 Design Summary 中保留已确认的边界与 Definitions。Propose MAY 基于这些依据完成局部模型组织和完整目标 Definition；Explore 不以预先完成全部目标层级作为交接条件。

用户确认的 Declaration 字段 SHALL 通过 Design Record 记录到结构部分，允许只含已确认字段；未确认字段不得标为已确认。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

- **已确认意图足以支持组织**：目标、范围与方案已明确，尚需决定局部层级表达；Explore 可以交付已确认依据，由 Propose 完成具体组织。
- **实质边界未决**：不同概念边界会改变目标、范围或方案；Explore 先取得用户选择，不把待裁决问题当作普通成文细节。
- **部分确认的 Declaration**：用户已确认 parent 与 kind，definition 仍在讨论；立即记录已确认字段，后续按实际确认补充。

### Section: 形成不持久化的 Design Summary

Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标且需要用户裁决的未决决策 SHALL 阻塞交接，Agent 不自行延期；可由 Propose 依据已确认意图和建模规则完成的局部模型组织不构成此类缺口。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并保留该记录身份供 Propose 发现来源；sourceVersion 仅保留在 CLI 输出与 Agent 内部校验中，不向用户呈现。带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

- **带记录完成 Explore**

  - 当前完整记录与拟议设计无未决冲突且适用设计已确认
  - 输出 Design Summary 并保留可供 Propose 发现来源的记录身份，不把 Summary 另存为记录或向用户呈现 sourceVersion。
