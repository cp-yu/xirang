## MODIFIED Requirements

### Requirement: CLI 拒绝无证据的 NO_OPTIMIZATION_NEEDED

CLI SHALL 拒绝缺少合法 optimizer reconciliation envelope 的 `NO_OPTIMIZATION_NEEDED`。非空 summary 不再单独证明 optimizer 已被调用；envelope MUST 对全部非终态 findings 作出裁决，且不存在 actionable finding。

#### Scenario: [ADDED] 合法 reconciliation 被接受
- **WHEN** input 包含结构合法的 optimizer envelope
- **AND** 不存在 actionable finding
- **THEN** CLI SHALL 接受该结果
- **AND** SHALL 持久化 reconciliation history

#### Scenario: [ADDED] 只有 summary 时拒绝
- **WHEN** input 只包含 `NO_OPTIMIZATION_NEEDED` 与非空 summary
- **THEN** CLI SHALL 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
- **AND** 以 exit 1 退出

#### Scenario: [REMOVED] summary 非空时接受 NO_OPTIMIZATION_NEEDED

- **WHEN** agent 调用 `openspec verify phase2 "<change>" --type=optimization --input '{"status":"NO_OPTIMIZATION_NEEDED","summary":"..."}'`
- **AND** `summary` 字段为非空字符串（trim 后长度 > 0）
- **THEN** CLI SHALL 接受该请求
- **AND** 将 `optimization.status` 设为 `NOT_NEEDED`
- **AND** 返回 `{ ok: true }`

#### Scenario: [REMOVED] summary 缺失时拒绝 NO_OPTIMIZATION_NEEDED

- **WHEN** agent 调用 `openspec verify phase2 "<change>" --type=optimization --input '{"status":"NO_OPTIMIZATION_NEEDED"}'`
- **AND** `summary` 字段不存在
- **THEN** CLI SHALL 拒绝该请求
- **AND** 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
- **AND** 输出诊断信息: "NO_OPTIMIZATION_NEEDED requires a non-empty summary from the optimizer subagent"
- **AND** 返回 exit code 1

#### Scenario: [REMOVED] summary 为空字符串时拒绝 NO_OPTIMIZATION_NEEDED

- **WHEN** agent 调用 `openspec verify phase2 "<change>" --type=optimization --input '{"status":"NO_OPTIMIZATION_NEEDED","summary":"  "}'`
- **AND** `summary` 字段 trim 后为空字符串
- **THEN** CLI SHALL 拒绝该请求
- **AND** 行为等同于 summary 缺失

### Requirement: Prompt fragment 强制委托 optimizer subagent

`VERIFY_SIMPLE_CHANGE_FAST_PATH` 常量 SHALL 保持名称和引用兼容，但文本 SHALL 要求每个未跳过的 Phase 2 至少 spawn optimizer 一次，由 optimizer 提交 reconciliation envelope 并判断 actionable findings。Master MUST NOT 自行声明 NOT_NEEDED。

#### Scenario: [ADDED] 简单变更也调用 optimizer
- **WHEN** 变更仅删除、重命名或移除参数
- **AND** optimization 未被禁用或跳过
- **THEN** prompt SHALL 要求 spawn optimizer
- **AND** SHALL 仅在合法 envelope 无 actionable finding 时记录 NOT_NEEDED

#### Scenario: [REMOVED] 常量名保持不变

- **WHEN** 开发者修改 `src/core/templates/fragments/opsx-fragments.ts`
- **THEN** SHALL 保持常量名 `VERIFY_SIMPLE_CHANGE_FAST_PATH` 不变
- **AND** 所有现有引用点（`apply-change.ts`）无需修改 import

#### Scenario: [REMOVED] 新文本禁止 master agent 自主判断

- **WHEN** `VERIFY_SIMPLE_CHANGE_FAST_PATH` 被渲染到 agent prompt 中
- **THEN** 文本 SHALL 包含以下语义约束：
  - MUST spawn optimizer subagent 至少一次
  - optimizer subagent（而非 master agent）决定是否需要优化
  - 若 optimizer 返回 "No optimization opportunities found"，记录 `NO_OPTIMIZATION_NEEDED` 并将 optimizer 结论作为 summary
  - master agent MUST NOT 自行做出 "not needed" 判断
  - 唯一例外为 `--skip-optimization` flag 或 `optimization.enabled: false`

### Requirement: Apply 编排文本明确角色分离

Apply Phase 2 文本 SHALL 将 master 描述为 evidence collector、TDD implementer 和 context challenger；将 optimizer 描述为 optimization judge 与 key design author；将 reviewer 描述为 speculative behavior judge。

#### Scenario: [ADDED] Phase 2 编排角色明确
- **WHEN** apply skill 模板被渲染
- **THEN** SHALL 要求 optimizer 先判断和排序 findings
- **AND** master SHALL 只实现 selected finding或提交 masterChallenge
- **AND** fresh reviewer SHALL 独立验证实现

#### Scenario: [REMOVED] Phase 2 段落包含角色约束

- **WHEN** apply skill 模板被渲染
- **THEN** Phase 2 段落 SHALL 包含以下语义：
  - 始终 spawn optimizer subagent 作为 Phase 2 第一个动作
  - optimizer subagent 读取 change artifacts 和 Phase 1 issues 后决定是否存在优化机会
  - master agent 角色为 evidence collector 和 patch applicator，不是 optimization judge
