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

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

inspection opinion SHALL 报告具体证据、机会、预期收益、成本风险与验证方法，或停止依据。implementation opinion 报告实际保留改动、改善及影响、行为保持依据、实际测试结果和证据位置、放弃事项与撤销原因、遗留问题，以及继续投入和验证范围的建议。没有相关结果时如实说明，不制造测试或改动。多项小改进可共享说明与证据，复杂算法按实际约束展开；opinion 绑定真实 baseCommit/resultCommit，Quality 不保存原始测试输出或代码快照。

### Section: 证据分工与机械关联

基线独立 Review、Opt opinion 与主 Agent Seal SHALL 可区分，不要求分别三个文件，也不维护重复机器台账和人类报告。CLI 生成 opinion identity 与 revision，并校验 Git commit identity；Opt 不手工维护哈希。测试结果与证据位置可以写入 opinion 的说明，但原始测试输出不存入 Quality JSON。Seal 是主 Agent 判断，不伪装成 Review 或实际测试记录。

### Section: 保留未完成事项与历史

已尝试优化被放弃时，Opt SHALL 在已交付 opinion 中保存事项、无法完成原因、撤销与处理结果；交付时 SHALL 报告遗留问题，无则明确说明。失败尝试与有效保留结果分开，后续 Opt 可读取历史 opinions，不能因一项可选尝试失败将整体结果笼统判为下降。未交付中断不作为完成 opinion；其代码状态和恢复历史由 Git 承载。

### Section: 交付不代替最终判断

Opt MAY 交付本次委托完成且无遗留问题，但主 Agent SHALL 判断是否继续投入、必需 Review 的范围与时机，以及如何 Seal，可交回具体修正或启动 fresh-context 新探索。Opt opinion 不表示 Change 完成；最终 Seal 由主 Agent 绑定一个 Git commit 并声明可运行及预期通过适用测试，CLI 不执行测试或决定后续工作。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。
