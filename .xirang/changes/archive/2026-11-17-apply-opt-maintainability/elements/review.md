---
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由 clean-context Reviewer 独立评估实现正确性的活动，独立承载基于证据的结论与修正意见。每条 Review opinion 绑定一个已提交的 Git commit；Review 不修改项目、不管理代码恢复，也不替主 Agent 决定优化价值或最终验证范围。
---

## MODIFIED Sections

### Section: 修改后重新 Review

失败的 full-change Review 修正 SHALL 形成不同 Git commit 并重新完整 Review。Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

已确认的基线缺陷修复 SHALL 接受 supplemental Review；该意见只证明对应缺陷及其影响，不自动代替累计优化的 full-change/incremental Review。任何类别未解决的 FAIL 不能被其他类别意见掩盖，后续意见绑定真实受审 commit。

### Section: 在每次 Apply 修改后执行

普通 Apply 完成所有目标与 Required Corrections 后 SHALL 在 Opt 前执行 `full-change` Review；被审查实现 SHALL 先提交为 Git commit 且本次所需测试已由主 Agent 运行通过。Review 不通过时，主 Agent SHALL 处理修正、形成新的修正 commit 并重新执行完整 Change Review，直到通过。Opt 后累计保留且尚未审查的变更 SHALL 在 Seal 前通过 full-change 或 incremental Review，主 Agent 按累计影响选择范围，可累计多批后审查或提前审查，不能以低风险免审；完整 Review 漏掉的既有 Change 缺陷经修复后 SHALL 执行针对缺陷及其影响的 `supplemental` Review。
