---
entity: "element-declaration"
identity: "agent"
kind: "element"
parent: "agents"
title: "Agent"
definition: "Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。"
---

## MODIFIED Sections

### Section: 按需委托 Internal Agents

Agent SHALL 按角色委托 Internal Agents：独立正确性评估交给 Reviewer，优化执行交给 Opt，实验交给 Experimenter；主 Agent 不以自身判断或 Opt 自测代替必需的独立 Review。

## ADDED Sections

### Section: 负责优化范围与最终验证

主 Agent SHALL 确定优化委托范围、处理越界与契约问题，可读取实际代码与证据，依据收益、成本、风险、已覆盖范围及潜在机会判断是否继续。每次交付后可交回修正或启动 fresh-context 新探索，无需自行先找新方向，也不固定轮数或要求穷尽证明。优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。

主 Agent SHALL 在收尾告知放弃优化的事项、原因及处理结果；中断更换写入者前确认旧 Opt 停止，不能确认归属或恢复可靠时不继续完成。
