---
entity: "element-declaration"
identity: "optimization-execution"
kind: "element"
parent: "quality"
title: "Optimization Execution"
definition: "Optimization Execution 定义 Quality 中优化活动的执行协议：以代码已通过 Review 为入口条件逐轮推进、每轮由 fresh optimizer 判断方向、checkpoint 与失败回滚、两级优化额度控制、轮次台账持久化、每轮实现后的 clean-context 复核，以及收口驱动。它不定义方向数据合约（属于 Optimizer Findings），也不定义命令面的输入与诊断形状（属于 Quality CLI Gate）。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 重试预算控制

`config.optimization.directionLimit` SHALL 限制可选取的新方向数；`config.optimization.directionRetries` SHALL 只限制同一方向的失败次数；`config.optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，默认 `low`。成功方向 MUST NOT 消耗方向失败额度，也 MUST NOT 被该额度限制；低于门槛的方向 MUST NOT 被选取，也 MUST NOT 消耗方向额度；方向数用尽后 SHALL 只允许收口。

#### Scenario: 成功方向不消耗失败额度

- **WHEN** 选中方向通过该轮复核
- **THEN** 该方向的失败计数 SHALL 保持不变
- **AND** 系统 SHALL 继续判断其他方向

#### Scenario: 失败方向达到上限

- **WHEN** 同一方向失败次数达到 `directionRetries`
- **THEN** 该方向 SHALL 转为 `rejected`
- **AND** 系统 SHALL 继续处理其他可执行方向

#### Scenario: 方向数用尽

- **WHEN** 已选方向数达到 `directionLimit`
- **THEN** 系统 SHALL 拒绝选择新方向
- **AND** SHALL 要求以 `DIRECTION_LIMIT_REACHED` 收口

#### Scenario: 低于门槛的方向不被选取

- **WHEN** 某个待选方向的 `impactLevel` 低于 `minImpactLevel`
- **THEN** 该方向 SHALL 永不被选取，也不消耗方向额度
- **AND** 当全部待选方向均低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口
