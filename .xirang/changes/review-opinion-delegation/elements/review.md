---
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由 clean-context Reviewer 独立评估实现正确性的活动，独立承载基于证据的结论与修正意见。每条 Review opinion 绑定一个已提交的 Git commit；Review 不修改项目、不管理代码恢复，也不替主 Agent 决定优化价值或最终验证范围。
---

## MODIFIED Sections

### Section: 在每次 Apply 修改后执行

普通 Apply 完成所有目标与 Required Corrections 后 SHALL 在 Opt 前执行 `full-change` Review；被审查实现 SHALL 先提交为 Git commit 且本次所需测试已由主 Agent 运行通过。Review 不通过时，主 Agent SHALL 处理修正、形成新的修正 commit 并重新执行完整 Change Review，直到通过。Opt 后的 `incremental` Review 按主 Agent 对累计改动及其影响的风险判断安排；完整 Review 漏掉的既有 Change 缺陷经修复后 SHALL 执行针对缺陷及其影响的 `supplemental` Review。

### Section: 评估目标实现质量

Review SHALL 在受托质量维度内评估完整性、正确性、一致性、项目约束和必要清理。`full-change` 覆盖完整累计 Change；`incremental` 覆盖受托的累计 Opt 改动与受影响行为；`supplemental` 覆盖原有 Change 缺陷的修复与影响。按维度分工时，每位 `full-change` Reviewer 在自己的维度内仍审查完整 Change；委派覆盖不到完整 Change 时交回主 Agent 重新委派，不产生 FAIL opinion。主 Agent收齐维度结论后合并为一条意见，失败或未解决的必需维度不得合并为 PASS。

### Section: 结论绑定被评估状态

Review opinion SHALL 关联实际审查 checkout 的 HEAD Git commit、`reviewKind`、`result`、`summary` 与 `findings`。Reviewer 从不可变 `baseCommit` 与 HEAD 的提交树差异定位累计 Change，审查期间只以已提交 HEAD 内容作为实现证据；未提交内容不属于该意见。HEAD 在审查期间变化时停止并报告主 Agent，不返回意见；后续实现改变不得重绑旧意见。只有通过的 `full-change` Review 才允许进入 Opt 或满足 Seal 的完整审查门禁。

### Section: 修改后重新 Review

失败的 `full-change` Review 所需修正 SHALL 形成不同 Git commit，并针对新 commit 重新 Review。Opt 改动不自动触发独立 Review；主 Agent判断是否安排 `incremental`，但已确认的当前 Change 原有缺陷的修复必须安排 `supplemental` Review。已经执行且失败的 Review 不得因不同类别的意见而被掩盖；后续意见准确绑定各自审查的 commit 与类别。
