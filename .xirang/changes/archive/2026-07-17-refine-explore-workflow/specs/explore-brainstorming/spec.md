## MODIFIED Requirements

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

系统 SHALL 在设计确认后生成结构化的 Design Summary，汇总已确认且适用于当前问题的章节。复杂变更通常包含 architecture、core components、data flow、technology stack、testing strategy 与 risks/trade-offs；窄修改 MUST 至少包含 problem、impact scope、approach 与 verification method。当识别到过时测试时，Testing Strategy 部分 SHALL 包含 Test Maintenance 子节。

#### Scenario: 复杂变更的 Design Summary 格式

- **WHEN** 复杂变更的所有适用设计段落都确认完成
- **THEN** 系统生成 Design Summary，通常包含以下部分：
  - 架构方案（选定的方案 + 理由）
  - 核心组件（组件列表 + 职责 + 接口）
  - 数据流（关键数据流描述）
  - 技术栈（具体技术选择）
  - 测试策略（单元测试 + 集成测试覆盖范围；当架构变更影响现有测试时，包含 Test Maintenance 子节）
  - 风险和权衡（已知风险 + 缓解措施）

#### Scenario: 窄修改的 Design Summary 格式

- **WHEN** 窄修改不存在独立的组件、数据流或技术栈决策
- **THEN** 系统 SHALL 省略没有决策内容的章节
- **AND** Design Summary SHALL 至少汇总 problem、impact scope、approach 与 verification method

#### Scenario: Design Summary 输出语言

- **WHEN** 用户主要使用非英语交流
- **THEN** Design Summary 的自然语言 prose 和非 canonical 小节标题 SHALL 跟随用户主要交流语言
- **AND** commands、paths、artifact names、schema keys 和 OpenSpec tokens SHALL 保持 canonical

#### Scenario: Design Summary 存储

- **WHEN** Design Summary 生成完成
- **THEN** 系统将其存储在对话上下文中（不写入文件）
- **AND** 系统 SHALL 在对话中先行呈现 Design Summary 内容
- **THEN** 系统在同一个消息末尾附上："Design Summary complete. Review the above design. If confirmed, call `/opsx:propose <change-name>` generate artifacts."
- **AND** 在此消息后系统 SHALL STOP，不主动提供任何工作流运行、不提出任何追问
- **AND** 只有用户能触发下一个工作流

#### Scenario: Test Maintenance 子节格式

- **WHEN** Design Summary 包含过时测试信息
- **THEN** Testing Strategy 部分 SHALL 包含 "Test Maintenance" 子节
- **AND** 该子节 SHALL 列出待删除测试及原因、待更新测试及原因
- **AND** 若存在权威测试套件，SHALL 注明其位置和通过用例数
- **AND** 若变更不影响现有测试假设，SHALL 省略此子节

### Requirement: Explore 主代理保持只读

Explore main agent SHALL 保持只读。生成的 explore skill 内容 SHALL 在正文开头通过 `## Workflow Stage` 表格声明只读边界，包含 Stage、Allowed、Forbidden 三行。它 SHALL 检查文件、搜索代码、运行只读 OpenSpec 上下文命令、提问、比较方案、解释影响面报告，并生成只存在于对话中的 `Design Summary`；它 SHALL NOT 创建、编辑、删除、格式化、重新生成或 patch 项目文件和 OpenSpec 制品。

#### Scenario: Explore 不写入制品

- **WHEN** 用户调用 `openspec-explore`
- **AND** 对话已形成确定的设计方向
- **THEN** main explore agent SHALL 将结果保留在对话状态中
- **AND** SHALL 生成只存在于对话中的 `Design Summary`
- **AND** SHALL 在需要生成制品时指示用户调用 `/opsx:propose <change-name>`

#### Scenario: Impact sweeper 保持只读

- **WHEN** explore 需要影响面发现
- **THEN** main explore agent SHALL delegate to the named `openspec-impact-sweeper` agent
- **AND** SHALL 传入 `projectRoot`、`concept`、可选 `optionalChangeName`、可选 `knownUserTerms` 与可选 `focus`
- **AND** sweeper SHALL 直接返回 canonical JSON report
- **AND** main explore agent SHALL 直接解释该返回对象
- **AND** main explore agent 与 sweeper SHALL NOT 写入项目文件
- **AND** 委托失败或未返回可用对象时，main explore agent SHALL 暴露 evidence gap，且 MUST NOT 猜测缺失的影响证据

#### Scenario: Explore skill 声明只读阶段边界表格

- **WHEN** 生成 `openspec-explore` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `EXPLORE` 并说明为只读头脑风暴阶段
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止创建、编辑、删除任何文件或制品
- **AND** 表格 SHALL 位于 `## Required References` 等其他章节之前

### Requirement: Explore 通过 referenceFiles 暴露 superpowers 行为引导

`openspec-explore` SHALL 通过 `referenceFiles` 暴露 Superpowers 风格的行为引导手册，作为主 instructions 的权威行为展开版。reference 内容 SHALL 以原始 Superpowers `brainstorming` skill 的设计前置纪律为行为来源，并适配 OpenSpec explore 的只读边界和 `openspec-propose` 路由。

reference 内容 SHALL 覆盖：实现前 hard gate、项目上下文探索、just-in-time visual companion 判断、一次一问、2-3 方案对比、分段设计确认、conversation-only `Design Summary`、Design Summary 自检、用户审查 gate、以及进入 `openspec-propose` 的交接。reference 内容 SHALL 将 Superpowers 的写 design doc、commit、user review、writing-plans 交接语义映射到 OpenSpec 的 conversation-only `Design Summary` 和 `openspec-propose` workflow，不得暗示 explore 可直接创建或更新制品。

reference 内容 SHALL 与只读边界、sweeper 委托、Design Summary 路由机制保持一致：不得包含暗示 explore 可直接创建或更新制品的措辞，所有制品生成 SHALL 以工具中立的 `openspec-propose` workflow 名称表达路由。reference SHALL NOT 包含 `/opsx:` 或 `$openspec-` 等工具特定调用语法；reference SHALL NOT 重复 sweeper 委托协议或 Future Capture Target 路由表（这些归主 instructions 与既有 requirement）。reference MAY 概述 brainstorming checklist，但 MUST NOT 复制主 instructions 的 OPSX/sweeper 机制内容。

reference 文件 SHALL 声明为 `references/explore-supperpowers-style.md` 并物化到 `openspec/references/openspec-explore-supperpowers-style.md`，满足 `skill-template-length-check` 的 ≤500 行限制。主 SKILL.md instructions SHALL 保留入口、只读边界、Impact Sweeps、Brainstorming Checklist，并通过 Required References 指向该物化 reference；主 instructions SHALL NOT 重新构建 Superpowers 行为内容。

#### Scenario: explore 声明 supperpowers-style reference

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill
- **THEN** 返回对象 SHALL 包含 `referenceFiles` 数组
- **AND** 该数组 SHALL 包含一项 `{ path: 'references/explore-supperpowers-style.md', ... }`
- **AND** 该 reference 内容 SHALL 覆盖 Superpowers hard gate、context exploration、just-in-time visual companion、one-question discipline、2-3 approaches、section-by-section design approval、Design Summary self-review、user review gate、openspec-propose handoff

#### Scenario: reference 内容路由到 propose 而非直接写入

- **WHEN** reference 内容涉及制品生成或更新
- **THEN** SHALL 使用 `openspec-propose` 逻辑 workflow 名称路由
- **AND** SHALL NOT 包含"Want me to create a proposal"、"I can create a change proposal"、"Updated design.md"、"write design doc"、"commit the design document"、"invoke writing-plans" 等暗示 explore 直接写入制品或进入实现计划的表述

#### Scenario: reference 保留 Superpowers 设计前置纪律

- **WHEN** agent 读取 `openspec/references/openspec-explore-supperpowers-style.md`
- **THEN** reference SHALL 明确在设计确认完成前不得实现
- **AND** SHALL 明确简单变更仍需要设计确认，但只确认适用章节，最低集合为 problem、impact scope、approach 与 verification method
- **AND** SHALL 明确用户审查通过 `Design Summary` 后才能路由到 `openspec-propose`

#### Scenario: reference 不重复主 instructions 机制

- **WHEN** 生成 reference 内容
- **THEN** SHALL NOT 包含 sweeper 委托协议或 Future Capture Target 路由表
- **AND** SHALL 聚焦 Superpowers brainstorming 行为纪律及其 OpenSpec 适配

#### Scenario: 主 instructions 保持精简并指向 reference

- **WHEN** 生成 explore 主 SKILL.md instructions
- **THEN** 主 instructions SHALL 保留只读边界、Impact Sweeps、Brainstorming Checklist
- **AND** SHALL 包含指向 `openspec/references/openspec-explore-supperpowers-style.md` 的 Required References 引用，且 SHALL 使用"必须阅读"级措辞
- **AND** SHALL 将该 reference 声明为 Superpowers 行为引导的权威来源，不在主 instructions 中重新构建该行为内容
- **AND** 主 SKILL.md SHALL 满足 ≤200 行限制

### Requirement: Explore 使用 todo 跟踪流程

`openspec-explore` SHALL 在 todo 工具可用时，把 Superpowers explore 阶段记录为 checklist，并在阶段完成时更新 checklist。该 checklist SHALL 覆盖 context exploration、visual companion decision、one-question clarification、options comparison、section-by-section approval、Design Summary self-review 和 propose handoff。

#### Scenario: 主 instructions 要求 todo 跟踪

- **WHEN** 系统生成 `openspec-explore` skill 内容
- **THEN** 主 instructions SHALL 声明在 todo 可用时，必须在读取 context 前创建唯一的 brainstorming checklist
- **AND** 主 instructions SHALL 要求随着阶段完成 tick 对应 checklist 项

#### Scenario: Superpowers reference 要求 context 前建立 checklist

- **WHEN** agent 读取 `openspec/references/openspec-explore-supperpowers-style.md`
- **THEN** reference SHALL 要求在读取项目 context 前创建 todo checklist
- **AND** checklist SHALL 包含 context、visual decision、one question、options、section approvals、self-review 和 handoff 阶段

#### Scenario: Todo checklist 不改变只读边界

- **WHEN** explore 使用 todo checklist 跟踪流程
- **THEN** checklist SHALL 只表示 explore 对话流程进度
- **AND** checklist SHALL NOT 授权 main explore agent 创建、编辑或删除项目文件或 OpenSpec 制品
