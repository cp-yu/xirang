---
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理 Apply 的任务执行状态、task-level TDD 与 Quality 阶段门禁。它包含 pending Checks 的证据处理、`needs_review` 与 `needs_optimize` 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。
---

## Specification

### Section: Apply 模板 SHALL 处理中间验证状态

`xirang-apply-change` 技能模板 SHALL 对 `needs_review` 和 `needs_optimize` 状态提供正确分支，无缝进入对应验证阶段。

- **needs_review 状态进入 Review**

  - `instructions apply --json` 返回 `state: 'needs_review'`
  - 模板 SHALL 指示 Agent 进入 Review 流程并启动 reviewer subagent
  - SHALL NOT 中断流程或要求用户手动触发

- **needs_optimize 状态进入 Optimization 与 seal**

  - `instructions apply --json` 返回 `state: 'needs_optimize'`
  - 模板 SHALL 指示 Agent 进入 Optimization 与 seal 流程
  - SHALL NOT 中断流程或要求用户手动触发

- **Dashboard 分类标签不声称完成**

  - Dashboard 展示 task 全部完成的 change
  - 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Section: Apply Phase 0 SHALL 执行 pending Checks

`xirang-apply-change` workflow SHALL 在 Phase 0 处理 `tasks.md` 中的 pending Checks，并为行为或代码 Check 执行严格 TDD：先检查已有测试并选择适用的 reuse、modify、add 或 delete 动作，再运行声明的 Check 确认目标行为尚未满足，完成最小实现后重跑同一 Check 确认通过。Workflow SHALL 只在对应证据通过后更新 Check 或 Required Corrections 状态。

- **行为或代码 Check 完成 TDD 闭环**

  - `xirang instructions apply --change "<name>" --json` 返回行为或代码 Check
  - Apply SHALL 先依据已有测试选择适用的测试动作
  - SHALL 在实现前运行声明的 Check 并确认目标行为缺失导致的失败
  - SHALL 完成最小实现后重跑同一 Check 并确认通过
  - SHALL NOT 通过语法错误、错误路径或损坏 fixture 人为制造 RED

- **非运行时制品使用最终证据**

  - pending Check 只修改非运行时文本或非运行时制品
  - Apply SHALL 运行声明的验证命令或检查 `Evidence:` / `Expect:`
  - SHALL 不要求人为制造失败测试
  - SHALL 只在最终证据通过后更新 checkbox

- **Config、Schema 与模板默认按行为变更处理**

  - pending Check 修改 config、schema、generated template、workflow template 或 agent instruction template
  - Apply SHALL 默认将其归类为行为或代码 Check
  - 只有 Check 明确证明编辑内容不存在运行时或生成 surface consumer 时，才 SHALL 按非运行时文本处理

### Section: Apply 完成时输出 archive 指引

Apply 阶段在所有 task 完成且 seal 通过后，SHALL 显式输出下一步操作指引，引导用户进入归档。

- **seal 通过后输出 call-to-action**

  - seal 返回 valid
  - apply SHALL 在汇总输出末尾显式给出 archive-ready call-to-action
  - call-to-action SHALL 引用 archive workflow 的工具适配 invocation
  - SHALL NOT 仅报告 sealed 状态而省略操作指引
  - SHALL NOT 在 workflow 模板 source text 中硬编码特定工具的 archive 调用语法

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
