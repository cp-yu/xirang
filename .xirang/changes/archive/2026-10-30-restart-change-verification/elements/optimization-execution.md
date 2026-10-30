---
entity: element-declaration
identity: optimization-execution
kind: element
parent: quality
title: Optimization Execution
definition: Optimization Execution 定义 Quality 中优化活动的执行协议：以代码已通过 Review 为入口条件逐轮推进、每轮由 fresh optimizer 判断方向、checkpoint 与失败回滚、两级优化额度控制、轮次台账持久化、每轮实现后的 clean-context 复核，以及收口驱动。它不定义方向数据合约（属于 Optimizer Findings），也不定义命令面的输入与诊断形状（属于 Quality CLI Gate）。
---

## MODIFIED Sections

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
  - SHALL 原子恢复三份当前状态文件并验证各自 SHA-256
  - SHALL 从最近成功 checkpoint 与恢复后的台账重新判断方向

- **终局状态保持兼容**

  - Optimization 收口
  - 终态 SHALL 为 `IMPROVED`、`DEGRADED`、`NOT_NEEDED`、`SKIPPED` 或 `ABORTED_UNSAFE`
  - 所有 `wip: opt-*` commits SHALL 保留

- **优化完成后保留 checkpoints**

  - Optimization 收口
  - 所有 `wip: opt-*` commits SHALL 保留
  - 系统 SHALL NOT 自动清理这些 commits

回滚保护 SHALL 覆盖当前 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 及当前 Change 内的全部质量历史目录。执行 `git reset --hard HEAD` 和 `git clean -fd` 前，SHALL 将这些数据完整保存到 repository 外并记录文件清单与 SHA-256；之后恢复并逐项校验，包括历史中未被 Git 跟踪的文件，不因 HEAD 中没有这些文件而删除它们。历史目录原先不存在时 SHALL 保留该事实，不伪造旧轮次。

恢复失败、校验不一致或历史文件缺失时 SHALL 停止，不提交新的优化结果。普通失败回滚 SHALL 保留当前台账的失败记录与预算，不调用重新验证的记录轮换流程。

- **重启后的优化失败**：旧轮次历史已保存在 Change 内，新方向未通过 Review；回滚只丢弃本次 speculative code，三份当前状态文件和所有旧轮次历史均保持保存时的字节，状态匹配成功 checkpoint 后可按当前台账报告失败尝试。
- **未跟踪的历史目录**：历史文件尚未被 Git 跟踪，`git clean -fd` 会清理它们；repository 外保存及恢复 SHALL 确保回滚后这些历史文件仍完整可读。
