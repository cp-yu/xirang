## MODIFIED Requirements

### Requirement: 归档前必须具备新鲜的完整验证结果

系统 SHALL 在归档任意活动 change 之前取得一份 fresh 的 full verify 结果，并通过 CLI 工具（`openspec verify status` 或等价的 freshness 检查）执行门禁校验。该结果 SHALL 包含 optimization 字段，且其终局状态必须与 verify 的 checkpoint 生命周期语义一致。

#### Scenario: Archive 通过 CLI 校验 verify gate

- **WHEN** agent 准备归档某个 change
- **AND** agent 调用 `openspec archive <change-name>`（或模板中等价的 freshness 预检查）
- **AND** CLI 校验 `.verify-result.json` FRESH + archive-compatible
- **THEN** archive SHALL 复用该 verify 结果继续执行后续归档步骤
- **AND** SHALL NOT 退回到轻量 inline conformance check

#### Scenario: Verify 结果缺失或 STALE 时由 CLI 提示

- **WHEN** agent 调用 archive 相关 CLI
- **AND** `.verify-result.json` MISSING 或 STALE
- **THEN** CLI SHALL 以 exit 1 退出并输出具体原因
- **AND** agent SHALL 向用户展示选项：先运行 verify / 强制继续 / 放弃

#### Scenario: 优化被跳过的验证结果仍然有效

- **WHEN** `optimization.status` 为 `SKIPPED`
- **AND** 跳过原因合理（config 禁用 或 用户显式 `--skip-optimization`）
- **THEN** 结果 SHALL 被视为 archive-compatible

#### Scenario: PENDING_VERIFICATION 状态不得归档复用

- **WHEN** `optimization.status` 为 `PENDING_VERIFICATION`
- **THEN** verify 结果 SHALL NOT 被视为 archive-compatible
- **AND** CLI SHALL 输出 "Phase 2 未完成验证，请先完成 speculative fence"

#### Scenario: ABORTED_UNSAFE 硬阻塞

- **WHEN** `optimization.status` 为 `ABORTED_UNSAFE`
- **THEN** 即使顶层 result 为 PASS 也不得复用
- **AND** CLI SHALL 输出恢复指示

#### Scenario: [ADDED] Seal 后仅 Git HEAD 推进时复用验证

- **WHEN** Phase 2 已完成且 `.verify-result.json` 已通过 seal
- **AND** 当前工作区的 evidence fingerprint 未发生变化
- **AND** 当前 Git HEAD 与 verification context 中记录的 HEAD 不一致
- **THEN** `freshness.status` SHALL 保持为 `FRESH`
- **AND** archive SHALL 复用 archive-compatible 的 verify result
- **AND** archive SHALL NOT 仅因 HEAD 差异重新执行 full verify 或委托 reviewer
