---
operation: ADDED
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 定义 Apply 与 Quality 的集成契约：Review 记录先写回再持久化、以轮为单位的优化循环、失败方向记录、主 agent 与 subagent 的角色分工、配置驱动的优化控制，以及 Apply reference 拥有的 checkpoint 编排。它不定义 Quality 自身的状态判定与命令面。
---

## ADDED Requirements

### Requirement: Review 记录先写回再持久化
`xirang-apply-change` SHALL 先委托 fresh reviewer，再校验其结构化 payload，只应用 CRITICAL `writeBackPlan`，最后调用 `xirang quality review` 持久化该 payload。CLI 持久化 SHALL 发生在 writeback 之后，使 `tasksFileHash` 对应最终写入的 `tasks.md`。

#### Scenario: CRITICAL writeback 先于记录
- **WHEN** reviewer 返回包含 CRITICAL `writeBackPlan` 的合法 payload
- **THEN** Apply SHALL 先更新 `tasks.md`
- **AND** SHALL 在更新完成后调用 `xirang quality review "<change-name>" --input '<json>' --json`
- **AND** CLI SHALL 从最终 `tasks.md` 计算 `tasksFileHash`

#### Scenario: 非 CRITICAL finding 不写回
- **WHEN** reviewer payload 只包含 WARNING 或 SUGGESTION
- **THEN** Apply SHALL NOT 将这些 finding 写入 `tasks.md`

### Requirement: 优化循环以轮为单位
`xirang-apply-change` SHALL 从生成 reference 读取优化循环协议。每轮 SHALL 创建非空 baseline commit、调用 fresh optimizer 取得方向台账、只实现本轮选中的方向、由 master 按 TDD 编码，再由 fresh reviewer 复核并通过 `xirang quality review` 记录该轮结论。普通实现轮次 SHALL NOT 创建 commit；Checkpoint 使用 git commit，失败回滚使用 `git reset --hard HEAD` 与 `git clean -fd`。

#### Scenario: 方向驱动的优化循环
- **WHEN** Optimization 开始
- **THEN** apply SHALL 创建非空 baseline checkpoint，并将其 SHA 写入 `.apply-isolation.json.optimizationBaselineCommit`
- **AND** SHALL 委托 fresh optimizer 取得方向台账
- **AND** SHALL 只实现本轮唯一选中的方向
- **AND** SHALL 委托 fresh reviewer 复核该轮改动
- **AND** SHALL 在该轮结束后重新判断剩余方向

#### Scenario: 成功 checkpoint 包含方向 ID
- **WHEN** 选中的方向通过该轮复核
- **THEN** apply SHALL 创建包含方向 ID 的增量 checkpoint commit
- **AND** SHALL 保留该 commit 供后续轮次作为最近成功状态

#### Scenario: 失败回滚保留 quality 记录且不残留改动
- **WHEN** 该轮复核返回 `FAIL_NEEDS_CORRECTIONS`
- **AND** CLI 已把失败事件与失败方向写入 quality 记录
- **THEN** Apply SHALL 把 quality 记录与 `.apply-isolation.json` 快照到 repository 外并分别记录 SHA-256
- **AND** SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
- **AND** SHALL 原子恢复两个持久状态文件并校验各自 SHA-256
- **AND** 恢复失败、hash 不匹配或仍有未回滚文件时 SHALL 停止

### Requirement: 失败方向记录
系统 SHALL 以方向 ID、目标位置、关键设计边界与 reviewer 失败证据记录失败方向。未达 `optimization.directionRetries` 时 optimizer MAY 提供实质不同的方案；达到上限后该方向 SHALL 被否决，但系统 SHALL 继续评估其他方向。

#### Scenario: 记录方向失败
- **WHEN** 选中方向的该轮复核失败
- **THEN** 系统 SHALL 追加该方向的失败事件与失败证据
- **AND** SHALL 在失败方向记录中写入该方向的设计边界与失败原因

#### Scenario: 后续 optimizer 避免重复
- **WHEN** optimizer 重新判断方向
- **THEN** SHALL 读取失败方向记录
- **AND** SHALL NOT 通过换措辞重复已达上限的方向

### Requirement: 主 agent 和 subagent 角色分工
系统 SHALL 区分三类职责：reviewer 判断行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集与有证据的撤销。Master SHALL 按选中方向的 keyDesign 与 preservation constraints 实现，MUST NOT 自行生成、跳过或否决优化方向。要撤销某个方向时 SHALL 在台账中提交理由与证据。

#### Scenario: optimizer 提供判断与关键设计
- **WHEN** 优化轮次执行
- **THEN** 系统 SHALL 委托 fresh optimizer
- **AND** optimizer SHALL 输出方向、修改意见、keyDesign 与 validation
- **AND** SHALL NOT 修改文件或输出逐字补丁

#### Scenario: master 实现选中方向
- **WHEN** CLI 已记录本轮选中方向
- **THEN** master SHALL 按 TDD 修改代码与测试
- **AND** SHALL 记录方向 ID 及任何非实质实现细节差异

#### Scenario: reviewer 独立复核
- **WHEN** master 完成选中方向
- **THEN** 系统 SHALL 委托 fresh reviewer
- **AND** reviewer SHALL 判断 preservation constraints 是否保持
- **AND** SHALL NOT 重新判断该方向是否值得优化

### Requirement: 配置驱动优化控制
`optimization.enabled` SHALL 控制 Optimization 是否运行；`optimization.directionLimit` SHALL 限制可选取的新方向数；`optimization.directionRetries` SHALL 只限制同一方向的失败次数，不限制成功轮次数。

#### Scenario: 成功轮次不受失败额度限制
- **WHEN** `directionRetries` 为 2 且存在三个依次通过复核的方向
- **THEN** apply SHALL 完成三个轮次
- **AND** SHALL NOT 以成功轮次消耗失败额度

#### Scenario: 跳过优化
- **WHEN** 用户显式拒绝优化
- **THEN** 系统 SHALL 以 `stopReason: USER_DECLINED` 收口并记录终态 `SKIPPED`
- **AND** apply SHALL 直接进入 seal

### Requirement: Apply 读取 Quality 诊断信息
当 quality 状态记录存在时，apply SHALL 读取其中的诊断信息，把它作为修复上下文注入任务实现循环。

#### Scenario: 检测到失败的 Review 记录
- **WHEN** apply 检测到 `.xirang/changes/<name>/.quality-state.json` 存在且 result 为 `FAIL_NEEDS_CORRECTIONS`
- **THEN** apply SHALL 读取该记录的 `issues` 数组
- **AND** 对每个被 unmark 的 task，将对应的 issue 作为修复指导注入上下文

#### Scenario: 检测到 Required Corrections section
- **WHEN** apply 读取 `tasks.md` 发现存在 `## Required Corrections` section
- **THEN** apply SHALL 将修正事项条目视为优先修复项
- **AND** SHALL 在实现被 unmark 的 task 时引用对应条目作为修复方向

#### Scenario: artifact_fix 类型的修正事项处理
- **WHEN** apply 遇到 `[artifact_fix]` 类型的修正事项条目
- **THEN** apply SHALL 修改对应的 artifact 而非代码
- **AND** SHALL 标记该修正事项为完成

#### Scenario: 记录通过或不存在
- **WHEN** quality 状态记录不存在，或 result 为 `PASS` 或 `PASS_WITH_WARNINGS`
- **THEN** apply SHALL 按原有逻辑执行，不注入额外修复上下文

### Requirement: Apply reference 拥有 checkpoint 编排
checkpoint 创建、成功提交、失败回滚与状态恢复 SHALL 由 Apply reference 定义。Reviewer 合约 SHALL 只负责该轮复核结论，不得创建、恢复或消费 git checkpoint。

#### Scenario: Reviewer 只返回复核结论
- **WHEN** reviewer subagent 执行该轮复核
- **THEN** reviewer SHALL 验证选中方向的 preservation constraints
- **AND** SHALL NOT 执行 git commit、reset、clean 或 worktree 操作

#### Scenario: Apply reference 编排 checkpoint
- **WHEN** Apply 模板执行优化循环
- **THEN** reference SHALL 定义非空 baseline commit 与成功方向 checkpoint commit
- **AND** SHALL 定义失败时对 quality 记录与 `.apply-isolation.json` 的 repository-external snapshot、实现回滚、原子恢复与 SHA-256 校验
- **AND** SHALL 保留失败历史、失败方向与 `optimizationBaselineCommit`
