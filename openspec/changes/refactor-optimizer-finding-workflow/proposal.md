## Why

现有 Phase 2 optimizer 将优化能力收窄为五类 rationale tag、固定 Code Smell 枚举和 Search/Replace 输出，并用 `optRetries` 同时限制成功优化与失败重试。这既遗漏重复、算法、数据结构和资源效率等通用优化，也让 optimizer 在发现机会时被迫直接设计逐字补丁，无法持续跟踪多个建议在代码演进后的有效性。

## What Changes

- **BREAKING** 将 `openspec-optimizer` 从 Search/Replace 提案器重构为 finding-first 通用优化审查者，输出严格 JSON findings、修改意见、关键设计、保持约束和验证建议。
- 移除强制 `delete/stdlib/native/yagni/shrink` 标签、封闭 Code Smell 枚举和绝对坏味道阈值；这些内容仅可作为非穷尽候选信号。
- 在 `.verify-result.json` 中持久化 CLI 分配稳定 ID 的 findings、当前状态和 append-only reconciliation history。
- 每个优化波次只实现最新排序中的首个 actionable finding；波次完成后重新调用 optimizer，基于当前代码和既有 findings 全量保留、重排、解决、失效、拒绝、合并或新增建议。
- 将 `optRetries` 限定为同一失败方向的重试预算；成功波次不消耗预算，并持续到无 actionable finding 或确定性停滞。
- 明确 reviewer、optimizer 与 master agent 的边界：reviewer 判断正确性，optimizer 判断正确实现是否值得及应如何优化，master agent 按 TDD 实现并可提交有证据的 challenge，fresh reviewer 执行 speculative re-verify。
- 保持 optimizer/reviewer 默认不配置 `model`，由用户通过工具自身配置覆盖。
- 保持 Phase 2 外部终态、skip/disabled 路径、archive 与 freshness 兼容。

## Capabilities

### New Capabilities

- `optimizer-finding-lifecycle`: 定义 optimization findings 的 JSON 合约、稳定 ID、优先级、状态机、reconciliation history、波次选择与终止语义。

### Modified Capabilities

- `openspec-optimizer-skill`: 将 optimizer 改为开放范围、finding-first、只读的优化判断与实现设计角色。
- `tdd-optimizer-smells`: 将固定坏味道枚举和绝对阈值降级为非穷尽候选信号，并移除 Search/Replace 标注要求。
- `verify-optimization`: 将单次补丁循环改为持久 findings 驱动的多波次 reconciliation 与 speculative re-verify。
- `verify-cli-gate`: 扩展现有 Phase 2 optimization JSON input，校验 finding actions、ID、状态迁移、依赖与 history。
- `apply-verify-integration`: 让 master agent 每轮只实现最高优先级 finding，并在每个波次后重新委托 optimizer 和 reviewer。
- `enforce-optimizer-invocation`: 将 optimizer 调用证据从非空 summary 提升为合法 reconciliation envelope，并保持 optimizer 的判断权。
- `verify-freshness-engine`: 在 optimizer 裁决后、master 实施前校验 finding 目标文件 hash，阻止实施过期建议。
- `reviewer-cleanliness-dimension`: 明确 correctness/cleanliness 缺陷与“正确之后还能更好”的 optimizer finding 边界。

## Impact

影响 optimizer subagent 模板及生成 references、apply/verify/archive 编排模板、Phase 2 CLI 输入校验、`.verify-result.json` 类型与 freshness 逻辑，以及对应的模板、CLI、状态机和集成测试。现有旧结果缺少 findings 时按空集合读取；不新增运行时依赖，不新增 finding 级 CLI 命令，也不改变用户配置中的模型默认行为。
