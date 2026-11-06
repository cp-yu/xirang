---
entity: element-declaration
identity: design-exploration
kind: element
parent: explore
title: Design Exploration
definition: Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method，最终形成不持久化的 Design Summary。
---

## Specification

### Section: 处理确定性影响

Design Exploration SHALL 将 CLI 返回的格式、版本与显式上下文变化纳入设计复核；CLI 可提供确定性影响线索，但不能据此断言自然语言设计无冲突或完整。

- **上下文变化后复核设计**

  - 记录关联的正式模型上下文发生变化
  - 重查相关设计和授权，区分预期模型演进与未解决矛盾，而非直接丢弃记录或接受新状态。

### Section: 确认适用设计

Design Exploration SHALL 主动发现需要用户选择的决策点，通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。Agent SHALL 解释适用的异常结果、竞争事件与时间起点或容差，给出推荐及理由并等待用户确认；推荐与未选方案不得当作已确认决定。关键条件、动作与可观察验收结果 SHALL 随设计确认，不能仅确认测试工具或技术方案名称；完整 Sections、Acceptance Cases 与 tasks 留给 Propose 文档化。

- **多个实现方案符合目标语义**

  - 多个方案具有不同权衡
  - Design Exploration 比较方案并请求用户选择

需要实践求证的可行性问题 SHALL 交 Experimenter 设计并执行实验，在 Explore 内取得结果再确认相关方案；实验事实与用户决策分开记录。

### Section: 形成不持久化的 Design Summary

适用设计已确认、必要可行性实验完成后，Design Exploration SHALL 形成 conversation-only Design Summary 供 Propose 使用。存在记录时先完整重载当前设计及状态，检查内部冲突、与拟议设计的冲突及影响当前目标的 pending 问题，先由用户裁决。用户确认即授权相应记录更新，无需额外写入授权；保存后核对差异与受影响设计。

- 冲突或影响当前目标的未决决策未解决：不输出可交接 Summary。
- 用户裁决修订后：按裁决更新，重查受影响结论再输出。
- Summary 后记录变化：相关结论失效，重查后才能交接。

### Section: 设计自查与忠实交接

Design Exploration SHALL 在交接前用适用的边界或竞争事件序列检查机制、不变量、时序和失败行为。已确认设计能确定答案的表达或推导错误 SHALL 由 Agent 修正；需要新增或改变决策时 SHALL 询问用户。影响当前目标的未决决策 SHALL 阻塞可交接声明；延后或排除范围 SHALL 经用户确认，不能把当前必需行为静默推给 Propose。

Design Summary SHALL 保留已确认行为、范围、决策及理由，包含适用条件、数值、例外、时序和关键验收结果；推荐、未选方案、未决事项与用户明确排除的范围 SHALL 保持可区分。有记录时引用记录身份，不向用户呈现 sourceVersion；sourceVersion 继续由 CLI 提供并由 Agent 内部用于版本校验，不重复记录全文。Summary 保持会话内，不新增永久决策台账。Propose 仍可在文档化时发现新缺口。

### Section: 使用完整当前确认记录

Design Exploration SHALL 在开始、恢复和准备输出 Summary 时读取存在的完整当前记录，联合 Semantic Model、项目证据与实验结果使用当前设计，区分 pending、accepted 与 excluded；只将已采纳规范内容作为确认依据，不得仅依赖最近对话或记录摘要。无记录时 SHALL 直接按通常流程探索。

- **恢复已有记录的探索**

  - 已有记录而对话中仅剩部分上下文
  - 通过 CLI 读取完整当前记录后继续，保留未出现在最近对话中的确认。

- **没有记录时正常继续**

  - 记录不存在
  - 基于模型与项目证据自审设计，不要求建立空记录。
