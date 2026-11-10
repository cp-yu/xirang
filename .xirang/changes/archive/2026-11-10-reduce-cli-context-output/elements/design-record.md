---
entity: element-declaration
identity: design-record
kind: element
parent: explore
title: "Design Record"
definition: "Design Record 是形成过程中维护当前设计及确认依据的方法。它独立建模以支持 Build、Explore 与 Propose 的记录维护、冲突调和、编译和覆盖检查；包含待确认内容捕获、用户确认、局部更新与交接，不负责结构分解、完整 Change 编写或项目实现。"
---

## MODIFIED Sections

### Section: 确认即记录

Explore 与 Propose 中的 Agent MAY 主动新增、维护待确认问题、假设和建议，明确标为 pending，避免遗忘后续提问。只有用户决定才能将设计标为 accepted 或 excluded；实验成功只构成事实依据，不代表用户采纳。已采纳或已排除内容的实质修改、删除、状态改变及已确认结构字段修改 SHALL 先获用户允许；不得先降为 pending 再自行改写。

用户确认即授权记录该部分内容。Agent SHALL 立即通过 CLI 局部写入，不再请求持久化确认，不在写入前展示完整拟保存内容。首次出现需保存的设计内容时可建立非空记录，空列表不构成确认内容免记的依据。写入后只报告本次写入的内容要点与决策状态变化；修改已确认内容须单独标出，不重贴未变化内容。无结果的成功更新以退出码确认，必要时显式请求差异；不要求 CLI 回传机械计数，不向用户播报这些计数。冲突先说明影响并由用户裁决，不默认以最新陈述覆盖先前确认。

- 例如：已有 18 条，新增 1 条、修改 1 条后只报告新增与修改的内容要点，不重贴其余 17 条，也不播报“共 19 条”等机械计数。
- Agent 推荐尚未获用户选择：可记 pending，不得记 accepted；实验验证推荐可行后仍不自动改为 accepted。
- 用户新陈述与既有确认矛盾：先裁决，再按裁决局部更新。

### Section: 按原子细节检查覆盖

Build 与 Propose 在交接前 SHALL 完整重载最新记录，按 nature、decision 与对当前目标的适用性检查。accepted 且适用的 normative 条目须拆成条件、数值、例子、反例、时序、例外等原子细节，各给出目标模型中的具体位置及当前位置的原文摘录；未覆盖项阻塞交接。非当前目标的条目须说明不适用依据，不得靠不适用声明绕过已确认承诺。pending 条目须判断是否影响当前目标，影响则先解决，不能忽略后声明就绪；确实不影响时记录理由。excluded 及 informative 不强制编成 Contract，仅保留必要设计依据。

目标为 Expected Semantic Model 或 active Candidate；位置精确到 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind 或 Authored View。现有正式语义已满足的细节可用 no-op 位置，不制造 Delta。摘录 SHALL 取自当前文件，不凭记忆改写。结构部分由 CLI 逐字段比对，不拆原子细节。CLI 内部绑定并校验来源内容及目标模型指纹、位置和摘录，不替代语义判断；覆盖结果记录后目标或记录变化须重查。

- 条目含规则与“A、C 时 ABC、ACD 可以，AB 不行”，只落实规则而没有具体例子：例子未覆盖，阻塞交接，直到落入验收内容。
- 将该例子指向只写“一个事件覆盖全部当前标签，另一个只覆盖部分”的泛化案例：仍未覆盖，不能用泛化摘录代替具体输入与结果。
- 仅声明“已逐项核对”而没有逐项细节及位置：CLI 拒绝。
- 用户已明确排除某实现方案：保留必要理由，不把排除方案强写成宿主 Contract 义务。

### Section: 载入记录时同步当前设计依据

Build、Explore 与 Propose 的 Agent SHALL 经 CLI 操作 Record。首次接手、上下文丢失与交接前 SHALL 完整读取当前记录；已掌握且未发生相关变化的依据可以复用，普通局部补读 SHALL 按条目选择，不固定执行 show/status/validate 三连。需要判断 drift、结构有效性或恢复失效结论时 SHALL 执行对应检查，不以减少调用跳过适用门禁。

新对话首次完整载入，或缺少已展示且仍有效的基线时，Agent SHALL 以自然语言概述全部已确认内容与待决问题；不播报文件名、hash、成功状态或机械计数。同一对话的普通读取不重复展示全量基线；写入后只报告本次内容要点和决策状态变化，修改已确认内容单独标出。

发现无效内容或相关 drift 时 SHALL 说明诊断并调和受影响结论，不复用失效依据。来源与目标的新鲜度由 coverage/consume 内部指纹检查，Agent 不抄传 sourceVersion。操作提示词 SHALL 不宣告允许 Agent 直接编辑文件或绕过 CLI。
