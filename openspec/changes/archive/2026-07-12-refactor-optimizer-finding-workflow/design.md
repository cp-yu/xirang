## Context

当前 Phase 2 将 optimizer 建模为 Search/Replace 生成器：先用五类 rationale tag 和固定 Code Smell 枚举筛选机会，再由 master agent 机械应用补丁。该模型把问题判断、方案设计和逐字编码耦合在一次 subagent 输出中，并以 `optRetries` 限制所有成功或失败波次，无法完整覆盖多个优化机会。

Superpowers `v6.0.2` 没有独立 optimizer；其代码质量流程采用 fresh read-only reviewer 生成证据化 findings，由 controller 裁决、implementer 修改、测试并复审。OpenSpec 借鉴 finding-first 闭环，但保留独立 Phase 2 optimizer、CLI 持久化和 speculative reviewer。

约束包括：optimizer/reviewer 不修改文件；master agent 持有代码主权；Phase 2 只优化当前 change 的 base scope；公开行为和 artifacts 不得由 optimizer 改写；现有外部终态、archive/freshness 契约和 skip/disabled 路径必须兼容；默认不配置 subagent model。

## Goals / Non-Goals

**Goals:**

- 让 optimizer 对所有具有实际收益、静态可证明且行为保持的优化开放，不受固定 taxonomy 限制。
- 让强判断模型输出多个证据化 findings、修改意见和关键设计，而非逐字补丁。
- 跨波次持久化 findings，并在每次代码变化后基于当前代码全量 reconciliation。
- 由 CLI 提供稳定 ID、合法状态迁移、append-only history 和过期检测。
- 保持 reviewer、optimizer、master agent 的判断与编码职责隔离。

**Non-Goals:**

- 不引入 AST、profiler、benchmark 框架或新依赖。
- 不允许 optimizer 直接修改代码、artifacts 或配置。
- 不新增 finding 级 CLI 命令，不改变外部 Phase 2 终态。
- 不在 OpenSpec 中配置或映射具体模型；用户继续通过工具自身配置覆盖。
- 不自动扩大 change scope，也不执行必须依赖运行时 workload 才能证明的优化。

## Decisions

### 1. Optimizer 输出 finding-first JSON envelope

Optimizer 返回严格 JSON，包含 `blockingObservations`、`actions` 和排序后的当前 findings 视图。每项 finding 描述 `location`、`opportunity`、`impact`、`evidence`、`recommendation`、`keyDesign`、`preservationConstraints`、`implementationOutline`、`validation`、`impactLevel`、`confidence`、`risk`、`cost`、`dependencies` 和 `priorityReason`。

CLI 校验 envelope 结构并持久化；开放设计字段保持自然语言。放弃 Search/Replace，因为逐字 patch 使 optimizer 为满足格式而制造修改，也削弱 master 对项目上下文和 TDD 的控制。仅输出泛化建议也被拒绝，因为它浪费高能力 optimizer 的方案设计价值。

### 2. 优化 taxonomy 是非穷尽启发式

删除、简化、重复、控制流、职责边界、算法复杂度、数据结构、I/O、分配和资源使用均为扫描提示，不是输出枚举。方法行数、嵌套深度、模块方法数和既有 smell 类型只触发进一步判断，不直接要求重构。

Finding 必须同时满足实际收益、静态证据和行为保持。依赖 profile、缓存命中率或 workload 的机会进入 `deferred`，不能声称已证明收益。

### 3. CLI 拥有稳定 ID 与状态迁移

Optimizer 对新机会提交 `add` action，不提供 ID；CLI 以 reconciliation 持久化时的 UTC 毫秒 timestamp 为批次前缀，并按 action 顺序分配 `OPT-<timestamp>-01`、`OPT-<timestamp>-02`。同一批次新增 finding 间的 dependencies 使用 `{ "actionIndex": N }` 引用对应 `add` action，CLI 分配正式 ID 后原子替换；既有 finding 继续直接引用稳定 ID。既有 finding 通过 ID 执行 `retain`、`reprioritize`、`resolve`、`invalidate`、`reject` 或 `merge`。`merge` 由 CLI 创建 timestamp ID 并关联旧 IDs。内容 hash 和模型自分配 ID 均被拒绝：前者会因文字变化漂移，后者无法保证跨轮身份稳定。

Finding 当前状态为：`pending`、`selected`、`implemented`、`verified`、`resolved`、`failed`、`rejected`、`invalidated`、`deferred`、`merged`。Actions 是 append-only history events，不与状态混用。每次最多一个 `selected`，且必须是依赖已满足后的最高优先级 `pending` finding。

### 4. 持久候选集每波次全量 reconciliation

初次调用生成多个 findings。Master 每个原子波次只实现最新排序中的首个 actionable finding。Fresh reviewer 完成 speculative re-verify 后，无论成功或失败均重新调用 optimizer；optimizer 必须读取当前代码、全部 findings、history 和 failedDirections，并对每个 pending finding 作出裁决，也可新增 finding。

不直接消费旧队列，因为前一优化可能解决、失效或改变后续建议；也不每轮从零开始，因为会丢失覆盖面与历史判断。

`.verify-result.json` 保存最新 `findings`、精简的 append-only `history` 和 `failedDirections`。History 只记录事件、理由摘要、证据引用和 hashes，不保存完整代码或 diff。

### 5. 使用多维词典序而非总分

Optimizer 先排除证据或保持约束无法闭合的机会，再按高影响、高置信度、低风险、低成本排序；依赖关系优先于 dependent finding。每项维度使用 `high | medium | low`，首项必须解释为何优先于下一项。加权分数被拒绝，因为不同维度相加会产生虚假精度。

### 6. 成功波次无固定上限，optRetries 只限制失败方向

成功 finding 不消耗 `optRetries`。同一 finding 方向 speculative re-verify 失败时增加失败次数；未达上限可由 optimizer 重新设计，达到上限转为 `rejected`，其他 findings 继续。

终止条件为：没有 actionable findings；全部剩余 findings 为终态或 deferred；optimization 被跳过/禁用；或连续两轮代码 fingerprint、pending IDs、排序和依赖相同且无状态推进，记录 `STALLED` 诊断并结束。外部终态仍映射到 `NOT_NEEDED`、`IMPROVED`、`DEGRADED`、`SKIPPED` 或 `ABORTED_UNSAFE`。

### 7. 三角色边界保持 clean-context 判断

Phase 1 reviewer 判断 specs/design/tasks 的 correctness、completeness、coherence 和 cleanliness。Optimizer 只在 Phase 1 通过后判断正确实现是否还能更好。若 optimizer 发现 correctness 或 artifact 冲突，返回 `blockingObservations`，不选择 finding，并路由回 remediation。

Master 按 finding 的关键设计和保持约束进行 TDD 实现。若与项目事实冲突，master 记录 `masterChallenge` 及证据并重新调用 optimizer，不能自行拒绝或因成本跳过。实质偏离 `keyDesign` 前也必须 challenge。

优化后仍由 fresh reviewer 执行 speculative re-verify；reviewer 验证规格和 preservation constraints，不重新判断优化价值。

### 8. Finding 新鲜度使用目标文件 hash

Optimizer reconciliation 时为 finding 的目标文件记录 pre-implementation hashes。Master 实施前由 CLI 比较当前 hash；任何目标文件变化都使 selected finding 过期并要求重新 reconciliation。现有 evidence fingerprint 继续负责整个 verify result 的 freshness，不为每个 finding复制完整快照。

路径继续使用项目既有的 `path.resolve`、`path.relative` 和 POSIX 持久化约定；Windows 输入在比较前规范化。不会新增模式匹配式路径所有权。

### 9. 向后兼容与模型默认

旧 `.verify-result.json` 缺少 findings/history 时按空集合读取，不回填历史。现有 Phase 2 外部状态与 archive compatibility 保持不变。Optimizer/reviewer 模板不设置 `model`；生成器继续保留用户已配置 model 的现有机制，但 OpenSpec 不声明能力等级或供应商模型。

## Risks / Trade-offs

- **Reconciliation 协议复杂度增加** → 将状态、事件、排序和终态集中为显式 TypeScript union 与 validator，避免散落字符串判断。
- **成功波次可能无限循环** → 使用无推进的 fingerprint + pending 集合停滞检测，并要求每轮对全部 pending findings 裁决。
- **模型输出结构合法但技术错误** → CLI 只做结构校验；master challenge、代码证据、TDD 和 fresh reviewer 构成语义闭环。
- **低优先级 finding 饥饿** → 每轮必须完整 reconciliation 并给出首项相对排序理由，不能只读取第一项。
- **历史文件膨胀** → history 保存摘要与引用，不复制 findings 快照、代码或 diff。
- **算法优化破坏隐含语义** → preservation constraints 必须覆盖顺序、重复项、键唯一性、副作用、错误时机、精度和兼容性；无法闭合则 deferred。
- **scope 外机会无法落地** → 标记 deferred，不自动扩大修改范围。
- **平台路径差异导致误判过期** → 复用现有跨平台路径规范化函数并以 POSIX 相对路径持久化。
