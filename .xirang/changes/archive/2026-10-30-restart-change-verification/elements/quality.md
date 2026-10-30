---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中评估并改进项目结果代码质量的环节，由 Review 与 Optimization 两个活动共同完成。它以当前代码是否已经过 Review 作为唯一驱动：存在未经 Review 的代码变更时必须先执行 Review，只有当前代码已通过 Review 才可以执行 Optimization，二者交替进行直到当前代码已通过 Review 且不存在需要继续执行的优化事项。它包含代码状态判定、两个活动的进入与收口、优化过程中的判断记录，以及确认 Change Implementation 可以进入 Change Closure 的证据；它不包含 Apply 如何产生改动、Change Closure 如何收束，也不包含两个活动各自的判断标准。
---

## MODIFIED Sections

### Section: 代码状态决定进入的活动

Quality SHALL 以当前代码是否已经过 Review 作为选择活动的唯一依据。存在未经 Review 的代码变更时 SHALL 进入 Review；当前代码已通过 Review 时才可以进入 Optimization。Review 依据 SHALL 来自当前活动质量记录，已受控轮换的历史不满足本轮门禁；`clean` 不解除当前台账的终态约束。

- **存在未检测的代码变更**

  - 当前代码与最近一条通过的 Review 记录不一致，或尚无 Review 记录
  - Quality 的状态为 `dirty`
  - 只有 Review 可以继续

- **当前代码已通过 Review**

  - 当前活动记录中存在一条 Review 记录，其 result 为 `PASS` 或 `PASS_WITH_WARNINGS`，且其 fingerprint 与当前代码一致
  - Quality 的状态为 `clean`
  - Optimization 在当前台账允许继续时可以开始

## ADDED Sections

### Section: 活动 Change 的显式重新验证

Quality SHALL 允许尚未归档的活动 Change 在用户明确要求重新验证后，通过共享恢复 reference 在原 Change 内重新开始 Review → Optimization，不要求创建接续 Change。适用情况包括：`ABORTED_UNSAFE` 中止原因处理后重验；`NOT_NEEDED`、`IMPROVED` 等优化终态后实现或契约改变；旧 Review 的证据或审查依据不可信，即使代码未变仍要求重审。

原流程 SHALL 已停止推进，Reviewer、Optimizer、实现任务及其结果处理、回写和回滚 SHALL 与重启串行执行；Reviewer 仍在运行时 MUST NOT 重启。系统不提供并行旧任务结果提交的轮次标识协议。

重启 SHALL 保留当前代码、已有 commits/checkpoints、旧质量日志与失败原因。旧轮次的验证结论、优化进度、终态、已用方向额度和方向失败计数 SHALL 不满足或占用新轮次的验证与优化门禁；旧记录仅作为历史参考。新轮次 SHALL 重新执行 fresh-context Review，即使旧 PASS 的文件指纹仍匹配，也不得直接复用该 PASS。新 Review 未通过时 SHALL 修正后再次 Review；通过后才可建立或验证本轮 checkpoint 并开始从零计算的 Optimization，随后按正常规则 seal 与进入 Closure。

普通 Review 失败后的修正、优化方向失败后的回滚、会话中断后的续跑 SHALL 继续使用原轮次并保留计数与进度，不得自动转换为重启。

- **同代码重新审查**：旧轮次已得到 `NOT_NEEDED`，用户因证据不足要求重审；完成受控轮换后当前状态为 `dirty`，新 Review 通过前不进入 Optimization，旧 PASS 不使本轮变为 `clean`。
- **unsafe 原 Change 重验**：旧轮次为 `ABORTED_UNSAFE`，用户授权原 Change 重验；保留原代码和失败历史，fresh Review 仍可报告未解决的问题，重启本身不构成问题已解决的证明。
- **运行中的 Reviewer**：Reviewer 尚未返回时用户要求重启；Agent 不轮换记录、不启动并行的新 Review，须先结束原流程。
