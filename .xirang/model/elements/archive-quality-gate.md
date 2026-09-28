---
entity: element-declaration
identity: archive-quality-gate
kind: element
parent: change-closure
title: Archive Quality Gate
definition: Archive Quality Gate 定义归档前必须具备的质量记录门禁：必须先存在与当前代码一致且通过的 Review 记录，并且 Optimization 已收口且终态不是 ABORTED_UNSAFE；freshness 基于显式持久化的证据判定，archive rerun 复用与 standalone quality 一致的 subagent-orchestrated 执行模型。它不定义 Review 与 Optimization 自身的判断标准，也不定义归档移动、git 交接或 sync 的行为。
---

## Specification

### Section: 归档前必须具备新鲜的完整验证记录

系统 SHALL 在归档任意活动 change 之前取得一份与当前代码一致且通过的 Review 记录，并通过 CLI 工具执行门禁校验。该 change SHALL 同时具备已收口的 Optimization 记录，其终态必须与 quality 生命周期语义一致。

- **Archive 通过 CLI 校验 quality gate**

  - agent 准备归档某个 change
  - CLI 校验 quality 记录为 fresh 且 archive-compatible
  - archive SHALL 复用该结果继续执行后续归档步骤
  - SHALL NOT 退回到轻量 inline conformance check

- **Review 记录缺失或状态为 dirty 时由 CLI 提示**

  - agent 调用 archive 相关 CLI
  - 不存在 quality 状态记录，或当前代码与通过的 Review 记录不一致
  - CLI SHALL 以 exit 1 退出并输出具体原因
  - agent SHALL 向用户展示选项：先运行 quality Review / 强制继续 / 放弃

- **优化被跳过的记录仍然有效**

  - Optimization 终态为 `SKIPPED`
  - 跳过原因合理（config 禁用或用户显式拒绝）
  - 结果 SHALL 被视为 archive-compatible

- **尚未收口时不得归档复用**

  - 还没有任何 Optimization 收口记录
  - 该结果 SHALL NOT 被视为 archive-compatible
  - CLI SHALL 输出未收口的具体原因

- **ABORTED_UNSAFE 硬阻塞**

  - Optimization 终态为 `ABORTED_UNSAFE`
  - 即使 Review 记录为通过也不得复用
  - CLI SHALL 输出恢复指示

- **Seal 后仅 Git HEAD 推进时复用记录**

  - Optimization 已收口且记录已通过 seal
  - 当前工作区的 evidence fingerprint 未发生变化
  - 当前 Git HEAD 与记录中的 HEAD 不一致
  - 代码状态 SHALL 保持为 `clean`
  - archive SHALL 复用 archive-compatible 的记录
  - archive SHALL NOT 仅因 HEAD 差异重新执行 full quality 流程

### Section: Freshness 基于显式验证证据判定

系统 SHALL 基于显式持久化的验证证据判定 Review 记录是否可用于归档。Optimization 字段存在不影响 freshness 判定，但其终态会影响 archive 是否可复用该结果。

- **Freshness 判定标准**

  - archive 检查 Review 记录
  - 系统 SHALL 判定为 fresh 当且仅当 ALL of:
  - 记录的 `evidenceFingerprint` 匹配重新计算的 fingerprint
  - 记录的 `contractVersion` 是当前版本
  - result 为 `PASS` 或 `PASS_WITH_WARNINGS`
  - `tasksFileHash` 不参与 fresh/`dirty` 判定
  - `gitHeadCommit` 不匹配时 SHALL 作为 informational 报告，不单独改变状态判定

- **Fresh 但 optimization 不可复用**

  - Review 记录通过 freshness 判定
  - Optimization 终态为 `ABORTED_UNSAFE`
  - archive SHALL 仍然拒绝复用该结果
  - SHALL 将其报告为"验证记录新鲜，但优化恢复状态不安全"

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

### Section: Archive 与 Sync 双重门禁

`xirang archive` 命令 SHALL 在执行归档前校验 quality 和 sync 状态。默认强制执行，`--no-verify` 标志提供显式用户授权绕过通道。

- **双重门禁通过，继续 archive**

  - agent 执行 `xirang archive <change-name>`
  - quality gate 通过（记录 fresh、result 可接受、Optimization 终态非 `ABORTED_UNSAFE`）
  - sync 已完成
  - 系统 SHALL 继续执行 archive 逻辑

- **门禁不通过，合并询问**

  - agent 执行 `xirang archive <change-name>`
  - quality gate 或 sync gate 任一不通过
  - 系统 SHALL 输出两个门禁的合并状态
  - SHALL 以 exit 1 退出
  - agent SHALL 向用户展示合并选项：先运行 quality+sync / 仅 sync / 强制继续 / 放弃

- **用户显式授权绕过门禁**

  - agent 执行 `xirang archive <change-name> --no-verify`
  - 用户未同时使用 `--yes` 标志
  - 系统 SHALL 显示风险警告并要求交互式确认
  - 用户拒绝确认
  - archive SHALL 取消并提示使用标准 quality gate
  - 用户确认授权
  - 系统 SHALL 记录 `[AUTHORIZED]` 审计日志
  - SHALL 跳过 quality 和 sync 门禁检查
  - SHALL 继续执行 archive 逻辑

- **--yes 模式下的 --no-verify 静默绕过**

  - agent 执行 `xirang archive <change-name> --no-verify --yes`
  - 系统 SHALL 跳过交互式确认
  - SHALL 记录 `[AUTHORIZED]` 审计日志
  - SHALL 直接跳过 quality 和 sync 门禁检查
