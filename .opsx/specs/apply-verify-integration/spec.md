---
element: cap.apply.verify-integration
---

# apply-verify-integration Specification

## Purpose
Define the reviewed Apply Verification Integration contract for Apply Phase 1 SHALL 先写回再持久化; apply 作为编译步骤; 失败方向记录; and 2 additional reviewed Requirements.

## Requirements
### Requirement: Apply Phase 1 SHALL 先写回再持久化

`opsx-apply-change` SHALL 先委托 fresh reviewer，再校验其结构化 payload，并只应用 CRITICAL `writeBackPlan`，最后调用 `opsx verify phase1` 持久化 payload。CLI 持久化 SHALL 发生在 writeback 之后，使 `tasksFileHash` 对应最终写入的 `tasks.md`。

#### Scenario: CRITICAL writeback 先于 Phase 1 record

- **WHEN** reviewer 返回包含 CRITICAL `writeBackPlan` 的合法 payload
- **THEN** Apply SHALL 先更新 `tasks.md`
- **AND** SHALL 在更新完成后调用 `opsx verify phase1 "<change-name>" --input '<json>' --json`
- **AND** CLI SHALL 从最终 `tasks.md` 计算 `tasksFileHash`

#### Scenario: 非 CRITICAL finding 不写回

- **WHEN** reviewer payload 只包含 WARNING 或 SUGGESTION
- **THEN** Apply SHALL NOT 将这些 finding 写入 `tasks.md`

### Requirement: apply 作为编译步骤

`opsx-apply-change` SHALL 从生成 reference 读取 finding-driven Phase 2 协议。Phase 2 SHALL 创建非空 baseline commit，调用 fresh optimizer 生成或 reconciliation 全部 findings，只实现最新排序中的首个 actionable finding，调用 CLI 记录 pre-implementation hashes，由 master 按 TDD 编码，再由 fresh reviewer 验证。

Phase 0 与 Phase 1 SHALL NOT 创建 commit。正常情况下，Phase 2 baseline SHALL 是本次 Apply 的首个 commit，且 MUST NOT 使用 `--allow-empty`。每个波次通过或失败后 SHALL 重新调用 optimizer。Checkpoint SHALL 使用 git commit；失败回滚 SHALL 使用 `git reset --hard HEAD` 和 `git clean -fd`，不得使用 stash 或 tag。

#### Scenario: finding 驱动的优化循环
- **WHEN** Phase 2 启动
- **THEN** apply SHALL 创建非空 baseline checkpoint，并将其 SHA 写入 `.apply-isolation.json.phase2BaselineCommit`
- **AND** SHALL spawn fresh optimizer 获取完整 findings
- **AND** SHALL 只实现唯一 selected finding
- **AND** SHALL spawn fresh reviewer 执行 speculative re-verify
- **AND** SHALL 在波次结束后重新 reconciliation

#### Scenario: 成功 checkpoint 包含 finding ID
- **WHEN** selected finding 通过 reviewer
- **THEN** apply SHALL 创建包含 finding ID 的增量 checkpoint commit
- **AND** SHALL 保留该 commit供后续波次作为最近成功状态

#### Scenario: 失败回滚保留 verify state 且不残留 speculative edits
- **WHEN** reviewer 返回 FAIL
- **AND** Phase 2 CLI 已将 failed event 与 `failedDirections` 写入 `.verify-result.json`
- **THEN** Apply SHALL 将 `.verify-result.json` 与 `.apply-isolation.json` 快照到 repository 外并分别记录 SHA-256
- **AND** isolation snapshot SHALL 保留未提交的 `phase2BaselineCommit`
- **AND** SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
- **AND** SHALL 原子恢复两个持久状态文件并校验各自 SHA-256
- **AND** 下一轮 SHALL 从最近成功 checkpoint 代码及恢复后的持久失败状态重新 reconciliation
- **AND** 恢复失败、hash 不匹配或仍有 speculative file 时 SHALL 停止

#### Scenario: 终局状态保持兼容
- **WHEN** Phase 2 终止
- **THEN** optimization.status SHALL 为 IMPROVED、DEGRADED、NOT_NEEDED、SKIPPED 或 ABORTED_UNSAFE
- **AND** 所有 `wip: opt-*` commits SHALL 保留

### Requirement: 失败方向记录

系统 SHALL 以 finding ID、目标位置、关键设计边界和 reviewer 失败证据记录失败方向。未达 `optRetries` 时 optimizer MAY 提供实质不同方案；达到上限后 SHALL reject 该方向但继续评估其他 findings。

#### Scenario: 记录 finding 失败方向
- **WHEN** selected finding speculative re-verify 失败
- **THEN** optimization history SHALL 追加 failed event
- **AND** failedDirections SHALL 记录该 finding 的设计方向和失败原因

#### Scenario: 后续 optimizer 避免重复
- **WHEN** optimizer 重新启动
- **THEN** SHALL 读取 history 与 failedDirections
- **AND** SHALL NOT 通过换措辞重复已耗尽方向

### Requirement: 主 agent 和 subagent 角色分工

系统 SHALL 区分三类职责：reviewer 判断 specs 和行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集和有证据的 challenge。

Master SHALL 按 selected finding 的 keyDesign 和 preservation constraints 实现，MUST NOT 自行生成、跳过或 reject optimization finding。实质偏离前 SHALL 记录 `masterChallenge` 并重新调用 optimizer。

#### Scenario: optimizer 提供判断与关键设计
- **WHEN** Phase 2 optimization 执行
- **THEN** 系统 SHALL spawn fresh optimizer
- **AND** optimizer SHALL 输出 findings、修改意见、keyDesign 和 validation
- **AND** SHALL NOT 修改文件或输出逐字补丁

#### Scenario: master 实现 selected finding
- **WHEN** CLI 已选择首个 actionable finding
- **THEN** master SHALL 按 TDD 修改代码和测试
- **AND** SHALL 记录 finding ID及任何非实质实现细节差异

#### Scenario: reviewer 独立验证
- **WHEN** master 完成 selected finding
- **THEN** 系统 SHALL spawn fresh reviewer
- **AND** reviewer SHALL 判断 spec 和 preservation constraints 是否保持
- **AND** SHALL NOT 重新判断该 finding 是否值得优化

### Requirement: 配置驱动优化控制

`optimization.enabled` SHALL 控制 Phase 2 是否运行；`optimization.optRetries` SHALL 只限制同一失败方向，不限制成功波次数。成功波次 SHALL 持续到无 actionable finding 或确定性停滞。

#### Scenario: 多个成功 finding 超过 optRetries 数量
- **WHEN** `optRetries` 为 2 且存在三个依次验证通过的 findings
- **THEN** apply SHALL 完成三个波次
- **AND** SHALL NOT 以成功次数消耗 optRetries

#### Scenario: skip optimization
- **WHEN** 用户传入 `--skip-optimization`
- **THEN** 系统 SHALL 设置 optimization.status 为 SKIPPED
- **AND** SHALL 直接进入 Phase 3 Seal
