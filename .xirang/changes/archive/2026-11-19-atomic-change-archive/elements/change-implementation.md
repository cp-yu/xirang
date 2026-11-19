---
entity: element-declaration
identity: change-implementation
kind: element
parent: change-realization
title: Change Implementation
definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan 实施项目，并以独立 Review、Opt 机会检查及获授权的改进、主 Agent 的 Seal 声明形成进入 Closure 的质量依据。本阶段负责实现与验证，不更新正式 Semantic Model 或关闭 Change。
---

## MODIFIED Sections

### Section: 实现并独立验证目标状态

Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 落实项目，并由 Verify 使用独立判断与可复现项目证据确认完整性、正确性和一致性。普通实现完成后取得绑定已提交代码的独立 full-change Review，通过后默认由独立干净上下文 Opt 只读发现机会，协调者再授权行为保持的改进或停止。每批保留改动由协调者提交并记录真实交付；无改动检查也记录 delivered，not_performed 只用于确未运行。Seal 前，累计保留改动须通过独立全量或增量 Review，风险只决定范围；通过后继续改动须重新审查，既有缺陷修复仍须针对性 Review。

Quality SHALL 使用共享写入序号与 commit 关联检查 Opt 后 Review；允许受审提交为最后一次变更 Opt 的结果或其 Git 后继，Seal 绑定该通过审查的提交。主 Agent 声明该版本可运行且预期通过适用测试。Quality 不保存代码快照、测试输出或工作区 fingerprint，不要求 Seal commit 匹配 HEAD 或工作区。只有基线 Review、适用后续 Review、明确 Opt 处置和 Seal 均满足时才具备默认交付归档的质量资格；quick 免 Seal 而不豁免模型与任务门禁。放弃留档不以完成实现为条件。
