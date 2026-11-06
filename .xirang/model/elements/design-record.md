---
entity: element-declaration
identity: design-record
kind: element
parent: explore
title: Design Record
definition: Design Record 是形成过程中维护当前设计及确认依据的方法。它独立建模以支持 Build、Explore 与 Propose 的记录维护、冲突调和、编译和覆盖检查；包含待确认内容捕获、用户确认、局部更新与交接，不负责结构分解、完整 Change 编写或项目实现。
---

## Specification

### Section: 确认即记录

Explore 与 Propose 中的 Agent MAY 主动新增、维护待确认问题、假设和建议，明确标为 pending，避免遗忘后续提问。只有用户决定才能将设计标为 accepted 或 excluded；实验成功只构成事实依据，不代表用户采纳。已采纳或已排除内容的实质修改、删除、状态改变及已确认结构字段修改 SHALL 先获用户允许；不得先降为 pending 再自行改写。

用户确认即授权记录该部分内容。Agent SHALL 立即通过 CLI 局部写入，不再请求持久化确认，不在写入前展示完整拟保存内容。首次出现需保存的设计内容时可建立非空记录，空列表不构成确认内容免记的依据。写入后只报告本次写入的内容要点与决策状态变化；修改已确认内容须单独标出，不重贴未变化内容。条目与 normative 条目计数、各决策状态数量等机械概况仅由 Agent 对照 CLI 回执自查，不向用户播报。冲突先说明影响并由用户裁决，不默认以最新陈述覆盖先前确认。

- 例如：已有 18 条，新增 1 条、修改 1 条后只报告新增与修改的内容要点，不重贴其余 17 条，也不播报“共 19 条”等机械计数。
- Agent 推荐尚未获用户选择：可记 pending，不得记 accepted；实验验证推荐可行后仍不自动改为 accepted。
- 用户新陈述与既有确认矛盾：先裁决，再按裁决局部更新。

### Section: 条目写入标准

记录 SHALL 表达当前设计、决策状态及影响设计的必要依据，不保存完整讨论流水。待确认条目保留问题、假设或建议；已采纳的规范条目须让下游不看会话也能写出 Contract 与验收内容，保留条件、数值、例外、时序及原样正反例。用户明确要求保留的材料优先保存，不以 Agent 的重要性判断省略。理由与实验事实以 informative 保存，不升格为规范义务；已排除方案仅保留必要内容与理由。

已确认的组件结构 SHALL 写入结构部分，未确认结构方案先以 pending 条目的自由文本表达，不提前结构化，不混入未确认字段。

- 用户以“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）”对齐规则：同时保留规则与例子原文，不能只记概括。
- 用户确认新增 Element、parent 与 kind：写入结构部分；尚未确认的候选 parent 只记 pending。
- 实验测得某方案可行：记录实验依据，方案是否采纳仍由用户决定。

### Section: 保持依赖设计一致

已确认设计记录变化时，Design Record SHALL 标识受影响的设计、Summary 与覆盖结论，要求消费者重载并重新检查；未受影响内容保持不变，不得复用已经失效的确认。

- **记录修订使结论失效**

  - 一个已确认条件或结构位置被修订
  - 依赖旧条目的设计、Summary 与覆盖结论不再视为有效，重新核对后才能继续交接。

### Section: 在交接前落定记录决策

Design Record SHALL 在形成过程交接前落定恰好一个记录决策：已持久化记录、用户明确授予的豁免、或本次确认不含 normative 内容的声明。交接前 SHALL 对照确认对话检查各规范性确认均已记录或明确豁免；已有部分记录不覆盖后续遗漏的确认，缺失时先补录。存在 normative 确认而三者皆缺时 SHALL 停止交接。豁免 SHALL 由用户授予并将其理由记录于 Design Summary（Explore）或 `build.md`（Build）与 provenance。SHALL NOT 以静默跳过代替任何一态，SHALL NOT 为满足决策而创建空记录，并在后续新增 normative 确认时重新开启已豁免的决策。

- **有规范确认却未落定决策**

  - 已确认设计含至少一条 normative 确认，且既无记录也无豁免
  - 停止交接并先补录；用户拒绝记录时记录其豁免与理由
  - 不创建空记录，也不以无记录继续

- **用户授予豁免**

  - 用户明确表示本次不建立记录
  - 记录该豁免及其理由，进入 Design Summary 或 `build.md` 与 provenance 并可被下游验证
  - 后续新增 normative 确认时重新开启记录决策

- **本次无规范内容**

  - 已确认设计仅含说明性材料、备选讨论或实施计划
  - 显式声明本次无 normative 内容，不要求建立记录

### Section: 按原子细节检查覆盖

Build 与 Propose 在交接前 SHALL 完整重载最新记录，按 nature、decision 与对当前目标的适用性检查。accepted 且适用的 normative 条目须拆成条件、数值、例子、反例、时序、例外等原子细节，各给出目标模型中的具体位置及当前位置的原文摘录；未覆盖项阻塞交接。非当前目标的条目须说明不适用依据，不得靠不适用声明绕过已确认承诺。pending 条目须判断是否影响当前目标，影响则先解决，不能忽略后声明就绪；确实不影响时记录理由。excluded 及 informative 不强制编成 Contract，仅保留必要设计依据。

目标为 Expected Semantic Model 或 active Candidate；位置精确到 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind 或 Authored View。现有正式语义已满足的细节可用 no-op 位置，不制造 Delta。摘录 SHALL 取自当前文件，不凭记忆改写。结构部分由 CLI 逐字段比对，不拆原子细节。CLI 记录并校验版本、位置和摘录，不替代语义判断；覆盖结果记录后目标或记录变化须重查。

- 条目含规则与“A、C 时 ABC、ACD 可以，AB 不行”，只落实规则而没有具体例子：例子未覆盖，阻塞交接，直到落入验收内容。
- 将该例子指向只写“一个事件覆盖全部当前标签，另一个只覆盖部分”的泛化案例：仍未覆盖，不能用泛化摘录代替具体输入与结果。
- 仅声明“已逐项核对”而没有逐项细节及位置：CLI 拒绝。
- 用户已明确排除某实现方案：保留必要理由，不把排除方案强写成宿主 Contract 义务。

### Section: 按写作规则编译细节

从记录编译目标语义时，仅将已采纳、适用的规范内容编成目标承诺，不能将待确认建议或实验事实当作用户决定。用户确认的例子 SHALL 写成验收内容（business-specification Contract 写入 Key Acceptance Cases 的 Acceptance Case，其他 Contract 写入对应 Section 的具体情形），原样或以等价的具体形式出现，SHALL NOT 抽象为概括性描述；已确认的数值、时序与例外 SHALL 写进宿主 Contract 的业务机制或例外处理内容，SHALL NOT 换成泛化描述。记录的结构对象 SHALL 编成对应的 Delta 条目，或在正式模型已一致时作为 no-op。

- **例子写成具体验收情形**

  - 记录含“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行”
  - Acceptance Case 使用具体标签 A、C 与事件 ABC、ACD、AB 及各自结果，而不是“一个事件覆盖全部当前标签，另一个只覆盖部分标签”。

- **数值不泛化**

  - 记录确认每路候选上限 K 可配置、默认 32
  - Contract 写明默认值 32，而不是“存在一个可配置上限”。

### Section: 载入记录时同步当前设计依据

Design Record SHALL 让 Build、Explore 与 Propose 在载入记录时按用户已有的对话上下文同步设计依据。新对话首次载入记录，或当前上下文没有已展示且仍有效的记录基线时，Agent SHALL 以自然语言概要呈现记录中全部已确认内容及所有待决问题，使用户能够了解并纠正 Agent 将据以继续的设计；SHALL NOT 呈现成功载入的 slug、记录身份、sourceVersion、valid 状态或机械计数。同一对话中的普通读取或重载不重复呈现全量基线。

同一对话内写入记录后，Agent SHALL 只呈现本次写入的内容要点与决策状态变化；修改已确认内容 SHALL 单独标出，不重贴未变化内容。CLI 返回的 sourceVersion 与计数仅供 Agent 内部校验、并发控制和覆盖门禁使用，CLI 输出保持不变。载入、status 或 validate 发现 invalid、relevant drift 或版本冲突时，Agent SHALL 向用户说明诊断及调和动作，不以静默成功播报或裸版本号代替。

无适用记录时不播报成功载入信息。
