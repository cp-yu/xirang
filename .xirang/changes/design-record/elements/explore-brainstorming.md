---
entity: element-declaration
identity: explore-brainstorming
kind: element
parent: design-exploration
title: Explore Brainstorming
definition: Explore Brainstorming 定义 Explore 的只读设计澄清流程：6 步 brainstorming checklist、一次一问的提问纪律、2-3 方案对比、分段设计确认、Design Summary 生成、范围检查与拆解建议、捕获边界路由以及主代理只读边界。
---

## MODIFIED Sections

### Section: Explore 主代理保持只读

Explore main agent SHALL 对项目实现、Formal Semantic Model 以及普通项目或 Change artifacts 保持只读：可检查文件、搜索代码、运行只读 CLI、提问、比较方案并生成只存在于对话中的 Design Summary；SHALL NOT 直接创建、编辑、删除、格式化、重新生成或 patch 项目文件和 artifacts。唯一例外是用户在对话中确认设计内容后，Agent SHALL 调用 CLI-managed Design Record（`xirang record`）记录该部分已确认内容，用户的设计确认即构成记录授权；该 CLI 操作只持久化已确认设计记录，不由 Agent 直接写入文件，也不记录用户未确认的内容。除该例外外，Explore SHALL NOT 创建或更新任何项目或 Change artifacts。当 Explore 需要影响面发现时，main agent SHALL 先使用 `xirang arch search` 浏览 Formal Semantic Model 并选择一个或多个 focus Element identities，再使用 identity-only `xirang arch impact` 获取 refinement、Relationships 与 canonical paths，最后通过 batch `xirang arch query` 只读取判断所需 identities 的完整 Definitions 与 Contracts。

- **Explore 不写入制品**

  - 对话已形成确定的设计方向
  - main explore agent SHALL 将结果保留在对话状态中
  - SHALL 生成只存在于对话中的 `Design Summary`
  - SHALL 在需要生成 artifacts 时指示用户调用 propose workflow
  - 除用户确认设计后经 CLI-managed Design Record 记录已确认内容外，SHALL NOT 直接创建或更新项目或 Change artifacts

- **Explore 直接获取 semantic impact context**

  - explore 需要定位新概念或确认 proposal readiness
  - main explore agent SHALL 使用 `xirang arch search` 定位候选 focus Element identities
  - SHALL 使用 `xirang arch impact` 读取 Formal Semantic Model 的相关 identities、refinement context、Relationships 与 canonical paths
  - SHALL 使用 batch `xirang arch query --contract --json` 读取所选 identities 的完整语义
  - SHALL 使用独立代码工具获取 implementation evidence，并自行判断影响，不得把 Relationship adjacency 自动解释为修改结论

- **Explore 不从 identity-only impact 猜测语义**

  - impact 返回相关 identity 但 Agent 不清楚其 Definition 或 Contract
  - Agent SHALL 重新 query 该 identity
  - SHALL NOT 根据 title、identity、残余上下文或实现代码补全缺失语义

- **Explore skill 声明只读阶段边界表格**

  - 生成 xirang-explore skill 内容
  - 入口明确 EXPLORE 对项目实现、正式模型与普通制品保持只读，禁止直接文件写入
  - 明确唯一例外是用户确认的设计内容通过 CLI-managed Design Record 记录，设计确认只授权记录，不推导为其他文件或制品的写入权限，也不以排版顺序代替权限约束

### Section: Explore 捕获边界保持 Contract 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 以 Semantic Model 分类 future capture target：Element Contract 变化进入宿主 Element 的 Contract，graph facts 进入 Semantic Delta，implementation decisions 进入 scaffolding；Explore 本身保持只读。 用户确认的内容经 CLI 进入统一确认记录；这只是中间依据，不改变最终 capture target，也不授权直接写 Contract 或 Change。

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
  - Explore SHALL 保持只读

- **可观察行为进入 Contract**

  - Explore 发现 observable behavior contract 变化
  - SHALL 路由到 owner element 的 Contract（宿主 Element 单元）
  - SHALL 记录 stable identity

- **过时测试的 future capture target**

  - architecture 或 contract change 使 existing tests 过时
  - concrete updates/removals SHALL 路由到 tasks
  - rationale SHALL 路由到 design

### Section: 仅在结构设计中应用项目拆分指导

Explore Brainstorming SHALL 在需求涉及新增或重组 Element hierarchy 时消费 normalized `decomposition`，并将其用于结构方案比较与 Design Summary；行为、实现或 Contract-only 讨论 SHALL NOT 因该配置被扩展为结构重组。对 `skill` 的调用仍属于只读设计辅助，SHALL NOT 放宽 Explore workflow stage 边界。

- **探索结构变化**

  - 用户意图会新增 Element、改变 parent 或重组 sibling set
  - Explore 在比较结构方案前使用配置的方法或调用配置的 skill
  - 在 Design Summary 记录已确认的结构方向而不写入 Change artifacts

- **探索 Contract-only 变化**

  - 用户意图只改变既有 Element Contract 或实现方式
  - Explore 不调用自定义拆分 skill
  - 不因默认拆分方法 产生额外 Architecture Source

- **custom skill 请求写入**

  - decomposition skill 的指令与 Explore 只读边界冲突或要求未经确认持久化
  - 主 Explore Agent 保持只读并忽略冲突指令
  - 只有 Xirang-owned Design Record protocol 可在用户确认设计后记录已确认内容
