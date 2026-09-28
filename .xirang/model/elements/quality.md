---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中评估并改进项目结果代码质量的环节，由 Review 与 Optimization 两个活动共同完成。它以当前代码是否已经过 Review 作为唯一驱动：存在未经 Review 的代码变更时必须先执行 Review，只有当前代码已通过 Review 才可以执行 Optimization，二者交替进行直到当前代码已通过 Review 且不存在需要继续执行的优化事项。它包含代码状态判定、两个活动的进入与收口、优化过程中的判断记录，以及确认 Change Implementation 可以进入 Change Closure 的证据；它不包含 Apply 如何产生改动、Change Closure 如何收束，也不包含两个活动各自的判断标准。
---

## Specification

### Section: 每次修改后先执行 Review

Quality SHALL 在每次 Apply 修改项目后先执行 clean-context Review。

- **项目状态被修改**

  - Apply 完成一轮写入
  - Quality 进入 Review

### Section: 代码状态决定进入的活动

Quality SHALL 以当前代码是否已经过 Review 作为选择活动的唯一依据。存在未经 Review 的代码变更时 SHALL 进入 Review；当前代码已通过 Review 时才可以进入 Optimization。

- **存在未检测的代码变更**

  - 当前代码与最近一条通过的 Review 记录不一致，或尚无 Review 记录
  - Quality 的状态为 `dirty`
  - 只有 Review 可以继续

- **当前代码已通过 Review**

  - 存在一条 Review 记录，其 result 为 `PASS` 或 `PASS_WITH_WARNINGS`，且其 fingerprint 与当前代码一致
  - Quality 的状态为 `clean`
  - Optimization 可以开始

### Section: Review 通过后建立 Baseline

首次 Review 通过的项目状态 SHALL 成为 baseline checkpoint。

- **初始实现通过 Review**

  - 当前状态首次满足正确性门禁
  - Quality 保存 baseline checkpoint

### Section: 成功优化推进 Checkpoint

每个优化轮次经 Apply 实现并重新通过 Review 后，当前项目状态 SHALL 成为新的 successful checkpoint。

- **优化实现通过 Review**

  - 优化轮次产生的代码变更通过 Review
  - Quality 推进 successful checkpoint

### Section: 失败优化恢复 Checkpoint

优化轮次未通过 Review 时，Quality SHALL 恢复最近的 successful checkpoint。

- **优化产生不合格状态**

  - 优化轮次产生的代码变更未通过 Review
  - Quality 回到最近成功状态

### Section: 保留失败方向与优化历史

失败轮次恢复后，Quality SHALL 保留 Review 结论、失败方向与优化判断记录，使后续评估仍可读取失败证据与历史。

- **恢复成功状态**

  - Quality 丢弃未通过的优化改动
  - 恢复后的状态仍可读取失败方向与轮次记录

### Section: 仅以最新成功状态完成

Quality SHALL 仅在最新项目状态已成为 successful checkpoint 时完成。

- **当前状态尚未通过 Review**

  - 最新修改仍是未通过 Review 的状态
  - Quality 不得完成

### Section: 收口后确认可进入 Change Closure

Quality SHALL 仅在当前代码已通过 Review、Optimization 已收口且终态不是 `ABORTED_UNSAFE`、且用于判断的证据仍然有效时，确认 Change Implementation 可以进入 Change Closure。

- **Optimization 尚未收口**

  - 还没有任何收口记录
  - Quality 不得确认进入 Change Closure

- **验证证据必须仍然有效**

  - Quality 无法以现有记录支持当前代码已通过 Review 的结论
  - 它要求重新执行 Review
