---
operation: MODIFIED
entity: element-declaration
identity: explore-brainstorming
kind: "element"
parent: "design-exploration"
title: "Explore Brainstorming"
definition: "Explore Brainstorming 定义 Explore 的设计澄清流程：通过项目证据、一次一问、方案比较和分段确认完善中间设计，委托必要的可行性实验并维护设计记录，交付 Design Summary。它不承担完整 Change 成文或正式项目实现。"
---

## ADDED Sections

### Section: Explore 主代理维护设计与实验边界

Explore main agent SHALL 可检查证据、运行查询、提问、比较方案、通过 CLI 维护中间设计记录，并委托 Experimenter 设计与执行必要可行性实验。记录遵守 pending 自主维护及用户独占确认权；实验不形成正式项目实现。主 Agent 不直接编写完整 Change，不修改正式模型或普通生成工作面。不得保留阻止实验的统一只读能力限制。

获取影响面时 SHALL 先用 arch search 选择 focus identities，再用 identity-only arch impact 获取 refinement、Relationships 与 canonical paths，最后 batch arch query 读取判断所需的完整 Definitions 与 Contracts。实现证据由代码工具获取，不能从 Relationship adjacency 自动推断必须修改，也不能从 identity、title 或残余上下文猜测未读语义。

生成的 Explore skill SHALL 明确记录维护、实验委托和正式实现之间的权限边界；需要完整 Change 时交 Propose。

## MODIFIED Sections

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

## REMOVED Sections

### Section: Explore 主代理保持只读
