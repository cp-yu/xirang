---
operation: MODIFIED
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 定义共享 quality gate 指引片段的契约：代码状态流程图、JSON 结构速查表与错误恢复决策树，供 archive、quality、apply 三个 skill 模板复用，并包含未收口恢复路径与简单变更快速路径的强制委托语义。
---

## MODIFIED Requirements

### Requirement: 简单变更快速路径识别

三个 skill 模板（archive/quality/apply）SHALL 包含 Optimization 强制委托指引：master agent MUST 始终 spawn optimizer subagent，由 optimizer subagent 决定是否存在优化方向。

#### Scenario: optimizer subagent 返回无优化方向
- **WHEN** Agent 进入 Optimization
- **AND** optimizer subagent 分析后返回无满足条件的方向
- **THEN** master agent SHALL 以 `stopReason: NO_ACTIONABLE` 收口
- **AND** summary 字段 SHALL 包含 optimizer subagent 的实际结论文本

#### Scenario: master agent 不得自行判断跳过
- **WHEN** Agent 进入 Optimization
- **AND** `optimization.enabled` 为 `true`
- **AND** 用户未显式拒绝优化
- **THEN** master agent MUST NOT 自行收口而不 spawn optimizer subagent
- **AND** 唯一允许跳过 optimizer subagent 的条件为 `optimization.enabled: false` 或用户显式拒绝

#### Scenario: 所有 change 类型均强制调用 optimizer
- **WHEN** 代码已通过 Review
- **AND** `optimization.enabled` 为 `true`
- **THEN** 系统 SHALL 始终 spawn optimizer subagent，无论 change 类型（包括纯删除、重命名）

#### Scenario: 简单变更也调用 optimizer
- **WHEN** 变更仅删除、重命名或移除参数
- **AND** optimization 未被禁用且用户未拒绝
- **THEN** prompt SHALL 要求 spawn optimizer
- **AND** SHALL 仅在台账确认无满足条件的方向时记录 `NOT_NEEDED`

## REMOVED Requirements

### Requirement: 共享 verify gate 指引片段

### Requirement: Archive 模板 PENDING_VERIFICATION 恢复路径

### Requirement: Verify 模板 CLI 错误恢复指南

## ADDED Requirements

### Requirement: 共享 quality gate 指引片段

系统 SHALL 在共享片段常量中提供 quality gate 指引常量，供 archive、quality、apply 三个 skill 模板复用。指引片段 SHALL 包含三个组件：代码状态流程图（`dirty` → Review → `clean` → Optimization → 收口的完整流转）、JSON 结构速查表（`review` 与 `optimize` 的输入形状）、错误恢复决策树（Agent 在 CLI 返回非零退出码时如何恢复）。指引片段 SHALL 与命令实现共用同一批导出常量，MUST NOT 手写一套并行维护的协议描述。

#### Scenario: 模板引用共享片段
- **WHEN** archive、quality 或 apply 模板需要输出 quality 指引
- **THEN** 模板 SHALL 引用共享片段常量
- **AND** SHALL NOT 在各模板中各自内联 CLI 调用格式

#### Scenario: 状态图覆盖代码状态转换
- **WHEN** 状态图常量被渲染到模板中
- **THEN** 流程图 SHALL 展示 `dirty` → Review → `clean` → Optimization → 收口的完整转换路径
- **AND** SHALL 标注 archive gate 接受的终态与拒绝的终态

#### Scenario: 速查表覆盖所有 CLI 调用
- **WHEN** JSON 结构速查表被渲染
- **THEN** 速查表 SHALL 包含 `review` 与 `optimize`（含收口）各 CLI 调用及其 `--input` JSON 格式
- **AND** 枚举取值 SHALL 与命令实现使用同一常量

### Requirement: Archive 模板未收口恢复路径

archive skill 模板 SHALL 在检测到 Optimization 尚未收口时提供具体的恢复指引而非仅输出 STOP。

#### Scenario: 尚未收口且存在可优化方向
- **WHEN** `xirang quality status` 报告 Optimization 尚未收口
- **AND** 已记录的方向数未达 `optimization.directionLimit`
- **THEN** 模板 SHALL 指导 Agent 执行 Optimization 分析
- **AND** 若无满足条件的方向，SHALL 以 `stopReason: NO_ACTIONABLE` 收口
- **AND** 收口后终态变为 `NOT_NEEDED` 或 `IMPROVED`，archive 门禁通过

#### Scenario: ABORTED_UNSAFE 保持 STOP
- **WHEN** `xirang quality status` 报告 Optimization 终态为 `ABORTED_UNSAFE`
- **THEN** 模板 SHALL 保持 STOP 行为
- **AND** SHALL 不提供自动恢复路径

### Requirement: Quality 模板 CLI 错误恢复指南

quality skill 模板 SHALL 包含显式的 CLI 错误恢复指南，指导 Agent 在 CLI 返回非零退出码时如何诊断和恢复。

#### Scenario: 入口条件不满足时按 allowedNextOperations 恢复
- **WHEN** Agent 调用 `review` 或 `optimize` 且 CLI 以 exit 1 返回
- **THEN** 错误恢复指南 SHALL 要求读取输出中的 `code` 与 `allowedNextOperations`
- **AND** SHALL 指导 Agent 执行其中声明的下一步操作，而不是改写输入重试

#### Scenario: 输入形状非法时按诊断修正
- **WHEN** CLI 以 exit 2 返回 `code: INVALID_INPUT`
- **THEN** 错误恢复指南 SHALL 要求按 `diagnostics` 中的字段路径、期待值与修正方式修改输入
- **AND** SHALL NOT 要求 Agent 阅读实现源码推断字段

#### Scenario: 保留 fail-closed 条目
- **WHEN** 错误恢复指南被渲染
- **THEN** SHALL 保留"记录缺失时不得推断代码状态"与"baseCommit 缺失或无效时 fail closed"等条目
