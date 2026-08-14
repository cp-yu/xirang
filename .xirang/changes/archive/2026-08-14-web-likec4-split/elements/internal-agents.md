---
entity: element-declaration
identity: internal-agents
kind: element
parent: agents
title: Internal Agents
definition: Internal Agents 是在与 Agent 隔离的 clean context 中承担无法由 CLI 确定性操作替代的独立判断的执行主体。它们通常只读，输出结构化结论供 Agent 消费；不修改项目，不关闭 Change，不提升 Semantic Model。
---

## MODIFIED Requirements

### Requirement: 不替代确定性查询

影响发现、模型导航和关系查询 SHALL 由 CLI 与 Web 承担，而不是由 Internal Agents 重做。

#### Scenario: 需要模型影响上下文

- **WHEN** Internal Agent 需要确定性关系信息
- **THEN** 它消费 Interaction Surface 提供的结果
