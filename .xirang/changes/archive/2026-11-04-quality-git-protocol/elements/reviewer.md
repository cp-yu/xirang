---
operation: MODIFIED
entity: element-declaration
identity: reviewer
kind: element
parent: internal-agents
title: Reviewer
definition: Reviewer 是独立读取指定 Git commit 并判断项目实现是否符合 Expected Semantic Model 的只读 Internal Agent，独立于实现者与主 Agent 的风险决策。它评估基线完整 Change、主 Agent 要求的优化增量或基线缺陷修复及影响，并交付绑定该 commit 的 Review opinion、Required Corrections 或证据缺口；不修改项目或任务，也不决定优化价值与最终验证范围。
---

## MODIFIED Sections

### Section: 独立取得 Review 证据
Reviewer SHALL 自主读取任务指定的 Git commit、Semantic Model、Change、项目状态与必要证据，不依赖 Apply 的完成声明。审查任务 SHALL 指明被审查 commit；Reviewer 的结论只适用于该 commit 与实际委托范围。

### Section: 交付结构化 Review 结论
Reviewer SHALL 将实际审查 commit、范围、result、summary、findings、Required Corrections 与证据缺口作为结构化 opinion 交给主 Agent。基线为 Change 级评估；增量或基线缺陷修复评估不得冒充整 Change 重新审查。Opt 自测及主 Agent 无需追加 Review 的判断不是独立 Review。Reviewer 保持只读，主 Agent 依据 opinion 判断修正并按需更新 `tasks.md`。

## REMOVED Sections

- 保持只读且不管理 Checkpoint

## ADDED Sections

### Section: 保持只读且不修改项目与任务
Reviewer SHALL NOT 修改项目文件、`tasks.md`、Quality JSON 或 Git history，也 SHALL NOT 创建或恢复代码状态。发现问题时只返回绑定被审查 commit 的 opinion；主 Agent 负责后续修正、任务状态与提交。
