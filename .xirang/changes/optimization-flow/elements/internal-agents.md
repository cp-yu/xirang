---
operation: "MODIFIED"
entity: "element-declaration"
identity: "internal-agents"
kind: "element"
parent: "agents"
title: "Internal Agents"
definition: "Internal Agents 是在与主 Agent 隔离的上下文中接受委托、独立取得依据并交付结果的执行主体，独立区分于端到端编排身份。它们包含只读 Reviewer、可写受托 Optimizer 与 Experimenter，各角色按职责执行审查、优化或实验；不承担用户设计确认、Change 关闭或 Semantic Model 提升。"
---

## MODIFIED Sections

### Section: 在 Clean Context 中判断

Internal Agents SHALL 在与主 Agent 隔离的上下文中接受委托并独立工作。Reviewer 在不受实现过程判断影响的 clean context 中评估；新的 Optimization 探索由 fresh-context Opt 独立读取并执行，中断恢复可在旧执行者停止后由原 Opt 或接手者继续同一委托；Experimenter 独立设计与执行所委托实验。

### Section: 输出结构化结论

Internal Agents SHALL 向主 Agent 返回足以支持后续编排的证据与结果。Reviewer 返回所评估范围的独立结论与修正事项；Opt 返回实际保留改动、行为保持依据、测试与证据、放弃及遗留问题、后续建议；Experimenter 返回方法、观察结果与限制。Opt 的交付不决定整个 Optimization 完成，其自测不作为独立 Review；主 Agent 决定后续投入与最终验证，不替用户确认设计。

### Section: 按角色限定操作能力

Reviewer SHALL 保持只读，不通过 Bash 绕过写入限制。Optimizer SHALL 在委托范围内实际具有修改实现与相关测试的权限，自主分组、合并、补充及运行局部测试；缺少对应测试时先补测试再改实现。Experimenter MAY 编写并执行实验所需代码与文件。所有角色均不承担用户确认、正式模型提升或 Change 关闭；Opt 中间恢复状态不自动成为最终成功，最终验证由主 Agent 负责。
