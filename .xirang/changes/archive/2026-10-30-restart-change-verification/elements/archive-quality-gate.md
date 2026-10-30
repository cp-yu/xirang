---
entity: element-declaration
identity: archive-quality-gate
kind: element
parent: change-closure
title: Archive Quality Gate
definition: Archive Quality Gate 定义归档前必须具备的质量记录门禁：必须先存在与当前代码一致且通过的 Review 记录，并且 Optimization 已收口且终态不是 ABORTED_UNSAFE；freshness 基于显式持久化的证据判定，archive rerun 复用与 standalone quality 一致的 subagent-orchestrated 执行模型。它不定义 Review 与 Optimization 自身的判断标准，也不定义归档移动、git 交接或 sync 的行为。
---

## MODIFIED Sections

### Section: Archive rerun 使用 quality 执行模型

系统 SHALL 在 Review 记录缺失或不一致触发 full quality rerun 时，复用与 standalone quality 一致的 subagent-orchestrated execution model。

- **archive rerun 复用 subagent orchestration**

  - archive 检测到 Review 记录 missing 或 dirty
  - archive SHALL 执行与 standalone quality 相同的 subagent-orchestrated full quality 合约
  - SHALL 复用相同的 Optimization eligibility、checkpoint 与失败回滚语义

- **archive-time full quality 不得私自跳过可执行的 Optimization**

  - archive 因 Review 记录缺失或 dirty 而重新执行 full quality 流程
  - 新的 Review result 为 `PASS` 或 `PASS_WITH_WARNINGS`
  - `.xirang/config.yaml` 未禁用 optimization
  - 用户未显式拒绝优化
  - 该流程 SHALL 继续执行与 standalone quality 完全一致的 Optimization 合约
  - SHALL NOT 仅因 archive-time 存在未提交改动风险而降级成 Review-only 流程
  - 只有在 config 禁用或用户显式拒绝时，记录才可包含 `SKIPPED` 终态

Archive Agent SHALL 与 Apply 使用同一共享恢复 reference。遇到当前 `ABORTED_UNSAFE` 时，SHALL 在常规 dirty/clean 路由前停止自动推进并展示该 reference；用户明确要求重新验证且原流程停止后，才可按 reference 保存并校验历史、轮换活动记录、重新执行 fresh Review 和从零开始的 Optimization。其他优化终态后的显式重验同样适用。未经新轮次有效 Review 和优化收口，不得复用历史目录中的旧 PASS 或终态进入正常归档；既有显式绕过门禁通道的授权规则不受影响。
