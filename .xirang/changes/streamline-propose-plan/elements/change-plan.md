---
entity: element-declaration
identity: change-plan
kind: element
parent: change
title: Change Plan
definition: Change Plan 是 Change 的辅助性组成。它通过 `proposal.md`、`design.md` 与 `tasks.md` 共同解释该 Change 的意图与路径；它帮助用户审查 Change，并帮助 Agent 生产与执行 Semantic Delta，但不独立定义目标语义。
---

## MODIFIED Sections

### Section: Tasks 安排待执行工作

当实现尚未发生时，`tasks.md` SHALL 与用户对齐待完成的实施目标及需要覆盖的验证方向，以目标 Semantic Delta 为依据，不预先列举实施文件、测试命令或一般技术依赖；Apply SHALL 根据当时项目状态决定具体实施与验证方式。用户明确要求的先后次序 SHALL 保留，未明确要求的任务顺序不构成执行约束。

- **Intent-first Change 进入实现**
  - 项目改动尚待落实
  - tasks 提供目标、验证方向与适用的用户指定次序

### Section: Change Plan 仅作辅助

Change Plan SHALL 帮助用户审查 Change 并帮助 Agent 生产和执行 Semantic Delta，但 SHALL NOT 独立定义目标语义。`proposal.md` SHALL 说明动机、范围及语义来源影响，`design.md` SHALL 记录关键方案决策及理由，`tasks.md` SHALL 记录待完成目标与验证方向；三者 SHALL 避免重复维护同一目标行为或提前猜测待修改代码文件。`design.md` MAY 保留用户已确认、构成方案约束的技术落点或路径。

- **Plan 与 Delta 冲突**
  - Plan 描述与 Delta 不一致
  - 目标语义由 Semantic Delta 决定
