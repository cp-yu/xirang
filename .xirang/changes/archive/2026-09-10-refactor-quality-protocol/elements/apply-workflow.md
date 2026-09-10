---
operation: MODIFIED
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理 Apply 的任务执行状态、task-level TDD 与 Quality 阶段门禁。它包含 pending Checks 的证据处理、`needs_review` 与 `needs_optimize` 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。
---

## MODIFIED Requirements

### Requirement: Apply 模板 SHALL 处理中间验证状态

`xirang-apply-change` 技能模板 SHALL 对 `needs_review` 和 `needs_optimize` 状态提供正确分支，无缝进入对应验证阶段。

#### Scenario: needs_review 状态进入 Review
- **WHEN** `instructions apply --json` 返回 `state: 'needs_review'`
- **THEN** 模板 SHALL 指示 Agent 进入 Review 流程并启动 reviewer subagent
- **AND** SHALL NOT 中断流程或要求用户手动触发

#### Scenario: needs_optimize 状态进入 Optimization 与 seal
- **WHEN** `instructions apply --json` 返回 `state: 'needs_optimize'`
- **THEN** 模板 SHALL 指示 Agent 进入 Optimization 与 seal 流程
- **AND** SHALL NOT 中断流程或要求用户手动触发

#### Scenario: Dashboard 分类标签不声称完成
- **WHEN** Dashboard 展示 task 全部完成的 change
- **THEN** 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Requirement: Apply 完成时输出 archive 指引

Apply 阶段在所有 task 完成且 seal 通过后，SHALL 显式输出下一步操作指引，引导用户进入归档。

#### Scenario: seal 通过后输出 call-to-action
- **WHEN** seal 返回 valid
- **THEN** apply SHALL 在汇总输出末尾显式给出 archive-ready call-to-action
- **AND** call-to-action SHALL 引用 archive workflow 的工具适配 invocation
- **AND** SHALL NOT 仅报告 sealed 状态而省略操作指引
- **AND** SHALL NOT 在 workflow 模板 source text 中硬编码特定工具的 archive 调用语法

### Requirement: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个 task 作为单一 TDD loop 处理；单个 task 完成 SHALL NOT 触发 Review、Optimization 或 workflow handoff。全部 pending tasks 与 Required Corrections 完成后，SHALL 进入一次 Change-level Review；此后 Review 或 seal 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review。

#### Scenario: 普通 task 完成不提前切换阶段
- **WHEN** 一个 pending task 的 Checks 全部通过
- **THEN** Apply SHALL 保持 Phase 0，直到全部 pending tasks 与 Required Corrections 完成
- **AND** SHALL NOT 触发 Review、Optimization 或 workflow handoff

#### Scenario: 全部完成后统一 Review
- **WHEN** 所有 pending tasks 与 Required Corrections 完成
- **THEN** Apply SHALL 进入一次 Change-level Review

#### Scenario: 修正后重新 Review
- **WHEN** Review 或 seal 失败产生 Required Corrections
- **AND** recovery 完成
- **THEN** 修改后的 Change 状态 SHALL 重新接受 Change-level Review
