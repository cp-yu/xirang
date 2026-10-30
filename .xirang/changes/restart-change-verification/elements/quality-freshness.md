---
entity: element-declaration
identity: quality-freshness
kind: element
parent: quality
title: Quality Freshness
definition: Quality Freshness 定义 quality 的记录匹配与状态判定引擎：`tasksFileHash` 计算、`evidenceFingerprint` 计算、按当前代码匹配历史记录得到的 `clean`/`dirty` 判定、归档兼容判定、gate 失败输出格式，以及 sync 后的 evidence fingerprint 增量刷新。它不定义命令面的输入与诊断形状，也不定义记录的写入时序（属于 Quality Writeback）。
---

## MODIFIED Sections

### Section: 记录匹配与状态判定

系统 SHALL 仅在当前 Change 根目录的活动质量快照及其配套日志中，按 evidence fingerprint 查找与当前代码一致的通过 Review 证据，而不是只读取最新一条 Review。存在当前格式、非空证据且 result 为 `PASS` 或 `PASS_WITH_WARNINGS`、fingerprint 与当前代码一致的记录时，状态 SHALL 为 `clean`；否则状态 SHALL 为 `dirty`。快照不存在或快照在配套日志中无对应记录时 SHALL 保守地为 `dirty`。

Review 证据匹配与当前 Optimization 台账 SHALL 独立取值。匹配到较早的通过记录时，当前方向状态、失败计数、已用方向额度、轮次判断、`stopReason` 与终态 SHALL 继续取自最新活动快照；不得回退到匹配 Review 附带的旧台账，也不得在最新快照无台账时从旧记录复活台账。status、后续 Review/Optimization 写入与 seal/Sync/Archive 门禁 SHALL 对同一当前台账作出一致判断。

已轮换到质量历史目录的记录 SHALL 不参与 `clean` 判定或当前台账选择。当前快照和日志轮换完成后，即使历史目录含与代码匹配的 PASS，当前状态仍 SHALL 为 `dirty`；新 Review 建立活动记录后只匹配该组活动记录。历史目录不成为额外的 runtime quality store。

- **记录匹配当前代码时为 clean**

  - 历史中存在一条 result 为 `PASS` 或 `PASS_WITH_WARNINGS` 且 fingerprint 与当前代码一致的 Review 记录
  - 状态 SHALL 为 `clean`

- **无记录时为 dirty**

  - change 目录中没有 Review 记录
  - 状态 SHALL 为 `dirty`

- **指纹不一致时为 dirty**

  - 重新计算的 fingerprint 与所有 Review 记录均不一致
  - 状态 SHALL 为 `dirty`
  - 输出 SHALL 列出导致不一致的文件路径

- **失败回滚后回到 clean**

  - 最新一条 Review 记录为 `FAIL_NEEDS_CORRECTIONS`
  - 工作区已回滚到更早一条通过的 Review 记录所对应的状态
  - 状态 SHALL 为 `clean`
  - SHALL NOT 因最新记录为失败而判为 `dirty`

- **匹配到的记录为失败时为 dirty**

  - 与当前代码 fingerprint 一致的记录 result 为 `FAIL_NEEDS_CORRECTIONS`
  - 状态 SHALL 为 `dirty`

- **Windows 路径正确匹配**

  - evidence 路径使用反斜杠表示
  - 系统 SHALL 将其规范化为相对 POSIX 路径后计算与比较指纹
  - SHALL 与已持久化路径匹配

- **恢复代码不恢复旧台账**：代码 A 的历史 PASS 台账已用方向数为 0，代码 B 后的最新活动台账已用方向数为 1 且终态为 `ABORTED_UNSAFE`；仅恢复代码 A 并完整保留活动记录后，状态 SHALL 为 `clean`，当前台账仍为已用方向数 1 和 `ABORTED_UNSAFE`，Optimization、seal、Sync 和 Archive 不得因此通过 unsafe 门禁。
- **失败计数不回退**：最新活动台账中方向已失败 2 次并被 `rejected`；回滚匹配到首次 PASS 后，该方向仍 SHALL 为 `rejected` 且失败计数为 2，后续写入保留最新历史。
- **台账独立于 Review 证据**：最新快照记录失败 Review、代码已恢复到历史 PASS 的状态时，SHALL 使用该 PASS 证明 `clean`，同时保留最新快照的优化进度；原始历史记录不得被改写。
