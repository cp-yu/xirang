---
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理工作流状态，并由 Master agent 串行完成 Phase 0 后进入 clean-context 验证阶段；它处理 `needs_verify` 与 `needs_seal` 状态分支，并要求 Master agent 直接执行实现而不委托 implementer。
---

## ADDED Requirements

### Requirement: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个 task 作为单一 TDD loop 连续执行；单个 task 完成 SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff。全部 pending tasks 与 Required Corrections 完成后，SHALL 进入一次 Change-level Phase 1 Review；此后 Review 或 Seal 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review。

#### Scenario: 普通 task 完成不切换阶段

- **WHEN** 一个 pending task 的 Checks 全部通过
- **THEN** Apply SHALL 直接继续下一 task
- **AND** SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff

#### Scenario: 全部完成后统一 Review

- **WHEN** 所有 pending tasks 与 Required Corrections 完成
- **THEN** Apply SHALL 进入一次 Change-level Phase 1 Review

#### Scenario: 修正后重新 Review

- **WHEN** Phase 1 或 Phase 3 失败产生 Required Corrections
- **AND** recovery 完成
- **THEN** 修改后的 Change 状态 SHALL 重新接受 Change-level Review
