---
entity: element-declaration
identity: apply-verify-integration
kind: capability
parent: apply
title: Apply Verify Integration
definition: Apply Verify Integration 定义 Apply 与 Verify 的集成契约：Phase 1 先写回再持久化、Phase 2 finding 驱动优化循环、失败方向记录、主 agent 与 subagent 角色分工，以及配置驱动优化控制。
---

## Requirements

### Requirement: Apply Phase 1 SHALL 先写回再持久化

`xirang-apply-change` SHALL 先委托 fresh reviewer，再校验其结构化 payload，并只应用 CRITICAL `writeBackPlan`，最后调用 `xirang verify phase1` 持久化 payload。CLI 持久化 SHALL 发生在 writeback 之后，使 `tasksFileHash` 对应最终写入的 `tasks.md`。

#### Scenario: CRITICAL writeback 先于 Phase 1 record

- **WHEN** reviewer 返回包含 CRITICAL `writeBackPlan` 的合法 payload
- **THEN** Apply SHALL 先更新 `tasks.md`
- **AND** SHALL 在更新完成后调用 `xirang verify phase1 "<change-name>" --input '<json>' --json`
- **AND** CLI SHALL 从最终 `tasks.md` 计算 `tasksFileHash`

#### Scenario: 非 CRITICAL finding 不写回

- **WHEN** reviewer payload 只包含 WARNING 或 SUGGESTION
- **THEN** Apply SHALL NOT 将这些 finding 写入 `tasks.md`

### Requirement: apply 作为编译步骤

`xirang-apply-change` SHALL 从生成 reference 读取 finding-driven Phase 2 协议。Phase 2 SHALL 创建非空 baseline commit，调用 fresh optimizer 生成或 reconciliation 全部 findings，只实现最新排序中的首个 actionable finding，调用 CLI 记录 pre-implementation hashes，由 master 按 TDD 编码，再由 fresh reviewer 验证。Phase 0 与 Phase 1 SHALL NOT 创建 commit；每个波次通过或失败后 SHALL 重新调用 optimizer；Checkpoint 使用 git commit，失败回滚使用 `git reset --hard HEAD` 与 `git clean -fd`。

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
- **AND** SHALL 保留该 commit 供后续波次作为最近成功状态

#### Scenario: 失败回滚保留 verify state 且不残留 speculative edits
- **WHEN** reviewer 返回 FAIL
- **AND** Phase 2 CLI 已将 failed event 与 `failedDirections` 写入 `.verify-result.json`
- **THEN** Apply SHALL 将 `.verify-result.json` 与 `.apply-isolation.json` 快照到 repository 外并分别记录 SHA-256
- **AND** SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
- **AND** SHALL 原子恢复两个持久状态文件并校验各自 SHA-256
- **AND** 恢复失败、hash 不匹配或仍有 speculative file 时 SHALL 停止

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

系统 SHALL 区分三类职责：reviewer 判断行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集和有证据的 challenge。Master SHALL 按 selected finding 的 keyDesign 和 preservation constraints 实现，MUST NOT 自行生成、跳过或 reject optimization finding。实质偏离前 SHALL 记录 `masterChallenge` 并重新调用 optimizer。

#### Scenario: optimizer 提供判断与关键设计
- **WHEN** Phase 2 optimization 执行
- **THEN** 系统 SHALL spawn fresh optimizer
- **AND** optimizer SHALL 输出 findings、修改意见、keyDesign 和 validation
- **AND** SHALL NOT 修改文件或输出逐字补丁

#### Scenario: master 实现 selected finding
- **WHEN** CLI 已选择首个 actionable finding
- **THEN** master SHALL 按 TDD 修改代码和测试
- **AND** SHALL 记录 finding ID 及任何非实质实现细节差异

#### Scenario: reviewer 独立验证
- **WHEN** master 完成 selected finding
- **THEN** 系统 SHALL spawn fresh reviewer
- **AND** reviewer SHALL 判断 preservation constraints 是否保持
- **AND** SHALL NOT 重新判断该 finding 是否值得优化
#### Scenario: Phase 2 编排角色明确
- **WHEN** apply skill 模板被渲染
- **THEN** SHALL 要求 optimizer 先判断和排序 findings
- **AND** master SHALL 只实现 selected finding或提交 masterChallenge
- **AND** fresh reviewer SHALL 独立验证实现
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

### Requirement: Apply 读取 Verify 诊断信息

当 `.verify-result.json` 存在时，apply SHALL 读取 verify 的诊断信息，将其作为修复上下文注入任务实现循环。

#### Scenario: 检测到 verify 结果文件

- **WHEN** apply 检测到 `.xirang/changes/<name>/.verify-result.json` 存在且 result 为 `FAIL_NEEDS_CORRECTIONS`
- **THEN** apply SHALL 读取该文件的 `issues` 数组
- **AND** 对每个被 unmark 的 task，将对应的 verify issue 作为修复指导注入上下文

#### Scenario: 检测到 Required Corrections section

- **WHEN** apply 读取 `tasks.md` 发现存在 `## Required Corrections` section
- **THEN** apply SHALL 将修正事项条目视为优先修复项
- **AND** 在实现被 unmark 的 task 时，引用对应的修正事项条目作为修复方向

#### Scenario: artifact_fix 类型的修正事项处理

- **WHEN** apply 遇到 `[artifact_fix]` 类型的修正事项条目
- **THEN** apply SHALL 修改对应的 artifact（spec 或 design）而非代码
- **AND** 标记该修正事项为完成
#### Scenario: verify 结果为 PASS 或不存在
- **WHEN** `.verify-result.json` 不存在
- **OR** result 为 `PASS` 或 `PASS_WITH_WARNINGS`
- **THEN** apply SHALL 按原有逻辑执行，不注入额外修复上下文
#### Scenario: 修复完成后清理 Required Corrections section
- **WHEN** apply 完成所有修正事项条目的修复
- **AND** 所有修正事项 checkbox 标记为 `[x]`
- **THEN** apply SHALL 在完成提示中建议重新运行 verify（`xirang verify` 门禁）以确认修复有效
### Requirement: Apply reference SHALL 拥有 checkpoint 编排

Phase 2 checkpoint 创建、成功提交、失败回滚和 verify-state 恢复 SHALL 由 Apply reference 定义。Reviewer contract SHALL 只负责 speculative verification verdict，不得创建、恢复或消费 Git checkpoint。

#### Scenario: Reviewer 只返回验证 verdict

- **WHEN** reviewer subagent 执行 Phase 2 speculative verification
- **THEN** reviewer SHALL 验证 selected finding 的 preservation constraints
- **AND** SHALL NOT 执行 Git commit、reset、clean 或 worktree 操作

#### Scenario: Apply Phase 2 reference 编排 checkpoint

- **WHEN** Apply 模板执行 Phase 2 optimization loop
- **THEN** Phase 2 reference SHALL 定义非空 baseline commit 与成功 finding checkpoint commit
- **AND** SHALL 定义失败时对 `.verify-result.json` 与 `.apply-isolation.json` 的 repository-external snapshot、speculative code rollback、原子恢复与 SHA-256 校验
- **AND** SHALL 保留 failed history、`failedDirections` 与 `phase2BaselineCommit`
