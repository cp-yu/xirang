---
operation: "MODIFIED"
entity: "element-declaration"
identity: "reviewer"
kind: "element"
parent: "internal-agents"
title: "Reviewer"
definition: "Reviewer 是独立取得证据并判断项目实现是否符合 Expected Semantic Model 的只读 Internal Agent，独立于实现者与主 Agent 的风险决策。它覆盖基线完整 Change，以及受托的优化增量或基线缺陷修复及影响，交付限于实际状态和范围的结论、Required Corrections 或证据缺口；不修改项目、不管理 Checkpoint，也不替主 Agent 决定优化价值及最终验证范围。"
---

## MODIFIED Sections

### Section: 交付结构化 Review 结论

Reviewer SHALL 将实际审查范围、对应状态、通过结论、Required Corrections 或证据缺口作为结构化结果交给主 Agent。基线为 Change 级评估；增量或基线缺陷修复评估不得冒充整 Change 重新审查。Opt 自测及主 Agent 无需追加 Review 的判断不是独立 Review；Reviewer 不决定最终优化取舍。
