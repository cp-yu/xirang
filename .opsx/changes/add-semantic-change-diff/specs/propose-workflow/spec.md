## MODIFIED Requirements

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
