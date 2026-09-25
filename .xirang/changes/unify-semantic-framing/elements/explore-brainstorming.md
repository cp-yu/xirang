---
entity: "element-declaration"
identity: "explore-brainstorming"
kind: "element"
parent: "design-exploration"
title: "Explore Brainstorming"
definition: "Explore Brainstorming 定义 Explore 的只读设计澄清流程：6 步 brainstorming checklist、一次一问的提问纪律、2-3 方案对比、分段设计确认、Design Summary 生成、范围检查与拆解建议、捕获边界路由以及主代理只读边界。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: Explore 主代理保持只读
Explore main agent SHALL 对项目实现、Formal Semantic Model 以及普通项目或 Change artifacts 保持只读：可检查文件、搜索代码、运行只读 CLI、提问、比较方案并生成只存在于对话中的 Design Summary；SHALL NOT 直接创建、编辑、删除、格式化、重新生成或 patch 项目文件和 artifacts。唯一例外是用户对完整、明确 payload 作出单独持久化确认后，Agent MAY 调用 CLI-managed Definition Framing；该 CLI 操作只持久化 已确认设计记录，不由 Agent 直接写入文件。除该例外外，Explore SHALL NOT 创建或更新任何项目或 Change artifacts。当 Explore 需要影响面发现时，main agent SHALL 先使用 `xirang arch search` 浏览 Formal Semantic Model 并选择一个或多个 focus Element identities，再使用 identity-only `xirang arch impact` 获取 refinement、Relationships 与 canonical paths，最后通过 batch `xirang arch query` 只读取判断所需 identities 的完整 Definitions 与 Contracts。

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
- **WHEN** 生成 xirang-explore skill 内容
- **THEN** 入口明确 EXPLORE 对项目实现、正式模型与普通制品保持只读，禁止直接文件写入
- **AND** 明确唯一例外是单独获准内容通过 CLI-managed Definition Framing 保存，不以普通设计确认推导权限，也不以排版顺序代替权限约束

### Requirement: Design Summary 生成
Explore SHALL 在设计确认后生成 conversation-only Design Summary。复杂语义模型变更 SHALL 明确记录适用的 decisions；窄修改 SHALL 至少汇总 problem、impact scope、approach 与 verification method；natural-language prose SHALL 跟随用户语言，canonical tokens、paths 与 commands SHALL 保持 canonical。 存在已确认设计记录时，输出前 SHALL 完整重载并完成冲突裁决、受影响结论重查；未决冲突与过期检查不能放行 Summary。

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

### Requirement: Explore 捕获边界保持 Contract 为可观察行为
Explore 在已有 change 上发现 insight 时 SHALL 以 Semantic Model 分类 future capture target：Element Contract 变化进入宿主 Element 的 Contract，graph facts 进入 Semantic Delta，implementation decisions 进入 scaffolding；Explore 本身保持只读。 用户单独授权保存的内容 MAY 经 CLI 进入统一确认记录；这只是中间依据，不改变最终 capture target，也不授权直接写 Contract 或 Change。

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
- **THEN** 不直接写入目标模型或 Change；在对话 Summary 中标明目标，或经单独授权由 CLI 保存确认记录
- **AND** 后续规范制品仍由 Propose 或其他获授权 workflow 生成

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

### Requirement: 仅在结构设计中应用项目拆分指导
Explore Brainstorming SHALL 在需求涉及新增或重组 Element hierarchy 时消费 normalized `decomposition`，并将其用于结构方案比较与 Design Summary；行为、实现或 Contract-only 讨论 SHALL NOT 因该配置被扩展为结构重组。对 `skill` 的调用仍属于只读设计辅助，SHALL NOT 放宽 Explore workflow stage 边界。

#### Scenario: 探索结构变化
- **WHEN** 用户意图会新增 Element、改变 parent 或重组 sibling set
- **THEN** Explore 在比较结构方案前使用配置的方法或调用配置的 skill
- **AND** 在 Design Summary 记录已确认的结构方向而不写入 Change artifacts

#### Scenario: 探索 Contract-only 变化
- **WHEN** 用户意图只改变既有 Element Contract 或实现方式
- **THEN** Explore 不调用自定义拆分 skill
- **AND** 不因默认拆分方法 产生额外 Architecture Source

#### Scenario: custom skill 请求写入
- **WHEN** decomposition skill 的指令与 Explore 只读边界冲突或要求未经确认持久化
- **THEN** 主 Explore Agent 保持只读并忽略冲突指令
- **AND** 只有 Xirang-owned Definition Framing protocol 可在独立确认后持久化已确认设计记录
