---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: "Propose"
definition: "Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。"
---

## MODIFIED Sections

### Section: 查缺补漏与决策确认

Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。

Propose SHALL 复用已确认决定及仍适用的证据，在推荐方案或认定方案就绪前，独立判断方案是否可行、能否在约束下达成预期结果。SHALL 主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，并向用户表达自己的判断和关键理由。MAY 依据已确认意图和建模规则自主完成局部模型组织，并处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

改变已确认承诺或结构决定、扩大范围或涉及重大业务及架构权衡时，先说明缺口、选项与推荐理由，一次一问等待确认。小范围内容或方案调整可在 Propose 内讨论确认并继续，不因任何设计讨论或记录修订都切回 Explore。需要设计实验重新判断可行性、重选方向或大幅重做设计时，SHALL 返回 Explore 完成实验与设计调整，再继续 Propose。

用户说“细枝末节的内容点的话，我觉得可以放权”时，Agent 可处理局部细节，但不能自行写很多实质内容；允许交互不等于无需确认。直接要求 Propose、不追问或 override 就绪建议都不提供缺失决策，无法确认时报告阻碍。

- **局部组织存在多个合理方案**：方案均符合确认意图与框架约束，差异不构成实质权衡；Agent 比较后作出有依据的组织选择并提交审阅，不因答案不唯一或新增/重组层级自动暂停。
- **变更取消职责**：移除某个 Element 同时意味着取消已确认承诺；Agent 在编写依赖该决定的目标内容前询问用户，不能以结构精简代替授权。

### Section: 完成 Formation 审查与确认

Propose SHALL 默认连续编写完整 Change 后集中交用户审阅，用户明确要求交互推进时才 SHALL 按一项机制及其目标、验证方向分段展示实际草稿，听取反馈并继续；不按制品、Element 数量或写作依赖机械设置审阅轮次。无论模式，遇到影响当前目标的重大缺口 SHALL 先说明选项与理由、等待用户裁决；批量模式不授予猜测决策的权力。

Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过代替语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

- **默认批量**
  - 用户未要求分段交互
  - Propose SHALL 在决策齐备时形成完整 Change 再集中审阅

- **用户要求交互**
  - 用户明确希望边写边审
  - Propose SHALL 按机制展示包含对应目标与验证方向的实际草稿，反馈后再推进

Propose SHALL 检查支持实现预期结果的证据及关键假设；用户确认本身不证明可行性，方案失败本身不证明意图理解错误或目标不可实现。SHALL 区分事实判断、方案缺陷与意图理解缺口，按已确认依据修正可确定的错误，重大方案调整或目标与约束冲突按决策确认规则处理。

草稿审阅 SHALL 呈现全部结构变化及其理由和语义影响，区分语义保留的组织调整与真正改变或移除承诺；用户确认不替代 Agent 对结构合理性和目标表达完整性的判断。该审阅不以逐 Element、逐层或逐 Section 审批为固定流程。

### Section: 遵循共享 Contract 语义

Propose SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义编写 Contract Delta，并以 Section 的独立演进边界确定 Entries。

- **编写多个 Section 义务**

  - 已确认设计包含可独立变化的规范承诺
  - Propose 将其表达为独立 Section Entries，并仅以 Acceptance Cases 具体化各自宿主 Section

Propose SHALL 在完整目标模型上下文中联合审视受影响 Elements 的 Declaration、Contract 与关系，并按共享写作规则调整表达。影响范围包含承接或细化原有语义的 Elements，不限于新增或删除的节点；不因此改写无关内容。

### Section: 编写完整 Definition 目标态

Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

- **已有确认边界**：复用 Design Summary 或记录中的确认依据，按建模规则完成完整目标 Definition。
- **局部组织可确定**：有多个合适的表达或组织方案，但没有待用户裁决的实质选择；按本阶段的决策规则自主处理并提交审阅。
- **存在实质决策缺口**：概念身份、职责边界或结构选择会改变已确认承诺或构成重大权衡；按本阶段决策规则处理，不猜测目标语义。
