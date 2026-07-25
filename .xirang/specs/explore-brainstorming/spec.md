---
element: cap.ai.explore-brainstorming
---

# explore-brainstorming Specification

## Purpose
定义 Explore 的只读设计澄清流程，使 Agent 基于项目证据完成范围识别、方案比较、适用设计章节确认、影响面发现和 conversation-only `Design Summary`，再由用户显式进入后续 workflow。
## Requirements
### Requirement: Explore 必须执行 brainstorming checklist

Explore 阶段 SHALL 执行 6 步 brainstorming checklist，确保设计前置和需求澄清。

#### Scenario: 完整 brainstorming 流程

- **WHEN** 用户调用 `/xirang:explore <idea>`
- **THEN** 系统按顺序执行以下步骤：
  1. 探索项目上下文（读取相关文件、git 历史），并遵循 evidence-first discipline：关于现有代码、架构或技术决策的所有声明必须基于项目证据，不得用通用知识替代项目事实
  2. 提供 visual companion（如果需要）
  3. 一次一问澄清需求
  4. 提出 2-3 个方案并对比权衡
  5. 分段呈现设计并逐段确认
  6. 生成 Design Summary

#### Scenario: 跳过 visual companion

- **WHEN** 用户的需求不涉及视觉内容（如后端 API、数据处理）
- **THEN** 系统跳过步骤 2，直接进入步骤 3

### Requirement: 一次一问的提问纪律

系统 SHALL 每次只问一个问题，等待用户回答后再继续。

#### Scenario: 单个问题等待

- **WHEN** 系统需要澄清多个方面（如技术栈、数据模型、API 设计）
- **THEN** 系统先问第一个问题，等待用户回答
- **THEN** 收到回答后，再问第二个问题

#### Scenario: 优先多选题

- **WHEN** 问题有明确的几个选项（如数据库选择：PostgreSQL / MySQL / SQLite）
- **THEN** 系统以多选题形式提问，而非开放式问题

### Requirement: 2-3 方案对比

系统 SHALL 提出 2-3 个不同的技术方案，并对比权衡。系统 SHALL 融入 ponytail-lite 意识：在方案对比时，若 ponytail 6-rung ladder 判断某方案可进一步精简，用一行指出替代方案。

#### Scenario: 方案对比呈现

- **WHEN** 系统理解了需求，准备提出技术方案
- **THEN** 系统提出 2-3 个方案
- **THEN** 每个方案包含：方案描述、优势、劣势、适用场景
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

系统 SHALL 分段呈现并确认适用于当前问题的设计内容。复杂变更通常覆盖 architecture、core components、data flow、technology stack、testing strategy 与 risks/trade-offs；窄修改 MAY 省略明显不适用的章节，但 MUST 至少确认 problem、impact scope、approach 与 verification method。系统 SHALL 在单方案讨论中发现过度规格化时，用一行指出更简单的替代方式。在 Testing Strategy 阶段，当架构变更影响现有测试时，系统 SHALL 识别过时测试（更新/删除/新增）、确定权威测试套件位置，并在 Design Summary 中记录。在 Testing Strategy 阶段，系统 SHALL 将每个测试项分类为 persistent 或 one-time verification。

#### Scenario: 逐段确认

- **WHEN** 系统准备呈现完整设计
- **THEN** 系统先呈现架构方案，询问"这个方向对吗？"
- **THEN** 用户确认后，呈现核心组件，询问"组件划分合理吗？"
- **THEN** 用户确认后，呈现数据流，询问"数据流清晰吗？"
- **THEN** 依次呈现技术栈、测试策略、风险和权衡

#### Scenario: 用户要求修改

- **WHEN** 用户在某一段提出修改意见
- **THEN** 系统修改该段内容
- **THEN** 重新呈现修改后的内容，等待确认
- **THEN** 确认后继续下一段

#### Scenario: 窄修改压缩设计确认

- **WHEN** 当前问题不需要独立的组件、数据流或技术栈决策
- **THEN** 系统 MAY 省略这些不适用章节
- **AND** SHALL 仍分别确认 problem、impact scope、approach 与 verification method
- **AND** SHALL NOT 将流程压缩解释为实现授权

#### Scenario: 单方案中发现过度规格化

- **WHEN** 系统在讨论单个设计决策（如数据模型、API 设计、组件层次），且 ponytailladder 发现该设计引入了不必要的抽象、新依赖或已有平台能力可覆盖的实现
- **THEN** 系统 SHALL 用一行指出简化方式
- **AND** 系统在 ponytailladder 无特别发现时自然跳过，不强制输出

#### Scenario: Testing Strategy 阶段识别过时测试

- **WHEN** 设计涉及架构变更、API 重构或数据布局调整
- **THEN** 系统 SHALL 读取相关测试文件并识别假设与新设计冲突的测试
- **AND** 系统 SHALL 将过时测试分类为更新（断言适配新 API）、删除（行为已废弃）、新增（缺少覆盖）
- **AND** 若项目存在多个测试目录，系统 SHALL 确定哪个测试套件是反映当前契约的权威套件

#### Scenario: Testing Strategy 阶段分类 persistent 与 one-time verification

- **WHEN** Testing Strategy 阶段呈现测试项
- **THEN** 系统 SHALL 将每个测试项分类为 persistent 或 one-time verification
- **AND** 对 one-time verification 项，系统 SHALL 不规划 persistent 测试文件
- **AND** 当存在 one-time verification 项时，系统 SHALL 在 Design Summary 的 Testing Strategy 下输出 `One-time Verification` 子节

### Requirement: Design Summary 生成

Explore SHALL 在设计确认后生成 conversation-only Design Summary，复杂语义模型变更 SHALL 明确记录 Project Root、Metamodel、elements、refinement、contracts、relationships、views、migration、testing 与 risks 中适用的 decisions。

#### Scenario: Semantic Model Design Summary
- **WHEN** 讨论涉及 OPSX Semantic Model structure
- **THEN** summary SHALL 使用 stable canonical terminology
- **AND** SHALL 区分 authored semantic content、derived views 与 implementation evidence
- **AND** MUST NOT 发明独立持久化 IR

#### Scenario: 复杂变更的 Design Summary 格式
- **WHEN** complex change 的适用设计段落已确认
- **THEN** summary SHALL 包含 architecture、components、data flow、technology、testing 与 risks 中适用部分

#### Scenario: 窄修改的 Design Summary 格式
- **WHEN** narrow change 不需要独立 components、data flow 或 technology decisions
- **THEN** SHALL 至少汇总 problem、impact scope、approach 与 verification method

#### Scenario: Design Summary 输出语言
- **WHEN** 用户主要使用非 English language
- **THEN** natural-language prose SHALL 跟随用户语言
- **AND** canonical tokens、paths 与 commands SHALL 保持 canonical

#### Scenario: Design Summary 存储
- **WHEN** summary 完成
- **THEN** SHALL 保留在 conversation
- **AND** SHALL 由用户显式触发 propose

#### Scenario: Test Maintenance 子节格式
- **WHEN** architecture 或 API change 影响 existing tests
- **THEN** Testing Strategy SHALL 列出待更新、删除与新增 tests 及原因
- **AND** SHALL 标注 authoritative suite 与 one-time verification

### Requirement: 范围检查和拆解建议

系统 SHALL 在 explore 阶段检查范围，如果过大则建议拆分。

#### Scenario: 范围过大提示

- **WHEN** 用户描述的需求涉及多个独立子系统
- **THEN** 系统在步骤 1（探索项目上下文）后立即提示："这个需求涉及多个独立子系统，建议拆分为多个变更。"
- **THEN** 系统帮助用户识别独立子系统
- **THEN** 系统建议实现顺序

#### Scenario: 拆分后继续

- **WHEN** 用户同意拆分并选择先实现某个子系统
- **THEN** 系统针对该子系统继续 brainstorming 流程
- **THEN** 其他子系统留待后续变更

### Requirement: Explore 捕获边界保持 specs 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 以 OPSX Semantic Model 分类 future capture target。Element Contract 变化进入 owner Spec，graph facts 进入 `architecture-delta.c4`，implementation decisions 进入 scaffolding；Explore 本身保持只读。Spec 的 typed schema MAY 表达 behavior、parent guarantees、data schema 或其他 element-kind contract，不再仅限 capability behavior。

#### Scenario: Contract decision 进入 owner Specs
- **WHEN** Explore 发现 element 的可验证 intent、guarantee、constraint、requirement 或 scenario 变化
- **THEN** SHALL 将 future capture target 分类为该 element 对应的 `specs/<spec-id>/spec.md`
- **AND** SHALL 在 Design Summary 中记录 stable `elementId` 与 contract scope

#### Scenario: Graph decision 进入 architecture delta
- **WHEN** Explore 发现 Metamodel、element identity、summary、containment、relationship 或 view 变化
- **THEN** SHALL 分类到 `architecture-delta.c4`
- **AND** SHALL 使用 abstraction/refinement 与 semantic relationship terminology

#### Scenario: Scaffolding decision 保持分离
- **WHEN** insight 是 motivation、scope、lowering decision、task 或 verification work
- **THEN** SHALL 分别路由到 proposal、design 或 tasks
- **AND** MUST NOT 将其写成 Element Contract

#### Scenario: Explore 不写入模型
- **WHEN** future capture target 已确定
- **THEN** SHALL 只写入 conversation-only Design Summary
- **AND** SHALL 由 propose 或其他非 Explore workflow 生成 artifacts

#### Scenario: 可观察行为进入 specs
- **WHEN** Explore 发现 observable behavior contract 变化
- **THEN** SHALL 路由到 owner element 的 Spec
- **AND** SHALL 记录 stable elementId

#### Scenario: 重构和实现决策进入 design
- **WHEN** Explore 形成 refactor rationale、rejected path 或 implementation strategy
- **THEN** SHALL 路由到 `design.md`
- **AND** MUST NOT 写入 Element Contract

#### Scenario: 其他 insight 路由到对应制品
- **WHEN** Explore 发现 scope、work、verification 或 graph intent change
- **THEN** SHALL 分别路由到 proposal、tasks 或 `architecture-delta.c4`
- **AND** Explore SHALL 保持只读

#### Scenario: 过时测试的 future capture target
- **WHEN** architecture 或 contract change 使 existing tests 过时
- **THEN** concrete updates/removals SHALL 路由到 tasks
- **AND** rationale SHALL 路由到 design

### Requirement: Explore 主代理保持只读

Explore main agent SHALL 保持只读。生成的 explore skill 内容 SHALL 在正文开头通过 `## Workflow Stage` 表格声明只读边界，包含 Stage、Allowed、Forbidden 三行。它 SHALL 检查文件、搜索代码、运行只读 OPSX 上下文命令、提问、比较方案、解释影响面报告，并生成只存在于对话中的 `Design Summary`；它 SHALL NOT 创建、编辑、删除、格式化、重新生成或 patch 项目文件和 OPSX 制品。

#### Scenario: Explore 不写入制品

- **WHEN** 用户调用 `xirang-explore`
- **AND** 对话已形成确定的设计方向
- **THEN** main explore agent SHALL 将结果保留在对话状态中
- **AND** SHALL 生成只存在于对话中的 `Design Summary`
- **AND** SHALL 在需要生成制品时指示用户调用 `/xirang:propose <change-name>`

#### Scenario: Impact sweeper 保持只读

- **WHEN** explore 需要影响面发现
- **THEN** main explore agent SHALL delegate to the named `opsx-impact-sweeper` agent
- **AND** SHALL 传入 `projectRoot`、`concept`、可选 `optionalChangeName`、可选 `knownUserTerms` 与可选 `focus`
- **AND** sweeper SHALL 直接返回 canonical JSON report
- **AND** main explore agent SHALL 直接解释该返回对象
- **AND** main explore agent 与 sweeper SHALL NOT 写入项目文件
- **AND** 委托失败或未返回可用对象时，main explore agent SHALL 暴露 evidence gap，且 MUST NOT 猜测缺失的影响证据

#### Scenario: Explore skill 声明只读阶段边界表格

- **WHEN** 生成 `xirang-explore` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `EXPLORE` 并说明为只读头脑风暴阶段
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止创建、编辑、删除任何文件或制品
- **AND** 表格 SHALL 位于 `## Required References` 等其他章节之前

### Requirement: 设计确认不是写入授权

Explore SHALL 将用户选择方案、确认设计段落，或说出 "可以"、"就这样"、"选 2"、"拆成多个文件" 等表达，仅视为设计方向确认。

#### Scenario: 用户确认方案

- **WHEN** explore 呈现多个设计方案
- **AND** 用户选择一个方案或确认该段设计
- **THEN** main explore agent SHALL 基于该设计方向继续 explore flow
- **AND** SHALL NOT 将该确认视为修改文件或制品的授权

### Requirement: Explore 通过 referenceFiles 暴露 superpowers 行为引导

`xirang-explore` SHALL 通过 `referenceFiles` 暴露 Superpowers 风格的行为引导手册，作为主 instructions 的权威行为展开版。reference 内容 SHALL 以原始 Superpowers `brainstorming` skill 的设计前置纪律为行为来源，并适配 OPSX explore 的只读边界和 `xirang-propose` 路由。

reference 内容 SHALL 覆盖：实现前 hard gate、项目上下文探索、just-in-time visual companion 判断、一次一问、2-3 方案对比、分段设计确认、conversation-only `Design Summary`、Design Summary 自检、用户审查 gate、以及进入 `xirang-propose` 的交接。reference 内容 SHALL 将 Superpowers 的写 design doc、commit、user review、writing-plans 交接语义映射到 OPSX 的 conversation-only `Design Summary` 和 `xirang-propose` workflow，不得暗示 explore 可直接创建或更新制品。

reference 内容 SHALL 与只读边界、sweeper 委托、Design Summary 路由机制保持一致：不得包含暗示 explore 可直接创建或更新制品的措辞，所有制品生成 SHALL 以工具中立的 `xirang-propose` workflow 名称表达路由。reference SHALL NOT 包含 `/xirang:` 或 `$opsx-` 等工具特定调用语法；reference SHALL NOT 重复 sweeper 委托协议或 Future Capture Target 路由表（这些归主 instructions 与既有 requirement）。reference MAY 概述 brainstorming checklist，但 MUST NOT 复制主 instructions 的 OPSX/sweeper 机制内容。

reference 文件 SHALL 声明为 `references/explore-supperpowers-style.md` 并物化到 `.xirang/references/xirang-explore-supperpowers-style.md`，满足 `skill-template-length-check` 的 ≤500 行限制。主 SKILL.md instructions SHALL 保留入口、只读边界、Impact Sweeps、Brainstorming Checklist，并通过 Required References 指向该物化 reference；主 instructions SHALL NOT 重新构建 Superpowers 行为内容。

#### Scenario: explore 声明 supperpowers-style reference

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill
- **THEN** 返回对象 SHALL 包含 `referenceFiles` 数组
- **AND** 该数组 SHALL 包含一项 `{ path: 'references/explore-supperpowers-style.md', ... }`
- **AND** 该 reference 内容 SHALL 覆盖 Superpowers hard gate、context exploration、just-in-time visual companion、one-question discipline、2-3 approaches、section-by-section design approval、Design Summary self-review、user review gate、opsx-propose handoff

#### Scenario: reference 内容路由到 propose 而非直接写入

- **WHEN** reference 内容涉及制品生成或更新
- **THEN** SHALL 使用 `xirang-propose` 逻辑 workflow 名称路由
- **AND** SHALL NOT 包含"Want me to create a proposal"、"I can create a change proposal"、"Updated design.md"、"write design doc"、"commit the design document"、"invoke writing-plans" 等暗示 explore 直接写入制品或进入实现计划的表述

#### Scenario: reference 保留 Superpowers 设计前置纪律

- **WHEN** agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
- **THEN** reference SHALL 明确在设计确认完成前不得实现
- **AND** SHALL 明确简单变更仍需要设计确认，但只确认适用章节，最低集合为 problem、impact scope、approach 与 verification method
- **AND** SHALL 明确用户审查通过 `Design Summary` 后才能路由到 `xirang-propose`

#### Scenario: reference 不重复主 instructions 机制

- **WHEN** 生成 reference 内容
- **THEN** SHALL NOT 包含 sweeper 委托协议或 Future Capture Target 路由表
- **AND** SHALL 聚焦 Superpowers brainstorming 行为纪律及其 OPSX 适配

#### Scenario: 主 instructions 保持精简并指向 reference

- **WHEN** 生成 explore 主 SKILL.md instructions
- **THEN** 主 instructions SHALL 保留只读边界、Impact Sweeps、Brainstorming Checklist
- **AND** SHALL 包含指向 `.xirang/references/xirang-explore-supperpowers-style.md` 的 Required References 引用，且 SHALL 使用"必须阅读"级措辞
- **AND** SHALL 将该 reference 声明为 Superpowers 行为引导的权威来源，不在主 instructions 中重新构建该行为内容
- **AND** 主 SKILL.md SHALL 满足 ≤200 行限制

### Requirement: Explore 使用 todo 跟踪流程

`xirang-explore` SHALL 在 todo 工具可用时，把 Superpowers explore 阶段记录为 checklist，并在阶段完成时更新 checklist。该 checklist SHALL 覆盖 context exploration、visual companion decision、one-question clarification、options comparison、section-by-section approval、Design Summary self-review 和 propose handoff。

#### Scenario: 主 instructions 要求 todo 跟踪

- **WHEN** 系统生成 `xirang-explore` skill 内容
- **THEN** 主 instructions SHALL 声明在 todo 可用时，必须在读取 context 前创建唯一的 brainstorming checklist
- **AND** 主 instructions SHALL 要求随着阶段完成 tick 对应 checklist 项

#### Scenario: Superpowers reference 要求 context 前建立 checklist

- **WHEN** agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
- **THEN** reference SHALL 要求在读取项目 context 前创建 todo checklist
- **AND** checklist SHALL 包含 context、visual decision、one question、options、section approvals、self-review 和 handoff 阶段

#### Scenario: Todo checklist 不改变只读边界

- **WHEN** explore 使用 todo checklist 跟踪流程
- **THEN** checklist SHALL 只表示 explore 对话流程进度
- **AND** checklist SHALL NOT 授权 main explore agent 创建、编辑或删除项目文件或 OPSX 制品
