---
operation: "MODIFIED"
entity: "element-declaration"
identity: "optimizer-findings"
kind: "element"
parent: "quality"
title: "Optimizer Findings"
definition: "Optimizer Findings 是 Quality 中优化实际结果与证据的交付合约，独立承载保留改动、行为保持依据、验证结果、未完成事项及后续建议。它以委托交付为组织单位，不维护逐方向队列或优先级；执行和恢复由 Optimization Execution 定义，机械关联和输入校验由 Quality CLI Gate 定义。"
---

## ADDED Sections

### Section: 交付实际结果与验证建议

Opt 报告 SHALL 包含四类必要信息：实际保留改动、改善及影响范围与行为保持依据；测试覆盖行为、实际结果及证据位置；放弃事项及原因、是否撤销、遗留问题，无此类事项时明确说明；是否值得继续及是否扩大测试或追加 Review 的建议与理由。表达形式、标题与详略按复杂度自主决定，多项小优化可共享简短说明及测试证据，复杂算法按实际行为约束展开。CLI 只检查必要信息和关联，不评价自然语言充分性。

### Section: 证据分工与机械关联

基线独立 Review、Opt 执行报告、主 Agent 最终验证结论 SHALL 可区分，不要求分别三个文件，也不维护重复机器台账和人类报告。代码状态、时间、委托标识、记录版本 SHALL 由 CLI 生成；Opt 不手工维护哈希。测试关联执行时状态，稍后提交报告不能改绑。内部未实施想法不强制预先登记、永久 ID、排序或重复字段。

### Section: 保留未完成事项与历史

已尝试优化被放弃时 SHALL 保存事项、无法完成原因及处理结果，最终告知用户；交付/主动暂停/交回时保存进展、实际测试与遗留问题。失败尝试与有效保留结果分开，历史可供后续 Opt 读取，不能因可选尝试失败将整体结果笼统判为下降。中断未交付状态 SHALL NOT 当作完成。

### Section: 交付不代替最终判断

Opt MAY 交付本次委托完成且无遗留问题，但主 Agent SHALL 判断继续投入或最终验证，可交回修正后更新交付，不要求重走全部候选发现排序。主 Agent 可启动 fresh-context 新探索而无需先提出具体方向；最终验证可覆盖多次交付累计改动，CLI 不选择下一项工作。

## REMOVED Sections

### Section: Finding 数据合约与稳定标识

### Section: Finding 优先级与选择

### Section: Selected finding 的 priorityReason 说明相对优先理由

### Section: 优化循环终止

### Section: 方向状态集合

### Section: 每轮台账与历史保留
