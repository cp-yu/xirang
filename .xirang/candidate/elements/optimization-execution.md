---
entity: element-declaration
identity: optimization-execution
kind: capability
parent: verify
title: Optimization Execution
definition: Optimization Execution 定义 Phase 2 最优性检验执行协议：Phase 1 通过后强制调用 optimizer、checkpoint 与回滚、重试预算控制、优化结果持久化、speculative re-verify 与 NO_OPTIMIZATION_NEEDED 的 CLI 校验。
---

## Requirements

### Requirement: 最优性检验执行

系统 SHALL 在 Phase 1 通过后自动进入 Phase 2，除非配置或 CLI 显式跳过。Phase 2 MUST 至少 spawn 一次 optimizer；master agent MUST NOT 替代 optimizer 判断是否存在 actionable findings。Optimizer SHALL 返回合法 reconciliation envelope；存在 `blockingObservations` 时返回 Phase 1 Required Corrections；否则持久化 findings 并选择首个 actionable finding，或进入 `NOT_NEEDED`。

#### Scenario: Phase 1 PASS 后强制调用 optimizer
- **WHEN** Phase 1 为 PASS 或 PASS_WITH_WARNINGS
- **AND** optimization 已启用且未显式跳过
- **THEN** 系统 SHALL spawn fresh optimizer
- **AND** SHALL 由 optimizer 判断当前代码是否存在 actionable findings

#### Scenario: 配置或 CLI 跳过 Phase 2
- **WHEN** `optimization.enabled` 为 false 或用户传入 `--skip-optimization`
- **THEN** `optimization.status` SHALL 为 `SKIPPED`
- **AND** Phase 1 canonical 结果 SHALL 保持不变
#### Scenario: Phase 1 副作用不阻止 Phase 2
- **WHEN** Phase 1 已写回 `tasks.md` 或 `.verify-result.json`
- **AND** optimization 未被跳过
- **THEN** 系统 SHALL 继续进入 Phase 2
- **AND** SHALL NOT 因 worktree 非空自动跳过
### Requirement: Checkpoint 与回滚

系统 SHALL 在 Phase 2 前以非空 git commit 保存 Phase 1 baseline，并在每个 selected finding 通过验证后创建增量 checkpoint。Speculative re-verify 失败时 SHALL 丢弃当前未提交实现并恢复最近成功 checkpoint，同时保留 CLI 已写入的 append-only optimization state；达到该 finding 方向的失败上限时 SHALL 将 finding 标记为 rejected。

#### Scenario: 创建 baseline checkpoint
- **WHEN** Phase 1 通过且 Phase 2 即将开始
- **AND** 工作区包含本次 Apply 的未提交变更
- **THEN** 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`
- **AND** SHALL 将 commit SHA 持久化为 `.apply-isolation.json.phase2BaselineCommit`

#### Scenario: 干净工作区不得创建空 baseline
- **WHEN** Phase 2 启动时工作区干净
- **THEN** 系统 SHALL 只复用已验证 baseline 或用户明确记录的完整实现 commit
- **AND** MUST NOT 使用 `--allow-empty`

#### Scenario: 以 finding ID 创建增量 checkpoint
- **WHEN** 某 finding 通过 speculative re-verify
- **THEN** 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-r${N} (<finding-id>: <description>)"`

#### Scenario: 失败波次回滚
- **WHEN** speculative re-verify 返回 FAIL_NEEDS_CORRECTIONS
- **AND** CLI 已更新 `.verify-result.json` 中的 history 与 `failedDirections`
- **THEN** Apply SHALL 把更新后的 verify result 与 `.apply-isolation.json` 快照到 repository 外
- **AND** SHALL 执行 `git reset --hard HEAD` 和 `git clean -fd` 丢弃 speculative implementation
- **AND** SHALL 原子恢复两个持久状态文件并验证各自 SHA-256
- **AND** SHALL 从最近成功 checkpoint 与恢复后的 optimization state 重新 reconciliation
#### Scenario: 终局状态保持兼容
- **WHEN** Phase 2 终止
- **THEN** optimization.status SHALL 为 IMPROVED、DEGRADED、NOT_NEEDED、SKIPPED 或 ABORTED_UNSAFE
- **AND** 所有 `wip: opt-*` commits SHALL 保留
#### Scenario: 优化完成后保留 checkpoints
- **WHEN** Phase 2 终止
- **THEN** 所有 `wip: opt-*` commits SHALL 保留
- **AND** 系统 SHALL NOT 自动清理这些 commits
### Requirement: 重试预算控制

`config.optimization.optRetries` SHALL 只限制同一 finding 方向的 speculative re-verify 失败次数。成功波次 MUST NOT 消耗该预算，也不得作为 Phase 2 成功波次总上限。

#### Scenario: 成功优化不消耗预算
- **WHEN** selected finding 通过 speculative re-verify
- **THEN** 该方向失败计数 SHALL 保持不变
- **AND** 系统 SHALL 继续 reconciliation 其他 findings

#### Scenario: 失败方向达到上限
- **WHEN** 同一 finding 方向失败次数达到 `optRetries`
- **THEN** 该 finding SHALL 转为 `rejected`
- **AND** 系统 SHALL 继续处理其他 actionable findings

### Requirement: 优化结果持久化

系统 SHALL 在 `.verify-result.json.optimization` 中持久化最新 `findings`、append-only `history` 和 `failedDirections`。现有 `attempts` 与外部 optimization status SHALL 保持可读兼容。旧文件缺少新字段时 SHALL 按空集合读取。History SHALL 只保存事件、理由摘要、证据引用和 hashes，不重复保存代码、diff 或完整 finding 快照。

#### Scenario: 旧结果按空集合读取
- **WHEN** `.verify-result.json` 包含 optimization 但不含 findings 或 history
- **THEN** 系统 SHALL 将缺失字段解释为空数组
- **AND** SHALL NOT 阻止 verify status、seal 或 archive compatibility

#### Scenario: Degraded 结果持久化
- **WHEN** Phase 2 因一个或多个 rejected findings 结束但 Phase 1 baseline 保持可用
- **THEN** 顶层 result SHALL 为 PASS_WITH_WARNINGS
- **AND** optimization.status SHALL 为 DEGRADED
- **AND** verified/resolved findings history SHALL 保留
#### Scenario: 记录失败方向与 finding 事件
- **WHEN** selected finding 导致 speculative re-verify 失败
- **THEN** 系统 SHALL 追加 finding `failed` event及失败证据
- **AND** SHALL 更新该方向的 failedDirections/失败计数
### Requirement: Speculative re-verify respects verify execution model

Master 实现 selected finding 后，系统 SHALL 按 verify execution model 执行 `P1_SPECULATIVE_FENCE`，并通过 `phase2 --type=verification` 记录 verdict。支持 clean-context subagent 的工具 MUST spawn fresh reviewer；顶层 agent 不得自行决定 verdict。Fresh reviewer SHALL 验证 preservation constraints，但 SHALL NOT 重新判断 finding 的优化价值。

#### Scenario: fresh reviewer 验证 finding
- **WHEN** master 已实现 selected finding
- **THEN** 系统 SHALL spawn fresh reviewer
- **AND** SHALL 向 reviewer 提供 finding ID、preservation constraints、实现证据和当前代码
- **AND** SHALL 用 reviewer verdict 更新 finding 状态

### Requirement: NO_OPTIMIZATION_NEEDED 的 CLI 校验

CLI SHALL 仅在 optimizer 提交合法 reconciliation envelope，且该 envelope 对全部非终态 findings 完成裁决并确认没有 actionable finding 时接受 `NO_OPTIMIZATION_NEEDED`。单独的非空 summary SHALL NOT 构成足够证据。

#### Scenario: 合法空 actionable 结果被接受
- **WHEN** optimizer envelope 结构合法
- **AND** 没有 pending/selected/implemented actionable finding
- **AND** 所有剩余 findings 均为终态或 deferred 且带原因
- **THEN** CLI SHALL 设置 optimization.status 为 NOT_NEEDED 或保持已完成优化对应的 IMPROVED

#### Scenario: 只有 summary 时拒绝
- **WHEN** 输入仅包含 `status: NO_OPTIMIZATION_NEEDED` 和非空 summary
- **AND** 缺少合法 reconciliation envelope
- **THEN** CLI SHALL 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
#### Scenario: 合法 reconciliation 被接受
- **WHEN** input 包含结构合法的 optimizer envelope
- **AND** 不存在 actionable finding
- **THEN** CLI SHALL 接受该结果
- **AND** SHALL 持久化 reconciliation history
#### Scenario: 只有 summary 时拒绝（verify-optimization）
- **WHEN** 输入仅包含 `status: NO_OPTIMIZATION_NEEDED` 和非空 summary
- **AND** 缺少合法 reconciliation envelope
- **THEN** CLI SHALL 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
### Requirement: 优化 finding reconciliation

Phase 2 SHALL 在初次 optimizer 调用中生成完整 findings 集，并在每个原子优化波次完成或失败后重新调用 optimizer。每次 reconciliation SHALL 基于当前代码、当前 findings、history 和 failedDirections 裁决全部非终态 findings。Master agent SHALL 只实现最新排序中的首个 actionable finding。

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
