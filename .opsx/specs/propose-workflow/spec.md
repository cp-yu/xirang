---
element: cap.ai.propose-smart-routing
---

## Purpose

定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为。
## Requirements
### Requirement: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Specs、`design.md`、`tasks.md` 与架构变化所需的 `architecture-delta.c4`。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 OPSX Semantic Model 的 module scopes。

#### Scenario: 创建新 change
- **WHEN** 用户明确要求创建 new change
- **AND** semantic readiness 已通过或用户已明确 override
- **AND** 派生 change ID 不存在
- **THEN** workflow SHALL 执行 `opsx new change`
- **AND** SHALL 按 artifact dependency order 生成 apply 所需制品

#### Scenario: Readiness 未通过时不创建 change
- **WHEN** semantic readiness 不完整且用户未 override
- **THEN** SHALL 报告缺失项并停止
- **AND** SHALL NOT 创建 change directory

#### Scenario: 更新 existing change
- **WHEN** 用户明确要求更新 existing change
- **THEN** SHALL 原地更新
- **AND** SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

#### Scenario: New change ID 冲突
- **WHEN** 用户要求 new change 且 ID 已存在
- **THEN** SHALL 停止并要求另一个 ID
- **AND** SHALL NOT 覆盖或自动改名

#### Scenario: Identity 不明确且 ID 已存在
- **WHEN** 用户意图未明确区分 update existing change 或 create new change
- **AND** 派生 ID 已存在
- **THEN** SHALL 一次询问用户选择
- **AND** non-interactive mode SHALL fail fast

#### Scenario: Workflow stage 边界
- **WHEN** 生成 propose skill
- **THEN** SHALL 声明 PROPOSE 只允许 change artifacts
- **AND** SHALL 禁止 implementation 与 change directory 外写入

### Requirement: Propose 生成完整 planning set

Propose SHALL 生成与既有 scaffold-plus-generation 流程等价的 change 目录与 planning artifacts；console output MAY 不同。

#### Scenario: 等价 artifact 结果
- **WHEN** 用户调用 propose
- **THEN** change directory 与 planning artifact set SHALL 完整创建

### Requirement: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与 unresolved Behavior/Architecture Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

#### Scenario: 复用 Design Summary
- **WHEN** conversation 包含已确认的 `Design Summary`
- **THEN** propose SHALL 说明正在复用该 summary
- **AND** SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
- **AND** SHALL NOT 重新执行字符数或 detail score 判断

#### Scenario: Semantic readiness 完整
- **WHEN** conversation 不包含已确认的 Design Summary
- **AND** problem、impact scope、approach 与 verification method 均明确
- **AND** 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
- **THEN** propose SHALL 说明 readiness 已满足并继续 artifact generation

#### Scenario: Semantic readiness 不完整
- **WHEN** 任一 readiness 项缺失或 source decision 未决
- **THEN** propose SHALL 在对话中列出具体缺口并建议 Explore
- **AND** SHALL 停止 artifact generation
- **AND** SHALL NOT 创建 change 或写入 routing decision

#### Scenario: 用户显式 override
- **WHEN** propose 已报告 readiness 缺口
- **AND** 用户明确要求直接生成
- **THEN** propose SHALL 接受 override 并继续
- **AND** override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策
- **AND** 关键未决问题 SHALL 仍一次询问一个

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

Proposal SHALL 保留 canonical `## Source Impact` 兼容结构，并分别声明 contract module scope 与 graph module scope。两部分 SHALL 明确属于同一个 OPSX Semantic Model；Spec ID 与 stable `elementId` 必须分离，Spec SHALL 通过 singular frontmatter binding 对应一个 element。

#### Scenario: Contract scope 使用 Spec ID
- **WHEN** Element Contract behavior 或 guarantee 变化
- **THEN** New/Modified Specs SHALL 使用 Spec IDs
- **AND** change-local Specs SHALL 只为这些 entries 创建或修改

#### Scenario: Graph scope 使用 elementId
- **WHEN** Metamodel、element、containment、summary、relationship 或 view 变化
- **THEN** Architecture Source SHALL 使用 stable `elementId` 或明确的新 element identity
- **AND** exact graph operations SHALL 定义在 `architecture-delta.c4`

#### Scenario: Source module 不变化
- **WHEN** 某 module scope 确认不变
- **THEN** 对应 section SHALL 写 `None`
- **AND** unresolved impact MUST NOT 表示为 `None`

#### Scenario: Optional contract 缺失不创建 Spec
- **WHEN** optional element 没有 Spec
- **THEN** propose MUST NOT 仅凭该状态创建 New Spec
- **AND** required element 缺失 contract SHALL 作为 source completeness gap 处理

### Requirement: Propose 使用 definition-first authoring

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Specs SHALL 只包含 canonical unlabeled target-state Requirements 与 Scenarios；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

#### Scenario: Specs 按 Behavior Source 生成
- **WHEN** propose 创建 change-local Specs
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Spec IDs
- **AND** SHALL 读取 Formal Spec 的 exact Requirement titles 后 author delta

#### Scenario: Specs boundary 不重复定义
- **WHEN** workflow 生成 Specs
- **THEN** SHALL 依赖 `opsx instructions specs --change "<name>" --json` 返回的 definition
- **AND** SHALL NOT 在 workflow template 维护竞争的 behavior boundary

#### Scenario: Scenario operations 通过 diff 审阅
- **WHEN** Agent 已完成 Specs、design、Architecture delta 与 combined validation
- **THEN** Agent MUST NOT 手写或生成 Scenario operation labels
- **AND** SHALL 审阅 validate concise preview
- **AND** SHALL 运行 `opsx diff --change "<name>" --write`
- **AND** SHALL 将 effective Scenario 与 Architecture operations 对照 proposal 与 Design Summary
- **AND** 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

### Requirement: Propose 在 architecture delta 前 reconcile architecture scope

Specs 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal OPSX Semantic Model 与 implementation evidence，再生成 `architecture-delta.c4`。Workflow SHALL 联合检查 change-local Specs 的 singular element bindings。

#### Scenario: Design 改变 graph scope
- **WHEN** design 确认 graph impact 与 proposal 初稿不同
- **THEN** SHALL 更新 proposal Architecture Source
- **AND** exact target graph SHALL 写入 `architecture-delta.c4`

#### Scenario: 无 graph change
- **WHEN** Architecture Source 为 `None`
- **THEN** SHALL 省略 `architecture-delta.c4`
- **AND** SHALL NOT 从 contract change 发明 graph operations

#### Scenario: Binding 指向同一 delta 新 element
- **WHEN** Spec 的 `element` 只存在于同一 graph delta
- **THEN** propose SHALL 在 Target Semantic Model 上联合验证
- **AND** MUST NOT 将其误报为 formal model missing element

### Requirement: Propose 消费共享语言合同

Propose SHALL 消费 artifact instructions 的 config projection，使新写或修改的 natural-language prose 跟随 `proseLanguage`，同时保持 headings、normative keywords、BDD keywords、IDs、schema keys、paths、commands 与 code identifiers canonical。

#### Scenario: 不增加额外语言扫描
- **WHEN** artifact 已消费共享 language contract
- **THEN** workflow SHALL NOT 增加独立的 per-artifact English prose scan

### Requirement: Post-propose validation 保持 warning-only

Artifact generation 后，workflow SHALL 检查 scaffolding，并运行一次 combined Semantic Delta validation。WARNING SHALL 披露但不阻塞；ERROR 最多修复一轮并复检一次。

#### Scenario: Combined validation 与 review generation
- **WHEN** apply-required artifacts 已生成
- **THEN** SHALL 运行 `opsx validate --change "<name>" --json`
- **AND** validation 无 ERROR 后 SHALL 运行 `opsx diff --change "<name>" --write`
- **AND** MUST NOT 执行 sync

#### Scenario: Lightweight auxiliary checks
- **WHEN** 检查 proposal、design 与 tasks
- **THEN** SHALL 使用 resolved definitions/templates 与 deterministic task structure validation
- **AND** SHALL NOT 发明额外 semantic lint

#### Scenario: Warning-only handoff
- **WHEN**修复轮次后只剩 WARNING
- **THEN** summary SHALL 披露 remaining warnings
- **AND** MAY 声明 apply-ready

### Requirement: Post-propose validation 使用分级 gate

Propose SHALL 使用 combined compiler validation 与 effective diff review 作为分级 gate。ERROR 或非预期 effective operation 阻塞 apply；WARNING 只披露。

#### Scenario: Combined Semantic Delta validation
- **WHEN** apply-required artifacts 已生成
- **THEN** SHALL 联合验证 graph、containment、relationships、bindings、contracts 与 strict removals
- **AND** SHALL 输出 concise effective preview

#### Scenario: ERROR 阻塞
- **WHEN** validation 产生 ERROR
- **THEN** SHALL 最多修复并复检一轮
- **AND** 残留 ERROR SHALL 阻塞 ready-for-apply

#### Scenario: Effective diff 不符合 intent
- **WHEN** `opsx diff` 显示未授权或遗漏的 operation
- **THEN** SHALL 修正 durable source 后重新 validate 与 write report
- **AND** MUST NOT 通过编辑 `effective-change.md` 解决

#### Scenario: Validation 全部通过
- **WHEN** validation 无 ERROR 且 effective diff 已审阅
- **THEN** SHALL 保留生成的 `effective-change.md`
- **AND** final summary SHALL 声明 ready-for-apply

### Requirement: Propose 状态输出保持收敛

Propose SHALL 只在 readiness、blocker 与 final summary 节点输出状态。

#### Scenario: Readiness 状态
- **WHEN** propose 完成 semantic readiness 判断
- **THEN** SHALL 报告 Design Summary reuse、readiness 或具体 gap

#### Scenario: Blocker 状态
- **WHEN** identity、source decision、validation 或 effective diff 阻塞流程
- **THEN** SHALL 报告最小必要 blocker
- **AND** 需要用户决定时 SHALL 一次询问一个问题

#### Scenario: 最终总结
- **WHEN** propose 完成 artifacts、validation 与 report generation
- **THEN** SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
- **AND** SHALL NOT 报告 Scenario label result

