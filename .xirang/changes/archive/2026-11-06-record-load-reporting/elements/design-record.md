---
entity: element-declaration
identity: design-record
kind: element
parent: explore
title: Design Record
definition: Design Record 是形成过程中维护当前设计及确认依据的方法。它独立建模以支持 Build、Explore 与 Propose 的记录维护、冲突调和、编译和覆盖检查；包含待确认内容捕获、用户确认、局部更新与交接，不负责结构分解、完整 Change 编写或项目实现。
---

## ADDED Sections

### Section: 载入记录时同步当前设计依据

Design Record SHALL 让 Build、Explore 与 Propose 在载入记录时按用户已有的对话上下文同步设计依据。新对话首次载入记录，或当前上下文没有已展示且仍有效的记录基线时，Agent SHALL 以自然语言概要呈现记录中全部已确认内容及所有待决问题，使用户能够了解并纠正 Agent 将据以继续的设计；SHALL NOT 呈现成功载入的 slug、记录身份、sourceVersion、valid 状态或机械计数。同一对话中的普通读取或重载不重复呈现全量基线。

同一对话内写入记录后，Agent SHALL 只呈现本次写入的内容要点与决策状态变化；修改已确认内容 SHALL 单独标出，不重贴未变化内容。CLI 返回的 sourceVersion 与计数仅供 Agent 内部校验、并发控制和覆盖门禁使用，CLI 输出保持不变。载入、status 或 validate 发现 invalid、relevant drift 或版本冲突时，Agent SHALL 向用户说明诊断及调和动作，不以静默成功播报或裸版本号代替。

无适用记录时不播报成功载入信息。

## MODIFIED Sections

### Section: 确认即记录

Explore 与 Propose 中的 Agent MAY 主动新增、维护待确认问题、假设和建议，明确标为 pending，避免遗忘后续提问。只有用户决定才能将设计标为 accepted 或 excluded；实验成功只构成事实依据，不代表用户采纳。已采纳或已排除内容的实质修改、删除、状态改变及已确认结构字段修改 SHALL 先获用户允许；不得先降为 pending 再自行改写。

用户确认即授权记录该部分内容。Agent SHALL 立即通过 CLI 局部写入，不再请求持久化确认，不在写入前展示完整拟保存内容。首次出现需保存的设计内容时可建立非空记录，空列表不构成确认内容免记的依据。写入后只报告本次写入的内容要点与决策状态变化；修改已确认内容须单独标出，不重贴未变化内容。条目与 normative 条目计数、各决策状态数量等机械概况仅由 Agent 对照 CLI 回执自查，不向用户播报。冲突先说明影响并由用户裁决，不默认以最新陈述覆盖先前确认。

- 例如：已有 18 条，新增 1 条、修改 1 条后只报告新增与修改的内容要点，不重贴其余 17 条，也不播报“共 19 条”等机械计数。
- Agent 推荐尚未获用户选择：可记 pending，不得记 accepted；实验验证推荐可行后仍不自动改为 accepted。
- 用户新陈述与既有确认矛盾：先裁决，再按裁决局部更新。
