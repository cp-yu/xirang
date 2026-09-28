---
entity: element-declaration
identity: user
kind: element
parent: participants
title: 用户
definition: 用户表达并确认用户意图，裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题，并授权需要用户判断的重要决策与状态转换；用户不必亲自执行项目修改或确定性 CLI 操作。
---

## Specification

### Section: 表达用户意图
用户 SHALL 表达项目或 Change 的用户意图。

- **发起项目演进**
  - 用户希望建立项目或改变目标状态
  - 用户说明期望意图

### Section: 确认用户意图
用户 SHALL 确认将被落实的用户意图。

- **Agent 形成目标表达**
  - Agent 将意图编译为 Candidate 或 Change
  - 用户确认该目标表达

### Section: 裁决证据无法确定的问题
用户 SHALL 裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题。

- **存在多个合理解释**
  - 不同解释会改变目标语义
  - 用户选择目标解释

### Section: 授权重要决策与状态转换
用户 SHALL 授权需要用户判断的重要决策与状态转换。

- **提升 Candidate**
  - Candidate 已验证并呈现 digest
  - 用户决定是否授权 promotion

### Section: 无需亲自执行落实操作
用户 SHALL NOT 被要求亲自执行项目修改或确定性 CLI 操作。

- **已完成必要授权**
  - 后续步骤可由 Agent 与 CLI 确定推进
  - Agent 代表用户完成操作
