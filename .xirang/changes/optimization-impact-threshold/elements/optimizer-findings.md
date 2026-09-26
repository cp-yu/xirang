---
entity: "element-declaration"
identity: "optimizer-findings"
kind: "element"
parent: "quality"
title: "Optimizer Findings"
definition: "Optimizer Findings 定义 Quality 优化活动的方向台账合约：方向数据字段与稳定标识分配、方向状态集合、优先级与选择、每轮台账的判断与历史保留，以及优化循环的终止条件。它不定义命令面的输入形状（属于 Quality CLI Gate），也不定义执行顺序与回滚（属于 Optimization Execution）。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 优化循环终止

优化循环 SHALL 在不存在满足条件的方向、全部待选方向均低于 `optimization.minImpactLevel`、用户或配置拒绝继续优化、方向失败达上限且无其他可执行方向、或方向数达到 `optimization.directionLimit` 时收口。收口 SHALL 记录 `stopReason`，并据此推导终态。

#### Scenario: 多个成功方向不受失败额度限制

- **WHEN** `directionRetries` 为 2 且连续三个方向依次通过复核
- **THEN** 系统 SHALL 允许三个方向依次完成
- **AND** SHALL NOT 以成功次数消耗失败额度

#### Scenario: 无方向时收口

- **WHEN** 一轮判断确认不存在满足条件的方向
- **THEN** 收口记录 SHALL 使用 `stopReason: NO_ACTIONABLE`
- **AND** 终态 SHALL 为 `NOT_NEEDED`

#### Scenario: 全部方向低于门槛时收口

- **WHEN** 一轮判断确认所有待选方向的 `impactLevel` 均低于 `minImpactLevel`
- **THEN** 收口记录 SHALL 使用 `stopReason: NO_ACTIONABLE`
- **AND** 终态 SHALL 为 `NOT_NEEDED`

#### Scenario: 方向数用尽时收口

- **WHEN** 已选方向数达到 `directionLimit` 且仍有满足条件的方向
- **THEN** 收口记录 SHALL 使用 `stopReason: DIRECTION_LIMIT_REACHED`
- **AND** 终态 SHALL 为 `IMPROVED` 或 `DEGRADED`
