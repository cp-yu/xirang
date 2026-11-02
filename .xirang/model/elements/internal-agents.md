---
entity: element-declaration
identity: internal-agents
kind: element
parent: agents
title: Internal Agents
definition: Internal Agents 是在与主 Agent 隔离的上下文中接受委托、提供独立判断或实验结果的执行主体。它们包含 Reviewer、Optimizer 与 Experimenter，各角色定义自己的操作能力；不承担用户设计确认、Change 关闭或 Semantic Model 提升。
---

## Specification

### Section: 在 Clean Context 中判断

Internal Agents SHALL 在与主 Agent 隔离的上下文中接受委托并独立工作。Reviewer 与 Optimizer 在不受 Apply 过程判断影响的 clean context 中评估；Experimenter 独立设计与执行所委托实验。

### Section: 独立读取判断依据

Internal Agents SHALL 按角色与委托问题独立读取所需依据。Reviewer、Optimizer 读取 Semantic Model、Change 与当前项目证据；Experimenter 读取问题、约束、决策背景和所需项目证据，不要求尚未形成的完整 Change。

### Section: 输出结构化结论

Internal Agents SHALL 向主 Agent 返回结构化判断或实验结果。评估角色返回证据及所需修正或优化事项，Experimenter 返回方法、观察结果与限制；由主 Agent 编排后续过程，不替用户确认设计。

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

Reviewer 与 Optimizer SHALL 保持只读，只返回事项，不通过 Bash 绕过编辑/写入限制。Experimenter MAY 编写并执行实验所需代码与文件，其能力限制由实验职责决定；不得以内部 Agent 统一只读禁止实验。所有角色都不承担用户确认、正式模型提升或 Change 关闭。
