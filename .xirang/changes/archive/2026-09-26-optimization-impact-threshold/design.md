## Context

Optimization 的代价结构是「每轮 = 一次 clean-context reviewer 调用 + 一次可能的回滚 + 一次方向额度消耗」，而收益门槛此前完全由 Optimizer 主观判断。协议要求每个方向「有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式」，但「实际收益」没有下限，于是消掉一个临时变量、内联一个只调用一次的辅助函数这类改动也能通过全部admission 条件并报为方向。

`impactLevel` 已经是方向的结构化字段（`high`/`medium`/`low`），CLI 已按它排序选取，因此它是现成的判据载体：门槛不需要引入新概念，只需给已有等级加一个可配置下限，并让判定留在 CLI 侧而非 Agent 侧。

## Goals / Non-Goals

**Goals:**
- 让「不值得做」可表达：低于门槛的方向不被报告，全部低于门槛时以 `NO_ACTIONABLE` 正当收口。
- 判定确定性：过滤在 CLI 选择器完成，不依赖 Agent 对「收益大不大」的主观判断。
- 默认行为零变化：默认 `low` 等价于无门槛。

**Non-Goals:**
- 不改变终态推导规则。`NO_ACTIONABLE → NOT_NEEDED` 保持不变，不新增终态。
- 不引入批次化方向处理，也不改变 review 单位。方向仍逐个实现、逐个复核。
- 不新增独立的 optimizer surface fragment。门槛经通用 `normalized` 载荷与模板自读到达 Optimizer。
- 不改变 `directionLimit` 与 `directionRetries` 的既有语义。

## Decisions

1. **门槛复用 `impactLevel` 而非新增收益字段**。理由：`impactLevel` 已是自由输入的结构化字段，CLI 已按它排序；复用它使门槛可在 CLI 侧确定性过滤，避免新增字段后 Agent 侧仍需主观打分，判据不会漂移。
2. **默认值 `low`（最低档）**。理由：`low` 是最宽的门槛，等价于不过滤，使既有项目的优化行为与改动前逐字一致；收紧是显式配置动作。这使该配置成为纯增量能力，不需要迁移。
3. **门槛落在两处：CLI 选择器 + Optimizer admission gate**。CLI 侧是确定性保证（低于门槛的方向永不被选中，与 Agent 行为无关）；Optimizer 侧是成本节约（不为注定不被选中的方向花一次评审）。两者是同一语义的两道实现，不构成双重判据。
4. **低于门槛时以 `NO_ACTIONABLE` 收口，而非新终态**。理由：语义上「没有值得做的事」与既有的「不存在满足条件的方向」是同一结论，复用既有 `stopReason` 可避免扩张状态机，且 `NOT_NEEDED` 已能被 Archive 接受。协议文本明确说明这是正当结论而非失败，以避免 Agent 为提高收口质量而虚报等级。
5. **禁止虚报与 deferred 充数**。方向低于门槛时，不得抬高其 `impactLevel` 越过门槛，也不得把它标为 deferred 以满足「必须报点什么」的错觉。理由：门槛若可被 Agent 绕过就失去确定性，而虚报会把成本重新引入。
6. **三处并行副本必须同步**。`optimization-execution`、`apply-quality-integration`、`optimizer-findings` 各有一份优化循环控制语义的表述，且都不提门槛。只改 `optimization` 会留下模型内部矛盾，而 Sync 不会自动调和跨元素的不一致。

## Risks / Trade-offs

- **默认值不收紧则该功能默认不生效**：这是刻意的取舍——收紧默认值会改变所有既有项目的优化行为，属于破坏性变更，而收益不足以证明该代价。需要收紧的项目显式配置。
- **门槛语义分散在五处实现**：两处手写 zod schema、一处非法值提示、一处 missing-path 迁移清单、一处配置序列化。这是既有实现的重复形态，本次不重构，仅在语义上声明「可取值与默认值」，实现重复由既有测试锁定。
- **`impactLevel` 的语义依赖 Agent 自评**：门槛是确定性的，但输入等级仍由 Optimizer 给出。若 Optimizer 系统性高估等级，门槛会被绕过。缓解是协议明确禁止虚报，且 `impactLevel` 的判据已定义为「值多少」而非「多难」。
- **端到端收口路径无持久测试**：现有测试只覆盖 `selectEligibleDirection` 单元行为，没有测试完整走完「全部方向低于门槛 → `NO_ACTIONABLE` → `NOT_NEEDED`」。该路径的证据是源码阅读（选择器返回 `undefined` 则 `wantsSelection` 为假），不是测试。这是一个已知的证据缺口。
