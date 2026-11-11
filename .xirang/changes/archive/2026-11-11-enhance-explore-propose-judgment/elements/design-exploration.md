---
entity: element-declaration
identity: "design-exploration"
kind: "element"
parent: "explore"
title: "Design Exploration"
definition: "Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method，最终形成不持久化的 Design Summary。"
---

## MODIFIED Sections

### Section: 确认适用设计

Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

Design Exploration SHALL 主动发现需要用户选择的决策点，通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。Agent SHALL 解释适用的异常结果、竞争事件与时间起点或容差，给出推荐及理由并等待用户确认；推荐与未选方案不得当作已确认决定。关键条件、动作与可观察验收结果 SHALL 随设计确认，不能仅确认测试工具或技术方案名称；完整 Sections、Acceptance Cases 与 tasks 留给 Propose 文档化。

- **多个实现方案符合目标语义**

  - 多个方案具有不同权衡
  - Design Exploration 比较方案并请求用户选择

需要实践求证的可行性问题 SHALL 交 Experimenter 设计并执行实验，在 Explore 内取得结果再确认相关方案；实验事实与用户决策分开记录。

Agent SHALL 在推荐或采纳方案前，独立判断方案的可行性及能否在约束下达成预期结果，对用户与自身提出的方案同等评估，并向用户表达自己的判断和关键理由。SHALL 区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

可行性判断 SHALL 使用相关证据与推理，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。
