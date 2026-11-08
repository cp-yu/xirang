---
entity: element-declaration
identity: explore-brainstorming
kind: element
parent: design-exploration
title: "Explore Brainstorming"
definition: "Explore Brainstorming 定义 Explore 的设计澄清流程：通过项目证据、一次一问、方案比较和分段确认完善中间设计，委托必要的可行性实验并维护设计记录，交付 Design Summary。它不承担完整 Change 成文或正式项目实现。"
---

## MODIFIED Sections

### Section: 一次一问的提问纪律

系统 SHALL 主动发现用户尚未考虑的决策点，包括适用的失败结果、事件竞争和时间起点或容差；SHALL 解释备选方案的可观察后果并给出有理由的推荐，每次只问一个问题，等待用户回答后再继续。推荐本身不构成确认。

- **单个问题等待**

  - 系统需要澄清多个方面
  - 系统先问第一个问题，等待用户回答后再问第二个问题

- **优先多选题**

  - 问题有明确的几个选项
  - 系统以多选题形式提问，而非开放式问题

Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

- **只表达意图**：用户说“我想更快地找到问题。”时，理解当前困难、使用情境与希望改善的结果，帮助探索路径，不猜定用户已选择方案。
- **只提出路线**：用户说“加一个缓存。”时，理解要解决的问题及为何想到缓存，辨别它是候选建议还是明确约束。
- **混合表达**：用户同时表达目标与路线时，辨别需保留的目标和可调整的路径。
- **信息已充分**：已有背景、目标与证据足以继续时，复用它们推进，不重复询问或强制实验。

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

Agent SHALL 根据目标和约束同等审视用户与自身提出的方案，区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

- **用户路线遇到反证**：依据问题重新比较可行路径，不因某条路线失败直接否定用户目标。
- **Agent 路线失败**：先检查自身方案和技术假设，不无依据重开意图确认。
- **明确约束冲突**：用户明确要求的路线无法同时满足目标时，呈现冲突及可调整选项，等待用户选择。

### Section: Explore 主代理维护设计与实验边界

Explore main agent SHALL 可检查证据、运行查询、提问、比较方案、通过 CLI 维护中间设计记录，并委托 Experimenter 设计与执行必要可行性实验。记录遵守 pending 自主维护及用户独占确认权；实验不形成正式项目实现。主 Agent 不直接编写完整 Change，不修改正式模型或普通生成工作面。不得保留阻止实验的统一只读能力限制。

获取影响面时 SHALL 先用 arch search 选择 focus identities，再用 identity-only arch impact 获取 refinement、Relationships 与 canonical paths，最后 batch arch query 读取判断所需的完整 Definitions 与 Contracts。实现证据由代码工具获取，不能从 Relationship adjacency 自动推断必须修改，也不能从 identity、title 或残余上下文猜测未读语义。

生成的 Explore skill SHALL 明确记录维护、实验委托和正式实现之间的权限边界；需要完整 Change 时交 Propose。

可行性判断 SHALL 使用已有证据与推理能力，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

- **局部实验成功**：仅某接口能力得到验证时，使用该事实判断相关部分，不宣称整套方案已通过验证。

### Section: Explore 必须执行 brainstorming checklist

Explore 阶段 SHALL 按当前问题和有效上下文组织 brainstorming checklist，覆盖适用的设计职责：探索项目上下文（evidence-first）、提供 visual companion（如果需要）、一次一问澄清需求、提出 2-3 个方案并对比权衡、分段呈现设计并逐段确认、生成 Design Summary。

- **完整 brainstorming 流程**

  - 用户调用 explore workflow
  - 系统按当前缺口推进适用设计工作，复用已有理解和确认，不重复执行固定问卷
  - 关于现有代码、架构或技术决策的所有声明必须基于项目证据，不得用通用知识替代项目事实

- **跳过 visual companion**

  - 用户的需求不涉及视觉内容
  - 系统跳过 visual companion 步骤，直接进入一次一问

### Section: Explore 通过 referenceFiles 暴露行为引导

`xirang-explore` SHALL 通过 `referenceFiles` 暴露行为引导手册，作为主 instructions 的权威行为展开版，并物化到 `.xirang/references/xirang-explore-supperpowers-style.md`。主 SKILL.md instructions SHALL 保留入口、记录维护、实验与正式实现边界、Required Context、Semantic Impact 与唯一 Brainstorming Checklist，并通过 Required References 指向该物化 reference；reference 内容 SHALL 将写 design doc、commit 等交接语义映射到 conversation-only Design Summary 与 propose workflow，不得暗示 Explore 可直接编写完整 Change 或落实正式项目，明确 CLI 记录维护与委托实验的例外。

- **explore 声明行为 reference**

  - explore skill 被生成
  - 返回对象 SHALL 包含 referenceFiles 数组
  - 该数组 SHALL 包含 `.xirang/references/xirang-explore-supperpowers-style.md` 对应的 entry
  - 主 instructions SHALL 使用“必须阅读”级措辞引用该 reference

- **reference 保留设计前置纪律**

  - agent 读取该 reference
  - reference SHALL 明确在设计确认完成前不得落实正式实现，必要实验可在 Explore 执行
  - SHALL 明确简单变更仍需要设计确认，最低集合为 problem、impact scope、approach 与 verification method
  - SHALL 明确用户审查通过 Design Summary 后才能路由到 propose workflow

- **reference 不重复主 instructions 机制**

  - 生成 reference 内容
  - SHALL NOT 包含 arch 查询编排协议或 future capture target 路由表
  - SHALL 聚焦 brainstorming 行为纪律及其 Xirang 适配

- **explore 声明 supperpowers-style reference**

  - `getExploreSkillTemplate()` 生成 explore skill
  - 返回对象 SHALL 包含 `referenceFiles` 数组
  - 该数组 SHALL 包含一项 `{ path: 'references/explore-supperpowers-style.md', ... }`
  - 该 reference 内容 SHALL 覆盖 Superpowers hard gate、context exploration、just-in-time visual companion、one-question discipline、2-3 approaches、section-by-section design approval、Design Summary self-review、user review gate、xirang-propose handoff

- **主 instructions 保持精简并指向 reference**

  - 生成 explore 主 SKILL.md instructions
  - 主 instructions SHALL 保留记录维护、实验与正式实现边界、Semantic Impact、Brainstorming Checklist
  - SHALL 包含指向 `.xirang/references/xirang-explore-supperpowers-style.md` 的 Required References 引用，且 SHALL 使用“必须阅读”级措辞
  - SHALL 将该 reference 声明为 Superpowers 行为引导的权威来源，不在主 instructions 中重新构建该行为内容
  - 主 SKILL.md SHALL 满足 ≤200 行限制

- **reference 内容路由到 propose 而非直接写入**

  - reference 内容涉及 artifact 生成或更新
  - SHALL 使用 `xirang-propose` 逻辑 workflow 名称路由
  - SHALL NOT 暗示 Explore 直接编写完整 Change 或进入正式 implementation planning；记录维护和实验按角色协议执行

- **reference 保留 Superpowers 设计前置纪律**

  - agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
  - reference SHALL 明确在设计确认完成前不得落实正式实现，必要实验可在 Explore 执行
  - SHALL 明确简单变更仍需要设计确认，但只确认适用章节，最低集合为 problem、impact scope、approach 与 verification method
  - SHALL 明确用户审查通过 `Design Summary` 后才能路由到 `xirang-propose`

提示词 SHALL 在组合后的上下文中保持精简；在适用位置表达关键判断与边界，复用已有规则，不将同一原则在各阶段重复展开，也不把每个例子或推论都变成独立指令。
