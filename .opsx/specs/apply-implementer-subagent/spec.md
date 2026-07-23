---
element: cap.apply.subagent-orchestration
---

# apply-implementer-subagent Specification

## Purpose
记录 `opsx-implementer` coding subagent 能力已从 active apply workflow 中移除。
## Requirements
### Requirement: apply 不再调用 implementer subagent

系统 SHALL NOT 在 apply Phase 0 中生成、安装或调用 `opsx-implementer`。

#### Scenario: apply workflow 不 dispatch implementer

- **WHEN** Master agent 执行 apply Phase 0
- **THEN** 系统直接实现 pending task
- **AND** 系统 SHALL NOT dispatch coding subagent

#### Scenario: internal subagent 列表显式排除 implementer

- **WHEN** 系统渲染 internal subagent artifact
- **THEN** internal subagent 列表 SHALL 包含 reviewer、optimizer 和 impact-sweeper
- **AND** internal subagent 列表 SHALL NOT 包含 `opsx-implementer`

#### Scenario: clean-context gate 保持不变

- **WHEN** Phase 0 实现完成
- **THEN** 系统仍 SHALL 使用 reviewer subagent 进行 Phase 1 判断
- **AND** 系统仍 SHALL 使用 optimizer subagent 判断 Phase 2 优化机会
