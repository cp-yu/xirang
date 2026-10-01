---
operation: ADDED
entity: element-declaration
identity: design-record
kind: element
parent: explore
title: Design Record
definition: Design Record 是项目意图形成过程中随设计确认记录用户已确认意图的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的记录方式，并为 Propose 与 Build 的编译提供可独立使用的确认依据；它包含确认即记录、条目写入标准、冲突调和与依赖重查、交接前的记录决策，以及消费方的写作规则与原子细节覆盖检查。它不负责结构形成（由可配置的分解指导负责），不生成完整 Semantic Model 或 Change，也不承担项目实现；记录内容本身由已确认设计记录承载。
---

## ADDED Sections

### Section: 确认即记录

Agent SHALL 在用户于对话中确认设计内容后立即记录该部分内容；用户的设计确认即构成记录授权，SHALL NOT 另行要求持久化确认，也 SHALL NOT 在写入前展示完整拟保存内容。只记录用户明确确认的内容，SHALL NOT 记录 Agent 自行推导、推荐或尚未裁决的内容。无记录时首次确认即建立记录，空记录列表不构成豁免。每次写入 SHALL 只提交本次新增、修改与显式删除的内容，写入后 SHALL 只报告本次变更与记录概况，SHALL NOT 在对话中原样重新呈现未改动的内容；修改已确认内容的条目或字段 SHALL 单独标出。新确认与已记录内容冲突时，SHALL 先说明冲突与影响并由用户裁决，SHALL NOT 默认以最新陈述覆盖先前确认；裁决后再写入即可。

- **确认后立即写入并只报告变更**

  - 用户确认一个设计段落，记录已有 18 条且本段新增 1 条、修改 1 条
  - Agent 立即写入这两条，报告“新增 1 条、修改 1 条、共 19 条”及被修改条目，不重新展示其余 17 条，也不再次请求写入授权。

- **推导内容不记录**

  - Agent 在讨论中给出推荐但用户尚未确认
  - 该推荐不写入记录；用户确认后才记录。

- **冲突先裁决后写入**

  - 用户新陈述与记录中已确认条件矛盾
  - 说明冲突与受影响条目，请求用户裁决；裁决后按裁决结果写入。

### Section: 条目写入标准

记录的每条内容 SHALL 满足：下游在没有这段会话的情况下，能据此写出 Contract 与 Acceptance Case 而不用猜。SHALL 保留用户确认的条件、数值、例外、时序，以及用来对齐的正例与反例；用户给出的例子 SHALL 按原样记录，SHALL NOT 改写或抽象为概括性规则。已确认的组件架构与组件关系 SHALL 写入记录的结构部分，SHALL NOT 仅以文字描述。讨论过程、被否决方案与推导理由 SHALL NOT 自动记录；用户明确要求记录时以 informative 性质保存，SHALL NOT 升格为规范义务。用户明确要求记录的材料 SHALL 优先保存，不因 Agent 判定不重要而省略。

- **例子按原样保留**

  - 用户以“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）”对齐多标签覆盖规则
  - 条目同时记录规则与该例子原文，不只写“同一或祖先关系”。

- **结构进入结构部分**

  - 用户确认新增一个 Element 及其 parent 与 kind
  - 该 Declaration 写入记录的结构部分，而非仅在条目文字中描述。

- **说明材料不规范化**

  - 用户要求保留一个被否决方案的理由
  - 以 informative 条目保存，下游路由到 Plan 或 provenance，不虚构 Contract 承诺。

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

消费记录的形成过程（Propose 编译 Change、Build 编写 Candidate）SHALL 在交接前对记录的每条 normative 条目执行覆盖检查：先将条目拆成原子细节（条件、数值、例子、反例、时序、例外），再逐项给出其在目标模型中的具体位置及该位置承载此细节的原文摘录，或标为未覆盖并说明理由；摘录须取自当前目标文件，不得凭记忆或改写。目标模型为 Change 的 Expected Semantic Model 或 active Candidate；位置精确到 Element identity 加 Declaration、Section 或 Acceptance Case，或 Relationship、Element Kind、Relationship Kind、Authored View。当前正式语义已满足的细节 MAY 以其现有位置作为 no-op 落位。检查结果 SHALL 交 CLI 记录并通过确定性门禁后才能交接；任何条目缺结果、未拆出原子细节或存在未覆盖项，均阻塞交接。仅规则落位而其对齐例子无落位时，该例子计为未覆盖。记录的结构部分由 CLI 逐字段比对，不拆原子细节、不交检查者判断。CLI 门禁只证明检查已执行、位置真实存在且摘录确实出现在该位置，不证明摘录表达了该细节；语义判断仍由检查者负责，摘录只表达泛化规则而不含例子的具体输入与结果时，该例子计为未覆盖。informative 条目不进入门禁，按性质路由到 Plan、构建依据或 provenance。豁免或本次无 normative 内容时 SHALL 显式声明没有条目需要检查。

- **例子缺失阻塞交接**

  - 条目含规则与例子“A、C 时 ABC、ACD 可以，AB 不行”，目标模型中规则写入 Business Logic 但没有该例子
  - 该例子标为未覆盖，交接被阻塞，直到例子写入对应 Acceptance Case。

- **泛化落位暴露于摘录**

  - 检查者把例子“A、C 时 ABC、ACD 可以，AB 不行”指向一条泛化 Acceptance Case，所附摘录只写“一个事件覆盖全部当前标签，另一个只覆盖部分”
  - 摘录不含该例子的具体标签与结果，该例子计为未覆盖；摘录不在该位置时 CLI 拒绝。

- **笼统描述不构成检查**

  - 检查者只给出“已逐项核对”而没有逐条原子细节与位置
  - CLI 拒绝记录该结果，`consume` 不能执行。

- **既有语义作为 no-op 落位**

  - 某原子细节已由正式模型中未改动的 Section 表达
  - 以该 Section 作为落位，不为满足检查而制造 Delta。

### Section: 按写作规则编译细节

从记录编译目标语义时，用户确认的例子 SHALL 写成验收内容（business-specification Contract 写入 Key Acceptance Cases 的 Acceptance Case，其他 Contract 写入对应 Section 的具体情形），原样或以等价的具体形式出现，SHALL NOT 抽象为概括性描述；已确认的数值、时序与例外 SHALL 写进宿主 Contract 的业务机制或例外处理内容，SHALL NOT 换成泛化描述。记录的结构对象 SHALL 编成对应的 Delta 条目，或在正式模型已一致时作为 no-op。

- **例子写成具体验收情形**

  - 记录含“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行”
  - Acceptance Case 使用具体标签 A、C 与事件 ABC、ACD、AB 及各自结果，而不是“一个事件覆盖全部当前标签，另一个只覆盖部分标签”。

- **数值不泛化**

  - 记录确认每路候选上限 K 可配置、默认 32
  - Contract 写明默认值 32，而不是“存在一个可配置上限”。
