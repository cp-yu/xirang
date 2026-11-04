---
entity: element-declaration
identity: optimizer-findings
kind: element
parent: quality
title: Optimizer Findings
definition: Optimizer Findings 是 Quality 中优化实际结果与证据的交付合约，独立承载保留改动、行为保持依据、验证结果、未完成事项及后续建议。它以委托交付为组织单位，不维护逐方向队列或优先级；执行和恢复由 Optimization Execution 定义，机械关联和输入校验由 Quality CLI Gate 定义。
---

## Specification

### Section: 交付实际结果与验证建议

Opt opinion SHALL 包含四类必要信息：实际保留改动、改善及影响范围与行为保持依据；测试覆盖行为、实际结果及证据位置；放弃事项及原因、是否撤销、遗留问题，无此类事项时明确说明；是否值得继续及是否扩大测试或追加 Review 的建议与理由。多项小优化可共享简短说明及测试证据，复杂算法按实际行为约束展开。Opinion SHALL 绑定 `baseCommit` 与 `resultCommit`；Quality JSON 保存意见，不保存测试输出或代码快照，CLI 不评价自然语言充分性。

### Section: 证据分工与机械关联

基线独立 Review、Opt opinion 与主 Agent Seal SHALL 可区分，不要求分别三个文件，也不维护重复机器台账和人类报告。CLI 生成 opinion identity 与 revision，并校验 Git commit identity；Opt 不手工维护哈希。测试结果与证据位置可以写入 opinion 的说明，但原始测试输出不存入 Quality JSON。Seal 是主 Agent 判断，不伪装成 Review 或实际测试记录。

### Section: 保留未完成事项与历史

已尝试优化被放弃时，Opt SHALL 在已交付 opinion 中保存事项、无法完成原因、撤销与处理结果；交付时 SHALL 报告遗留问题，无则明确说明。失败尝试与有效保留结果分开，后续 Opt 可读取历史 opinions，不能因一项可选尝试失败将整体结果笼统判为下降。未交付中断不作为完成 opinion；其代码状态和恢复历史由 Git 承载。

### Section: 交付不代替最终判断

Opt MAY 交付本次委托完成且无遗留问题，但主 Agent SHALL 判断是否继续投入、是否追加 Review 与如何 Seal，可交回具体修正或启动 fresh-context 新探索。Opt opinion 不表示 Change 完成；最终 Seal 由主 Agent 绑定一个 Git commit 并声明可运行及预期通过适用测试，CLI 不执行测试或决定后续工作。
