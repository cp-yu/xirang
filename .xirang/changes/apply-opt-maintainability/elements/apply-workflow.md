---
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理 Apply 的任务执行状态、task-level TDD 与 Quality 阶段门禁。它包含 pending Checks 的证据处理、`needs_review` 与 `needs_optimize` 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。
---

## MODIFIED Sections

### Section: Apply 模板 SHALL 处理中间验证状态

`xirang-apply-change` 技能模板 SHALL 对 `needs_review` 和 `needs_optimize` 状态提供正确分支，无缝进入相应 Quality 阶段。

- **needs_review 状态进入 Review**

  - `status --change <name>` 返回 `state: 'needs_review'`
  - 模板 SHALL 指示 Agent 委托 clean-context Reviewer，并保存 commit-bound opinion
  - SHALL NOT 中断流程或要求用户手动触发

- **needs_optimize 状态进入 Opt 处置与 Seal**

  - `status --change <name>` 返回 `state: 'needs_optimize'`
  - 协调者 SHALL 默认委托独立只读 Opt 发现机会，再决定授权实施或停止，记录真实交付并在满足累计独立 Review 后完成 Seal
  - SHALL NOT 强制 Opt 产生改动，也 SHALL NOT 中断流程或要求用户手动触发

- **Dashboard 分类标签不声称完成**

  - Dashboard 展示 task 全部完成的 change
  - 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Section: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个目标作为实施与验证闭环；单个目标完成 SHALL NOT 触发 Review、Optimization 或 workflow handoff。全部未完成目标与 Required Corrections 完成后 SHALL 进入 Change-level Review；普通实现与基线 Review 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review；Optimization 的累计保留改动 SHALL 在 Seal 前独立 Review，按影响选择全量或增量，允许累计多批后审查；Seal 证据缺口须补齐，基线缺陷修复必须针对性独立 Review，不强制每项优化重做整 Change Review。

- **普通目标完成不提前切换阶段**
  - 一个目标的实际验证已通过并勾选
  - Apply SHALL 保持 Phase 0，直到全部目标与 Required Corrections 完成

- **全部完成后统一 Review**
  - 所有目标与 Required Corrections 已完成
  - Apply SHALL 进入一次 Change-level Review

- **修正后重新 Review**
  - 普通实现的 Review 或 Seal 失败产生 Required Corrections
  - recovery 完成
  - 修改后的 Change 状态 SHALL 重新接受 Change-level Review
