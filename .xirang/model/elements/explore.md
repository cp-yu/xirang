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

Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。普通探索 SHALL 按明确问题渐进读取：先用 `arch search --limit` 定位候选，再用层级或影响 projection 缩小范围，再查询选定 identity 的完整 Declaration，只有需要判断完整规范语义时才查询完整 Contract。Explore 不得自动读取影响分析返回的全部 Elements Contracts。

- **逐步确定语义范围**

  - 用户意图涉及尚未定位的模型概念
  - Explore 按 `arch search`、`arch outline`/`arch impact`、`arch query`、`arch query --contract` 顺序按需展开
  - 每次扩大读取都回答一个明确的设计问题

- **保留完整语义读取**

  - 选定 Element 的 Definition 或 Contract 影响判断
  - Explore 查询该 stable identity 的完整语义
  - 未加载的 Definition、impact identity、旧摘要或实现证据不得代替该读取

- **全局恢复有明确触发条件**

  - 整体模型理解已丢失、上下文压缩或需要全局结构诊断
  - Explore 使用 `arch outline` 显式展开所需结构，必要时使用无 Contract 的完整 `arch snapshot`
  - snapshot 不是普通探索的默认入口

### Section: 一次一问并比较方案

Explore SHALL 主动识别行为、边界与实现方案中的决策点，通过一次一问与方案比较推进设计，并由用户确认选择。Agent SHALL 给出推荐与可观察后果，不将推荐当作确认；适用的关键验收结果随设计确认，完整制品留给 Propose。

- **存在多个合理方案**

  - 不同方案具有不同权衡
  - Explore 比较方案并一次请求一个用户决策

Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

Agent SHALL 根据目标和约束同等审视用户与自身提出的方案，区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

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

Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标的未决决策 SHALL 阻塞交接，Agent 不自行延期。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并保留该记录身份供 Propose 发现来源；sourceVersion 仅保留在 CLI 输出与 Agent 内部校验中，不向用户呈现。带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

- **带记录完成 Explore**

  - 当前完整记录与拟议设计无未决冲突且适用设计已确认
  - 输出 Design Summary 并保留可供 Propose 发现来源的记录身份，不把 Summary 另存为记录或向用户呈现 sourceVersion。

### Section: 按确认即记录使用 Design Record

发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference。按协议主动维护 pending 内容，用户确认后立即通过 `xirang record` 局部更新；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

Explore SHALL 在每个阶段入口先运行 `xirang list --json` 发现当前记录，并读取必要的完整基础状态；完整 show/status/validate 用于入口、恢复和收尾门禁，不用于普通讨论或每次局部更新前的重复仪式。有效上下文未发生相关变化时，SHALL 复用最近成功操作返回的 `sourceVersion`、summary 与已知 identity；局部设计问题使用 `record show --entry`，update 使用最近有效 `sourceVersion` 并检查返回的 diff 与 summary。

发生上下文压缩、session 切换、sourceVersion 冲突、相关模型 drift 或无法确认当前状态时，SHALL 重新读取完整记录与状态，并重建受影响的模型或项目证据。记录变化使受影响设计与 Summary 需重查。交接前仍须完成完整覆盖检查，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。

### Section: 委托可行性实验

可行性判断 SHALL 使用已有证据与推理能力，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

必要的方案可行性实验 SHALL 在 Explore 完成，为 Propose 奠定设计基础。Explore 向专门 Experimenter 提供待回答问题、约束和决策背景；由 Experimenter 自主设计并执行最小实验，交付方法、结果、分析与限制。Explore 依据证据继续比较方案、请求用户确认，不把实验成功当作方案已获采纳。不得以统一只读能力禁令阻止实验编写与执行。

实验使用当前工作区、临时目录、项目副本或 worktree 等，由主 Agent 与 Experimenter 根据情况选择；框架不预设选择策略，也不把执行细节逐项交用户设计。实验产物不视为正式 Change 实现。

- Propose 前必须确认某 API 能力：Explore 提供问题与约束，Experimenter 设计并运行最小验证，Explore 将可行性证据和限制用于设计确认。
