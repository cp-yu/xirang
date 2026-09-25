---
entity: "element-declaration"
identity: "propose-workflow"
kind: "element"
parent: "propose"
title: "Propose Workflow"
definition: "Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。"
contract: "optional"
---

## MODIFIED Requirements

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
- **THEN** 声明 PROPOSE 只写目标 Change 制品，禁止修改 implementation 或正式模型
- **AND** 仅在记录覆盖与校验通过后，允许 CLI-managed framing consume 完成明确来源的交接及受控清理，不允许任意 change 目录外写入

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

### Requirement: 仅在 Propose 形成结构目标时应用拆分指导
Propose Workflow SHALL 在需要形成尚未确认的新增或重组 hierarchy 时消费 normalized decomposition；对已经确认的记录或 Summary 结构决策 SHALL 忠实编译而不重新裁决。精简记录的存在不表示全部结构都已确认；尚未决部分仍须指导和用户确认。Contract-only 变化不因默认方法制造 Architecture Source。

#### Scenario: 无 framing 时形成结构 Delta
- **WHEN** 设计要求新增或重组结构且不存在记录
- **THEN** 使用配置指导确认目标结构，再编译对应 Delta。

#### Scenario: 已确认记录优先
- **WHEN** 记录已确认部分 identity、parent 或 Kind，但仍有未决结构
- **THEN** 保持已确认决策；仅对未决部分使用指导并请求用户确认，不能跳过全部结构设计或静默重做旧决策。

#### Scenario: Architecture Source 为 None
- **WHEN** Change 只改变 Contracts 或 implementation scaffolding
- **THEN** 不调用拆分 skill，不从默认方法发明结构变化。

#### Scenario: 拆分指导不可用时阻塞 Formation
- **WHEN** 必须形成结构但方法不明确或 skill 不可用
- **THEN** 停止相关结构写入并询问用户，不猜测默认方法或实现目录作为目标。

### Requirement: Propose 按 TDD 闭环划分 Tasks
Propose 生成 `tasks.md` 时 SHALL 以可独立实现与验证的完整闭环划分 task 边界，SHALL NOT 按 component、module、directory、file type、Requirement 数量或 Scenario 数量机械拆分；SHALL 按共享测试品质判断每个 Check 的语义价值，将同一可观察行为与同一失败原因的 Scenario 归入一个 Check；声明 ready-for-apply 前 SHALL 交叉检查所有 task 边界与 Check 价值，并 reconcile 违反独立验证或制造低价值持久化测试的划分。 Tasks SHALL 以具体实施事项与完整 Contract 引用承接规范目标，不能把记录摘要直接当成完整行为定义；相关 prompt 与受管生成面须归入所属行为闭环。ready-for-apply 前 SHALL 执行记录到语义及语义到实施/Checks 的语义覆盖检查，不能只验证引用存在。

#### Scenario: 按行为闭环而非组件划分
- **WHEN** 多个组件共同交付一个行为
- **THEN** Propose SHALL 将它们放入同一 task

#### Scenario: Requirement 数量不构成拆分理由
- **WHEN** 一个 task 的 Requirements 超过上限
- **THEN** Propose SHALL 合并细节或将验证细节下沉到 Checks
- **AND** SHALL NOT 仅因数量拆分 task

#### Scenario: Scenario 数量不构成拆分理由
- **WHEN** 一个 Requirement 含多个描述同一行为与同一失败原因的 Scenario
- **THEN** Propose SHALL 将它们编译进同一个 Check
- **AND** SHALL NOT 为每个 Scenario 各创建一个 persistent test Check

#### Scenario: Propose 必须判断 Check 价值
- **WHEN** Propose 编译 `tasks.md` Checks
- **THEN** SHALL 应用共享测试品质：优先 reuse 或 modify 已有测试，只在现有测试无法保护该行为时 add
- **AND** SHALL 把不值得持久化的证据编译为 one-time Check
- **AND** SHALL NOT 以「不得判断 Check 是否语义足够」为由保留机械测试

#### Scenario: 新增边界必须指向独特缺陷
- **WHEN** Propose 为同一行为增加额外边界 Check 或测试
- **THEN** SHALL 写明该边界能捕获、已有测试捕获不到的合理缺陷
- **AND** 无法指出独特缺陷时 SHALL 不创建该 Check

#### Scenario: ready-for-apply 前边界自检
- **WHEN** Propose 准备声明 Change ready-for-apply
- **THEN** SHALL 交叉检查 Goals、Files、Requirements 与 Checks
- **AND** 发现 task 依赖后续 task、Check 按 Scenario 1:1 机械拆分或假防护测试时 SHALL reconcile 后再声明

#### Scenario: 确认细节贯穿执行安排
- **WHEN** 用户确认的条件、例外与时序已经写入 Contract
- **THEN** 任务安排其实现与检查并引用该 Contract，不复制规范文本；缺少安排时不声明 ready-for-apply。
