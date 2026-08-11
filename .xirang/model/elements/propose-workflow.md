---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、definition-first authoring、架构范围 reconcile、post-propose validation 分级 gate 与状态输出收敛。
---

## Requirements

### Requirement: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Contracts、`design.md`、`tasks.md` 与架构变化所需的结构目标制品。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 Semantic Model 的 module scopes。

#### Scenario: 创建新 change

- **WHEN** 用户明确要求创建 new change
- **AND** semantic readiness 已通过或用户已明确 override
- **AND** 派生 change ID 不存在
- **THEN** workflow SHALL 执行 `xirang new change`
- **AND** SHALL 按 artifact dependency order 生成 apply 所需制品

#### Scenario: Readiness 未通过时不创建 change

- **WHEN** semantic readiness 不完整且用户未 override
- **THEN** SHALL 报告缺失项并停止
- **AND** SHALL NOT 创建 change directory

#### Scenario: 更新 existing change

- **WHEN** 用户明确要求更新 existing change
- **THEN** SHALL 原地更新
- **AND** SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

#### Scenario: Workflow stage 边界

- **WHEN** 生成 propose skill
- **THEN** SHALL 声明 PROPOSE 只允许 change artifacts
- **AND** SHALL 禁止 implementation 与 change directory 外写入

#### Scenario: New change ID 冲突

- **WHEN** 用户要求 new change 且 ID 已存在
- **THEN** SHALL 停止并要求另一个 ID
- **AND** SHALL NOT 覆盖或自动改名

#### Scenario: Identity 不明确且 ID 已存在

- **WHEN** 用户意图未明确区分 update existing change 或 create new change
- **AND** 派生 ID 已存在
- **THEN** SHALL 一次询问用户选择
- **AND** non-interactive mode SHALL fail fast

#### Scenario: 等价 artifact 结果

- **WHEN** 用户调用 propose
- **THEN** change directory 与 planning artifact set SHALL 完整创建

### Requirement: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

#### Scenario: 复用 Design Summary

- **WHEN** conversation 包含已确认的 `Design Summary`
- **THEN** propose SHALL 说明正在复用该 summary
- **AND** SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
- **AND** SHALL NOT 重新执行字符数或 detail score 判断

#### Scenario: Semantic readiness 不完整

- **WHEN** 任一 readiness 项缺失或 source decision 未决
- **THEN** propose SHALL 在对话中列出具体缺口并建议 Explore
- **AND** SHALL 停止 artifact generation
- **AND** SHALL NOT 创建 change 或写入 routing decision

#### Scenario: 用户显式 override

- **WHEN** propose 已报告 readiness 缺口且用户明确要求直接生成
- **THEN** propose SHALL 接受 override 并继续
- **AND** override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策

#### Scenario: Semantic readiness 完整

- **WHEN** conversation 不包含已确认的 Design Summary
- **AND** problem、impact scope、approach 与 verification method 均明确
- **AND** 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
- **THEN** propose SHALL 说明 readiness 已满足并继续 artifact generation

#### Scenario: 多 subsystem scope

- **WHEN** 请求涉及多个 subsystem
- **THEN** propose SHALL 将其作为 impact scope 证据
- **AND** 只有无法形成单一一致 change scope 时才 SHALL 报告 readiness 缺口
- **AND** MUST NOT 仅凭 subsystem 数量强制 Explore

#### Scenario: Test Maintenance 分发

- **WHEN** Testing Strategy 包含过时测试信息
- **THEN** 过时原因 SHALL 进入 `design.md`
- **AND** 具体更新或删除操作 SHALL 进入 `tasks.md`

#### Scenario: One-time Verification 分发

- **WHEN** Testing Strategy 包含 `One-time Verification`
- **THEN** 项目 SHALL 生成 evidence-only Check 且 SHALL NOT 创建 persistent test file
- **AND** absence assertion SHALL 锚定 REMOVED Requirement

#### Scenario: Routing decision 不污染 artifacts

- **WHEN** propose 报告 readiness、缺失项或用户 override
- **THEN** 这些运行过程信息 SHALL 仅保留在对话中
- **AND** SHALL NOT 写入 `proposal.md` comment 或其他 change artifacts

### Requirement: Proposal 分离 behavior 与 architecture source impact

Proposal SHALL 保留 canonical `## Source Impact` 兼容结构，并分别声明 behavior source scope 与 architecture source scope。两部分 SHALL 明确属于同一个 Semantic Model；Element 的 Contract 由该 Element 的稳定 identity 定位（Requirement 全局寻址为 `<element identity>#<Requirement name>`），不存在独立 Spec ID 或 Contract 绑定 registry。

#### Scenario: Contract scope 使用 Element identity

- **WHEN** Element Contract behavior 或 guarantee 变化
- **THEN** Behavior Source SHALL 使用受影响 Element 的稳定 identity
- **AND** change-local delta SHALL 只为这些 Elements 在 change `elements/` 分区创建或修改对应单元

#### Scenario: Graph scope 使用 elementId

- **WHEN** Metamodel、element、containment、definition、relationship 或 view 变化
- **THEN** Architecture Source SHALL 使用稳定 identity 或明确的新 element identity
- **AND** exact graph operations SHALL 定义在四分区 Semantic Delta 中

#### Scenario: Source module 不变化

- **WHEN** 某 module scope 确认不变
- **THEN** 对应 section SHALL 写 `None`
- **AND** unresolved impact MUST NOT 表示为 `None`

#### Scenario: Proposal 分离 source impact

- **WHEN** Agent 获取 proposal definition
- **THEN** Behavior Source SHALL 使用 Element 稳定 identity
- **AND** Architecture Source SHALL 使用 stable element identities

#### Scenario: Optional contract 缺失不创建 Spec

- **WHEN** optional element 没有 Contract
- **THEN** propose MUST NOT 仅凭该状态创建 Contract 单元
- **AND** required element 缺失 contract SHALL 作为 source completeness gap 处理

### Requirement: Propose 使用 definition-first authoring

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 canonical unlabeled target-state Requirements 与 Scenarios；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

#### Scenario: Scenario operations 通过 diff 审阅

- **WHEN** Agent 已完成 delta Contracts、design、结构目标与 combined validation
- **THEN** Agent MUST NOT 手写或生成 Scenario operation labels
- **AND** SHALL 审阅 validate concise preview
- **AND** 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

#### Scenario: Specs 按 Behavior Source 生成

- **WHEN** propose 创建 change-local Contracts
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Element identities
- **AND** SHALL 读取 Formal Contract 的 exact Requirement titles 后 author delta

#### Scenario: Specs boundary 不重复定义

- **WHEN** workflow 生成 Contracts
- **THEN** SHALL 依赖 `xirang instructions specs --change "<name>" --json` 返回的 definition（Element-owned Contract delta authoring 指导）
- **AND** SHALL NOT 在 workflow template 维护竞争的 behavior boundary

### Requirement: Propose 在架构 delta 前 reconcile architecture scope

Contracts 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal Semantic Model 与 implementation evidence，再生成结构目标。Workflow SHALL 在完整 Target Semantic Model 上联合检查 Element Declarations、Relationships 与 Element Contracts。

#### Scenario: Design 改变 graph scope

- **WHEN** design 确认 graph impact 与 proposal 初稿不同
- **THEN** SHALL 更新 proposal Architecture Source
- **AND** exact target graph SHALL 写入 Semantic Delta

#### Scenario: 无 graph change

- **WHEN** Architecture Source 为 `None`
- **THEN** SHALL 省略结构目标
- **AND** SHALL NOT 从 contract change 发明 graph operations

#### Scenario: 指导生成 Semantic Delta

- **WHEN** change 影响 Architecture semantics
- **THEN** skill SHALL 指导在对应分区创建顶层 ADDED、MODIFIED、REMOVED sections
- **AND** SHALL 要求 MODIFIED entity 使用完整 target payload

#### Scenario: Binding 指向同一 delta 新 element

- **WHEN** Contract 的宿主 Element 只存在于同一 delta 中新增
- **THEN** propose SHALL 在 Target Semantic Model 上联合验证
- **AND** MUST NOT 将其误报为 formal model missing element

#### Scenario: Graph no-op

- **WHEN** Architecture Source 为 None
- **THEN** SHALL 省略 `metamodel/`、`relationships/` 与 `views/` delta 单元
- **AND** SHALL NOT 创建空 model 单元

### Requirement: Post-propose validation 使用分级 gate

Propose SHALL 使用 combined compiler validation 与 effective diff review 作为分级 gate。ERROR 或非预期 effective operation 阻塞 apply；WARNING 只披露。ERROR 最多修复一轮并复检一次。

#### Scenario: Combined Semantic Delta validation

- **WHEN** apply-required artifacts 已生成
- **THEN** SHALL 联合验证结构、containment、relationships、contracts 与 strict removals
- **AND** SHALL 输出 concise effective preview

#### Scenario: ERROR 阻塞

- **WHEN** validation 产生 ERROR
- **THEN** SHALL 最多修复并复检一轮
- **AND** 残留 ERROR SHALL 阻塞 ready-for-apply

#### Scenario: Effective diff 不符合 intent

- **WHEN** 预览显示未授权或遗漏的 operation
- **THEN** SHALL 修正 durable source 后重新 validate
- **AND** MUST NOT 通过编辑只读 preview 输出解决

#### Scenario: Validation 全部通过

- **WHEN** validation 无 ERROR 且 effective diff 已审阅
- **THEN** SHALL 以只读 preview 记录 effective diff 已审阅；不生成或持久化 review artifact
- **AND** final summary SHALL 声明 ready-for-apply

#### Scenario: 验证与审阅 delta

- **WHEN** Agent 完成 change artifacts
- **THEN** SHALL 指导运行 `xirang validate --change <name> --json`
- **AND** validation 无 ERROR 后 SHALL 运行 `xirang validate --change "<name>"` 的只读预览
- **AND** SHALL 要求 Agent 审阅 unexpected operations
- **AND** MUST NOT 运行 Scenario label command

#### Scenario: Combined validation 与只读 preview

- **WHEN** apply-required artifacts 已生成
- **THEN** SHALL 运行 `xirang validate --change "<name>" --json`
- **AND** validation 无 ERROR 后 SHALL 运行 `xirang validate --change "<name>"` 的只读预览
- **AND** MUST NOT 执行 sync

#### Scenario: Lightweight auxiliary checks

- **WHEN** 检查 proposal、design 与 tasks
- **THEN** SHALL 使用 resolved definitions/templates 与 deterministic task structure validation
- **AND** SHALL NOT 发明额外 semantic lint

#### Scenario: Warning-only handoff

- **WHEN**修复轮次后只剩 WARNING
- **THEN** summary SHALL 披露 remaining warnings
- **AND** MAY 声明 apply-ready

### Requirement: Propose 状态输出保持收敛

Propose SHALL 只在 readiness、blocker 与 final summary 节点输出状态；需要用户决定时一次询问一个问题。

#### Scenario: Readiness 状态

- **WHEN** propose 完成 semantic readiness 判断
- **THEN** SHALL 报告 Design Summary reuse、readiness 或具体 gap

#### Scenario: 最终总结

- **WHEN** propose 完成 artifacts、validation 与 report generation
- **THEN** SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
- **AND** SHALL NOT 报告 Scenario label result

#### Scenario: Blocker 状态

- **WHEN** identity、source decision、validation 或 effective diff 阻塞流程
- **THEN** SHALL 报告最小必要 blocker
- **AND** 需要用户决定时 SHALL 一次询问一个问题

### Requirement: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 在没有已确认 Change Structural Definition、且本次 Change 需要形成新增或重组 hierarchy 目标时消费 normalized `decomposition`。存在已确认 Change Structural Definition 时，Propose SHALL 忠实编译该完整 payload，SHALL NOT 通过配置的方法或 skill 重新裁决已确认结构。

#### Scenario: 无 framing 时形成结构 Delta

- **WHEN** Design Summary 要求新增或重组结构且不存在 Change Structural Definition
- **THEN** Propose 使用配置的方法或调用配置的 skill 形成完整目标结构
- **AND** 将结果编译为对应 Semantic Delta Entries

#### Scenario: 已确认 framing 优先

- **WHEN** handoff 包含有效且已确认的 Change Structural Definition
- **THEN** Propose 以该 payload 作为结构来源
- **AND** 不调用 decomposition skill 重做 identity、parent、Kind 或 Relationship 决策

#### Scenario: Architecture Source 为 None

- **WHEN** Change 只修改 Contracts 或 implementation scaffolding
- **THEN** Propose 不调用 decomposition skill
- **AND** 不从默认方法发明 Architecture Source

#### Scenario: 拆分指导不可用时阻塞 Formation

- **WHEN** Propose 必须形成结构目标但方法无法明确理解或 skill 调用失败
- **THEN** workflow 停止写入相关 Delta 并一次询问用户
- **AND** 不以默认 C4 或 implementation layout 猜测结构
