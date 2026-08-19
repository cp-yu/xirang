---
operation: MODIFIED
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理 Apply 的任务执行状态、task-level TDD 与 Verify 阶段门禁。它包含 pending Checks 的证据处理、`needs_verify` 与 `needs_seal` 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。
---

## ADDED Requirements

### Requirement: Apply Phase 0 SHALL 执行 pending Checks

`xirang-apply-change` workflow SHALL 在 Phase 0 处理 `tasks.md` 中的 pending Checks，并为行为或代码 Check 执行严格 TDD：先检查已有测试并选择适用的 reuse、modify、add 或 delete 动作，再运行声明的 Check 确认目标行为尚未满足，完成最小实现后重跑同一 Check 确认通过。Workflow SHALL 只在对应证据通过后更新 Check 或 Required Corrections 状态。

#### Scenario: 行为或代码 Check 完成 TDD 闭环

- **WHEN** `xirang instructions apply --change "<name>" --json` 返回行为或代码 Check
- **THEN** Apply SHALL 先依据已有测试选择适用的测试动作
- **AND** SHALL 在实现前运行声明的 Check 并确认目标行为缺失导致的失败
- **AND** SHALL 完成最小实现后重跑同一 Check 并确认通过
- **AND** SHALL NOT 通过语法错误、错误路径或损坏 fixture 人为制造 RED

#### Scenario: 非运行时制品使用最终证据

- **WHEN** pending Check 只修改非运行时文本或非运行时制品
- **THEN** Apply SHALL 运行声明的验证命令或检查 `Evidence:` / `Expect:`
- **AND** SHALL 不要求人为制造失败测试
- **AND** SHALL 只在最终证据通过后更新 checkbox

#### Scenario: Config、Schema 与模板默认按行为变更处理

- **WHEN** pending Check 修改 config、schema、generated template、workflow template 或 agent instruction template
- **THEN** Apply SHALL 默认将其归类为行为或代码 Check
- **AND** 只有 Check 明确证明编辑内容不存在运行时或生成 surface consumer 时，才 SHALL 按非运行时文本处理

## REMOVED Requirements

### Requirement: Apply Phase 0 SHALL 由 Master agent 直接执行

## MODIFIED Requirements

### Requirement: Apply 模板 SHALL 处理中间验证状态

`xirang-apply-change` 技能模板 SHALL 对 `needs_verify` 和 `needs_seal` 状态提供正确分支，无缝进入对应验证阶段。

#### Scenario: needs_verify 状态进入 Phase 1

- **WHEN** `instructions apply --json` 返回 `state: 'needs_verify'`
- **THEN** 模板 SHALL 指示 Agent 进入 Phase 1 验证流程并启动 reviewer subagent
- **AND** SHALL NOT 中断流程或要求用户手动触发 verify

#### Scenario: needs_seal 状态进入 Phase 2/3

- **WHEN** `instructions apply --json` 返回 `state: 'needs_seal'`
- **THEN** 模板 SHALL 指示 Agent 进入 Phase 2/3 流程
- **AND** SHALL NOT 中断流程或要求用户手动触发

#### Scenario: Dashboard 分类标签不声称完成

- **WHEN** Dashboard 展示 task 全部完成的 change
- **THEN** 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Requirement: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个 task 作为单一 TDD loop 处理；单个 task 完成 SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff。全部 pending tasks 与 Required Corrections 完成后，SHALL 进入一次 Change-level Phase 1 Review；此后 Review 或 Seal 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review。

#### Scenario: 普通 task 完成不提前切换阶段

- **WHEN** 一个 pending task 的 Checks 全部通过
- **THEN** Apply SHALL 保持 Phase 0，直到全部 pending tasks 与 Required Corrections 完成
- **AND** SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff

#### Scenario: 全部完成后统一 Review

- **WHEN** 所有 pending tasks 与 Required Corrections 完成
- **THEN** Apply SHALL 进入一次 Change-level Phase 1 Review

#### Scenario: 修正后重新 Review

- **WHEN** Phase 1 或 Phase 3 失败产生 Required Corrections
- **AND** recovery 完成
- **THEN** 修改后的 Change 状态 SHALL 重新接受 Change-level Review
