---
entity: element-declaration
identity: internal-agents
kind: element
parent: agents
title: Internal Agents
definition: Internal Agents 是在与 Agent 隔离的 clean context 中承担无法由 CLI 确定性操作替代的独立判断的执行主体。它们通常只读，输出结构化结论供 Agent 消费；不修改项目，不关闭 Change，不提升 Semantic Model。
---

## Specification

### Section: 在 Clean Context 中判断

Internal Agents SHALL 在不受 Apply 上下文影响的 clean context 中作出判断。

- **Agent 请求独立评估**

  - 当前项目状态需要 Review 或 Optimization
  - Internal Agent 在隔离上下文中开始评估

### Section: 独立读取判断依据

Internal Agents SHALL 独立读取 Semantic Model、Change 与项目证据。

- **形成评估结论**

  - Internal Agent 接手任务
  - 它从当前项目状态获取所需依据

### Section: 输出结构化结论

Internal Agents SHALL 输出结构化结论供 Agent 消费。

- **独立判断完成**

  - Internal Agent 完成评估
  - Agent 获得可执行的结构化结论

### Section: 不修改项目

Internal Agents SHALL NOT 修改项目。

- **发现需要修正或优化的事项**

  - Internal Agent 识别出项目改动
  - 它返回事项而不直接写入文件

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
