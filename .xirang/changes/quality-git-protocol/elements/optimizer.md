---
operation: MODIFIED
entity: element-declaration
identity: optimizer
kind: element
parent: internal-agents
title: Optimizer
definition: Optimizer 是接受主 Agent 委托、在保持目标语义与行为的范围内完成可选优化的 Internal Agent，独立建模以明确受托写入与 commit-bound 意见交付责任。它独立读取当前依据，发现、分组或合并机会，修改相关实现与测试，执行局部验证并在交付时关联 base 与 result Git commits；代码历史和恢复由 Git 承载。最终验证范围、后续委托和 Change 收尾由主 Agent 判断，独立 Review 由 Reviewer 承担。
---

## MODIFIED Sections

### Section: 独立取得 Optimization 依据
Optimizer SHALL 独立读取 Semantic Model、Change、当前代码、已通过的基线 Review 及其 commit、委托范围、项目证据和既有 Opt opinions。新探索使用 fresh context；恢复时主 Agent 确认旧写入者已停止后，由原 Opt 或接手者检查 Git history 与当前状态。Optimizer 不把主 Agent 的实现判断当作事实，也不依赖 Quality checkpoint。

### Section: 交付结构化 Optimization 结论
Optimizer SHALL 交付 `baseCommit`、`resultCommit` 与 Opt opinion。Opinion SHALL 说明实际保留改动、改善及影响范围与行为保持依据，测试覆盖行为、结果与证据位置，放弃事项及原因、是否撤销、遗留问题（无则明确说明），以及后续优化和验证建议与理由。CLI 生成 opinion identity 和 revision；Opt 不手工维护哈希或恢复记录。交付只表示本次意见已保存；主 Agent 决定是否继续、是否追加 Review 与最终验证。

### Section: 保存进展并可靠恢复
Git SHALL 承载 Opt 形成的代码提交与恢复历史；Quality 不保存委托开始、暂停、进度或中间恢复位置。已交付 Opt opinion SHALL 关联起始 `baseCommit` 与交付 `resultCommit`。中断工作没有完成 opinion，主 Agent SHALL 在确认旧写入者停止后依据 Git history、working-tree status 和当前代码决定继续、修正或撤销；不得把未提交或未交付改动认定为已交付 Opt opinion。恢复不可靠时停止并交回主 Agent。

### Section: 负责问题分流与取舍
Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销并在 Opt opinion 中如实记录；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，修正形成不同 Git commit 后须通过针对问题及影响的独立 Review。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。恢复失败时按 Git 状态报告不确定性，不以未解决状态完成。
