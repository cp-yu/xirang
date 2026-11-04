---
entity: "element-declaration"
identity: "change-closure"
kind: "element"
parent: "change-realization"
title: "Change Closure"
definition: "Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。"
---

## MODIFIED Sections

### Section: 仅接受有效验证结果

Change Closure SHALL 以仍然有效的 Change Implementation 验证结果为入口，不基于未验证或过期状态同步归档。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。 任一证据缺口 SHALL 按实际义务补齐，不将每次优化变化都解释为必须重新执行整 Change Review。
