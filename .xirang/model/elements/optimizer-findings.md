---
entity: element-declaration
identity: optimizer-findings
kind: element
parent: verify
title: Optimizer Findings
definition: Optimizer Findings 定义 Phase 2 优化 finding 的数据合约与生命周期：finding 数据字段与稳定标识分配、状态与 reconciliation events、优先级与选择、优化波次 reconciliation 与循环终止。
---

## Requirements

### Requirement: Finding 数据合约与稳定标识

Phase 2 optimization envelope SHALL 以 JSON 表达 `blockingObservations`、`actions` 和 findings。新 finding SHALL 包含 `location`、`opportunity`、`impact`、`evidence`、`recommendation`、`keyDesign`、`preservationConstraints`、`implementationOutline`、`validation`、`impactLevel`、`confidence`、`risk`、`cost`、`dependencies` 和 `priorityReason`。`impactLevel`、`confidence`、`risk`、`cost` SHALL 使用 `high | medium | low`。新 finding 的稳定 ID SHALL 由 CLI 按 `OPT-<UTC 毫秒 timestamp>-<batch index>` 分配；optimizer 提交 `add` 时 MUST NOT 自行提供 ID。

#### Scenario: CLI 为新 finding 分配 ID
- **WHEN** optimizer envelope 包含两个合法 `add` actions
- **THEN** CLI SHALL 使用同一 UTC 毫秒 timestamp 和连续 batch index 为其分配稳定 ID
- **AND** SHALL 将分配后的 findings 写入 `.verify-result.json`

#### Scenario: 拒绝 optimizer 自分配新 ID
- **WHEN** `add` action 携带 optimizer 自行生成的 finding ID
- **THEN** CLI SHALL 拒绝该 envelope
- **AND** SHALL NOT 修改 `.verify-result.json`

#### Scenario: 同批依赖解析
- **WHEN** 第二个 `add` action 的 dependencies 包含 `{ "actionIndex": 0 }`
- **THEN** CLI SHALL 将其原子替换为第一个 `add` action 获得的正式 timestamp ID
- **AND** `.verify-result.json` SHALL NOT 持久化 `actionIndex` 引用

### Requirement: Finding 状态与 reconciliation events

Finding 当前状态 SHALL 为 `pending | selected | implemented | verified | resolved | failed | rejected | invalidated | deferred | merged`。Reconciliation actions SHALL 为 append-only history events，并支持 `add`、`retain`、`reprioritize`、`resolve`、`invalidate`、`reject`、`merge` 和 `masterChallenge`。CLI SHALL 校验 action 引用、状态迁移和 merge 关系；history 既有事件 MUST NOT 被覆盖或删除。

#### Scenario: 合法状态迁移被持久化
- **WHEN** selected finding 被 master 标记为 implemented 且 fresh reviewer 返回 PASS
- **THEN** CLI SHALL 依次持久化 `implemented`、`verified` 事件
- **AND** 后续 reconciliation 确认机会消失时 SHALL 将其转为 `resolved`

#### Scenario: 非法覆盖 history 被拒绝
- **WHEN** optimization input 尝试替换或删除已持久化 history event
- **THEN** CLI SHALL 拒绝该输入
- **AND** 原 history SHALL 保持不变

### Requirement: Finding 优先级与选择

Optimizer SHALL 先排除静态证据不足或 preservation constraints 无法闭合的 finding，再按高 `impactLevel`、高 `confidence`、低 `risk`、低 `cost` 的词典序排序。未满足的 dependencies SHALL 优先于 dependent finding。每次 SHALL 最多存在一个 `selected` finding，且该 finding MUST 是 dependencies 已满足后的最高优先级 `pending` finding。

#### Scenario: 选择依赖已满足的最高优先级 finding
- **WHEN** reconciliation 产生多个 pending findings
- **AND** 最高收益 finding 依赖另一个 pending finding
- **THEN** CLI SHALL 选择 prerequisite finding
- **AND** SHALL NOT 同时选择第二个 finding

#### Scenario: 拒绝跳过排序首项
- **WHEN** master 尝试选择低于当前首个 actionable finding 的建议
- **THEN** CLI SHALL 拒绝状态迁移
- **AND** SHALL 要求提交 `masterChallenge` 后重新 reconciliation

### Requirement: Selected finding 的 priorityReason 说明相对优先理由

CLI 选择首个 actionable finding 后，其 `priorityReason` SHALL 说明该 finding 相对下一项的优先理由，使选择依据可追溯。

#### Scenario: priorityReason 记录相对优先理由
- **WHEN** CLI 选择首个 actionable finding
- **THEN** 该 finding 的 `priorityReason` SHALL 说明其相对下一项的优先理由

### Requirement: 优化波次 reconciliation

每个 optimization 波次完成或失败后，系统 SHALL 重新调用 optimizer。Optimizer SHALL 基于当前代码、当前 findings、append-only history 和 `failedDirections` 对全部非终态 findings 作出裁决，可保留、重排、解决、失效、拒绝、合并或新增 finding。旧 findings SHALL 作为候选连续性输入，而不是机械执行队列。

#### Scenario: 成功波次后重排剩余 findings
- **WHEN** 首个 finding 通过 fresh reviewer 验证
- **THEN** 系统 SHALL 重新调用 optimizer
- **AND** optimizer SHALL 读取优化后的当前代码并裁决全部剩余 findings
- **AND** SHALL 允许新增优先级更高的 finding

#### Scenario: 代码变化使旧 finding 失效
- **WHEN** 已完成 finding 的代码变化消除了另一个 pending finding 的前提
- **THEN** optimizer SHALL 返回引用该 ID 的 `invalidate` action 及代码证据
- **AND** CLI SHALL 将该 finding 标记为 `invalidated`

### Requirement: 优化循环终止

成功验证的 finding SHALL NOT 消耗 `optimization.optRetries`。同一失败方向达到 `optRetries` 后 SHALL 转为 `rejected`，其他 actionable findings SHALL 继续处理。循环 SHALL 在没有 actionable findings、全部剩余 findings 为终态或 deferred、optimization 被跳过/禁用，或连续两轮 reconciliation 无状态推进时终止；最后一种情况 SHALL 记录 `STALLED` 诊断。

#### Scenario: 多个成功波次不受 optRetries 限制
- **WHEN** optimizer 连续发现三个可执行 findings
- **AND** 每个波次均通过 fresh reviewer
- **THEN** 系统 SHALL 允许三个 findings 依次完成
- **AND** SHALL NOT 因 `optRetries` 默认值为 2 而停止

#### Scenario: 无推进时停止
- **WHEN** 连续两轮 reconciliation 的代码 fingerprint、pending IDs、排序和 dependencies 完全相同
- **AND** 没有状态迁移或新 finding
- **THEN** 系统 SHALL 停止 Phase 2 循环
- **AND** SHALL 持久化 `STALLED` 诊断而非再次调用 optimizer
