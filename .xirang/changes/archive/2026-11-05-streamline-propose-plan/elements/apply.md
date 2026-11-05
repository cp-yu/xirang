---
entity: element-declaration
identity: apply
kind: element
parent: change-implementation
title: Apply
definition: Apply 是 Change Implementation 中落实 Change 项目改动的活动，独立承载按 Expected Semantic Model、Change Plan 与当前状态实施普通项目工作及处理相应修正。存在 tasks.md 时按执行与验证安排推进，并将结果交给 Verify；优化阶段集成受托 Opt 的实施与主 Agent 的最终验证编排，不承担逐方向选择协议或模型同步归档。
---

## MODIFIED Sections

### Section: 遵循现有 Tasks 安排

当 `tasks.md` 存在时，Apply SHALL 以其中与用户对齐的目标和验证方向推进，遵守用户明确要求的先后次序；对未指定顺序的目标 SHALL 根据当前代码与测试现状安排实施顺序、文件、测试动作、层级、命令和具体操作。Apply SHALL 不以这些现场判断修改已确认的目标语义或业务时序。

- **Change 具有目标任务**
  - Apply 开始执行
  - 先读取目标 Contract 与 Plan，再确定实际实施与验证方法

- **用户指定目标顺序**
  - 任务排列及 Plan 明确目标 A 须先于 B
  - Apply SHALL 在 A 完成后推进 B
