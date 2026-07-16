## MODIFIED Requirements

### Requirement: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Specs、`design.md`、`tasks.md` 与 `opsx-delta.yaml`。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change。

#### Scenario: [MODIFIED] 创建新 change
- **WHEN** 用户明确要求创建 new change
- **AND** semantic readiness 已通过或用户已明确 override
- **AND** 派生的 kebab-case change ID 不存在
- **THEN** workflow SHALL 执行 `openspec new change`
- **AND** SHALL 按 artifact dependency order 生成 apply 所需制品

#### Scenario: [ADDED] Readiness 未通过时不创建 change
- **WHEN** 用户请求创建 new change
- **AND** semantic readiness 不完整
- **AND** 用户尚未明确 override
- **THEN** workflow SHALL 报告缺失项并停止
- **AND** SHALL NOT 创建 change directory 或修改项目文件

#### Scenario: [ADDED] 更新 existing change
- **WHEN** 用户明确要求更新 existing change
- **THEN** workflow SHALL 原地读取并更新该 change
- **AND** SHALL NOT 询问名称、重命名 change 或创建替代 ID
- **AND** semantic readiness SHALL 合并现有 artifacts、当前输入、已确认的 Design Summary、formal source 与 implementation evidence 判断

#### Scenario: [ADDED] New change ID 冲突
- **WHEN** 用户明确要求创建 new change
- **AND** 派生的 change ID 已存在
- **THEN** workflow SHALL 停止并要求用户提供另一个 ID
- **AND** SHALL NOT 覆盖、自动续写、重命名 existing change 或自动生成替代 ID

#### Scenario: [ADDED] Identity 不明确且 ID 已存在
- **WHEN** 用户意图未明确区分更新 existing change 或创建独立 new change
- **AND** 派生的 ID 已存在
- **THEN** workflow SHALL 一次询问用户选择更新 existing change 或创建独立 change
- **AND** 非交互环境 SHALL fail fast 并要求明确选择

#### Scenario: [MODIFIED] Workflow stage 边界
- **WHEN** 生成 `openspec-propose` skill
- **THEN** 正文首个章节 SHALL 包含 `## Workflow Stage`
- **AND** SHALL 声明 Stage 为 `PROPOSE`、允许生成 change artifacts、禁止实施代码或修改 change directory 以外的项目文件

#### Scenario: [REMOVED] 已有 change
- **WHEN** 目标 change 已存在
- **THEN** workflow SHALL 询问继续现有 change 或使用新名称
- **AND** 非交互环境 SHALL fail fast 并要求明确选择

### Requirement: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与 unresolved Behavior/Architecture Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

#### Scenario: [MODIFIED] 复用 Design Summary
- **WHEN** conversation 包含已确认的 `Design Summary`
- **THEN** propose SHALL 说明正在复用该 summary
- **AND** SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
- **AND** SHALL NOT 重新执行字符数或 detail score 判断

#### Scenario: [ADDED] Semantic readiness 完整
- **WHEN** conversation 不包含已确认的 Design Summary
- **AND** problem、impact scope、approach 与 verification method 均明确
- **AND** 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
- **THEN** propose SHALL 说明 readiness 已满足并继续 artifact generation

#### Scenario: [ADDED] Semantic readiness 不完整
- **WHEN** 任一 readiness 项缺失或 source decision 未决
- **THEN** propose SHALL 在对话中列出具体缺口并建议 Explore
- **AND** SHALL 停止 artifact generation
- **AND** SHALL NOT 创建 change 或写入 routing decision

#### Scenario: [ADDED] 用户显式 override
- **WHEN** propose 已报告 readiness 缺口
- **AND** 用户明确要求直接生成
- **THEN** propose SHALL 接受 override 并继续
- **AND** override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策
- **AND** 关键未决问题 SHALL 仍一次询问一个

#### Scenario: [ADDED] 多 subsystem scope
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

#### Scenario: [ADDED] Routing decision 不污染 artifacts
- **WHEN** propose 报告 readiness、缺失项或用户 override
- **THEN** 这些运行过程信息 SHALL 仅保留在对话中
- **AND** SHALL NOT 写入 `proposal.md` comment 或其他 change artifacts

### Requirement: Propose 使用 definition-first authoring

每个 artifact 写入前，workflow SHALL 读取 resolved `definition`，使用 `content.includes` 与 `content.excludes` 判断内容归属，遵守 `writePolicy`，再执行 `instruction` 并填充 `template`。Definition、context、rules、config projection、routing decision 与 Agent reasoning MUST NOT 被复制进 artifact。

#### Scenario: [MODIFIED] Specs 按 Behavior Source 生成
- **WHEN** propose 创建 change-local Specs
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Spec IDs
- **AND** SHALL 使用返回的 definition 路由非 behavior 内容到 proposal、design、tasks 或 OPSX delta
- **AND** SHALL 读取 formal Spec 的精确 Requirement titles 后 author delta

#### Scenario: Specs boundary 不重复定义
- **WHEN** workflow 生成 Specs
- **THEN** SHALL 依赖 `openspec instructions specs --change "<name>" --json` 返回的 definition boundary
- **AND** SHALL NOT 在 workflow template 中维护独立的内容分类合同

#### Scenario: [ADDED] Scenario labels preview 后生成
- **WHEN** Agent 已完成 Specs 与 combined semantic-source delta validation
- **THEN** Agent MUST NOT 手写 scenario operation labels
- **AND** SHALL 先执行 `openspec scenario-labels "<name>" --preview --json`
- **AND** SHALL 将 suggestions 与 proposal Behavior Source 和目标 delta 对照
- **AND** 非预期 ADDED、MODIFIED 或 REMOVED operation SHALL 阻塞 label write
- **AND** preview 符合意图后才 SHALL 执行 `openspec scenario-labels "<name>" --write`
- **AND** sync/archive SHALL 消费并清理已有 labels，但 MUST NOT 生成 labels
- **AND** SHALL NOT 仅因已审查的 deterministic labels 写入而再次运行 validate

#### Scenario: [REMOVED] Scenario labels 程序化生成
- **WHEN** Agent 编写 Specs
- **THEN** Agent MUST NOT 手写 scenario operation labels
- **AND** validation 后 SHALL 执行 `openspec scenario-labels "<name>" --write`
- **AND** labels SHALL 保持 change-local review metadata
- **AND** sync/archive SHALL 消费并清理已有 labels，但 MUST NOT 生成 labels
- **AND** SHALL NOT 仅因程序化 labels 再运行一次 validate

## ADDED Requirements

### Requirement: Post-propose validation 使用分级 gate

Artifact 生成后，workflow SHALL 检查 compilation scaffolding，并运行一次 combined semantic-source delta validation。发现 ERROR 时 SHALL 最多修复一轮并复检一次；残留 ERROR SHALL 阻塞 ready-for-apply，WARNING SHALL 披露但不阻塞。

#### Scenario: Combined semantic-source delta validation
- **WHEN** apply-required artifacts 已生成
- **THEN** workflow SHALL 运行 `openspec validate --change "<name>" --json`
- **AND** SHALL 将该命令作为 Specs delta 与 OPSX delta 的 combined validation
- **AND** SHALL NOT 强制重复运行 Specs-scoped 与 OPSX-delta-scoped validation
- **AND** MUST NOT 执行 `openspec sync`

#### Scenario: Lightweight scaffolding checks
- **WHEN** 检查 proposal、design 与 tasks
- **THEN** SHALL 使用当前 resolved definitions/templates 检查 proposal 与 design
- **AND** SHALL 使用 deterministic task structure validation 检查 tasks
- **AND** SHALL NOT 发明额外 semantic lint 或判断 Check 语义充分性

#### Scenario: Validation ERROR 阻塞
- **WHEN** 初次 validation 或 scaffolding check 产生 ERROR
- **THEN** workflow SHALL 最多执行一轮修复并复检一次
- **AND** 单轮修复后仍有 ERROR 时 SHALL 报告 blockers
- **AND** SHALL NOT 声明 ready-for-apply

#### Scenario: Validation WARNING 不阻塞
- **WHEN** validation 通过且仅剩 WARNING
- **THEN** final summary SHALL 披露 remaining warnings
- **AND** workflow MAY 声明 ready-for-apply

#### Scenario: Validation 全部通过
- **WHEN** scaffolding checks 与 combined validation 均无 ERROR
- **THEN** workflow SHALL 继续 scenario label preview/write
- **AND** final summary SHALL 声明 ready-for-apply

### Requirement: Propose 状态输出保持收敛

Propose SHALL 只在 readiness 判断、阻塞决策和最终总结三个节点输出状态，不得要求首次 onboarding 预告或逐 artifact 完成播报。

#### Scenario: Readiness 状态
- **WHEN** propose 完成 semantic readiness 判断
- **THEN** SHALL 报告 Design Summary reuse、readiness 结果、具体缺口或 override 状态中适用的内容

#### Scenario: Blocker 状态
- **WHEN** change identity、source decision、validation 或 label preview 阻塞流程
- **THEN** SHALL 报告最小必要 blocker
- **AND** 需要用户决定时 SHALL 一次询问一个问题

#### Scenario: 最终总结
- **WHEN** propose 完成 artifact generation 与 validation
- **THEN** SHALL 汇总创建或更新的 artifacts、validation errors/warnings、scenario label 结果与 ready-for-apply 状态
- **AND** SHALL NOT 要求每完成一个 artifact 就输出独立进度消息

## REMOVED Requirements

### Requirement: Propose onboarding UX

**Reason**: 首次预告与逐 artifact 播报增加对话噪声，不改变 compilation 结果。

**Migration**: 仅在 readiness、blocker 与 final summary 节点输出状态。

### Requirement: Propose 在写 Specs 前检查 delta references

**Reason**: Agent 已读取 formal Specs，最终 combined validation 保留相同的 deterministic Requirement header cross-check；独立 `check-delta` preflight 被删除。

**Migration**: 使用 formal Spec 精确 titles author delta，并由 `openspec validate --change "<name>" --json` 阻断错误。
