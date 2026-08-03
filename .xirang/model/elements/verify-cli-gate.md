---
entity: element-declaration
identity: verify-cli-gate
kind: element
parent: verify
title: Verify CLI Gate
definition: Verify CLI Gate 定义 `xirang verify` 命令面的门禁契约：Phase 1 入口门禁、Phase 2 双调用门禁（optimization reconciliation 与 speculative verification）、Seal 校验与 status 输出语义。
---

## Requirements

### Requirement: Phase 1 入口门禁

系统 SHALL 提供 `xirang verify phase1 <change-name>` 命令，在接受 agent 的 Phase 1 结果前先校验入口条件。

#### Scenario: 入口条件通过

- **WHEN** agent 执行 `xirang verify phase1 <change-name> --input '<json>'`
- **AND** `tasks.md` 存在且包含 checkbox 任务
- **AND** change 目录存在
- **THEN** 系统 SHALL 校验 JSON 输入结构（`result`、`issues`、`evidenceFiles` 字段）
- **AND** SHALL 计算 `tasksFileHash` 与 `evidenceFingerprint`
- **AND** SHALL 将 canonical Phase 1 payload 写入 `.verify-result.json`
- **AND** 当 result 为 PASS/PASS_WITH_WARNINGS 时 SHALL 初始化 `optimization.status = PENDING_VERIFICATION`，防止 Phase 1-only 结果通过 sync/archive 门禁
- **AND** 输出下一步指令并以 exit 0 退出

### Requirement: Phase 2 双调用门禁

系统 SHALL 保留 `xirang verify phase2 <change-name> --type=<optimization|verification>` 双调用表面。`--type=optimization` SHALL 接受严格 reconciliation JSON envelope，校验 actions、稳定 ID 引用、dependencies、排序、唯一 selected、状态迁移、append-only history 和目标文件 hashes；`--type=verification` SHALL 记录 selected finding 的 speculative reviewer verdict。

#### Scenario: optimization 被禁用
- **WHEN** Phase 1 已通过、`optimization.enabled` 为 false 且输入 status 为 SKIPPED
- **THEN** CLI SHALL 设置 optimization.status 为 SKIPPED
- **AND** SHALL 允许进入 seal/archive

#### Scenario: 初次提交多个 findings
- **WHEN** optimizer envelope 包含多个合法 `add` actions
- **THEN** CLI SHALL 分配稳定 timestamp IDs
- **AND** SHALL 持久化排序后的 findings 与 history
- **AND** SHALL 将唯一首个 actionable finding 标为 selected
- **AND** SHALL 记录其目标文件 pre-implementation hashes

#### Scenario: verification 通过
- **WHEN** optimization.status 为 PENDING_VERIFICATION
- **AND** 输入引用当前 selected finding
- **AND** reviewer result 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** CLI SHALL 将 finding 标记为 verified
- **AND** SHALL 更新顶层 evidence snapshot
- **AND** SHALL 要求下一步重新调用 optimizer，而非直接 seal

#### Scenario: verification 失败但可重试
- **WHEN** reviewer result 为 FAIL_NEEDS_CORRECTIONS
- **AND** 该 finding 方向失败次数小于 `optRetries`
- **THEN** CLI SHALL 追加 failed event 和方向证据
- **AND** SHALL 要求回滚并重新 reconciliation

#### Scenario: 非法 selected 被拒绝
- **WHEN** envelope 选择的 finding 不是 dependencies 已满足后的最高优先级 pending finding
- **THEN** CLI SHALL 以 exit 1 拒绝
- **AND** SHALL NOT 修改 `.verify-result.json`

#### Scenario: 调用顺序错误
- **WHEN** agent 在没有 selected/implemented finding 的情况下提交 `--type=verification`
- **THEN** CLI SHALL 输出必须先提交 optimization reconciliation 的诊断
- **AND** 以 exit 1 退出
#### Scenario: 提交后续 reconciliation
- **WHEN** optimization 已包含 findings/history
- **AND** 新 envelope 引用既有 IDs并提交合法 actions
- **THEN** CLI SHALL 逐项应用 actions
- **AND** SHALL 保留既有 history
- **AND** SHALL 允许新增 finding 并重新选择首项
#### Scenario: finding 失败次数耗尽
- **WHEN** 该 finding 方向失败次数达到 `optRetries`
- **THEN** CLI SHALL 将 finding 转为 rejected
- **AND** SHALL NOT 因此拒绝其他 actionable findings
### Requirement: Seal 校验

系统 SHALL 提供 `xirang verify seal <change-name>` 命令，校验 `.verify-result.json` 的结构完整性和字段合法性。

#### Scenario: Seal 校验通过

- **WHEN** agent 执行 `xirang verify seal <change-name>`
- **AND** `.verify-result.json` 存在且结构完整
- **AND** 所有必需字段存在且值合法
- **AND** `optimization.status` 为终局状态（非 PENDING_VERIFICATION）
- **THEN** 系统 SHALL 输出 seal hash
- **AND** 以 exit 0 退出

#### Scenario: Seal 校验失败

- **WHEN** `.verify-result.json` 缺失必需字段或字段值非法
- **THEN** 系统 SHALL 输出缺失/非法字段列表
- **AND** 以 exit 1 退出

### Requirement: Verify status output semantics

系统 SHALL 提供 `xirang verify status <change-name>` 命令，并在 JSON 与文本输出中区分 freshness 判定、阻塞检查和非阻塞 informational 诊断。

#### Scenario: JSON status exposes HEAD information separately

- **WHEN** agent 执行 `xirang verify status <change-name> --json`
- **AND** verification context 中记录的 Git HEAD 与当前 HEAD 不一致
- **AND** 其他 freshness 硬条件均通过
- **THEN** 输出 SHALL 将 `freshness.status` 设为 `FRESH`
- **AND** `freshness.checks` 与 `freshness.details` SHALL NOT 包含 Git HEAD 条目
- **AND** 输出 SHALL 在 `freshness.information.gitHeadCommit` 中包含 `matches: false`

#### Scenario: Freshness status remains the decision signal

- **WHEN** agent 消费 `verify status --json` 输出决定是否重新执行 full verify
- **THEN** agent SHALL 仅依据 `freshness.status` 判断 freshness
- **AND** SHALL NOT 从 `freshness.checks`、`freshness.details` 或 `freshness.information` 推导 STALE
#### Scenario: Text status labels HEAD drift as information
- **WHEN** `xirang verify status <change-name>` 返回 FRESH 且 Git HEAD 信息不匹配
- **THEN** 文本输出 SHALL 包含 `Verify gate passed.`
- **AND** SHALL 使用 `Information:` 展示 HEAD 差异
- **AND** SHALL NOT 使用 `Warnings:` 表示该 HEAD 差异
