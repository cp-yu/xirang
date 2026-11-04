---
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 xirang-apply-change 如何处理 Apply 的任务执行状态、task-level TDD 与 Quality 阶段门禁。它包含 pending Checks 的证据处理、needs_review 与 needs_optimize 状态分支，以及全部任务完成后的 clean-context 验证入口；它不定义 Phase 0 的执行主体、任务编排方式或临时实现材料。
---

## MODIFIED Sections

### Section: Apply 模板 SHALL 处理中间验证状态
`xirang-apply-change` 技能模板 SHALL 对 `needs_review` 和 `needs_optimize` 状态提供正确分支，无缝进入相应 Quality 阶段。

- **needs_review 状态进入 Review**

  - `instructions apply --json` 返回 `state: 'needs_review'`
  - 模板 SHALL 指示 Agent 委托 clean-context Reviewer，并保存 commit-bound opinion
  - SHALL NOT 中断流程或要求用户手动触发

- **needs_optimize 状态进入 Opt 处置与 Seal**

  - `instructions apply --json` 返回 `state: 'needs_optimize'`
  - 主 Agent SHALL 决定委托 Opt 或记录不做 Opt 的理由，之后完成 Seal
  - SHALL NOT 将 Opt 设为必做，也 SHALL NOT 中断流程或要求用户手动触发

- **Dashboard 分类标签不声称完成**

  - Dashboard 展示 task 全部完成的 change
  - 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Section: Apply 完成时输出 archive 指引
Apply 阶段在所有 task 完成且 Seal 通过后，SHALL 显式输出下一步操作指引，引导用户进入归档。Seal 返回有效且绑定 commit 对象存在时，apply SHALL 在汇总输出末尾给出 archive-ready call-to-action；指引 SHALL 引用 archive workflow 的工具适配 invocation，不在 workflow 模板 source text 中硬编码特定工具的 archive 调用语法。
