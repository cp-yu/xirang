---
entity: element-declaration
identity: "explore-brainstorming"
kind: "element"
parent: "design-exploration"
title: "Explore Brainstorming"
definition: "Explore Brainstorming 定义 Explore 的设计澄清流程：通过项目证据、一次一问、方案比较和分段确认完善中间设计，委托必要的可行性实验并维护设计记录，交付 Design Summary。它不承担完整 Change 成文或正式项目实现。"
---

## MODIFIED Sections

### Section: 2-3 方案对比

存在需要选择的关键方案时，系统 SHALL 提出 2-3 个可行方案并对比权衡；每个方案包含方案描述、优势、劣势、适用场景，并推荐其中一个方案且说明理由。

- **方案对比呈现**

  - 系统理解了需求且存在尚未确定的关键方案选择
  - 系统提出 2-3 个方案并对比权衡
  - 系统推荐其中一个方案并说明理由

- **用户选择方案**

  - 用户选择了某个方案或提出修改
  - 系统基于选定方案继续设计

- **方案对比时加入 ponytail 视角**

  - 系统呈现 2-3 个技术方案，且 ponytail ladder 判断某方案存在不必要的抽象、新依赖或已有平台能力可覆盖的实现
  - 系统 SHALL 用一行指出 ponytailladder 建议（如：「ponytail 说：这个抽象现在不需要，直接调 stdlib 够用。要换成这个吗？」）
  - 系统 SHALL 等待用户确认后才调整方案
  - 若无 ponytailladder 可简化项，系统 SHALL 自然跳过

已确定的选择 SHALL 复用，不为满足数量制造替代方案。

Agent SHALL 在推荐或采纳方案前，独立判断方案的可行性及能否在约束下达成预期结果，对用户与自身提出的方案同等评估，并向用户表达自己的判断和关键理由。SHALL 区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

- **用户路线遇到反证**：依据问题重新比较可行路径，不因某条路线失败直接否定用户目标。
- **Agent 路线失败**：先检查自身方案和技术假设，不无依据重开意图确认。
- **明确约束冲突**：用户明确要求的路线无法同时满足目标时，呈现冲突及可调整选项，等待用户选择。

### Section: Explore 主代理维护设计与实验边界

Explore main agent SHALL 可检查证据、运行查询、提问、比较方案、通过 CLI 维护中间设计记录，并委托 Experimenter 设计与执行必要可行性实验。记录遵守 pending 自主维护及用户独占确认权；实验不形成正式项目实现。主 Agent 不直接编写完整 Change，不修改正式模型或普通生成工作面。不得保留阻止实验的统一只读能力限制。

获取影响面时 SHALL 先用 arch search 选择 focus identities，再用 identity-only arch impact 获取 refinement、Relationships 与 canonical paths，最后 batch arch query 读取判断所需的完整 Definitions 与 Contracts。实现证据由代码工具获取，不能从 Relationship adjacency 自动推断必须修改，也不能从 identity、title 或残余上下文猜测未读语义。

生成的 Explore skill SHALL 明确记录维护、实验委托和正式实现之间的权限边界；需要完整 Change 时交 Propose。

可行性判断 SHALL 使用相关证据与推理，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

- **局部实验成功**：仅某接口能力得到验证时，使用该事实判断相关部分，不宣称整套方案已通过验证。
