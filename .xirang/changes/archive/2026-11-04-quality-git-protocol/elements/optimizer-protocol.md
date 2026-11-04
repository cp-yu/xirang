---
entity: element-declaration
identity: optimizer-protocol
kind: element
parent: optimization
title: Optimizer Protocol
definition: Optimizer Protocol 是 Optimizer 的受托执行与交付约束，独立承载输入、自主取证、实际影响范围、行为保持与测试纪律、必要记录及问题分流。它规定可写角色如何形成可信交付，不定义主 Agent 最终风险决策、CLI 方向队列或独立 Reviewer 的结论。
---

## MODIFIED Sections

### Section: Optimizer 输入合约
主 Agent SHALL 提供合法 `changeName`、绝对 `changeDir` 与 `projectRoot`、通过的基线 Review commit 以及委托定位信息。Opt 独立读取委托范围和约束、基线 Review、`.apply-isolation.json.baseCommit`（仅用于当前 Change scope 导航）、当前代码、Change、Semantic Model 与相关 Opt opinions。缺少通过的基线 Review 或不可解析的 scope baseCommit 时 SHALL fail closed；不得用 branch ref 猜测。Opt 结果以 `baseCommit` 与 `resultCommit` 标识，不将累计改动伪装成基线 Review 范围。

### Section: 执行并交付实际结果
Opt SHALL 自主发现、分组、合并、实施及局部验证，并交付一条 opinion，绑定起始 `baseCommit` 和实际结果 `resultCommit`。Opinion SHALL 报告实际保留改动与收益/保持依据、测试行为和结果及证据位置、放弃/撤销及遗留问题（无则明确说明）、后续建议及理由。表达形式与详略按复杂度决定，不固定标题或方向表单。CLI 生成 opinion identity 与 revision，并验证 commit objects；它不生成内容 fingerprint 或测试执行证据。

### Section: 按必要边界保存并恢复
代码改动、成功提交与恢复历史 SHALL 由 Git 承载；Opt SHALL 在交付时将意见关联 `baseCommit` 与 `resultCommit`。Quality SHALL NOT 持久化 Opt 进度、暂停记录、恢复位置或代码快照。Opt 可按恢复需要形成 Git commits；不要求逐优化方向 commit。中断时主 Agent 先确认旧写入者停止，再检查 Git history 和当前工作区，依据证据继续、修正或撤销；未完成工作不得作为 delivered opinion。优化引入的问题 SHALL 局部修正或撤销并验证、保留可靠工作；无法确认恢复可靠时停止并交回主 Agent，不以未解决状态完成。
