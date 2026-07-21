# opsx-optimizer-skill Specification

## Purpose
此规约记录变更 add-subagent-skills 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: Optimizer 角色与硬约束

`opsx-optimizer` SHALL 是 Phase 2 finding-first 通用优化审查者，负责判断正确实现是否值得优化及应如何优化。它 MUST 使用 fresh context 自主读取项目证据，MUST NOT 修改任何文件，MUST NOT 改变 specs、公开契约或领域语义，MUST NOT 配置默认 `model`。

Optimizer SHALL 仅对当前 change base scope 内实现文件提出 actionable finding；一层展开文件仅用于理解。若发现 correctness、spec 或 artifact 冲突，SHALL 返回 `blockingObservations` 并停止选择 finding。

#### Scenario: 发现 correctness 缺陷时回到 remediation
- **WHEN** optimizer 发现当前实现违反 spec requirement
- **THEN** SHALL 返回带证据的 `blockingObservations`
- **AND** SHALL NOT 选择 optimization finding

#### Scenario: 默认不指定 model
- **WHEN** 生成 optimizer subagent artifact
- **THEN** 模板 SHALL 不声明默认 `model`
- **AND** 用户通过工具自身配置的 model SHALL 继续由现有生成机制保留

### Requirement: Optimizer 输入合约

顶层 agent MUST 传入合法 `changeName`、绝对 `changeDir` 和绝对 `projectRoot`。Optimizer SHALL 自主读取 `.verify-result.json`、change artifacts、optimization findings/history/failedDirections、项目 optimization config、base scope 最终代码和一层关联上下文。

Optimizer SHALL 从 `.apply-isolation.json.baseCommit` 读取不可变证据基线，并使用 `git diff <baseCommit>...HEAD --name-only` 与 `git status --short` 的并集导航 scope，不以 diff hunks 替代最终文件内容。`baseCommit` 缺失或 Git 无法解析时 SHALL fail closed，MUST NOT 回退到可移动 branch ref。

#### Scenario: 后续波次读取持久 findings
- **WHEN** `.verify-result.json` 已包含 findings 和 history
- **THEN** optimizer SHALL 读取全部非终态 findings及历史结果
- **AND** SHALL 基于当前文件内容生成 reconciliation actions

#### Scenario: Phase 1 baseline 缺失
- **WHEN** `changeDir/.verify-result.json` 不存在
- **THEN** optimizer SHALL 返回 `Phase 1 result not found — cannot optimize without baseline`
- **AND** SHALL NOT 推断 Phase 1 状态

#### Scenario: Git evidence baseline 缺失
- **WHEN** `.apply-isolation.json.baseCommit` 缺失或无效
- **THEN** optimizer SHALL fail closed
- **AND** SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

### Requirement: 优化原则与禁止项

Optimizer SHALL 寻找具有实际收益、静态证据且可保持行为的通用优化。扫描面包括但不限于删除、简化、重复、控制流、职责边界、局部性、算法复杂度、数据结构、重复 I/O、无效分配和资源使用。任何列表或标签均为非穷尽候选信号，不得成为能力边界或强制分类。

Finding 的 preservation constraints SHALL 覆盖适用的输入、输出、顺序、重复项、键唯一性、副作用次数、错误时机、精度和兼容性。依赖 workload、profile 或缓存命中率才能证明的建议 MUST 为 `deferred`。

#### Scenario: 静态可证明的数据结构优化
- **WHEN** 当前代码在无顺序语义的成员查询中重复执行线性扫描
- **AND** optimizer 可从代码证明键语义和重复项行为不变
- **THEN** optimizer MAY 提出使用适当 lookup 结构的 finding
- **AND** SHALL 明确复杂度收益与 preservation constraints

#### Scenario: 运行时收益无法证明
- **WHEN** 缓存建议的收益依赖未知 workload 或命中率
- **THEN** optimizer SHALL 将 finding 标记为 `deferred`
- **AND** SHALL NOT 声称该优化具有已证明收益

### Requirement: Failed Directions 避重协议

Optimizer SHALL 读取 finding history 与 `failedDirections`。同一目标、优化类型和实现边界构成同一失败方向；optimizer MUST NOT 通过改写措辞重复已达 `optRetries` 的方向。未达上限时 MAY 提供实质不同的关键设计。

#### Scenario: 失败方向达到上限
- **WHEN** 某 finding 方向失败次数达到 `optimization.optRetries`
- **THEN** optimizer SHALL 对其返回 `reject` action
- **AND** SHALL 继续评估其他 findings

### Requirement: 跨工具 skill 路径兼容

Optimizer subagent artifact SHALL 通过现有 per-tool renderer 和路径 API 生成，路径处理 MUST 跨 macOS、Linux 和 Windows。Finding location SHALL 持久化为项目相对 POSIX 路径。

#### Scenario: Windows 路径输入规范化
- **WHEN** optimizer 在 Windows 环境读取反斜杠路径
- **THEN** 输出 finding location SHALL 规范化为项目相对 POSIX 路径
- **AND** SHALL 与 CLI hash 校验使用同一逻辑路径

### Requirement: 一层依赖展开扩大优化候选

Optimizer SHALL 从 base scope 通过直接 imports、callers 和 OPSX `depends_on`/`relates_to` 关系展开一层读取上下文。展开 SHALL 过滤项目外路径、gitignored 路径及 `node_modules`、`dist`、`build`、`.git`。关系缺失时 SHALL 继续使用 imports 和 callers。

展开文件 MUST NOT 成为 actionable finding 的修改目标；scope 外机会 SHALL 标记为 `deferred`。

#### Scenario: 展开文件只提供上下文
- **WHEN** base scope 文件调用 scope 外共享模块
- **THEN** optimizer SHALL 读取共享模块判断重复或契约风险
- **AND** finding location SHALL NOT 要求修改该 scope 外文件

#### Scenario: 展开仅一层
- **WHEN** `a.ts` import `b.ts` 且 `b.ts` import `c.ts`
- **THEN** optimizer SHALL 读取 `b.ts`
- **AND** SHALL NOT 因该链继续展开 `c.ts`

### Requirement: Optimizer finding JSON 输出合约

`opsx-optimizer` SHALL 返回严格 JSON envelope，不得返回 Search/Replace、unified diff 或可直接应用的逐字补丁。每个 finding SHALL 提供具体代码位置、机会及影响、代码证据、修改建议、实现级关键设计、preservation constraints、实现步骤和验证建议。

#### Scenario: 输出多个证据化 findings
- **WHEN** optimizer 在当前 scope 中发现多个值得执行的优化
- **THEN** SHALL 在同一 envelope 中返回全部 findings 及相对排序
- **AND** 每项 SHALL 包含足以指导 master 实现和 reviewer 验证的设计与证据字段

#### Scenario: 不输出逐字补丁
- **WHEN** optimizer 给出实现建议
- **THEN** 输出 SHALL NOT 包含 Search/Replace blocks 或 unified diff
- **AND** SHALL 由 master agent 负责编码

