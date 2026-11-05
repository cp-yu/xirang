---
entity: element-declaration
identity: change-plan
kind: element
parent: change
title: Change Plan
definition: Change Plan 是 Change 的辅助性组成。它通过 `proposal.md`、`design.md` 与 `tasks.md` 共同解释该 Change 的意图与路径；它帮助用户审查 Change，并帮助 Agent 生产与执行 Semantic Delta，但不独立定义目标语义。
---

## Specification

### Section: Proposal 说明意图与影响

`proposal.md` SHALL 说明发起 Change 的原因、范围与影响面。

- **审查 Change 原因**
  - 用户或 Agent 读取 proposal
  - 可理解为何发起 Change 及其边界

### Section: Design 记录决策与策略

`design.md` SHALL 记录关键决策、理由与实现策略。

- **理解实现路径**
  - Agent 读取 design
  - 可获得已确认决策及其理由

### Section: Tasks 安排待执行工作

当实现尚未发生时，`tasks.md` SHALL 与用户对齐待完成的实施目标及需要覆盖的验证方向，以目标 Semantic Delta 为依据，不预先列举实施文件、测试命令或一般技术依赖；Apply SHALL 根据当时项目状态决定具体实施与验证方式。用户明确要求的先后次序 SHALL 保留，未明确要求的任务顺序不构成执行约束。

- **Intent-first Change 进入实现**
  - 项目改动尚待落实
  - tasks 提供目标、验证方向与适用的用户指定次序

### Section: Implementation-first 不生成 Tasks

当实现已经发生时，Snack SHALL NOT 生成 `tasks.md`。

- **从已有实现形成 Change**
  - Change 通过 Implementation-first Path 形成
  - Plan 不虚构执行任务清单

### Section: Change Plan 仅作辅助

Change Plan SHALL 帮助用户审查 Change 并帮助 Agent 生产和执行 Semantic Delta，但 SHALL NOT 独立定义目标语义。`proposal.md` SHALL 说明动机、范围及语义来源影响，`design.md` SHALL 记录关键方案决策及理由，`tasks.md` SHALL 记录待完成目标与验证方向；三者 SHALL 避免重复维护同一目标行为或提前猜测待修改代码文件。`design.md` MAY 保留用户已确认、构成方案约束的技术落点或路径。

- **Plan 与 Delta 冲突**
  - Plan 描述与 Delta 不一致
  - 目标语义由 Semantic Delta 决定
