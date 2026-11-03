---
entity: "element-declaration"
identity: "apply-workflow"
kind: "element"
parent: "apply"
title: "Apply Workflow"
definition: "Apply Workflow 定义 `xirang-apply-change` 如何处理 Apply 的任务执行状态、task-level TDD 与 Quality 阶段门禁。它包含 pending Checks 的证据处理、`needs_review` 与 `needs_optimize` 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。"
---

## MODIFIED Sections

### Section: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个 task 作为单一 TDD loop 处理；单个 task 完成 SHALL NOT 触发 Review、Optimization 或 workflow handoff。全部 pending tasks 与 Required Corrections 完成后，SHALL 进入一次 Change-level Review；普通实现与基线 Review 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review；Optimization 的修改和 seal 中优化证据缺口 SHALL 按共享优化协议判断受影响验证，修复基线缺陷必须针对性独立 Review，不强制每项优化重做整 Change Review。

- **普通 task 完成不提前切换阶段**

  - 一个 pending task 的 Checks 全部通过
  - Apply SHALL 保持 Phase 0，直到全部 pending tasks 与 Required Corrections 完成
  - SHALL NOT 触发 Review、Optimization 或 workflow handoff

- **全部完成后统一 Review**

  - 所有 pending tasks 与 Required Corrections 完成
  - Apply SHALL 进入一次 Change-level Review

- **修正后重新 Review**

  - 普通实现的 Review 或 seal 失败产生 Required Corrections
  - recovery 完成
  - 修改后的 Change 状态 SHALL 重新接受 Change-level Review
