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

### Section: Apply Phase 0 SHALL 执行 pending Checks

`xirang-apply-change` workflow SHALL 在 Phase 0 对 `tasks.md` 中未完成的目标读取验证方向，结合目标 Contract、现有测试和代码选择具体测试动作、边界及验证命令。行为或代码改动 SHALL 通过可信的 RED/GREEN 证据验证：先确认当前目标行为尚未满足，再实现并重跑同一行为检查；不得以语法错误、错误路径或损坏 fixture 制造 RED。非运行时制品不要求人为失败测试；config、schema、generated template、workflow template 与 agent instruction template 默认视为有行为消费者，除非证据证明无消费者。工作流 SHALL 只在目标适用验证通过后更新目标或 Required Corrections 的完成状态，不向任务文件写入具体测试操作与输出。

- **行为或代码目标**
  - Apply 开始未完成目标
  - SHALL 先检查已有测试，动态选择 reuse、modify、add、delete 或 one-time，并针对目标行为取得 RED 与 GREEN 证据

- **非运行时制品**
  - 目标只修改无消费者的文本或制品
  - SHALL 检查最终证据，不人为制造失败测试

- **Config、Schema 与模板**
  - 目标影响有运行时或生成面消费者的配置或模板
  - SHALL 默认验证实际行为，不能仅校验措辞

### Section: Apply 完成时输出 archive 指引

Apply 阶段在所有 task 完成且 Seal 通过后，SHALL 显式输出下一步操作指引，引导用户进入归档。Seal 返回有效且绑定 commit 对象存在时，apply SHALL 在汇总输出末尾给出 archive-ready call-to-action；指引 SHALL 引用 archive workflow 的工具适配 invocation，不在 workflow 模板 source text 中硬编码特定工具的 archive 调用语法。

### Section: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个目标作为实施与验证闭环；单个目标完成 SHALL NOT 触发 Review、Optimization 或 workflow handoff。全部未完成目标与 Required Corrections 完成后 SHALL 进入 Change-level Review；普通实现与基线 Review 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review；Optimization 的修改和 Seal 中的证据缺口 SHALL 按共享优化协议判断受影响验证，修复基线缺陷必须针对性独立 Review，不强制每项优化重做整 Change Review。

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
