---
operation: "MODIFIED"
entity: "element-declaration"
identity: "apply"
kind: "element"
parent: "change-implementation"
title: "Apply"
definition: "Apply 是 Change Implementation 中落实 Change 项目改动的活动，独立承载按 Expected Semantic Model、Change Plan 与当前状态实施普通项目工作及处理相应修正。存在 tasks.md 时按执行与验证安排推进，并将结果交给 Verify；优化阶段集成受托 Opt 的实施与主 Agent 的最终验证编排，不承担逐方向选择协议或模型同步归档。"
---

## MODIFIED Sections

### Section: 处理 Required Corrections

Verify 返回普通实现的 Required Corrections 时，Apply SHALL 完成相应修正并重新进入 Change 级 Review。优化中的问题按优化协议分流：局部优化回归由 Opt 修正或撤销；基线漏掉的当前 Change 缺陷由主 Agent 安排修复并追加针对性独立 Review。

## ADDED Sections

### Section: 集成受托优化执行

Apply SHALL 在普通实现完成并通过独立 Review 后集成 Optimization。Opt 在委托范围内自主分组、修改与局部测试，主 Agent 负责范围、后续投入和基于累计改动的最终验证。优化修改不自动重复普通 Apply 任务循环或每项 Change 级 Review；最终所需验证通过后形成成功 checkpoint。

## REMOVED Sections

### Section: 实现已确认优化事项
