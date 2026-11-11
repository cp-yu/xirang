---
entity: element-declaration
identity: explore-brainstorming
kind: element
parent: design-exploration
title: Explore Brainstorming
definition: Explore Brainstorming 定义 Explore 的设计澄清流程：通过项目证据、一次一问、方案比较和分段确认完善中间设计，委托必要的可行性实验并维护设计记录，交付 Design Summary。它不承担完整 Change 成文或正式项目实现。
---

## Specification

### Section: Explore 必须执行 brainstorming checklist

Explore 阶段 SHALL 按当前问题和有效上下文组织 brainstorming checklist，覆盖适用的设计职责：探索项目上下文（evidence-first）、提供 visual companion（如果需要）、一次一问澄清需求、提出 2-3 个方案并对比权衡、分段呈现设计并逐段确认、生成 Design Summary。

- **完整 brainstorming 流程**

  - 用户调用 explore workflow
  - 系统按当前缺口推进适用设计工作，复用已有理解和确认，不重复执行固定问卷
  - 关于现有代码、架构或技术决策的所有声明必须基于项目证据，不得用通用知识替代项目事实

- **跳过 visual companion**

  - 用户的需求不涉及视觉内容
  - 系统跳过 visual companion 步骤，直接进入一次一问

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

Agent SHALL 在推荐或采纳方案前，独立判断方案的可行性及能否在约束下达成预期结果，对用户与自身提出的方案同等评估，并向用户表达自己的判断和关键理由。SHALL 区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

- **用户路线遇到反证**：依据问题重新比较可行路径，不因某条路线失败直接否定用户目标。
- **Agent 路线失败**：先检查自身方案和技术假设，不无依据重开意图确认。
- **明确约束冲突**：用户明确要求的路线无法同时满足目标时，呈现冲突及可调整选项，等待用户选择。

### Section: 分段设计呈现

系统 SHALL 分段呈现并确认适用于当前问题的设计内容。设计确认 SHALL 包含行为、职责边界与关键条件下的可观察验收结果，不只确认技术方案或测试工具。复杂变更还覆盖适用的 architecture、core components、data flow、technology stack、testing strategy 与 risks/trade-offs；窄修改 MAY 省略明显不适用的章节，但 MUST 至少确认 problem、impact scope、approach 与 verification method。Testing Strategy SHALL 先应用共享测试品质（可重复隔离、锁行为不锁结构、单一失败原因，以及难测先改设计），再决定 reuse、modify、add、delete 或 one-time；SHALL NOT 按 Acceptance Case 条数机械规划持久化测试。

- **逐段确认**

  - 系统准备呈现完整设计
  - 系统依次呈现并确认适用的业务行为、边界、关键验收结果、架构方案、核心组件、数据流、技术栈、测试策略、风险和权衡
  - 不要求 Explore 写完 Contract 的四个 Section、全部 Acceptance Cases 或任务清单

- **窄修改压缩设计确认**

  - 当前问题不需要独立的组件、数据流或技术栈决策
  - 系统 MAY 省略这些不适用章节
  - SHALL 仍分别确认 problem、impact scope、approach 与 verification method
  - verification method SHALL 仍应用共享测试品质

- **Testing Strategy 应用测试品质**

  - Testing Strategy 阶段呈现验证计划
  - 系统 SHALL 先说明要防止的可观察行为回归与现有覆盖
  - SHALL 只在现有测试无法保护该行为时规划新增持久化测试
  - SHALL 为每个新增边界说明它能捕获、现有测试捕获不到的缺陷

- **Testing Strategy 按行为而非 Acceptance Case 规划**

  - 一个 Section 含多个描述同一行为与同一失败原因的 Acceptance Case
  - Testing Strategy SHALL 将它们规划为一条持久化测试或一个验证项
  - SHALL NOT 为每个 Acceptance Case 各规划一个测试文件

- **Testing Strategy 阶段识别过时测试**

  - 设计涉及架构变更、API 重构、数据布局调整或行为删除
  - 系统 SHALL 读取相关测试并识别假设冲突、重复保护、结构耦合或弱断言测试
  - 系统 SHALL 将它们分类为更新、删除或保留
  - 若项目存在多个测试目录，系统 SHALL 确定权威测试套件

- **Testing Strategy 阶段分类 persistent 与 one-time verification**

  - Testing Strategy 阶段呈现测试项
  - 系统 SHALL 将每个验证项分类为 persistent 或 one-time verification
  - 对 one-time verification 项，系统 SHALL 不规划 persistent 测试文件
  - 当存在 one-time verification 项时，系统 SHALL 在 Design Summary 的 Testing Strategy 下输出 `One-time Verification` 子节
  - typecheck、build、一次性 grep 与纯制品文本核对 SHALL 归入 one-time，除非它们本身就是该行为的唯一可观察证据

- **用户要求修改**

  - 用户在某一段提出修改意见
  - 系统修改该段内容并复核依赖它的设计结论
  - 重新呈现受影响内容，等待确认
  - 确认后继续下一段

- **Test Maintenance 子节格式**

  - 现有测试需要更新、删除或被新测试替代
  - Testing Strategy SHALL 列出 reuse、modify、delete、add 与 one-time 项及原因
  - SHALL 标注 authoritative suite

- **单方案中发现过度规格化**

  - 系统在讨论单个设计决策（如数据模型、API 设计、组件层次），且 ponytailladder 发现该设计引入了不必要的抽象、新依赖或已有平台能力可覆盖的实现
  - 系统 SHALL 用一行指出简化方式
  - 系统在 ponytailladder 无特别发现时自然跳过，不强制输出

### Section: Design Summary 生成

Explore SHALL 在设计确认和机制自查后生成 conversation-only Design Summary。自查 SHALL 用适用的边界或竞争事件序列检验不变量、时序与失败行为；能依据已确认设计修正的表达或推导错误由 Agent 修正，需要新决策时询问用户。Summary SHALL 保留决策的条件、数值、例外、时序与关键验收结果，区分确认、推荐、未决与用户明确排除的范围；当前目标依赖的未决决策不得以 Agent 自行延期方式放行。复杂语义模型变更 SHALL 明确记录适用的 decisions；窄修改 SHALL 至少汇总 problem、impact scope、approach 与 verification method；natural-language prose SHALL 跟随用户语言，canonical tokens、paths 与 commands SHALL 保持 canonical。 存在已确认设计记录时，输出前 SHALL 完整重载并完成冲突裁决、受影响结论重查；未决冲突与过期检查不能放行 Summary。

- **Semantic Model Design Summary**

  - 讨论涉及 Semantic Model structure
  - summary SHALL 使用 stable canonical terminology
  - SHALL 区分 authored semantic content、derived views 与 implementation evidence
  - MUST NOT 发明独立持久化 IR

- **Design Summary 存储**

  - summary 完成
  - SHALL 保留在 conversation
  - SHALL 由用户显式触发 propose

- **复杂变更的 Design Summary 格式**

  - complex change 的适用设计段落已确认
  - summary SHALL 包含 architecture、components、data flow、technology、testing 与 risks 中适用部分

- **Design Summary 输出语言**

  - 用户主要使用非 English language
  - natural-language prose SHALL 跟随用户语言
  - canonical tokens、paths 与 commands SHALL 保持 canonical

- **窄修改的 Design Summary 格式**

  - narrow change 不需要独立 components、data flow 或 technology decisions
  - SHALL 至少汇总 problem、impact scope、approach 与 verification method

### Section: 范围检查和拆解建议

系统 SHALL 在 explore 阶段检查范围，如果过大则建议拆分。

- **范围过大提示**

  - 用户描述的需求涉及多个独立子系统
  - 系统在探索项目上下文后提示"这个需求涉及多个独立子系统，建议拆分为多个变更"
  - 系统帮助用户识别独立子系统并建议实现顺序

- **拆分后继续**

  - 用户同意拆分并选择先实现某个子系统
  - 系统针对该子系统继续 brainstorming 流程

### Section: 设计确认不是写入授权

用户选择方案或确认设计段落 SHALL 授权记录相应决定，并据此继续 Explore。该确认不自动授权落实正式项目、修改正式模型或编写完整 Change。pending 信息可按共享协议主动保存；实验委托与执行遵循实验角色职责，不因用户尚未采纳方案而禁止实践求证。

### Section: Explore 捕获边界保持 Contract 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 以 Semantic Model 分类 future capture target：Element Contract 变化进入宿主 Element 的 Contract，graph facts 进入 Semantic Delta，implementation decisions 进入 scaffolding；Explore 不直接编写这些最终制品。当前设计经 CLI 进入中间设计记录，显式区分 pending、accepted、excluded；这只是中间依据，不改变最终 capture target，也不授权直接写 Contract 或 Change。

- **Contract decision 进入宿主 Contract**

  - Explore 发现 element 的可验证 intent、guarantee、constraint、Section 或 Acceptance Case 变化
  - SHALL 将 future capture target 分类为该 element 对应的 Contract
  - SHALL 在 Design Summary 中记录稳定 identity 与 contract scope

- **Graph decision 进入 Semantic Delta**

  - Explore 发现 Metamodel、element identity、containment、relationship 或 view 变化
  - SHALL 分类到 Semantic Delta
  - SHALL 使用 abstraction/refinement 与 semantic relationship terminology

- **Scaffolding decision 保持分离**

  - insight 是 motivation、scope、lowering decision、task 或 verification work
  - SHALL 分别路由到 proposal、design 或 tasks
  - MUST NOT 将其写成 Element Contract

- **重构和实现决策进入 design**

  - Explore 形成 refactor rationale、rejected path 或 implementation strategy
  - SHALL 路由到 `design.md`
  - MUST NOT 写入 Element Contract

- **Explore 不写入模型**

  - future capture target 已确定
  - 不直接写入目标模型或 Change；在对话 Summary 中标明目标，并经 CLI 记录用户已确认的内容
  - 后续规范制品仍由 Propose 或其他获授权 workflow 生成

- **Contract decision 进入 owner Contract**

  - Explore 发现 element 的可验证 intent、guarantee、constraint、Section 或 Acceptance Case 变化
  - SHALL 将 future capture target 记录为该 element 的 Contract scope（全局寻址 `<element identity>#<Section name>`，由 propose 写入 change `elements/` delta 单元）
  - SHALL 在 Design Summary 中记录 stable `identity` 与 contract scope

- **其他 insight 路由到对应制品**

  - Explore 发现 scope、work、verification 或 graph intent change
  - SHALL 分别路由到 proposal、tasks 或 `Semantic Delta`
  - Explore SHALL 不直接写入这些最终制品

- **可观察行为进入 Contract**

  - Explore 发现 observable behavior contract 变化
  - SHALL 路由到 owner element 的 Contract（宿主 Element 单元）
  - SHALL 记录 stable identity

- **过时测试的 future capture target**

  - architecture 或 contract change 使 existing tests 过时
  - concrete updates/removals SHALL 路由到 tasks
  - rationale SHALL 路由到 design

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

### Section: Explore 使用 todo 跟踪流程

`xirang-explore` SHALL 在 todo 工具可用时，把 Explore 阶段记录为 checklist 并在阶段完成时更新；该 checklist 只表示对话流程进度，不授权 main explore agent 创建、编辑或删除项目文件。

- **主 instructions 要求 todo 跟踪**

  - 系统生成 explore skill 内容
  - 主 instructions SHALL 声明在 todo 可用时，必须在读取 context 前创建唯一的 brainstorming checklist
  - 主 instructions SHALL 要求随着阶段完成 tick 对应 checklist 项

- **Todo checklist 不改变只读边界**

  - explore 使用 todo checklist 跟踪流程
  - checklist SHALL 只表示 explore 对话流程进度
  - checklist SHALL NOT 授权 main explore agent 创建、编辑或删除项目文件

- **Superpowers reference 要求 context 前建立 checklist**

  - agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
  - reference SHALL 要求在读取项目 context 前创建 todo checklist
  - checklist SHALL 包含 context、visual decision、one question、options、section approvals、self-review 和 handoff 阶段

### Section: 仅在结构设计中应用项目拆分指导

Explore Brainstorming SHALL 在需求涉及新增或重组 Element hierarchy 时消费 normalized `decomposition`，并将其用于结构方案比较与 Design Summary；行为、实现或 Contract-only 讨论 SHALL NOT 因该配置被扩展为结构重组。对 `skill` 的调用仍属于结构设计辅助，SHALL NOT 放宽 Explore workflow stage 边界。

- **探索结构变化**

  - 用户意图会新增 Element、改变 parent 或重组 sibling set
  - Explore 在比较结构方案前使用配置的方法或调用配置的 skill
  - 在 Design Summary 记录已确认的结构方向而不写入 Change artifacts

- **探索 Contract-only 变化**

  - 用户意图只改变既有 Element Contract 或实现方式
  - Explore 不调用自定义拆分 skill
  - 不因默认拆分方法 产生额外 Architecture Source

- **custom skill 请求写入**

  - decomposition skill 的指令要求越过 Explore 的记录、实验与正式实现边界
  - 主 Explore Agent 忽略冲突指令，不直接编写正式模型或完整 Change
  - 设计状态通过 Xirang-owned Design Record protocol 管理，结构目标仍只纳入用户确认字段

### Section: Explore 主代理维护设计与实验边界

Explore main agent SHALL 可检查证据、运行查询、提问、比较方案、通过 CLI 维护中间设计记录，并委托 Experimenter 设计与执行必要可行性实验。记录遵守 pending 自主维护及用户独占确认权；实验不形成正式项目实现。主 Agent 不直接编写完整 Change，不修改正式模型或普通生成工作面。不得保留阻止实验的统一只读能力限制。

获取影响面时 SHALL 先用 arch search 选择 focus identities，再用 identity-only arch impact 获取 refinement、Relationships 与 canonical paths，最后 batch arch query 读取判断所需的完整 Definitions 与 Contracts。实现证据由代码工具获取，不能从 Relationship adjacency 自动推断必须修改，也不能从 identity、title 或残余上下文猜测未读语义。

生成的 Explore skill SHALL 明确记录维护、实验委托和正式实现之间的权限边界；需要完整 Change 时交 Propose。

可行性判断 SHALL 使用相关证据与推理，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

- **局部实验成功**：仅某接口能力得到验证时，使用该事实判断相关部分，不宣称整套方案已通过验证。
