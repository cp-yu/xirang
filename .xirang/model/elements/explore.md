---
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中可通过 Definition Framing 持续确认并记录关键设计，记录的每次持久化需单独授权。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
---

## Specification

### Section: 识别语义影响面

Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。

- **分析潜在变更**

  - 用户意图可能影响现有项目语义
  - Explore 联合模型与项目证据确定相关范围

### Section: 一次一问并比较方案

Explore SHALL 主动识别行为、边界与实现方案中的决策点，通过一次一问与方案比较推进设计，并由用户确认选择。Agent SHALL 给出推荐与可观察后果，不将推荐当作确认；适用的关键验收结果随设计确认，完整制品留给 Propose。

- **存在多个合理方案**

  - 不同方案具有不同权衡
  - Explore 比较方案并一次请求一个用户决策

### Section: 分段确认复杂变更设计

对复杂变更，Explore SHALL 分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks。

- **变更跨越多个设计维度**

  - 单次确认不足以审查设计
  - Explore 逐段呈现并确认适用维度

### Section: 确认窄变更最低设计集

对窄变更，Explore SHALL 至少确认 problem、impact scope、approach 与 verification method。

- **变更范围有限**

  - 完整复杂设计分段不适用
  - Explore 仍确认最低设计集

### Section: 不形成完整 Change

Explore SHALL NOT 形成完整 Change。

- **Design Summary 已形成**

  - Explore 到达出口
  - 完整 Change 仍由 Propose 形成

### Section: 澄清 Element Definition 影响

Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。已确认片段可在单独授权后通过 Definition Framing 保存；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

- **Change 改变 Element 概念边界**

  - 不同 Definition 边界会产生不同 Semantic Delta
  - Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

### Section: 支持可选 Definition Framing

Explore SHALL 告知可通过 Definition Framing 保存已确认设计，并按触发条件加载共享 framing reference：发现或接收相关记录（含恢复已有探索）时，在读取或依赖记录前加载；设计段落产生未被明确豁免的规范性确认，或用户要求 framing、记录或修订材料时，在拟定 payload 或操作记录前加载；Summary 前发现规范性确认既未记录也未明确豁免时，加载并解决交接缺口。未触发时不为普通讨论预加载协议。通过 Design Exploration 推进设计，在每个已确认设计段落结束时主动整理规范性确认并展示完整拟保存 payload，发起一次批量持久化确认，不等待用户主动要求记录，也不默认提供豁免。明确豁免覆盖的内容不重复请求记录。存在 normative 确认时，Explore SHALL 在交接前落定恰好一个记录决策——已持久化记录、用户明确授予的豁免、或本次无 normative 内容的声明——三者皆缺即阻塞交接。记录更新后 SHALL 重查受影响设计与 Summary，不得将结构 Framing 固定为所有设计的先行阶段。

- **有规范确认时落定决策**

  - 采用的设计含 normative 确认
  - 在交接前取得记录、豁免或无 normative 内容声明之一
  - 不将无记录继续作为默认路径

- **已确认内容修订**

  - 记录中的行为或结构确认被授权更新
  - 重载记录并重新检查依赖旧条目的设计结论

### Section: 形成不持久化的 Design Summary

Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标的未决决策 SHALL 阻塞交接，Agent 不自行延期。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并一起交付该记录身份及受核对版本；带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

- **带记录完成 Explore**

  - 当前完整记录与拟议设计无未决冲突且适用设计已确认
  - 输出 Design Summary 并交付记录身份及该次核对版本，不把 Summary 另存为记录。

- **带豁免完成 Explore**

  - 用户已授予豁免且设计已确认
  - 输出 Design Summary 并交付无记录声明及其理由

- **无规范内容完成 Explore**

  - 设计已确认但仅含说明性材料
  - 输出 Design Summary 并显式声明本次无 normative 内容，不建立记录
