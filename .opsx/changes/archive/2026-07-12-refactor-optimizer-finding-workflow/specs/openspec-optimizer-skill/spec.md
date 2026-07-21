## ADDED Requirements

### Requirement: Optimizer finding JSON 输出合约

`openspec-optimizer` SHALL 返回严格 JSON envelope，不得返回 Search/Replace、unified diff 或可直接应用的逐字补丁。每个 finding SHALL 提供具体代码位置、机会及影响、代码证据、修改建议、实现级关键设计、preservation constraints、实现步骤和验证建议。

#### Scenario: 输出多个证据化 findings
- **WHEN** optimizer 在当前 scope 中发现多个值得执行的优化
- **THEN** SHALL 在同一 envelope 中返回全部 findings 及相对排序
- **AND** 每项 SHALL 包含足以指导 master 实现和 reviewer 验证的设计与证据字段

#### Scenario: 不输出逐字补丁
- **WHEN** optimizer 给出实现建议
- **THEN** 输出 SHALL NOT 包含 Search/Replace blocks 或 unified diff
- **AND** SHALL 由 master agent 负责编码

## MODIFIED Requirements

### Requirement: Optimizer 角色与硬约束

`openspec-optimizer` SHALL 是 Phase 2 finding-first 通用优化审查者，负责判断正确实现是否值得优化及应如何优化。它 MUST 使用 fresh context 自主读取项目证据，MUST NOT 修改任何文件，MUST NOT 改变 specs、公开契约或领域语义，MUST NOT 配置默认 `model`。

Optimizer SHALL 仅对当前 change base scope 内实现文件提出 actionable finding；一层展开文件仅用于理解。若发现 correctness、spec 或 artifact 冲突，SHALL 返回 `blockingObservations` 并停止选择 finding。

#### Scenario: [ADDED] 发现 correctness 缺陷时回到 remediation
- **WHEN** optimizer 发现当前实现违反 spec requirement
- **THEN** SHALL 返回带证据的 `blockingObservations`
- **AND** SHALL NOT 选择 optimization finding

#### Scenario: [ADDED] 默认不指定 model
- **WHEN** 生成 optimizer subagent artifact
- **THEN** 模板 SHALL 不声明默认 `model`
- **AND** 用户通过工具自身配置的 model SHALL 继续由现有生成机制保留

#### Scenario: [REMOVED] Optimizer 使用 Bash 辅助分析
- **WHEN** optimizer 需要确认某函数的调用点或测试覆盖
- **THEN** optimizer SHALL 使用 `grep` 或 `git log` 等只读命令辅助分析
- **AND** SHALL 基于分析结果决定优化策略是否安全

#### Scenario: [REMOVED] Optimizer 拒绝行为改变提案
- **WHEN** optimizer 识别出一个可能改变行为的改进（如重排序有副作用的调用）
- **THEN** optimizer MUST NOT 提议此变更
- **AND** SHALL 返回 NO_OPTIMIZATION_NEEDED（若此为唯一改进机会）

#### Scenario: [REMOVED] 使用 ponytail 标签分类优化

- **WHEN** optimizer 输出 Search/Replace 优化块
- **THEN** 每个优化提案 SHALL 标注对应的 ponytail 标签：delete（死代码）、stdlib（重造标准库）、native（有平台功能可替代）、yagni（一个实现的抽象）、shrink（同样逻辑更少行数）
- **AND** 标签作为附加分类信息，不改变 Search/Replace 块的结构格式

#### Scenario: [REMOVED] 不标记 specs 要求的代码

- **WHEN** optimizer 识别出一个抽象仅有一处实现，但该抽象对应的 spec requirement 明确了必须存在该抽象
- **THEN** optimizer SHALL NOT 将此项标记为 yagni
- **AND** SHALL 跳过该优化，不写入提案

### Requirement: Optimizer 输入合约

顶层 agent MUST 传入合法 `changeName`、绝对 `changeDir` 和绝对 `projectRoot`。Optimizer SHALL 自主读取 `.verify-result.json`、change artifacts、optimization findings/history/failedDirections、项目 optimization config、base scope 最终代码和一层关联上下文。

Original branch SHALL 优先来自 `.apply-isolation.json`，回退到 `git symbolic-ref refs/remotes/origin/HEAD --short`。Optimizer SHALL 使用 `git diff <originalBranch>...HEAD --name-only` 导航 scope，不以 diff hunks 替代最终文件内容。

#### Scenario: [ADDED] 后续波次读取持久 findings
- **WHEN** `.verify-result.json` 已包含 findings 和 history
- **THEN** optimizer SHALL 读取全部非终态 findings及历史结果
- **AND** SHALL 基于当前文件内容生成 reconciliation actions

#### Scenario: [ADDED] Phase 1 baseline 缺失
- **WHEN** `changeDir/.verify-result.json` 不存在
- **THEN** optimizer SHALL 返回 `Phase 1 result not found — cannot optimize without baseline`
- **AND** SHALL NOT 推断 Phase 1 状态

#### Scenario: [REMOVED] 所有定位信息完整传入

- **WHEN** 顶层 agent 传入 changeName、changeDir 和 projectRoot
- **THEN** optimizer SHALL 自行读取 `.verify-result.json` 获取 Phase 1 结果和 evidence 列表
- **AND** SHALL 通过 `git diff <originalBranch>...HEAD --name-only` 拿到 scope
- **AND** SHALL Read 候选实现文件最终内容
- **AND** SHALL 继续执行优化分析

#### Scenario: [REMOVED] .verify-result.json 不存在

- **WHEN** `changeDir/.verify-result.json` 不存在
- **THEN** optimizer SHALL 返回错误 "Phase 1 result not found — cannot optimize without baseline"
- **AND** SHALL NOT 尝试自行推断 Phase 1 状态

#### Scenario: [REMOVED] 利用 evidenceFiles 与 scopeFiles 读取候选

- **WHEN** `.verify-result.json` 存在且 `git diff <originalBranch>...HEAD --name-only` 成功
- **THEN** optimizer SHALL 把两者去重合并作为基础 scope
- **AND** SHALL 排除 spec、design、tasks、配置文件
- **AND** SHALL 基于读取的完整文件内容生成精确的 Search/Replace 锚点

### Requirement: 优化原则与禁止项

Optimizer SHALL 寻找具有实际收益、静态证据且可保持行为的通用优化。扫描面包括但不限于删除、简化、重复、控制流、职责边界、局部性、算法复杂度、数据结构、重复 I/O、无效分配和资源使用。任何列表或标签均为非穷尽候选信号，不得成为能力边界或强制分类。

Finding 的 preservation constraints SHALL 覆盖适用的输入、输出、顺序、重复项、键唯一性、副作用次数、错误时机、精度和兼容性。依赖 workload、profile 或缓存命中率才能证明的建议 MUST 为 `deferred`。

#### Scenario: [ADDED] 静态可证明的数据结构优化
- **WHEN** 当前代码在无顺序语义的成员查询中重复执行线性扫描
- **AND** optimizer 可从代码证明键语义和重复项行为不变
- **THEN** optimizer MAY 提出使用适当 lookup 结构的 finding
- **AND** SHALL 明确复杂度收益与 preservation constraints

#### Scenario: [ADDED] 运行时收益无法证明
- **WHEN** 缓存建议的收益依赖未知 workload 或命中率
- **THEN** optimizer SHALL 将 finding 标记为 `deferred`
- **AND** SHALL NOT 声称该优化具有已证明收益

#### Scenario: [REMOVED] 通过展开识别有意义的重复消除机会

- **WHEN** scope 内 `auth.ts` 与展开候选 `user.ts` 包含几乎相同的验证逻辑
- **AND** `user.ts` 不在原始 scope
- **THEN** optimizer SHALL 提案在 `auth.ts` 内引用 `user.ts` 已存在的共享函数（仅修改 scope 内文件）
- **AND** SHALL NOT 提案修改 `user.ts`

#### Scenario: [REMOVED] 简单代码无需优化

- **WHEN** 变更代码已经是扁平结构、无重复、命名清晰
- **THEN** optimizer SHALL 返回 No optimization opportunities found
- **AND** SHALL NOT 制造不存在的改进

#### Scenario: [REMOVED] Ponytail ladder 前置分析

- **WHEN** optimizer 分析某个优化候选区域
- **THEN** optimizer SHALL 先通过 ponytail 6-rung ladder 判断是否存在更懒的方案
- **AND** SHALL 在第一阶命中时停止，跳过后续 ladder 阶梯和结构优化分析
- **AND** 命中方案 SHALL 标注对应的 ponytail 标签（delete/stdlib/native/yagni/shrink）
- **AND** 仅在 ladder 六阶均未命中后 MAY 进入结构优化分析（降低重复、简化结构等）

### Requirement: Failed Directions 避重协议

Optimizer SHALL 读取 finding history 与 `failedDirections`。同一目标、优化类型和实现边界构成同一失败方向；optimizer MUST NOT 通过改写措辞重复已达 `optRetries` 的方向。未达上限时 MAY 提供实质不同的关键设计。

#### Scenario: [ADDED] 失败方向达到上限
- **WHEN** 某 finding 方向失败次数达到 `optimization.optRetries`
- **THEN** optimizer SHALL 对其返回 `reject` action
- **AND** SHALL 继续评估其他 findings

#### Scenario: [REMOVED] 避免重复失败的优化方向
- **WHEN** failedDirections 包含 "extract shared validation logic from auth.ts and user.ts"
- **THEN** optimizer MUST NOT 提案从 auth.ts 和 user.ts 中提取验证逻辑
- **AND** MUST NOT 提案提取相同文件的超集验证逻辑

#### Scenario: [REMOVED] 所有策略已用尽
- **WHEN** failedDirections 覆盖了所有 optimizer 能想到的可行优化策略
- **THEN** optimizer SHALL 返回 No optimization opportunities found
- **AND** SHALL NOT 编造低质量的替代提案

### Requirement: 跨工具 skill 路径兼容

Optimizer subagent artifact SHALL 通过现有 per-tool renderer 和路径 API 生成，路径处理 MUST 跨 macOS、Linux 和 Windows。Finding location SHALL 持久化为项目相对 POSIX 路径。

#### Scenario: [ADDED] Windows 路径输入规范化
- **WHEN** optimizer 在 Windows 环境读取反斜杠路径
- **THEN** 输出 finding location SHALL 规范化为项目相对 POSIX 路径
- **AND** SHALL 与 CLI hash 校验使用同一逻辑路径

#### Scenario: [REMOVED] Codex 上安装 optimizer skill
- **WHEN** 在任意平台上为 Codex 执行 `openspec init`
- **THEN** skill 文件 SHALL 写入到 `.codex/skills/openspec-optimizer/SKILL.md`
- **AND** Codex 的 skill 名称解析 SHALL 使用 `openspec-optimizer`（无 `$` 前缀在 skill 目录名称中，`$` 前缀为 invoke 时的语法）

### Requirement: 一层依赖展开扩大优化候选

Optimizer SHALL 从 base scope 通过直接 imports、callers 和 OPSX `depends_on`/`relates_to` 关系展开一层读取上下文。展开 SHALL 过滤项目外路径、gitignored 路径及 `node_modules`、`dist`、`build`、`.git`。关系缺失时 SHALL 继续使用 imports 和 callers。

展开文件 MUST NOT 成为 actionable finding 的修改目标；scope 外机会 SHALL 标记为 `deferred`。

#### Scenario: [ADDED] 展开文件只提供上下文
- **WHEN** base scope 文件调用 scope 外共享模块
- **THEN** optimizer SHALL 读取共享模块判断重复或契约风险
- **AND** finding location SHALL NOT 要求修改该 scope 外文件

#### Scenario: [MODIFIED] 展开仅一层
- **WHEN** `a.ts` import `b.ts` 且 `b.ts` import `c.ts`
- **THEN** optimizer SHALL 读取 `b.ts`
- **AND** SHALL NOT 因该链继续展开 `c.ts`

#### Scenario: [REMOVED] 通过 imports 找到共享模块

- **WHEN** scope 文件 `auth.ts` import 了 `validators.ts`
- **AND** `validators.ts` 不在原始 scope
- **THEN** optimizer SHALL 把 `validators.ts` 加入读取候选
- **AND** SHALL 在分析跨文件重复时考虑该文件
- **AND** SHALL NOT 把 `validators.ts` 作为 Search/Replace 的 patch 目标

#### Scenario: [REMOVED] 通过 callers 找到调用方

- **WHEN** scope 文件 `service.ts` 导出函数 `processOrder`
- **AND** `grep -RIn "processOrder"` 在 `route.ts` 找到调用
- **AND** `route.ts` 不在原始 scope
- **THEN** optimizer SHALL 把 `route.ts` 加入读取候选
- **AND** SHALL 在分析签名/契约一致性时考虑该文件

#### Scenario: [REMOVED] 通过 OPSX relations 找到关联节点

- **WHEN** scope 文件对应 `cap.orders.create` 节点
- **AND** `relations.yaml` 含 `cap.orders.create depends_on cap.payment.process`
- **AND** `code-map` 把 `cap.payment.process` 映射到 `payment.ts`
- **AND** `payment.ts` 不在原始 scope
- **THEN** optimizer SHALL 把 `payment.ts` 加入读取候选

#### Scenario: [REMOVED] 展开候选不进入 affectedFileHashes

- **WHEN** optimizer 提出涉及 scope 内文件的 Search/Replace 块
- **THEN** affectedFileHashes SHALL 仅包含 scope 内文件
- **AND** SHALL NOT 包含一层展开得到的候选文件
- **AND** Search/Replace 的 PATH 字段 SHALL 仅指向 scope 内文件

#### Scenario: [REMOVED] 展开候选过滤忽略目录

- **WHEN** 一层展开命中 `node_modules/zod/lib/types.ts`
- **THEN** optimizer SHALL 过滤该路径
- **AND** SHALL NOT 把第三方源加入读取候选

#### Scenario: [REMOVED] relations.yaml 缺失时降级

- **WHEN** `projectRoot/openspec/project.opsx.relations.yaml` 不存在
- **THEN** optimizer SHALL 仅执行 imports 与 callers 两路展开
- **AND** SHALL 不报错

## REMOVED Requirements

### Requirement: Search/Replace 块输出格式

**Reason**: optimizer 改为 finding-first 判断与设计角色，逐字补丁由 master agent 的 TDD 实现替代。

**Migration**: 消费 optimizer JSON envelope 中的 `recommendation`、`keyDesign`、`preservationConstraints`、`implementationOutline` 和 `validation` 字段。
