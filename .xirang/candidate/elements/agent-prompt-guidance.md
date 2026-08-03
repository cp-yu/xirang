---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 定义共享 verify gate 指引片段的契约：状态机流程图、JSON schema 速查表与错误恢复决策树，供 archive、verify、apply 三个 skill 模板复用，并包含 PENDING_VERIFICATION 恢复路径与简单变更快速路径的强制委托语义。
---

## Requirements

### Requirement: 共享 verify gate 指引片段

系统 SHALL 在共享片段常量中提供 verify gate 指引常量，供 archive、verify、apply 三个 skill 模板复用。指引片段 SHALL 包含三个组件：状态机流程图（Phase 1 → Phase 2 optimization → Phase 2 verification → 终态的完整流转）、JSON schema 速查表（phase1/phase2 所有 CLI 调用及其 `--input` JSON 格式）、错误恢复决策树（Agent 在 CLI 返回各类错误时如何恢复）。

#### Scenario: 模板引用共享片段

- **WHEN** archive、verify 或 apply 模板需要输出 verify CLI 调用指引
- **THEN** 模板 SHALL 引用共享片段常量
- **AND** SHALL NOT 在各模板中各自内联 CLI 调用格式

#### Scenario: 状态机图覆盖所有状态转换

- **WHEN** 状态机图常量被渲染到模板中
- **THEN** 流程图 SHALL 展示 Phase 1 PASS → PENDING_VERIFICATION、PENDING_VERIFICATION → NOT_NEEDED/SKIPPED/IMPROVED/DEGRADED 的完整转换路径
- **AND** 标注 archive gate 仅接受的终态与拒绝的状态
#### Scenario: OPTIMIZATION_PROPOSED 行参数
- **WHEN** JSON schema 速查表渲染 `OPTIMIZATION_PROPOSED` 条目
- **THEN** CLI call 列 SHALL 包含 `--files "<affected-files>"` 参数
- **AND** 该参数 SHALL 位于 `--type=optimization` 之后、`--input` 之前
#### Scenario: JSON schema 速查表覆盖所有 CLI 调用
- **WHEN** JSON schema 速查表被渲染
- **THEN** 速查表 SHALL 包含 phase1 与 phase2 各 CLI 调用及其 `--input` JSON 格式
### Requirement: Archive 模板 PENDING_VERIFICATION 恢复路径

archive skill 模板 SHALL 在检测到 `PENDING_VERIFICATION` 时提供具体的恢复指引而非仅输出 STOP。

#### Scenario: PENDING_VERIFICATION 无 affectedFileHashes

- **WHEN** verify status 报告 `optimization.status = PENDING_VERIFICATION`
- **AND** `.verify-result.json` 中 `optimization.affectedFileHashes` 不存在或为空
- **THEN** 模板 SHALL 指导 Agent 执行 Phase 2 优化分析
- **AND** 若无优化空间，SHALL 调用 `--type=optimization` 提交 NO_OPTIMIZATION_NEEDED
- **AND** 调用后 `optimization.status` 变为 `NOT_NEEDED`，archive 门禁通过

#### Scenario: PENDING_VERIFICATION 有 affectedFileHashes

- **WHEN** verify status 报告 `optimization.status = PENDING_VERIFICATION`
- **AND** `.verify-result.json` 中 `optimization.affectedFileHashes` 存在且非空
- **THEN** 模板 SHALL 指导 Agent 先完成 verification 调用
- **AND** 调用后 `optimization.status` 变为 `IMPROVED` 或 `DEGRADED`，archive 门禁通过

#### Scenario: ABORTED_UNSAFE 保持 STOP

- **WHEN** verify status 报告 `optimization.status = ABORTED_UNSAFE`
- **THEN** 模板 SHALL 保持 STOP 行为
- **AND** SHALL 不提供自动恢复路径

### Requirement: Verify 模板 CLI 错误恢复指南

verify skill 模板 SHALL 包含显式的 CLI 错误恢复指南，指导 Agent 在 CLI 返回非零退出码时如何诊断和恢复。

#### Scenario: phase2 --type=optimization 返回 FILES_REQUIRED 错误

- **WHEN** Agent 调用 `phase2 --type=optimization` 且输入 status 为 OPTIMIZATION_PROPOSED
- **AND** CLI 返回 `{"ok": false, "reason": "FILES_REQUIRED"}`
- **THEN** 错误恢复指南 SHALL 包含一条恢复指引
- **AND** 该指引 SHALL 指导 Agent 补充 `--files` 参数，传入 optimizer 声明的受影响文件路径列表
#### Scenario: 保留原有错误恢复条目
- **WHEN** 错误恢复指南被渲染
- **THEN** SHALL 保留 Invalid JSON input、status must be、result must be 与"尚未提交优化结果"等已有恢复条目
### Requirement: 简单变更快速路径识别

三个 skill 模板（archive/verify/apply）SHALL 包含 Phase 2 强制委托指引：master agent MUST 始终 spawn optimizer subagent，由 optimizer subagent 决定是否存在优化机会。

#### Scenario: optimizer subagent 返回无优化机会

- **WHEN** Agent 进入 Phase 2 优化阶段
- **AND** optimizer subagent 分析后返回 "No optimization opportunities found"
- **THEN** master agent SHALL 调用 `--type=optimization` 提交 NO_OPTIMIZATION_NEEDED
- **AND** summary 字段 SHALL 包含 optimizer subagent 的实际结论文本

#### Scenario: master agent 不得自行判断跳过

- **WHEN** Agent 进入 Phase 2 优化阶段
- **AND** `optimization.enabled` 为 `true`
- **AND** 未传入 `--skip-optimization`
- **THEN** master agent MUST NOT 自行调用 NO_OPTIMIZATION_NEEDED 而不 spawn optimizer subagent
- **AND** 唯一允许跳过 optimizer subagent 的条件为 `--skip-optimization` flag 或 `optimization.enabled: false`
#### Scenario: 所有 change 类型均强制调用 optimizer
- **WHEN** Phase 1 返回 `PASS` 或 `PASS_WITH_WARNINGS`
- **AND** `optimization.enabled` 为 `true`
- **THEN** 系统 SHALL 始终 spawn optimizer subagent，无论 change 类型（包括纯删除、重命名）
- **AND** optimizer subagent 对简单 change 快速返回 "No optimization opportunities found"
#### Scenario: 简单变更也调用 optimizer
- **WHEN** 变更仅删除、重命名或移除参数
- **AND** optimization 未被禁用或跳过
- **THEN** prompt SHALL 要求 spawn optimizer
- **AND** SHALL 仅在合法 envelope 无 actionable finding 时记录 NOT_NEEDED
