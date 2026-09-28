---
entity: element-declaration
identity: optimization-execution
kind: element
parent: quality
title: Optimization Execution
definition: Optimization Execution 定义 Quality 中优化活动的执行协议：以代码已通过 Review 为入口条件逐轮推进、每轮由 fresh optimizer 判断方向、checkpoint 与失败回滚、两级优化额度控制、轮次台账持久化、每轮实现后的 clean-context 复核，以及收口驱动。它不定义方向数据合约（属于 Optimizer Findings），也不定义命令面的输入与诊断形状（属于 Quality CLI Gate）。
---

## Specification

### Section: 最优性检验执行

系统 SHALL 在当前代码已通过 Review、Optimization 尚未收口、未因 `ABORTED_UNSAFE` 阻塞、且方向数未达 `optimization.directionLimit` 时进入下一轮 Optimization，除非配置或用户显式拒绝。每轮 MUST 至少由 fresh optimizer 判断一次是否存在可优化方向，master agent MUST NOT 替代 optimizer 判断。Optimizer SHALL 返回一份方向台账；发现正确性、spec 或 artifact 冲突时 SHALL 返回阻塞观察并停止选择方向。

- **代码通过 Review 后进入 Optimization**

  - 当前代码已通过 Review
  - optimization 已启用且未显式拒绝
  - 系统 SHALL 委托 fresh optimizer 判断当前代码是否存在可优化方向

- **配置或用户拒绝优化**

  - `optimization.enabled` 为 false 或用户显式拒绝优化
  - 收口记录 SHALL 使用 `stopReason: USER_DECLINED`
  - 终态 SHALL 为 `SKIPPED`
  - 已有的 Review 记录 SHALL 保持不变

- **Review 副作用不阻止 Optimization**

  - Review 已写回 `tasks.md` 或更新 quality 记录
  - optimization 未被拒绝
  - 系统 SHALL 继续判断优化方向
  - SHALL NOT 因工作区非空而自动跳过

### Section: Checkpoint 与回滚

系统 SHALL 以非空 git commit 保存每个已通过 Review 的状态，并在每个优化轮次通过复核后创建增量 checkpoint。轮次复核失败时 SHALL 丢弃当轮未提交实现并恢复最近成功 checkpoint，同时保留已写入的 quality 记录；达到该方向失败上限时 SHALL 将该方向标记为 `rejected`，并继续处理其他方向。

- **创建 baseline checkpoint**

  - 代码已通过 Review 且 Optimization 即将开始
  - 工作区包含本次 Apply 的未提交变更
  - 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`
  - SHALL 将 commit SHA 持久化为 `.apply-isolation.json.optimizationBaselineCommit`

- **干净工作区不得创建空 baseline**

  - Optimization 启动时工作区干净
  - 系统 SHALL 只复用已验证 baseline 或用户明确记录的完整实现 commit
  - MUST NOT 使用 `--allow-empty`

- **以方向 ID 创建增量 checkpoint**

  - 某方向通过该轮复核
  - 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-r${N} (<direction-id>: <description>)"`

- **失败轮次回滚**

  - 该轮复核返回 `FAIL_NEEDS_CORRECTIONS`
  - CLI 已把该轮结论与失败方向写入 quality 记录
  - Apply SHALL 把更新后的 quality 记录与 `.apply-isolation.json` 快照到 repository 外
  - SHALL 执行 `git reset --hard HEAD` 和 `git clean -fd` 丢弃该轮实现
  - SHALL 原子恢复两个持久状态文件并验证各自 SHA-256
  - SHALL 从最近成功 checkpoint 与恢复后的台账重新判断方向

- **终局状态保持兼容**

  - Optimization 收口
  - 终态 SHALL 为 `IMPROVED`、`DEGRADED`、`NOT_NEEDED`、`SKIPPED` 或 `ABORTED_UNSAFE`
  - 所有 `wip: opt-*` commits SHALL 保留

- **优化完成后保留 checkpoints**

  - Optimization 收口
  - 所有 `wip: opt-*` commits SHALL 保留
  - 系统 SHALL NOT 自动清理这些 commits

### Section: 重试预算控制

`config.optimization.directionLimit` SHALL 限制可选取的新方向数；`config.optimization.directionRetries` SHALL 只限制同一方向的失败次数；`config.optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，默认 `low`。成功方向 MUST NOT 消耗方向失败额度，也 MUST NOT 被该额度限制；低于门槛的方向 MUST NOT 被选取，也 MUST NOT 消耗方向额度；方向数用尽后 SHALL 只允许收口。

- **成功方向不消耗失败额度**

  - 选中方向通过该轮复核
  - 该方向的失败计数 SHALL 保持不变
  - 系统 SHALL 继续判断其他方向

- **失败方向达到上限**

  - 同一方向失败次数达到 `directionRetries`
  - 该方向 SHALL 转为 `rejected`
  - 系统 SHALL 继续处理其他可执行方向

- **方向数用尽**

  - 已选方向数达到 `directionLimit`
  - 系统 SHALL 拒绝选择新方向
  - SHALL 要求以 `DIRECTION_LIMIT_REACHED` 收口

- **低于门槛的方向不被选取**

  - 某个待选方向的 `impactLevel` 低于 `minImpactLevel`
  - 该方向 SHALL 永不被选取，也不消耗方向额度
  - 当全部待选方向均低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口

### Section: 优化结果持久化

系统 SHALL 把每轮的 optimizer 判断、方向台账、两级计数与收口结论持久化到当前状态快照，并把该轮记录追加到 append-only 日志。台账 SHALL 只保存方向数据、判断理由、证据引用与 hashes，不重复保存代码、diff 或完整实现快照。旧记录缺少新字段时 SHALL 按空集合读取。

- **旧记录按空集合读取**

  - 状态记录包含 optimization 但不含 directions 或轮次历史
  - 系统 SHALL 将缺失字段解释为空数组
  - SHALL NOT 阻止 status、seal 或 archive compatibility

- **Degraded 结果持久化**

  - Optimization 因一个或多个 `rejected` 方向收口但 Review 记录保持可用
  - Review 记录的 result SHALL 保持 `PASS_WITH_WARNINGS` 或 `PASS`
  - Optimization 终态 SHALL 为 `DEGRADED`
  - 已验证方向的历史 SHALL 保留

- **记录失败方向与方向事件**

  - 选中方向导致该轮复核失败
  - 系统 SHALL 追加该方向的 `failed` 事件及失败证据
  - SHALL 更新该方向的失败方向记录与失败计数

### Section: 优化 finding reconciliation

每个优化轮次完成或失败后 SHALL 重新由 fresh optimizer 判断是否存在可优化方向。每轮判断 SHALL 基于当前代码、已有方向台账、失败方向与当前计数，并 SHALL 说明本轮选中方向的相对优先理由。Master agent SHALL 只实现本轮选中的方向。

- **每轮结束后重新判断**

  - 选中方向通过该轮复核
  - 系统 SHALL 保存当前成功 checkpoint
  - SHALL 重新委托 fresh optimizer 判断剩余可优化方向

- **master 发现冲突时提交证据**

  - master 发现选中方向与 spec、代码或测试证据冲突
  - SHALL 在台账中提交该方向的撤销理由与证据
  - SHALL NOT 静默跳过该方向

### Section: 每轮实现后由 fresh reviewer 复核

Master 实现选中方向后，系统 SHALL 委托 clean-context reviewer 复核该轮改动。Reviewer SHALL 验证该方向的 preservation constraints 是否保持，但 SHALL NOT 重新判断该方向的优化价值。该轮结论 SHALL 通过 `xirang quality review` 记录为一次 Review。

- **fresh reviewer 复核轮次改动**

  - master 已实现选中方向
  - 系统 SHALL 委托 fresh reviewer，并传入方向 ID、preservation constraints、实现证据与当前代码
  - SHALL 以该 reviewer 的结论记录一次 Review
  - 顶层 agent MUST NOT 自行决定该结论
