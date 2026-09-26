---
entity: "element-declaration"
identity: "quality-cli-gate"
kind: "element"
parent: "quality"
title: "Quality CLI Gate"
definition: "Quality CLI Gate 定义 `xirang quality` 命令面的门禁与协议契约：`review`、`optimize`、`status`、`seal` 四个入口各自的输入形状、入口条件与收口条件，以及统一输出、结构化诊断、退出码语义和机器可读协议说明的投影。它不定义各入口背后的判断标准（属于 Review 与 Optimization），也不定义记录载体的持久化细节（属于 Quality Writeback）。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: Optimization 记录入口

系统 SHALL 提供 `xirang quality optimize <change-name>` 命令，以一轮为单位接受一份优化判断台账。入口条件为当前代码已通过 Review、Optimization 尚未收口、终态不是 `ABORTED_UNSAFE`、且已选方向数未达 `optimization.directionLimit`。系统 SHALL 为台账中省略 `id` 的新方向分配稳定 ID 并在输出中回显，校验方向 ID 引用与状态迁移，按方向数与同方向失败次数更新两级计数，并按 `optimization.minImpactLevel` 过滤低于门槛的方向，并持久化该轮台账。

#### Scenario: 已选方向数达到上限

- **WHEN** 已选方向数达到 `optimization.directionLimit`
- **THEN** 系统 SHALL 拒绝选择新方向并要求收口

#### Scenario: 门槛过滤在选择阶段生效

- **WHEN** 台账中存在 `impactLevel` 低于 `optimization.minImpactLevel` 的待选方向
- **THEN** 该方向 SHALL 不被选取，也不消耗方向额度
- **AND** 当全部待选方向均低于门槛时该轮不选取任何方向

### Requirement: 收口终态由 stopReason 推导

Optimization 收口时 SHALL 要求 `stopReason`，并据此推导终态：`USER_DECLINED` 对应 `SKIPPED`；`NO_ACTIONABLE` 对应 `NOT_NEEDED`；`DIRECTION_REJECTED` 与 `DIRECTION_LIMIT_REACHED` 在有成功落地方向时对应 `IMPROVED`，否则对应 `DEGRADED`；`UNSAFE` 对应 `ABORTED_UNSAFE`。全部待选方向低于 `optimization.minImpactLevel` 时 SHALL 以 `NO_ACTIONABLE` 收口，并据此推导为 `NOT_NEEDED`。

#### Scenario: 被方向数上限截断但已有成功方向

- **WHEN** 收口输入的 `stopReason` 为 `DIRECTION_LIMIT_REACHED`
- **AND** 台账中存在已验证的方向
- **THEN** 终态 SHALL 为 `IMPROVED`
- **AND** `stopReason` SHALL 保留为 `DIRECTION_LIMIT_REACHED`

#### Scenario: 仅有被否决方向

- **WHEN** 收口输入的 `stopReason` 为 `DIRECTION_REJECTED`
- **AND** 台账中不存在已验证的方向
- **THEN** 终态 SHALL 为 `DEGRADED`

#### Scenario: 全部方向低于门槛

- **WHEN** 台账中所有待选方向的 `impactLevel` 均低于 `minImpactLevel`
- **THEN** 收口输入 SHALL 使用 `stopReason: NO_ACTIONABLE`
- **AND** 终态 SHALL 为 `NOT_NEEDED`

#### Scenario: unsafe 中止

- **WHEN** 收口输入的 `stopReason` 为 `UNSAFE`
- **THEN** 终态 SHALL 为 `ABORTED_UNSAFE`
- **AND** 后续 optimize 入口 SHALL 被拒绝，直到工作区被恢复
