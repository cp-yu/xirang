---
entity: "element-declaration"
identity: "optimization"
kind: "element"
parent: "quality"
title: "Optimization"
definition: "Optimization 是 Quality 中，在代码已通过 Review 的状态上对实现进行优化评估的活动，以一轮为单位推进。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化方向都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 只选择有价值且可验证的事项

每项选中优化 SHALL 有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式，且其 `impactLevel` SHALL 不低于 `optimization.minImpactLevel`。低于门槛的方向 SHALL NOT 作为 actionable 报告、SHALL NOT 被标注为 deferred 以填充结果、SHALL NOT 通过抬高 `impactLevel` 越过门槛。`impactLevel` SHALL 度量改动价值而非实现难度：有真实可证效果的小改动仍可为 `high`，仅重排代码而无效果的大重构在任何规模下都低于门槛。

#### Scenario: 建议无法证明收益

- **WHEN** 候选事项不满足选择条件
- **THEN** Optimization 延后或拒绝该事项

#### Scenario: 方向低于收益门槛

- **WHEN** 某个待选方向的 `impactLevel` 低于 `optimization.minImpactLevel`
- **THEN** 该方向不报告为 actionable，也不标注为 deferred
- **AND** 不通过抬高其 `impactLevel` 使其越过门槛

### Requirement: 无需继续优化时完成

最新 successful checkpoint 不再存在需要执行的优化方向，或全部待选方向均低于 `optimization.minImpactLevel`，或方向数上限用尽，或用户拒绝继续优化时，Optimization SHALL 收口。全部方向低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口并在 summary 中说明剩余机会低于门槛，该结论 SHALL 被视为正当结果而非未找到工作的失败。

#### Scenario: 没有满足方向

- **WHEN** Optimizer 完成当前评估且不存在满足选择条件的方向
- **THEN** Optimization SHALL 以 `NO_ACTIONABLE` 收口
- **AND** Quality 可判断 Optimization 已完成

#### Scenario: 全部方向低于门槛

- **WHEN** 该轮所有待选方向的 `impactLevel` 均低于 `optimization.minImpactLevel`
- **THEN** Optimization SHALL 以 `NO_ACTIONABLE` 收口并在 summary 说明门槛
- **AND** 不消耗方向额度，也不报告任何 sub-threshold 方向
