## Why

场景操作标签（`[ADDED]`/`[MODIFIED]`/`[REMOVED]`）两层标签系统交互规则不清晰，提示词和校验器未对齐，导致 agent 不会正确使用。MODIFIED 下的无标签 scenario 未被约束，错误信息缺少语义解释。

## What Changes

- 校验器新增约束：`## MODIFIED Requirements` 下每个 scenario 必须有标签；`## ADDED Requirements` 下 [MODIFIED]/[REMOVED] → ERROR 并解释语义原因
- 错误信息增加"why"：解释为什么该标签组合不合法，并建议正确的 section
- 提示词简化：用一段话替代冗长表格，明确仅 MODIFIED 需要标签、ADDED 不加、REMOVED 无场景
- 存活 scenario 计数错误消息区分 section 语义

## Capabilities

- **Modified Capabilities**: `cap.validation.spec`, `cap.validation.change` (校验器约束变更)
- **Modified Capabilities**: `cap.ai.workflow-templates` (specs instruction 标签指引更新)

## Impact

- 已有 change 中 MODIFIED 下无标签的 spec 将在 validate 时报错（当前活跃 change 均已有标签，无 break）
- 所有形式化 spec 不受影响（formals 原本就不允许标签）
