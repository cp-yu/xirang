---
entity: element-declaration
identity: optimizer-findings
kind: element
parent: quality
title: Optimizer Findings
definition: Optimizer Findings 定义 Quality 优化活动的方向台账合约：方向数据字段与稳定标识分配、方向状态集合、优先级与选择、每轮台账的判断与历史保留，以及优化循环的终止条件。它不定义命令面的输入形状（属于 Quality CLI Gate），也不定义执行顺序与回滚（属于 Optimization Execution）。
---

## Requirements

### Requirement: Finding 数据合约与稳定标识

一轮 Optimization 台账 SHALL 以 JSON 表达 `directions`（该轮方向候选）、`selected`（本轮选中方向）、可选的上一轮 `attempt` 结果，以及收口时的 `stopReason`。新方向 SHALL 包含 `location`、`opportunity`、`impact`、`evidence`、`recommendation`、`keyDesign`、`preservationConstraints`、`implementationOutline`、`validation`、`impactLevel`、`confidence`、`risk`、`cost`、`dependencies` 与 `priorityReason`；`impactLevel`、`confidence`、`risk`、`cost` SHALL 使用 `high | medium | low`。方向稳定 ID SHALL 由 CLI 分配：新方向在输入中 MUST 省略 `id`，CLI SHALL 在输出中回显分配结果。

#### Scenario: CLI 为新方向分配 ID

- **WHEN** 一轮台账包含两个合法新方向
- **THEN** CLI SHALL 使用同一批次时间戳和连续序号为其分配稳定 ID
- **AND** SHALL 在输出中回显分配结果

#### Scenario: 拒绝 agent 自构造 ID

- **WHEN** 输入中的新方向携带自行构造的 `id`
- **THEN** CLI SHALL 拒绝该输入
- **AND** SHALL NOT 修改任何记录

#### Scenario: 同批依赖解析

- **WHEN** 同一轮中某个新方向的 dependencies 包含 `{ "actionIndex": 0 }`
- **THEN** CLI SHALL 将其替换为第一个新方向获得的正式 ID
- **AND** 持久化结果 SHALL NOT 保留 `actionIndex` 引用

### Requirement: Finding 优先级与选择

Optimizer SHALL 先排除静态证据不足或 preservation constraints 无法闭合的方向，再按高 `impactLevel`、高 `confidence`、低 `risk`、低 `cost` 的词典序排序。未满足的 dependencies SHALL 优先于依赖它的方向。每一轮 SHALL 最多存在一个 `selected` 方向，且该方向 MUST 是 dependencies 已满足后的最高优先级 `pending` 方向。

#### Scenario: 选择依赖已满足的最高优先级方向

- **WHEN** 一轮台账产生多个 pending 方向
- **AND** 最高收益方向依赖另一个 pending 方向
- **THEN** CLI SHALL 选择 prerequisite 方向
- **AND** SHALL NOT 同时选择第二个方向

#### Scenario: 拒绝跳过排序首项

- **WHEN** master 尝试选择低于当前首个可执行方向的建议
- **THEN** CLI SHALL 拒绝该输入
- **AND** SHALL 要求在台账中提交撤销理由与证据后重新判断

### Requirement: Selected finding 的 priorityReason 说明相对优先理由

CLI 选择首个 actionable finding 后，其 `priorityReason` SHALL 说明该 finding 相对下一项的优先理由，使选择依据可追溯。

#### Scenario: priorityReason 记录相对优先理由

- **WHEN** CLI 选择首个 actionable finding
- **THEN** 该 finding 的 `priorityReason` SHALL 说明其相对下一项的优先理由

### Requirement: 优化循环终止

优化循环 SHALL 在不存在满足条件的方向、用户或配置拒绝继续优化、方向失败达上限且无其他可执行方向、或方向数达到 `optimization.directionLimit` 时收口。收口 SHALL 记录 `stopReason`，并据此推导终态。

#### Scenario: 多个成功方向不受失败额度限制

- **WHEN** `directionRetries` 为 2 且连续三个方向依次通过复核
- **THEN** 系统 SHALL 允许三个方向依次完成
- **AND** SHALL NOT 以成功次数消耗失败额度

#### Scenario: 无方向时收口

- **WHEN** 一轮判断确认不存在满足条件的方向
- **THEN** 收口记录 SHALL 使用 `stopReason: NO_ACTIONABLE`
- **AND** 终态 SHALL 为 `NOT_NEEDED`

#### Scenario: 方向数用尽时收口

- **WHEN** 已选方向数达到 `directionLimit` 且仍有满足条件的方向
- **THEN** 收口记录 SHALL 使用 `stopReason: DIRECTION_LIMIT_REACHED`
- **AND** 终态 SHALL 为 `IMPROVED` 或 `DEGRADED`

### Requirement: 方向状态集合

方向状态 SHALL 为 `pending | selected | implemented | verified | failed | rejected | deferred`。达到同一方向失败上限时 CLI SHALL 将其置为 `rejected`。Optimizer MAY 主动将方向置为 `rejected` 或 `deferred`，但 MUST 同时给出理由，且 `rejected` 与 `deferred` SHALL 携带支撑证据。

#### Scenario: 失败达上限转为 rejected

- **WHEN** 同一方向失败次数达到 `optimization.directionRetries`
- **THEN** CLI SHALL 将该方向置为 `rejected`
- **AND** SHALL NOT 因此拒绝其他可执行方向

#### Scenario: 主动撤销必须带理由与证据

- **WHEN** Optimizer 在台账中把方向置为 `rejected` 或 `deferred`
- **THEN** 该方向 SHALL 携带理由
- **AND** SHALL 携带支撑证据

### Requirement: 每轮台账与历史保留

每个优化轮次 SHALL 生成或更新一份方向台账，并把该轮判断结果追加到 append-only 历史。既有轮次记录 MUST NOT 被覆盖或删除。

#### Scenario: 每轮追加历史

- **WHEN** 一轮 Optimization 被记录
- **THEN** 该轮的方向判断结果 SHALL 追加到历史
- **AND** 既有轮次记录 SHALL 保持不变

#### Scenario: 拒绝覆盖既有历史

- **WHEN** 输入尝试替换或删除已持久化的轮次记录
- **THEN** CLI SHALL 拒绝该输入
- **AND** 原历史 SHALL 保持不变
