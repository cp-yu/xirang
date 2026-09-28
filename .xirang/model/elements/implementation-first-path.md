---
entity: element-declaration
identity: implementation-first-path
kind: element
parent: change-formation
title: Implementation-first Path
definition: Implementation-first Path 是 Change Formation 的路径之一：从已发生的项目实现出发，再形成完整 Change。该路径通过 Snack 对照 Semantic Model 与实现证据，形成完整 Change。
---

## Specification

### Section: 从已发生实现出发
Implementation-first Path SHALL 以已经发生的项目实现为形成 Change 的起点。

- **实现先于 Change**
  - 项目改动已经存在
  - Agent 不重做标准 Apply

### Section: 通过 Snack 对照模型与证据
Implementation-first Path SHALL 通过 Snack 对照 Semantic Model 与实现证据。

- **识别语义影响**
  - Snack 检查已有实现
  - 它结合模型与证据识别影响面

### Section: 形成完整 Change
Implementation-first Path SHALL 通过 Snack 形成完整 Change。

- **Snack Formation 完成**
  - Delta 与适用 Plan 已完整并确认
  - 已有实现获得对应的完整 Change

### Section: 不生成执行任务清单
Implementation-first Path SHALL 因实现已经完成而不生成 `tasks.md`。

- **编写 Change Plan**
  - Snack 记录已有实现的意图与决策
  - Plan 不包含执行任务清单

### Section: 移交验证与收束
Implementation-first Path 形成完整 Change 后 SHALL 进入后续验证与 Change Closure。

- **已有实现完成调和**
  - Formation 审查与确认通过
  - 当前实现交由 Verify 独立评估
