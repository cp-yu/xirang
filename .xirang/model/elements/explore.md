---
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
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

Explore SHALL 使用中间设计记录完善设计，不提前展开完整 Change 草稿；整体设计接近完成后，由 Propose 组织并编写实际草稿。探索中后续发现可以使此前设计修订，记录按当前状态更新，避免每次反复都重写完整制品。Explore SHALL NOT 实现正式 Change。

- 先确定的条件因后续发现改变：取得必要用户裁决后更新中间记录，未进入 Propose 时不展开完整 Delta、Plan。

### Section: 澄清 Element Definition 影响

Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。用户确认的 Declaration 字段 SHALL 通过 Design Record 记录到记录的结构部分，允许只含已确认字段；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

- **Change 改变 Element 概念边界**

  - 不同 Definition 边界会产生不同 Semantic Delta
  - Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

- **部分确认的 Declaration**

  - 用户已确认新 Element 的 parent 与 kind，definition 仍在讨论
  - 立即记录已确认的两个字段，definition 确认后补充

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

### Section: 按确认即记录使用 Design Record

发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference；普通讨论不预加载。按协议主动维护 pending 内容，用户确认后立即通过 xirang record 局部更新为相应状态；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

记录随设计形成，不是先行阶段；记录变化使受影响设计与 Summary 需重查。交接前对照完整确认内容补足遗漏，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。

### Section: 委托可行性实验

必要的方案可行性实验 SHALL 在 Explore 完成，为 Propose 奠定设计基础。Explore 向专门 Experimenter 提供待回答问题、约束和决策背景；由 Experimenter 自主设计并执行最小实验，交付方法、结果、分析与限制。Explore 依据证据继续比较方案、请求用户确认，不把实验成功当作方案已获采纳。不得以统一只读能力禁令阻止实验编写与执行。

实验使用当前工作区、临时目录、项目副本或 worktree 等，由主 Agent 与 Experimenter 根据情况选择；框架不预设选择策略，也不把执行细节逐项交用户设计。实验产物不视为正式 Change 实现。

- Propose 前必须确认某 API 能力：Explore 提供问题与约束，Experimenter 设计并运行最小验证，Explore 将可行性证据和限制用于设计确认。
