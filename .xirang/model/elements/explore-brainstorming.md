---
entity: element-declaration
identity: explore-brainstorming
kind: element
parent: design-exploration
title: Explore Brainstorming
definition: Explore Brainstorming 定义 Explore 的只读设计澄清流程：6 步 brainstorming checklist、一次一问的提问纪律、2-3 方案对比、分段设计确认、Design Summary 生成、范围检查与拆解建议、捕获边界路由以及主代理只读边界。
---

## Requirements

### Requirement: Explore 必须执行 brainstorming checklist

Explore 阶段 SHALL 执行 6 步 brainstorming checklist，确保设计前置和需求澄清：探索项目上下文（evidence-first）、提供 visual companion（如果需要）、一次一问澄清需求、提出 2-3 个方案并对比权衡、分段呈现设计并逐段确认、生成 Design Summary。

#### Scenario: 完整 brainstorming 流程

- **WHEN** 用户调用 explore workflow
- **THEN** 系统按顺序执行 6 步 checklist
- **AND** 关于现有代码、架构或技术决策的所有声明必须基于项目证据，不得用通用知识替代项目事实

#### Scenario: 跳过 visual companion

- **WHEN** 用户的需求不涉及视觉内容
- **THEN** 系统跳过 visual companion 步骤，直接进入一次一问

### Requirement: 一次一问的提问纪律

系统 SHALL 每次只问一个问题，等待用户回答后再继续。

#### Scenario: 单个问题等待

- **WHEN** 系统需要澄清多个方面
- **THEN** 系统先问第一个问题，等待用户回答后再问第二个问题

#### Scenario: 优先多选题

- **WHEN** 问题有明确的几个选项
- **THEN** 系统以多选题形式提问，而非开放式问题

### Requirement: 2-3 方案对比

系统 SHALL 提出 2-3 个不同的技术方案并对比权衡；每个方案包含方案描述、优势、劣势、适用场景，并推荐其中一个方案且说明理由。

#### Scenario: 方案对比呈现

- **WHEN** 系统理解了需求并准备提出技术方案
- **THEN** 系统提出 2-3 个方案并对比权衡
- **THEN** 系统推荐其中一个方案并说明理由

#### Scenario: 用户选择方案

- **WHEN** 用户选择了某个方案或提出修改
- **THEN** 系统基于选定方案继续设计

#### Scenario: 方案对比时加入 ponytail 视角

- **WHEN** 系统呈现 2-3 个技术方案，且 ponytail ladder 判断某方案存在不必要的抽象、新依赖或已有平台能力可覆盖的实现
- **THEN** 系统 SHALL 用一行指出 ponytailladder 建议（如：「ponytail 说：这个抽象现在不需要，直接调 stdlib 够用。要换成这个吗？」）
- **AND** 系统 SHALL 等待用户确认后才调整方案
- **AND** 若无 ponytailladder 可简化项，系统 SHALL 自然跳过

### Requirement: 分段设计呈现

系统 SHALL 分段呈现并确认适用于当前问题的设计内容。复杂变更通常覆盖 architecture、core components、data flow、technology stack、testing strategy 与 risks/trade-offs；窄修改 MAY 省略明显不适用的章节，但 MUST 至少确认 problem、impact scope、approach 与 verification method。Testing Strategy SHALL 先应用共享测试品质（可重复隔离、锁行为不锁结构、单一失败原因，以及难测先改设计），再决定 reuse、modify、add、delete 或 one-time；SHALL NOT 按 Scenario 条数机械规划持久化测试。

#### Scenario: 逐段确认

- **WHEN** 系统准备呈现完整设计
- **THEN** 系统依次呈现并确认架构方案、核心组件、数据流、技术栈、测试策略、风险和权衡

#### Scenario: 窄修改压缩设计确认

- **WHEN** 当前问题不需要独立的组件、数据流或技术栈决策
- **THEN** 系统 MAY 省略这些不适用章节
- **AND** SHALL 仍分别确认 problem、impact scope、approach 与 verification method
- **AND** verification method SHALL 仍应用共享测试品质

#### Scenario: Testing Strategy 应用测试品质

- **WHEN** Testing Strategy 阶段呈现验证计划
- **THEN** 系统 SHALL 先说明要防止的可观察行为回归与现有覆盖
- **AND** SHALL 只在现有测试无法保护该行为时规划新增持久化测试
- **AND** SHALL 为每个新增边界说明它能捕获、现有测试捕获不到的缺陷

#### Scenario: Testing Strategy 按行为而非 Scenario 规划

- **WHEN** 一个 Requirement 含多个描述同一行为与同一失败原因的 Scenario
- **THEN** Testing Strategy SHALL 将它们规划为一条持久化测试或一个验证项
- **AND** SHALL NOT 为每个 Scenario 各规划一个测试文件

#### Scenario: Testing Strategy 阶段识别过时测试

- **WHEN** 设计涉及架构变更、API 重构、数据布局调整或行为删除
- **THEN** 系统 SHALL 读取相关测试并识别假设冲突、重复保护、结构耦合或弱断言测试
- **AND** 系统 SHALL 将它们分类为更新、删除或保留
- **AND** 若项目存在多个测试目录，系统 SHALL 确定权威测试套件

#### Scenario: Testing Strategy 阶段分类 persistent 与 one-time verification

- **WHEN** Testing Strategy 阶段呈现测试项
- **THEN** 系统 SHALL 将每个验证项分类为 persistent 或 one-time verification
- **AND** 对 one-time verification 项，系统 SHALL 不规划 persistent 测试文件
- **AND** 当存在 one-time verification 项时，系统 SHALL 在 Design Summary 的 Testing Strategy 下输出 `One-time Verification` 子节
- **AND** typecheck、build、一次性 grep 与纯制品文本核对 SHALL 归入 one-time，除非它们本身就是该行为的唯一可观察证据

#### Scenario: 用户要求修改

- **WHEN** 用户在某一段提出修改意见
- **THEN** 系统修改该段内容
- **THEN** 重新呈现修改后的内容，等待确认
- **THEN** 确认后继续下一段

#### Scenario: Test Maintenance 子节格式

- **WHEN** 现有测试需要更新、删除或被新测试替代
- **THEN** Testing Strategy SHALL 列出 reuse、modify、delete、add 与 one-time 项及原因
- **AND** SHALL 标注 authoritative suite

#### Scenario: 单方案中发现过度规格化

- **WHEN** 系统在讨论单个设计决策（如数据模型、API 设计、组件层次），且 ponytailladder 发现该设计引入了不必要的抽象、新依赖或已有平台能力可覆盖的实现
- **THEN** 系统 SHALL 用一行指出简化方式
- **AND** 系统在 ponytailladder 无特别发现时自然跳过，不强制输出

### Requirement: Design Summary 生成

Explore SHALL 在设计确认后生成 conversation-only Design Summary。复杂语义模型变更 SHALL 明确记录适用的 decisions；窄修改 SHALL 至少汇总 problem、impact scope、approach 与 verification method；natural-language prose SHALL 跟随用户语言，canonical tokens、paths 与 commands SHALL 保持 canonical。

#### Scenario: Semantic Model Design Summary

- **WHEN** 讨论涉及 Semantic Model structure
- **THEN** summary SHALL 使用 stable canonical terminology
- **AND** SHALL 区分 authored semantic content、derived views 与 implementation evidence
- **AND** MUST NOT 发明独立持久化 IR

#### Scenario: Design Summary 存储

- **WHEN** summary 完成
- **THEN** SHALL 保留在 conversation
- **AND** SHALL 由用户显式触发 propose

#### Scenario: 复杂变更的 Design Summary 格式

- **WHEN** complex change 的适用设计段落已确认
- **THEN** summary SHALL 包含 architecture、components、data flow、technology、testing 与 risks 中适用部分

#### Scenario: Design Summary 输出语言

- **WHEN** 用户主要使用非 English language
- **THEN** natural-language prose SHALL 跟随用户语言
- **AND** canonical tokens、paths 与 commands SHALL 保持 canonical

#### Scenario: 窄修改的 Design Summary 格式

- **WHEN** narrow change 不需要独立 components、data flow 或 technology decisions
- **THEN** SHALL 至少汇总 problem、impact scope、approach 与 verification method

### Requirement: 范围检查和拆解建议

系统 SHALL 在 explore 阶段检查范围，如果过大则建议拆分。

#### Scenario: 范围过大提示

- **WHEN** 用户描述的需求涉及多个独立子系统
- **THEN** 系统在探索项目上下文后提示"这个需求涉及多个独立子系统，建议拆分为多个变更"
- **THEN** 系统帮助用户识别独立子系统并建议实现顺序

#### Scenario: 拆分后继续

- **WHEN** 用户同意拆分并选择先实现某个子系统
- **THEN** 系统针对该子系统继续 brainstorming 流程

### Requirement: Explore 主代理保持只读

Explore main agent SHALL 对项目实现、Formal Semantic Model 以及普通项目或 Change artifacts 保持只读：可检查文件、搜索代码、运行只读 CLI、提问、比较方案并生成只存在于对话中的 Design Summary；SHALL NOT 直接创建、编辑、删除、格式化、重新生成或 patch 项目文件和 artifacts。唯一例外是用户对完整、明确 payload 作出单独持久化确认后，Agent MAY 调用 CLI-managed Definition Framing；该 CLI 操作只持久化 Change Structural Definition，不由 Agent 直接写入文件。除该例外外，Explore SHALL NOT 创建或更新任何项目或 Change artifacts。当 Explore 需要影响面发现时，main agent SHALL 先使用 `xirang arch search` 浏览 Formal Semantic Model 并选择一个或多个 focus Element identities，再使用 identity-only `xirang arch impact` 获取 refinement、Relationships 与 canonical paths，最后通过 batch `xirang arch query` 只读取判断所需 identities 的完整 Definitions 与 Contracts。

#### Scenario: Explore 不写入制品

- **WHEN** 对话已形成确定的设计方向
- **THEN** main explore agent SHALL 将结果保留在对话状态中
- **AND** SHALL 生成只存在于对话中的 `Design Summary`
- **AND** SHALL 在需要生成 artifacts 时指示用户调用 propose workflow
- **AND** 除用户明确确认完整 payload 后调用 CLI-managed Definition Framing 外，SHALL NOT 直接创建或更新项目或 Change artifacts

#### Scenario: Explore 直接获取 semantic impact context

- **WHEN** explore 需要定位新概念或确认 proposal readiness
- **THEN** main explore agent SHALL 使用 `xirang arch search` 定位候选 focus Element identities
- **AND** SHALL 使用 `xirang arch impact` 读取 Formal Semantic Model 的相关 identities、refinement context、Relationships 与 canonical paths
- **AND** SHALL 使用 batch `xirang arch query --contract --json` 读取所选 identities 的完整语义
- **AND** SHALL 使用独立代码工具获取 implementation evidence，并自行判断影响，不得把 Relationship adjacency 自动解释为修改结论

#### Scenario: Explore 不从 identity-only impact 猜测语义

- **WHEN** impact 返回相关 identity 但 Agent 不清楚其 Definition 或 Contract
- **THEN** Agent SHALL 重新 query 该 identity
- **AND** SHALL NOT 根据 title、identity、残余上下文或实现代码补全缺失语义

#### Scenario: Explore skill 声明只读阶段边界表格

- **WHEN** 生成 `xirang-explore` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `EXPLORE` 并说明为只读头脑风暴阶段
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止创建、编辑、删除任何文件或 artifact
- **AND** 表格 SHALL 位于 `## Required References` 等其他章节之前

### Requirement: 设计确认不是写入授权

Explore SHALL 将用户选择方案、确认设计段落等表达仅视为设计方向确认。

#### Scenario: 用户确认方案

- **WHEN** explore 呈现多个设计方案且用户选择一个方案或确认该段设计
- **THEN** main explore agent SHALL 基于该设计方向继续 explore flow
- **AND** SHALL NOT 将该确认视为修改文件或制品的授权

### Requirement: Explore 捕获边界保持 Contract 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 以 Semantic Model 分类 future capture target：Element Contract 变化进入宿主 Element 的 Contract，graph facts 进入 Semantic Delta，implementation decisions 进入 scaffolding；Explore 本身保持只读。

#### Scenario: Contract decision 进入宿主 Contract

- **WHEN** Explore 发现 element 的可验证 intent、guarantee、constraint、requirement 或 scenario 变化
- **THEN** SHALL 将 future capture target 分类为该 element 对应的 Contract
- **AND** SHALL 在 Design Summary 中记录稳定 identity 与 contract scope

#### Scenario: Graph decision 进入 Semantic Delta

- **WHEN** Explore 发现 Metamodel、element identity、containment、relationship 或 view 变化
- **THEN** SHALL 分类到 Semantic Delta
- **AND** SHALL 使用 abstraction/refinement 与 semantic relationship terminology

#### Scenario: Scaffolding decision 保持分离

- **WHEN** insight 是 motivation、scope、lowering decision、task 或 verification work
- **THEN** SHALL 分别路由到 proposal、design 或 tasks
- **AND** MUST NOT 将其写成 Element Contract

#### Scenario: 重构和实现决策进入 design

- **WHEN** Explore 形成 refactor rationale、rejected path 或 implementation strategy
- **THEN** SHALL 路由到 `design.md`
- **AND** MUST NOT 写入 Element Contract

#### Scenario: Explore 不写入模型

- **WHEN** future capture target 已确定
- **THEN** SHALL 只写入 conversation-only Design Summary
- **AND** SHALL 由 propose 或其他非 Explore workflow 生成 artifacts

#### Scenario: Contract decision 进入 owner Contract

- **WHEN** Explore 发现 element 的可验证 intent、guarantee、constraint、requirement 或 scenario 变化
- **THEN** SHALL 将 future capture target 记录为该 element 的 Contract scope（全局寻址 `<element identity>#<Requirement name>`，由 propose 写入 change `elements/` delta 单元）
- **AND** SHALL 在 Design Summary 中记录 stable `identity` 与 contract scope

#### Scenario: 其他 insight 路由到对应制品

- **WHEN** Explore 发现 scope、work、verification 或 graph intent change
- **THEN** SHALL 分别路由到 proposal、tasks 或 `Semantic Delta`
- **AND** Explore SHALL 保持只读

#### Scenario: 可观察行为进入 Contract

- **WHEN** Explore 发现 observable behavior contract 变化
- **THEN** SHALL 路由到 owner element 的 Contract（宿主 Element 单元）
- **AND** SHALL 记录 stable identity

#### Scenario: 过时测试的 future capture target

- **WHEN** architecture 或 contract change 使 existing tests 过时
- **THEN** concrete updates/removals SHALL 路由到 tasks
- **AND** rationale SHALL 路由到 design

### Requirement: Explore 通过 referenceFiles 暴露行为引导

`xirang-explore` SHALL 通过 `referenceFiles` 暴露行为引导手册，作为主 instructions 的权威行为展开版，并物化到 `.xirang/references/xirang-explore-supperpowers-style.md`。主 SKILL.md instructions SHALL 保留入口、只读边界、Required Context、Semantic Impact 与唯一 Brainstorming Checklist，并通过 Required References 指向该物化 reference；reference 内容 SHALL 将写 design doc、commit 等交接语义映射到 conversation-only Design Summary 与 propose workflow，不得暗示 Explore 可直接创建或更新 artifacts。

#### Scenario: explore 声明行为 reference

- **WHEN** explore skill 被生成
- **THEN** 返回对象 SHALL 包含 referenceFiles 数组
- **AND** 该数组 SHALL 包含 `.xirang/references/xirang-explore-supperpowers-style.md` 对应的 entry
- **AND** 主 instructions SHALL 使用“必须阅读”级措辞引用该 reference

#### Scenario: reference 保留设计前置纪律

- **WHEN** agent 读取该 reference
- **THEN** reference SHALL 明确在设计确认完成前不得实现
- **AND** SHALL 明确简单变更仍需要设计确认，最低集合为 problem、impact scope、approach 与 verification method
- **AND** SHALL 明确用户审查通过 Design Summary 后才能路由到 propose workflow

#### Scenario: reference 不重复主 instructions 机制

- **WHEN** 生成 reference 内容
- **THEN** SHALL NOT 包含 arch 查询编排协议或 future capture target 路由表
- **AND** SHALL 聚焦 brainstorming 行为纪律及其 Xirang 适配

#### Scenario: explore 声明 supperpowers-style reference

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill
- **THEN** 返回对象 SHALL 包含 `referenceFiles` 数组
- **AND** 该数组 SHALL 包含一项 `{ path: 'references/explore-supperpowers-style.md', ... }`
- **AND** 该 reference 内容 SHALL 覆盖 Superpowers hard gate、context exploration、just-in-time visual companion、one-question discipline、2-3 approaches、section-by-section design approval、Design Summary self-review、user review gate、xirang-propose handoff

#### Scenario: 主 instructions 保持精简并指向 reference

- **WHEN** 生成 explore 主 SKILL.md instructions
- **THEN** 主 instructions SHALL 保留只读边界、Semantic Impact、Brainstorming Checklist
- **AND** SHALL 包含指向 `.xirang/references/xirang-explore-supperpowers-style.md` 的 Required References 引用，且 SHALL 使用“必须阅读”级措辞
- **AND** SHALL 将该 reference 声明为 Superpowers 行为引导的权威来源，不在主 instructions 中重新构建该行为内容
- **AND** 主 SKILL.md SHALL 满足 ≤200 行限制

#### Scenario: reference 内容路由到 propose 而非直接写入

- **WHEN** reference 内容涉及 artifact 生成或更新
- **THEN** SHALL 使用 `xirang-propose` 逻辑 workflow 名称路由
- **AND** SHALL NOT 包含暗示 Explore 直接写入 artifact 或进入 implementation planning 的表述

#### Scenario: reference 保留 Superpowers 设计前置纪律

- **WHEN** agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
- **THEN** reference SHALL 明确在设计确认完成前不得实现
- **AND** SHALL 明确简单变更仍需要设计确认，但只确认适用章节，最低集合为 problem、impact scope、approach 与 verification method
- **AND** SHALL 明确用户审查通过 `Design Summary` 后才能路由到 `xirang-propose`

### Requirement: Explore 使用 todo 跟踪流程

`xirang-explore` SHALL 在 todo 工具可用时，把 Explore 阶段记录为 checklist 并在阶段完成时更新；该 checklist 只表示对话流程进度，不授权 main explore agent 创建、编辑或删除项目文件。

#### Scenario: 主 instructions 要求 todo 跟踪

- **WHEN** 系统生成 explore skill 内容
- **THEN** 主 instructions SHALL 声明在 todo 可用时，必须在读取 context 前创建唯一的 brainstorming checklist
- **AND** 主 instructions SHALL 要求随着阶段完成 tick 对应 checklist 项

#### Scenario: Todo checklist 不改变只读边界

- **WHEN** explore 使用 todo checklist 跟踪流程
- **THEN** checklist SHALL 只表示 explore 对话流程进度
- **AND** checklist SHALL NOT 授权 main explore agent 创建、编辑或删除项目文件

#### Scenario: Superpowers reference 要求 context 前建立 checklist

- **WHEN** agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
- **THEN** reference SHALL 要求在读取项目 context 前创建 todo checklist
- **AND** checklist SHALL 包含 context、visual decision、one question、options、section approvals、self-review 和 handoff 阶段

### Requirement: 仅在结构设计中应用项目拆分指导

Explore Brainstorming SHALL 在需求涉及新增或重组 Element hierarchy 时消费 normalized `decomposition`，并将其用于结构方案比较与 Design Summary；行为、实现或 Contract-only 讨论 SHALL NOT 因该配置被扩展为结构重组。对 `skill` 的调用仍属于只读设计辅助，SHALL NOT 放宽 Explore workflow stage 边界。

#### Scenario: 探索结构变化

- **WHEN** 用户意图会新增 Element、改变 parent 或重组 sibling set
- **THEN** Explore 在比较结构方案前使用配置的方法或调用配置的 skill
- **AND** 在 Design Summary 记录已确认的结构方向而不写入 Change artifacts

#### Scenario: 探索 Contract-only 变化

- **WHEN** 用户意图只改变既有 Element Contract 或实现方式
- **THEN** Explore 不调用自定义拆分 skill
- **AND** 不因默认 C4 产生额外 Architecture Source

#### Scenario: custom skill 请求写入

- **WHEN** decomposition skill 的指令与 Explore 只读边界冲突或要求未经确认持久化
- **THEN** 主 Explore Agent 保持只读并忽略冲突指令
- **AND** 只有 Xirang-owned Definition Framing protocol 可在独立确认后持久化结构中间态
