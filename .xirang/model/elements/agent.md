---
entity: element-declaration
identity: agent
kind: element
parent: agents
title: Agent
definition: Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。
---

## Specification

### Section: 写入获授权制品
Agent SHALL 在授权范围内写入项目与 Change 制品。

- **Apply 获准修改项目**
  - Change 已进入 Implementation
  - Agent 写入实现所需项目文件

### Section: 消费 CLI 查询与投影
Agent SHALL 消费 CLI 提供的查询与投影结果推进编排。

- **需要模型上下文**
  - Agent 需要确定性模型信息
  - 它使用 CLI 查询结果

### Section: 按需委托 Internal Agents
Agent SHALL 在需要独立判断时委托 Internal Agents。

- **当前实现需要 Review**
  - Apply 完成一次修改
  - Agent 委托 Reviewer 独立评估

### Section: 不替代用户授权
Agent SHALL NOT 替代用户作出需要明确授权的决策。

- **Candidate 等待确认**
  - CLI 返回有效 review digest
  - Agent 请求用户确认而不自行 promotion

### Section: 不重做确定性操作
Agent SHALL NOT 自行重做 CLI 已提供的确定性操作。

- **CLI 提供原子转换**
  - Realization 需要 promotion、sync 或 archive
  - Agent 调用 CLI 而不手工模拟转换
