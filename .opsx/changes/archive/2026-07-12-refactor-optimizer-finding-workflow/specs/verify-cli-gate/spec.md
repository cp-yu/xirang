## MODIFIED Requirements

### Requirement: Phase 2 双调用门禁

系统 SHALL 保留 `openspec verify phase2 <change-name> --type=<optimization|verification>` 双调用表面。`--type=optimization` SHALL 接受严格 reconciliation JSON envelope，校验 actions、稳定 ID 引用、dependencies、排序、唯一 selected、状态迁移、append-only history 和目标文件 hashes；`--type=verification` SHALL 记录 selected finding 的 speculative reviewer verdict。

#### Scenario: [ADDED] optimization 被禁用
- **WHEN** Phase 1 已通过、`optimization.enabled` 为 false 且输入 status 为 SKIPPED
- **THEN** CLI SHALL 设置 optimization.status 为 SKIPPED
- **AND** SHALL 允许进入 seal/archive

#### Scenario: [ADDED] 初次提交多个 findings
- **WHEN** optimizer envelope 包含多个合法 `add` actions
- **THEN** CLI SHALL 分配稳定 timestamp IDs
- **AND** SHALL 持久化排序后的 findings 与 history
- **AND** SHALL 将唯一首个 actionable finding 标为 selected
- **AND** SHALL 记录其目标文件 pre-implementation hashes

#### Scenario: [ADDED] 提交后续 reconciliation
- **WHEN** optimization 已包含 findings/history
- **AND** 新 envelope 引用既有 IDs并提交合法 actions
- **THEN** CLI SHALL 逐项应用 actions
- **AND** SHALL 保留既有 history
- **AND** SHALL 允许新增 finding 并重新选择首项

#### Scenario: [ADDED] verification 通过
- **WHEN** optimization.status 为 PENDING_VERIFICATION
- **AND** 输入引用当前 selected finding
- **AND** reviewer result 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** CLI SHALL 将 finding 标记为 verified
- **AND** SHALL 更新顶层 evidence snapshot
- **AND** SHALL 要求下一步重新调用 optimizer，而非直接 seal

#### Scenario: [ADDED] verification 失败但可重试
- **WHEN** reviewer result 为 FAIL_NEEDS_REMEDIATION
- **AND** 该 finding 方向失败次数小于 `optRetries`
- **THEN** CLI SHALL 追加 failed event 和方向证据
- **AND** SHALL 要求回滚并重新 reconciliation

#### Scenario: [ADDED] finding 失败次数耗尽
- **WHEN** 该 finding 方向失败次数达到 `optRetries`
- **THEN** CLI SHALL 将 finding 转为 rejected
- **AND** SHALL NOT 因此拒绝其他 actionable findings

#### Scenario: [ADDED] 非法 selected 被拒绝
- **WHEN** envelope 选择的 finding 不是 dependencies 已满足后的最高优先级 pending finding
- **THEN** CLI SHALL 以 exit 1 拒绝
- **AND** SHALL NOT 修改 `.verify-result.json`

#### Scenario: [ADDED] 调用顺序错误
- **WHEN** agent 在没有 selected/implemented finding 的情况下提交 `--type=verification`
- **THEN** CLI SHALL 输出必须先提交 optimization reconciliation 的诊断
- **AND** 以 exit 1 退出

#### Scenario: [REMOVED] 第一次调用 — 优化被配置禁用

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=optimization --input '<json>'`
- **AND** Phase 1 result 为 PASS 或 PASS_WITH_WARNINGS
- **AND** `optimization.enabled` 为 false
- **AND** 输入 `status` 为 `SKIPPED`
- **THEN** 系统 SHALL 设置 `optimization.status = SKIPPED`
- **AND** SHALL 写入 `.verify-result.json`（更新 optimization 对象）
- **AND** 输出 "Phase 2 skipped. 可进入 sync/archive"
- **AND** 以 exit 0 退出

#### Scenario: [REMOVED] 第一次调用 — 提交优化结果 (NO_OPTIMIZATION_NEEDED)

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=optimization --input '<json>'`
- **AND** Phase 1 result 为 PASS 或 PASS_WITH_WARNINGS
- **AND** `optimization.enabled` 不为 false
- **AND** 输入 `status` 为 `NO_OPTIMIZATION_NEEDED`
- **THEN** 系统 SHALL 设置 `optimization.status = NOT_NEEDED`
- **AND** SHALL 写入 `.verify-result.json`（更新 optimization 对象）
- **AND** 输出 "Phase 2 完成 (无需优化)。可进入 sync/archive"
- **AND** 以 exit 0 退出

#### Scenario: [REMOVED] 第一次调用 — 提交优化结果 (OPTIMIZATION_PROPOSED)

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=optimization --files '<paths>' --input '<json>'`
- **AND** Phase 1 result 为 PASS 或 PASS_WITH_WARNINGS
- **AND** 输入 `status` 为 `OPTIMIZATION_PROPOSED`
- **AND** `--files` 参数指定受优化影响的文件路径（逗号分隔）
- **THEN** 系统 SHALL 追加 `optimization.attempts` 条目（记录文件列表、时间戳、重试计数）
- **AND** SHALL 计算 `--files` 中每个文件的 SHA-256 存入 `optimization.affectedFileHashes`
- **AND** SHALL 设置 `optimization.status = PENDING_VERIFICATION`
- **AND** SHALL 记录输入 `summary` 中的优化方向到 `optimization.attempts`
- **AND** 以 exit 0 退出

#### Scenario: [REMOVED] 第二次调用 — 提交 speculative fence 结果 (通过)

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=verification --input '<json>'`
- **AND** `optimization.status` 为 `PENDING_VERIFICATION`
- **AND** 输入 `result` 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** 系统 SHALL 设置 `optimization.status = IMPROVED`
- **AND** SHALL 输出 "Phase 2 完成 (优化+验证通过)。可进入 sync/archive"
- **AND** 以 exit 0 退出

#### Scenario: [REMOVED] 第二次调用 — speculative fence 失败 (可重试)

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=verification --input '<json>'`
- **AND** 输入 `result` 为 FAIL_NEEDS_REMEDIATION
- **AND** `behaviorRetryCounter < config.optimization.optRetries`（默认 2）
- **THEN** 系统 SHALL 追加失败方向到 `optimization.failedDirections[]`
- **AND** 输出 "推测性验证失败 (尝试 N/<optRetries>)。请用不同策略重试优化"
- **AND** 以 exit 0 退出（中间态，agent 应回到 --type=optimization）

#### Scenario: [REMOVED] 第二次调用 — speculative fence 失败 (重试耗尽)

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=verification --input '<json>'`
- **AND** `behaviorRetryCounter >= config.optimization.optRetries`
- **THEN** 系统 SHALL 设置 `optimization.status = DEGRADED`
- **AND** SHALL 设置顶层 `result = PASS_WITH_WARNINGS`
- **AND** SHALL 输出 "Phase 2: N次优化尝试已安全回滚。可进入 sync/archive"
- **AND** 以 exit 0 退出

#### Scenario: [REMOVED] Phase 2 调用顺序错误

- **WHEN** agent 执行 `openspec verify phase2 <change-name> --type=verification`
- **AND** `optimization.status` 不是 `PENDING_VERIFICATION`
- **THEN** 系统 SHALL 输出 "尚未提交优化结果，请先调用 phase2 --type=optimization"
- **AND** 以 exit 1 退出
