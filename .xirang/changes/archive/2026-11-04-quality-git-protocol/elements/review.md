---
operation: MODIFIED
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由 clean-context Reviewer 独立评估实现正确性的活动，独立承载基于证据的结论与修正意见。每条 Review opinion 绑定一个已提交的 Git commit；Review 不修改项目、不管理代码恢复，也不替主 Agent 决定优化价值或最终验证范围。
---

## MODIFIED Sections

### Section: 在每次 Apply 修改后执行
普通 Apply 实现完成后 SHALL 执行覆盖完整 Change 的独立基线 Review，且被审查代码在 Review 开始前已提交为 Git commit。Review 不通过时，主 Agent SHALL 处理 Required Corrections、形成不同的修正 commit，并针对该 commit 重新执行 Review，直至取得通过的基线 Review。只有通过的基线 Review 才允许 Opt 开始或 Seal；Opt 后是否追加增量 Review 由主 Agent 按风险决定。

### Section: 结论绑定被评估状态
每条 Review opinion SHALL 包含其实际评估的 Git commit identity、审查范围、结果、summary 与 findings。Review 开始前目标代码 SHALL 已提交，审查期间保持该代码状态不变；保存 opinion 时 SHALL 保留原 commit identity，不因之后的代码修改重绑结论。通过的基线 Review 是 Opt 和 Seal 的必要前置条件。

### Section: 修改后重新 Review
基线 Review 失败后的修正 SHALL 提交为不同 Git commit，并针对该 commit 重新 Review；重复此过程直至基线通过。Opt 修改本身不自动要求 Review；是否进行 Opt 后 Review 由主 Agent 决定。已执行且失败的增量 Review 所指问题由主 Agent 处理，后续 Review 仍须准确关联其实际审查的 commit。

## REMOVED Sections

- 通过状态具备 Checkpoint 资格
