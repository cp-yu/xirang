## ADDED Requirements

### Requirement: 优化 finding reconciliation

Phase 2 SHALL 在初次 optimizer 调用中生成完整 findings 集，并在每个原子优化波次完成或失败后重新调用 optimizer。每次 reconciliation SHALL 基于当前代码、当前 findings、history 和 failedDirections 裁决全部非终态 findings。

Master agent SHALL 只实现最新排序中的首个 actionable finding；旧 findings SHALL NOT 被机械消费。

#### Scenario: 每个成功波次后重新 reconciliation
- **WHEN** selected finding 通过 speculative re-verify
- **THEN** 系统 SHALL 保存当前成功 checkpoint
- **AND** SHALL 重新 spawn fresh optimizer
- **AND** SHALL 在新 selected finding 实施前持久化完整 reconciliation 结果

#### Scenario: Master challenge 触发重新裁决
- **WHEN** master 发现 selected finding 与 spec、代码或测试证据冲突
- **THEN** SHALL 记录 `masterChallenge` 及证据
- **AND** SHALL 重新调用 optimizer
- **AND** master SHALL NOT 自行将 finding 标记为 rejected

## MODIFIED Requirements

### Requirement: 最优性检验执行

系统 SHALL 在 Phase 1 通过后自动进入 Phase 2，除非配置或 CLI 显式跳过。Phase 2 MUST 至少 spawn 一次 optimizer；master agent MUST NOT 替代 optimizer 判断是否存在 actionable findings。

Optimizer SHALL 返回合法 reconciliation envelope。若存在 `blockingObservations`，系统 SHALL 返回 Phase 1 remediation；否则系统 SHALL 持久化 findings 并选择首个 actionable finding，或在没有 actionable finding 时进入 `NOT_NEEDED`。

#### Scenario: [ADDED] Phase 1 PASS 后强制调用 optimizer
- **WHEN** Phase 1 为 PASS 或 PASS_WITH_WARNINGS
- **AND** optimization 已启用且未显式跳过
- **THEN** 系统 SHALL spawn fresh optimizer
- **AND** SHALL 由 optimizer 判断当前代码是否存在 actionable findings

#### Scenario: [ADDED] 配置或 CLI 跳过 Phase 2
- **WHEN** `optimization.enabled` 为 false 或用户传入 `--skip-optimization`
- **THEN** `optimization.status` SHALL 为 `SKIPPED`
- **AND** Phase 1 canonical 结果 SHALL 保持不变

#### Scenario: [ADDED] Phase 1 副作用不阻止 Phase 2
- **WHEN** Phase 1 已写回 `tasks.md` 或 `.verify-result.json`
- **AND** optimization 未被跳过
- **THEN** 系统 SHALL 继续进入 Phase 2
- **AND** SHALL NOT 因 worktree 非空自动跳过

#### Scenario: [REMOVED] Phase 1 PASS 后强制 spawn optimizer subagent

- **WHEN** Phase 1 返回 `PASS` 或 `PASS_WITH_WARNINGS`
- **AND** `config.yaml` 中 `optimization.enabled` 为 `true`（默认）
- **AND** CLI 未传入 `--skip-optimization` flag
- **THEN** 系统 SHALL spawn optimizer subagent（至少一次）
- **AND** 将 Phase 1 issues 列表和 change artifacts 传入 optimizer subagent
- **AND** master agent SHALL NOT 自行判断是否需要优化

#### Scenario: [REMOVED] --skip-optimization 跳过 Phase 2

- **WHEN** 用户执行 verify 时传入 `--skip-optimization` flag
- **THEN** 系统 SHALL 跳过 Phase 2
- **AND** `.verify-result.json` 中 `optimization.status` 记录为 `SKIPPED`
- **AND** 不影响 Phase 1 的 canonical 结果

#### Scenario: [REMOVED] config.yaml 禁用优化

- **WHEN** `openspec/config.yaml` 中 `optimization.enabled` 为 `false`
- **THEN** 系统 SHALL 跳过 Phase 2
- **AND** 行为等同于 `--skip-optimization`

#### Scenario: [REMOVED] Phase 1 副作用不会阻止 Phase 2

- **WHEN** Phase 1 已经写回 `tasks.md` 或 `.verify-result.json`
- **AND** 用户未传入 `--skip-optimization`
- **AND** `optimization.enabled` 不是 `false`
- **THEN** 系统 SHALL 继续进入 Phase 2
- **AND** SHALL NOT 因当前 worktree 非空而自动跳过 optimization

### Requirement: Checkpoint 与回滚

系统 SHALL 在 Phase 2 前以 git commit 保存 Phase 1 baseline，并在每个 selected finding 通过验证后创建增量 checkpoint。Speculative re-verify 失败时 SHALL 丢弃当前未提交修改并恢复最近成功 checkpoint；达到该 finding 方向的失败上限时 SHALL 将 finding 标记为 rejected，而不是终止其他 findings。

#### Scenario: [MODIFIED] 创建 baseline checkpoint
- **WHEN** Phase 1 通过且 Phase 2 即将开始
- **THEN** 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`

#### Scenario: [ADDED] 以 finding ID 创建增量 checkpoint
- **WHEN** `OPT-20260712T140523123Z-01` 通过 speculative re-verify
- **THEN** 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-r${N} (OPT-20260712T140523123Z-01: ${description})"`

#### Scenario: [ADDED] 失败波次回滚
- **WHEN** speculative re-verify 返回 FAIL_NEEDS_REMEDIATION
- **THEN** 系统 SHALL 执行 `git reset --hard HEAD` 和 `git clean -fd`
- **AND** SHALL 从最近成功 checkpoint 重新 reconciliation

#### Scenario: [ADDED] 优化完成后保留 checkpoints
- **WHEN** Phase 2 终止
- **THEN** 所有 `wip: opt-*` commits SHALL 保留
- **AND** 系统 SHALL NOT 自动清理这些 commits

#### Scenario: [REMOVED] 创建增量 checkpoint

- **WHEN** 优化轮次验证通过
- **THEN** 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-r${N} (${description})"` 其中 N 是轮次编号

#### Scenario: [REMOVED] 重试耗尽后安全回滚

- **WHEN** `behaviorRetryCounter >= config.optimization.optRetries`
- **THEN** 系统 SHALL 先丢弃当前轮 speculative edits：`git reset --hard HEAD` + `git clean -fd`
- **AND** 工作区 SHALL 恢复到最近一次 commit 的状态（Phase 1 baseline 或某一轮优化后的状态）
- **AND** SHALL 输出 "Verify: Phase 1 PASS. N optimization attempts safely reverted."
- **AND** SHALL 输出简短总结：尝试了什么、为什么失败

#### Scenario: [REMOVED] 优化完成后保留 commits

- **WHEN** 所有优化轮次完成（预算耗尽或用户停止）
- **THEN** 系统 SHALL NOT 执行任何 commit 清理操作
- **AND** 所有 `wip: opt-*` commits SHALL 保留在 git history 中

### Requirement: 重试预算控制

`config.optimization.optRetries` SHALL 只限制同一 finding 方向的 speculative re-verify 失败次数。成功波次 MUST NOT 消耗该预算，也不得作为 Phase 2 成功波次总上限。

#### Scenario: [ADDED] 成功优化不消耗预算
- **WHEN** selected finding 通过 speculative re-verify
- **THEN** 该方向失败计数 SHALL 保持不变
- **AND** 系统 SHALL 继续 reconciliation 其他 findings

#### Scenario: [ADDED] 失败方向达到上限
- **WHEN** 同一 finding 方向失败次数达到 `optRetries`
- **THEN** 该 finding SHALL 转为 `rejected`
- **AND** 系统 SHALL 继续处理其他 actionable findings

#### Scenario: [REMOVED] 行为错误重试

- **WHEN** 优化导致 P1_SPECULATIVE_FENCE re-verify 失败
- **THEN** `behaviorRetryCounter` 递增
- **AND** 循环计数器递增（消耗一次 optRetries 配额）
- **AND** 如果循环计数器 < `config.optimization.optRetries`：生成全新策略的 Search/Replace 块
- **AND** 如果循环计数器 >= `config.optimization.optRetries`：进入 Degraded Pass

#### Scenario: [REMOVED] 成功优化消耗配额

- **WHEN** 优化提案应用后 re-verify 返回 PASS
- **THEN** 循环计数器递增（消耗一次 optRetries 配额）
- **AND** 如果循环计数器 < `config.optimization.optRetries`：继续循环（可能发现新的优化机会）
- **AND** 如果循环计数器 >= `config.optimization.optRetries`：强制终止，以 IMPROVED 状态进入 Phase 3

#### Scenario: [REMOVED] 格式和匹配问题不消耗重试预算

- **WHEN** Search/Replace 块因格式或语法问题无法应用
- **OR** Search/Replace 块匹配不唯一或找不到锚点
- **THEN** 主 agent SHALL 直接修复格式或匹配问题
- **AND** SHALL NOT 消耗 optRetries 预算
- **AND** SHALL NOT 要求 subagent optimizer 重新生成 Search/Replace 块

### Requirement: 优化结果持久化

系统 SHALL 在 `.verify-result.json.optimization` 中持久化最新 `findings`、append-only `history` 和 `failedDirections`。现有 `attempts` 与外部 optimization status SHALL 保持可读兼容。旧文件缺少新字段时 SHALL 按空集合读取。

History SHALL 只保存事件、理由摘要、证据引用和 hashes，不重复保存代码、diff 或完整 finding 快照。

#### Scenario: [ADDED] 旧结果按空集合读取
- **WHEN** `.verify-result.json` 包含 optimization 但不含 findings 或 history
- **THEN** 系统 SHALL 将缺失字段解释为空数组
- **AND** SHALL NOT 阻止 verify status、seal 或 archive compatibility

#### Scenario: [ADDED] 记录失败方向与 finding 事件
- **WHEN** selected finding 导致 speculative re-verify 失败
- **THEN** 系统 SHALL 追加 finding `failed` event及失败证据
- **AND** SHALL 更新该方向的 failedDirections/失败计数

#### Scenario: [ADDED] Degraded 结果持久化
- **WHEN** Phase 2 因一个或多个 rejected findings 结束但 Phase 1 baseline 保持可用
- **THEN** 顶层 result SHALL 为 PASS_WITH_WARNINGS
- **AND** optimization.status SHALL 为 DEGRADED
- **AND** verified/resolved findings history SHALL 保留

#### Scenario: [REMOVED] 优化失败时记录方向

- **WHEN** Phase 2 优化提案应用后 re-verify 返回 FAIL_NEEDS_REMEDIATION
- **THEN** 系统 SHALL 将优化策略的自然语言摘要追加到 `optimization.failedDirections[]`
- **AND** 摘要格式为自由文本，描述尝试的优化方向（如 "extract shared validation logic from auth.ts and user.ts"）

#### Scenario: [REMOVED] 新优化提案避免重复方向

- **WHEN** subagent optimizer 在 Phase 2 后续循环或新会话中启动
- **THEN** SHALL 读取 `optimization.failedDirections[]`
- **AND** SHALL 避免提出与已记录方向相同或相似的优化策略
- **AND** 若所有可想到的策略均已失败，SHALL 返回 NO_OPTIMIZATION_NEEDED

#### Scenario: [REMOVED] Degraded Pass 结果持久化

- **WHEN** Degraded Pass 终局恢复完成
- **THEN** `.verify-result.json` 中 `result` SHALL 为 `PASS_WITH_WARNINGS`
- **AND** `optimization.status` SHALL 为 `DEGRADED`
- **AND** `optimization.failedDirections[]` SHALL 保留所有已尝试的策略记录

### Requirement: Speculative re-verify respects verify execution model

Master 实现 selected finding 后，系统 SHALL 按 verify execution model 执行 `P1_SPECULATIVE_FENCE`，并通过 `phase2 --type=verification` 记录 verdict。支持 clean-context subagent 的工具 MUST spawn fresh reviewer；顶层 agent不得自行决定 verdict。

Fresh reviewer SHALL 验证 specs/design/tasks 和 selected finding 的 preservation constraints，但 SHALL NOT 重新判断 finding 的优化价值。

#### Scenario: [ADDED] fresh reviewer 验证 finding
- **WHEN** master 已实现 selected finding
- **THEN** 系统 SHALL spawn fresh reviewer
- **AND** SHALL 向 reviewer 提供 finding ID、preservation constraints、实现证据和当前代码
- **AND** SHALL 用 reviewer verdict 更新 finding 状态

#### Scenario: [REMOVED] subagent-capable 工具通过 reviewer subagent 执行 speculative fence

- **WHEN** 当前 AI 工具支持 clean-context subagent verify
- **AND** Phase 2 已应用 candidate Search/Replace blocks，准备执行 `P1_SPECULATIVE_FENCE`
- **THEN** 系统 SHALL spawn a clean-context reviewer subagent to execute speculative Phase 1 checks
- **AND** 顶层 agent SHALL NOT 自己决定 speculative `PASS`、`PASS_WITH_WARNINGS` 或 `FAIL_NEEDS_REMEDIATION`
- **AND** behavior retry budget SHALL 消费 reviewer subagent 返回的 speculative verdict
- **AND** agent SHALL 调用 `openspec verify phase2 --type=verification --input '<结果JSON>'` 记录 speculative fence 结果

#### Scenario: [REMOVED] reread 工具保留 current-agent speculative fence

- **WHEN** 当前 AI 工具不支持 clean-context subagent verify
- **AND** Phase 2 已应用 candidate Search/Replace blocks，准备执行 `P1_SPECULATIVE_FENCE`
- **THEN** 系统 MAY 在当前 agent 中执行 explicit reread-based speculative verification
- **AND** SHALL 保持现有 format / match / behavior retry budget 语义
- **AND** agent SHALL 调用 `openspec verify phase2 --type=verification --input '<结果JSON>'` 记录结果

### Requirement: NO_OPTIMIZATION_NEEDED 的 CLI 校验

CLI SHALL 仅在 optimizer 提交合法 reconciliation envelope，且该 envelope 对全部非终态 findings 完成裁决并确认没有 actionable finding 时接受 `NO_OPTIMIZATION_NEEDED`。单独的非空 summary SHALL NOT 构成足够证据。

#### Scenario: [ADDED] 合法空 actionable 结果被接受
- **WHEN** optimizer envelope 结构合法
- **AND** 没有 pending/selected/implemented actionable finding
- **AND** 所有剩余 findings 均为终态或 deferred 且带原因
- **THEN** CLI SHALL 设置 optimization.status 为 NOT_NEEDED 或保持已完成优化对应的 IMPROVED

#### Scenario: [ADDED] 只有 summary 时拒绝
- **WHEN** 输入仅包含 `status: NO_OPTIMIZATION_NEEDED` 和非空 summary
- **AND** 缺少合法 reconciliation envelope
- **THEN** CLI SHALL 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`

#### Scenario: [REMOVED] summary 非空时接受

- **WHEN** CLI 收到 `{"status":"NO_OPTIMIZATION_NEEDED","summary":"No optimization opportunities found"}`
- **AND** `summary` trim 后长度 > 0
- **THEN** CLI SHALL 接受并记录 `optimization.status` 为 `NOT_NEEDED`

#### Scenario: [REMOVED] summary 缺失或为空时拒绝

- **WHEN** CLI 收到 `{"status":"NO_OPTIMIZATION_NEEDED"}` 且 `summary` 缺失或 trim 后为空
- **THEN** CLI SHALL 拒绝该请求
- **AND** 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
- **AND** 输出诊断: "NO_OPTIMIZATION_NEEDED requires a non-empty summary from the optimizer subagent"
- **AND** 返回 exit code 1

## REMOVED Requirements

### Requirement: Search/Replace 块生成

**Reason**: optimizer 改为输出 findings、关键设计和保持约束，master agent 负责 TDD 实现。

**Migration**: 使用 optimization reconciliation envelope 和 selected finding workflow。
