---
entity: element-declaration
identity: snack-role
kind: capability
parent: agent
title: Snack Role
definition: Snack 是 Agent 在 Implementation-first Path 中、从已发生实现出发形成或调和 Change 的工作身份。它对照 Semantic Model 与实现证据写出或更新 Semantic Delta 以及 Plan 中的意图与决策说明；因实现已完成，不生成执行任务清单。
---

## Requirements

### Requirement: 限定 Change 写入范围
Snack Role MAY 写入或更新 Semantic Delta、`proposal.md` 与 `design.md`，SHALL NOT 生成 `tasks.md`。

#### Scenario: Snack 需要调和制品
- **WHEN** 活动识别出不一致或缺失内容
- **THEN** Agent 只写入适用的 Change 制品

### Requirement: 保留一致制品内容
Snack Role SHALL 避免改写已被 Snack 判定与模型和实现证据一致的内容。

#### Scenario: 某项 Change 内容已一致
- **WHEN** Agent 执行制品更新
- **THEN** 该内容保持不变

### Requirement: 交付当前实现供独立验证
Snack Role SHALL 将完整 Change 与当前项目状态交付给 Verify。

#### Scenario: Snack 活动完成
- **WHEN** Formation 审查与确认通过
- **THEN** Agent 组织后续独立评估
