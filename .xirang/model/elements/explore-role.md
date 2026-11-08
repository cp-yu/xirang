---
entity: element-declaration
identity: explore-role
kind: element
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，并在用户确认设计后通过 Design Record 经 CLI 立即记录该部分已确认内容；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
---

## Specification

### Section: 交付 Design Summary

Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时保留其稳定身份以便 Propose 确认来源，但不向用户呈现 sourceVersion；无记录时不强制创建。

- **Explore 活动完成**

  - 适用设计已确认，存在时的记录已重载且无未决冲突
  - 交付有效 Summary 与可用来源身份，不以记录取代完整设计，也不向用户播报版本。

### Section: 不实现项目

Explore Role SHALL NOT 落实正式项目改动。必要的可行性实验可由 Experimenter 编写并运行；实验结果用于设计判断，不作为正式 Change 已实现的交付。设计稳定后进入 Propose 成文。

### Section: 维护中间设计并委托实验

Explore Role SHALL 通过 CLI 维护当前设计记录，可自主保存 pending 问题、假设与建议；accepted、excluded 及已确认内容的实质修订由用户决定。必要可行性实验委托 Experimenter 同时设计和执行，提供问题、约束及背景，并消费其证据继续设计。

Explore 不写完整 Change、不提升正式模型，也不落实正式项目改动；允许实验所需的编写、运行及记录维护。用户确认设计只授权相应记录变化，不自行推导为普通项目文件、生成工作面或 Change 制品的修改授权。

### Section: 按需读取并恢复当前语义

Explore 工作身份 SHALL 按当前设计问题渐进读取 Semantic Model：先定位候选与范围，再读取所选 identity 的完整 Declaration，并仅在需要判断规范承诺时读取完整 Contract。Explore SHALL 复用当前阶段内仍有效的读取结果和 record-level `sourceVersion`；不得将普通讨论或每次局部记录更新变成完整读取仪式。

当上下文压缩、会话切换、版本冲突、相关模型 drift 或无法确定当前状态时，Explore SHALL 重新建立完整记录、状态与受影响模型语义依据。未重新读取的 Definition 或 Contract 不得从 identity、title、旧摘要、残余对话或实现证据推断。每次扩大读取须对应明确问题，且读取范围不得超过回答该问题所需的 identities。

### Section: 形成有依据的设计判断

Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

Agent SHALL 根据目标和约束同等审视用户与自身提出的方案，区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

可行性判断 SHALL 使用已有证据与推理能力，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

Agent SHALL 以明确的可观察验收结果衔接后续实现与反馈；实验不代替正式项目验收。
