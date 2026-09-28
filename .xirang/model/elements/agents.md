---
entity: element-declaration
identity: agents
kind: element
parent: participants
title: Agents
definition: Agents 是可代表息壤推进 Realization 的执行主体。它们理解 Semantic Model 与项目证据，形成或调和 Change，实现 Change，组织独立评估，并在用户授权下推进模型构建与 Change 收束；Agents 分为 Agent 与 Internal Agents。
---

## Specification

### Section: 理解语义与项目证据
Agents SHALL 理解 Semantic Model、Change、用户决策与项目证据，并以其作为推进依据。

- **判断下一步行动**
  - Agent 接手 Realization
  - 它先读取适用语义与证据

### Section: 形成或调和 Change
Agents SHALL 按适用 Formation Path 形成或调和 Change。

- **Change 尚未形成**
  - 用户意图或已有实现需要规范化
  - Agent 使用 Intent-first 或 Implementation-first Path

### Section: 实现 Change
Agents SHALL 将已形成 Change 落实到项目。

- **Change 进入 Implementation**
  - Change 已完成 Formation
  - Agent 依据 Expected Semantic Model 修改项目

### Section: 组织独立评估
Agents SHALL 组织对项目结果的独立评估。

- **Apply 产生项目状态**
  - 当前实现可供验证
  - Agent 委托适用 Internal Agent 评估

### Section: 经授权推进构建与收束
Agents SHALL 仅在用户授权下推进 Semantic Model Build 与需要授权的 Change 收束事项。

- **授权尚未获得**
  - 下一状态转换需要用户确认
  - Agent 暂停推进并请求授权

### Section: 分为两类协作身份
Agents SHALL 分为 Agent 与 Internal Agents。

- **分配执行与判断**
  - Realization 同时需要编排和独立评估
  - 分别由 Agent 与 Internal Agent 承担
