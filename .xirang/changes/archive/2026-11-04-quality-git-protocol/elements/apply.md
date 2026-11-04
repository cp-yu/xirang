---
entity: element-declaration
identity: apply
kind: element
parent: change-implementation
title: Apply
definition: Apply 是 Change Implementation 中落实 Change 项目改动的活动，独立承载按 Expected Semantic Model、Change Plan 与当前状态实施普通项目工作及处理相应修正。存在 tasks.md 时按执行与验证安排推进，并将结果交给 Verify；优化阶段集成受托 Opt 的实施与主 Agent 的最终验证编排，不承担逐方向选择协议或模型同步归档。
---

## MODIFIED Sections

### Section: 处理 Required Corrections
Verify 返回普通实现的 Required Corrections 时，主 Agent SHALL 判断并完成相应修正，按需更新 `tasks.md`，将修正形成新的 Git commit，并针对该 commit 重新执行 Change 级 Review。Opt 中的问题由 Opt 或主 Agent 依据实际证据修正或撤销；基线漏掉的当前 Change 缺陷由主 Agent 安排修复并追加针对性独立 Review。Reviewer 和 Quality CLI SHALL NOT 自动修改任务文件。

### Section: 集成受托优化执行
普通实现完成并通过独立 Review 后，主 Agent MAY 选择委托 Optimization。Opt 在委托范围内自主分组、修改与局部测试，交付关联 `baseCommit`/`resultCommit` 的 opinion；主 Agent 决定是否继续、是否追加 Review 以及 Seal 的最终声明。优化修改不自动重复普通 Apply 任务循环或每项 Change 级 Review。代码历史与恢复由 Git 承载，Quality SHALL NOT 创建代码 checkpoint。
