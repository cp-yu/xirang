## MODIFIED Requirements

### Requirement: apply 作为编译步骤

`openspec-apply-change` SHALL 从生成 reference 读取 finding-driven Phase 2 协议。Phase 2 SHALL 创建 baseline commit，调用 fresh optimizer 生成或 reconciliation 全部 findings，只实现最新排序中的首个 actionable finding，调用 CLI 记录 pre-implementation hashes，由 master 按 TDD 编码，再由 fresh reviewer 验证。

每个波次通过或失败后 SHALL 重新调用 optimizer。Checkpoint SHALL 使用 git commit；失败回滚 SHALL 使用 `git reset --hard HEAD` 和 `git clean -fd`，不得使用 stash 或 tag。

#### Scenario: [ADDED] finding 驱动的优化循环
- **WHEN** Phase 2 启动
- **THEN** apply SHALL 创建 baseline checkpoint
- **AND** SHALL spawn fresh optimizer 获取完整 findings
- **AND** SHALL 只实现唯一 selected finding
- **AND** SHALL spawn fresh reviewer 执行 speculative re-verify
- **AND** SHALL 在波次结束后重新 reconciliation

#### Scenario: [ADDED] 成功 checkpoint 包含 finding ID
- **WHEN** selected finding 通过 reviewer
- **THEN** apply SHALL 创建包含 finding ID 的增量 checkpoint commit
- **AND** SHALL 保留该 commit供后续波次作为最近成功状态

#### Scenario: [ADDED] 失败回滚不残留 speculative edits
- **WHEN** reviewer 返回 FAIL
- **THEN** apply SHALL 执行 `git reset --hard HEAD` 和 `git clean -fd`
- **AND** 下一轮 SHALL 从最近成功 checkpoint 读取当前代码

#### Scenario: [ADDED] 终局状态保持兼容
- **WHEN** Phase 2 终止
- **THEN** optimization.status SHALL 为 IMPROVED、DEGRADED、NOT_NEEDED、SKIPPED 或 ABORTED_UNSAFE
- **AND** 所有 `wip: opt-*` commits SHALL 保留

#### Scenario: [REMOVED] Phase 2 优化循环

- **WHEN** Phase 2 启动
- **THEN** 系统 SHALL 创建初始 git commit checkpoint（`git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`），保存 Phase 1 baseline
- **AND** SHALL 按以下循环执行：
  1. **优化提案（subagent optimizer）**: 读取代码 + specs + design + `failedDirections`，按 ponytail ladder 前置分析 + 结构优化原则输出 Search/Replace 块。若无优化机会，返回 NO_OPTIMIZATION_NEEDED
  2. **理解优化意图（主 agent）**: 读取 optimizer 返回的 ponytail 标签（delete/stdlib/native/yagni/shrink）和 Code Smell 注释，理解每个提案的优化理由——是删除、stdlib 替代、简化还是结构改进——在应用补丁前确认每个提案适合 change 上下文
  3. **记录 optimization（主 agent）**: 调用 `phase2 --type=optimization --files "..."` 记录 pre-patch hash（此时磁盘 MUST 处于 pre-patch 状态）
  4. **应用补丁（主 agent）**: 解析并原子应用 Search/Replace 块到工作区
  5. **再验证 Phase 1（subagent reviewer）**: 在补丁后的代码上重新执行 Phase 1 一致性验证
- **AND** 若再验证 PASS — 接受补丁，递增 cycleCounter，执行 `git add -A && git commit -m "wip: opt-r${N} (${description})"` 将当前优化后状态保存为新 checkpoint。若 cycleCounter < `config.optimization.optRetries`：继续循环（可能发现新的优化机会）。若 cycleCounter >= `config.optimization.optRetries`：强制终止并以 `optimization.status = IMPROVED` 进入 Phase 3
- **AND** 若再验证 FAIL — 执行 `git reset --hard HEAD` + `git clean -fd` 回滚到最近一次 commit（最近成功状态），递增 cycleCounter，记录 `failedDirections`
- **AND** 若 cycleCounter >= `config.optimization.optRetries` → `optimization.status = DEGRADED`，进入 Phase 3
- **AND** 若 cycleCounter < `config.optimization.optRetries` → 回到步骤 1 使用全新策略

#### Scenario: [REMOVED] Phase 2 reference 明确 commit checkpoint 命令

- **WHEN** 读取 `references/apply-phase2-optimization.md`
- **THEN** content SHALL 包含 `git add -A`
- **AND** content SHALL 包含 `git commit -m "wip: opt-checkpoint-r0 (baseline)"`
- **AND** content SHALL 包含 `git commit -m "wip: opt-r${N} (${description})"`
- **AND** content SHALL 包含 `git reset --hard HEAD`
- **AND** content SHALL 包含 `git clean -fd`
- **AND** content SHALL NOT 包含 `git stash push`
- **AND** content SHALL NOT 包含 `git stash apply`
- **AND** content SHALL NOT 包含 `git tag apply-opt-checkpoint`

#### Scenario: [REMOVED] FAIL 回滚不残留错误状态

- **WHEN** reviewer 返回 FAIL 且系统执行 `git reset --hard` + `git clean -fd`
- **THEN** 工作区 SHALL 恢复到最近一次 checkpoint commit 保存的成功状态
- **AND** 下一轮优化循环 SHALL 从干净的最近成功状态开始

#### Scenario: [REMOVED] 优化循环终局状态

- **WHEN** 优化循环终止
- **THEN** 系统 SHALL NOT 执行任何 checkpoint commit 清理操作
- **AND** 所有 `wip: opt-*` commits SHALL 保留在 git history 中
- **AND** `optimization.status` SHALL 为以下终局值之一：IMPROVED | DEGRADED | NOT_NEEDED | SKIPPED

### Requirement: 失败方向记录

系统 SHALL 以 finding ID、目标位置、关键设计边界和 reviewer 失败证据记录失败方向。未达 `optRetries` 时 optimizer MAY 提供实质不同方案；达到上限后 SHALL reject 该方向但继续评估其他 findings。

#### Scenario: [ADDED] 记录 finding 失败方向
- **WHEN** selected finding speculative re-verify 失败
- **THEN** optimization history SHALL 追加 failed event
- **AND** failedDirections SHALL 记录该 finding 的设计方向和失败原因

#### Scenario: [ADDED] 后续 optimizer 避免重复
- **WHEN** optimizer 重新启动
- **THEN** SHALL 读取 history 与 failedDirections
- **AND** SHALL NOT 通过换措辞重复已耗尽方向

#### Scenario: [REMOVED] 优化提案导致验证失败时记录方向

- **WHEN** Phase 2 优化提案应用后再验证 Phase 1 返回 FAIL
- **THEN** 系统 SHALL 在 `optimization.failedDirections[]` 中追加一条自然语言摘要
- **AND** 摘要 SHALL 描述尝试的优化策略（如 "简化 auth.ts 的条件分支逻辑"）

#### Scenario: [REMOVED] 后续优化提案读取失败方向

- **WHEN** subagent optimizer 启动优化提案
- **THEN** SHALL 读取 `.verify-result.json` 中 `optimization.failedDirections[]`
- **AND** SHALL 避免提出与已记录方向相同或相似的优化策略

### Requirement: 主 agent 和 subagent 角色分工

系统 SHALL 区分三类职责：reviewer 判断 specs 和行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集和有证据的 challenge。

Master SHALL 按 selected finding 的 keyDesign 和 preservation constraints 实现，MUST NOT 自行生成、跳过或 reject optimization finding。实质偏离前 SHALL 记录 `masterChallenge` 并重新调用 optimizer。

#### Scenario: [ADDED] optimizer 提供判断与关键设计
- **WHEN** Phase 2 optimization 执行
- **THEN** 系统 SHALL spawn fresh optimizer
- **AND** optimizer SHALL 输出 findings、修改意见、keyDesign 和 validation
- **AND** SHALL NOT 修改文件或输出逐字补丁

#### Scenario: [ADDED] master 实现 selected finding
- **WHEN** CLI 已选择首个 actionable finding
- **THEN** master SHALL 按 TDD 修改代码和测试
- **AND** SHALL 记录 finding ID及任何非实质实现细节差异

#### Scenario: [ADDED] reviewer 独立验证
- **WHEN** master 完成 selected finding
- **THEN** 系统 SHALL spawn fresh reviewer
- **AND** reviewer SHALL 判断 spec 和 preservation constraints 是否保持
- **AND** SHALL NOT 重新判断该 finding 是否值得优化

#### Scenario: [REMOVED] 主 agent 仅负责编码

- **WHEN** apply 工作流执行中
- **THEN** 主 agent SHALL 负责实现 tasks.md 任务
- **AND** SHALL 负责应用 subagent optimizer 产出的 Search/Replace 补丁
- **AND** SHALL NOT 自行做出完整性/正确性/一致性判断
- **AND** SHALL NOT 自行生成优化提案

#### Scenario: [REMOVED] subagent reviewer 仅负责判断

- **WHEN** Phase 1 验证或优化后再验证执行中
- **THEN** 系统 SHALL spawn clean-context reviewer subagent，指定 `context: "fresh"`
- **AND** subagent SHALL 基于 artifacts + git evidence + 代码文件给出 verdict
- **AND** subagent SHALL NOT 修改代码或 tasks.md
- **AND** 主 agent SHALL NOT 替代 subagent 的判断

#### Scenario: [REMOVED] subagent optimizer 仅负责提案

- **WHEN** Phase 2 优化提案执行中
- **THEN** 系统 SHALL spawn clean-context optimizer subagent，指定 `context: "fresh"`
- **AND** subagent SHALL 输出 Search/Replace 块建议
- **AND** subagent SHALL NOT 直接修改代码
- **AND** 主 agent SHALL 应用补丁而非 subagent

### Requirement: 配置驱动优化控制

`optimization.enabled` SHALL 控制 Phase 2 是否运行；`optimization.optRetries` SHALL 只限制同一失败方向，不限制成功波次数。成功波次 SHALL 持续到无 actionable finding 或确定性停滞。

#### Scenario: [ADDED] 多个成功 finding 超过 optRetries 数量
- **WHEN** `optRetries` 为 2 且存在三个依次验证通过的 findings
- **THEN** apply SHALL 完成三个波次
- **AND** SHALL NOT 以成功次数消耗 optRetries

#### Scenario: [ADDED] skip optimization
- **WHEN** 用户传入 `--skip-optimization`
- **THEN** 系统 SHALL 设置 optimization.status 为 SKIPPED
- **AND** SHALL 直接进入 Phase 3 Seal

#### Scenario: [REMOVED] optRetries 控制重试和循环上限

- **WHEN** `optimization.enabled` 为 true
- **AND** `optimization.optRetries` 设置为 N（默认 2）
- **THEN** Phase 2 每次提案+补丁+验证循环（无论成功或失败）消耗一次 optRetries 配额
- **AND** optRetries 同时充当优化循环的有效上限
- **AND** subagent 返回 NO_OPTIMIZATION_NEEDED 不计入循环，不消耗配额

#### Scenario: [REMOVED] --skip-optimization 跳过 Phase 2

- **WHEN** 用户执行 `/opsx:apply --skip-optimization`
- **THEN** 系统 SHALL 跳过 Phase 2
- **AND** `optimization.status` 记录为 `SKIPPED`
- **AND** Phase 1 的结果保持不变
- **AND** 直接进入 Phase 3 Seal
