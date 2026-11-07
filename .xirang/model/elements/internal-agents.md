---
entity: element-declaration
identity: internal-agents
kind: element
parent: agents
title: Internal Agents
definition: Internal Agents 是在与主 Agent 隔离的上下文中接受委托、独立取得依据并交付结果的执行主体，独立区分于端到端编排身份。它们包含只读 Reviewer、可写受托 Optimizer 与 Experimenter，各角色按职责执行审查、优化或实验；不承担用户设计确认、Change 关闭或 Semantic Model 提升。
---

## Specification

### Section: 在 Clean Context 中判断

Internal Agents SHALL 在与主 Agent 隔离的上下文中接受委托并独立工作。Reviewer 在不受实现过程判断影响的 clean context 中评估；新的 Optimization 探索由 fresh-context Opt 独立读取并执行，中断恢复可在旧执行者停止后由原 Opt 或接手者继续同一委托；Experimenter 独立设计与执行所委托实验。

### Section: 独立读取判断依据

Internal Agents SHALL 按角色与委托问题独立读取所需依据。Reviewer、Optimizer 读取 Semantic Model、Change 与当前项目证据；Experimenter 读取问题、约束、决策背景和所需项目证据，不要求尚未形成的完整 Change。

### Section: 输出结构化结论

Internal Agents SHALL 向主 Agent 返回足以支持后续编排的证据与结果。Reviewer 返回所评估范围的独立结论与修正事项；Opt 返回实际保留改动、行为保持依据、测试与证据、放弃及遗留问题、后续建议；Experimenter 返回方法、观察结果与限制。Opt 的交付不决定整个 Optimization 完成，其自测不作为独立 Review；主 Agent 决定后续投入与最终验证，不替用户确认设计。

### Section: 不关闭 Change

Internal Agents SHALL NOT 关闭 Change。

- **验证结论通过**

  - Internal Agent 判断当前状态满足门禁
  - Closure 仍由 Agent 编排

### Section: 不提升 Semantic Model

Internal Agents SHALL NOT 提升 Semantic Model。

- **Candidate 通过评估**

  - Internal Agent 没有发现阻塞问题
  - 它不执行 promotion

### Section: 不替代确定性查询

影响发现、模型导航和关系查询 SHALL 由 CLI 与 Web 承担，而不是由 Internal Agents 重做。

- **需要模型影响上下文**

  - Internal Agent 需要确定性关系信息
  - 它消费 Interaction Surface 提供的结果

### Section: 按角色限定操作能力

Reviewer SHALL 只读判断，不修改项目、Change、Quality、Checkpoint 或 Git history；其工具可用范围与主 Agent 相同，不以工具白名单、编辑否决或硬只读沙箱代替行为约束。Optimizer SHALL 在委托范围内实际修改相关实现与测试、执行局部验证，缺失对应测试时先补后改；Experimenter MAY 编写并执行受托实验。三者均不承担用户确认、正式模型提升或 Change 关闭，最终验证范围由主 Agent 决定。
