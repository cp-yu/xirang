## ADDED Requirements

### Requirement: Change-local specs express target steady state

Change-local specs SHALL 使用 `ADDED`、`MODIFIED`、`REMOVED` 与 `RENAMED` sections 作为 reconciliation syntax，但 Requirement 与 Scenario 正文 SHALL 描述 change 完成后程序应持续呈现的目标稳态行为，MUST NOT 写成 change log、before/after narration 或实现历史。

#### Scenario: ADDED 正文直接描述行为
- **WHEN** change 引入新行为
- **THEN** ADDED Requirement SHALL 使用 durable capability name 与 normative target-state text
- **AND** SHALL NOT 使用“本次增加”“现在改为”等 change-context narration

#### Scenario: MODIFIED 包含完整目标状态
- **WHEN** existing Requirement 的行为或 Scenario 集发生变化
- **THEN** change-local MODIFIED block SHALL 包含完整 target-state Requirement
- **AND** SHALL 包含目标稳态中全部 surviving scenarios
- **AND** existing Requirement title SHALL 保持 exact matching

#### Scenario: Scenario 删除通过省略表达
- **WHEN** existing Scenario 在目标稳态中不再存在
- **THEN** Agent-authored MODIFIED Requirement SHALL 省略该 Scenario
- **AND** Agent MUST NOT 编写“Scenario 已删除”的日志 Scenario
- **AND** Agent MUST NOT 手工预写 `[REMOVED]` scenario operation label

#### Scenario: Programmatic labels 不改变正文语义
- **WHEN** `openspec scenario-labels <change> --write` 比较 formal 与 change-local target-state Requirement
- **THEN** 命令 MAY 生成 change-local review metadata
- **AND** 该 metadata SHALL NOT 被视为 Agent-authored behavior source
