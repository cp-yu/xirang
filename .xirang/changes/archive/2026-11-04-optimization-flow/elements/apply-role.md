---
operation: "MODIFIED"
entity: "element-declaration"
identity: "apply-role"
kind: "element"
parent: "agent"
title: "Apply Role"
definition: "Apply 是 Agent 落实 Change 所描述项目改动的工作身份，独立表达写入普通实现、遵循任务安排与处理修正的责任。它以 Expected Semantic Model 为目标，结合 Change Plan 和当前状态推进；在优化集成中由主 Agent 委托 Opt 执行、判断后续投入与最终验证，不替代独立 Reviewer 或执行模型同步归档。"
---

## MODIFIED Sections

### Section: 接收 Verify 返回事项

Apply Role SHALL 接收普通实现 Required Corrections 并再次执行 Apply。优化中由主 Agent 安排范围和修正，Opt 受托执行优化与局部验证；主 Agent 可委托 Opt 或自行修复当前 Change 基线缺陷，修复后安排针对问题及其影响的独立 Review。

### Section: 交付状态与证据

Apply Role SHALL 将普通 Apply 产出的项目状态与可复现证据交付独立 Review。进入优化后 SHALL 委托可写 Opt 并检查实际交付，依据累计改动和风险判断最终验证；所需验证通过且证据对应当前状态后保存最终 successful checkpoint。
