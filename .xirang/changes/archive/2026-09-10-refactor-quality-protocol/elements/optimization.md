---
operation: MODIFIED
entity: element-declaration
identity: optimization
kind: element
parent: quality
title: Optimization
definition: Optimization 是 Quality 中，在代码已通过 Review 的状态上对实现进行优化评估的活动，以一轮为单位推进。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化方向都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。
---

## MODIFIED Requirements

### Requirement: 无需继续优化时完成

最新 successful checkpoint 不再存在需要执行的优化方向，或方向数上限用尽，或用户拒绝继续优化时，Optimization SHALL 收口。

#### Scenario: 没有满足方向
- **WHEN** Optimizer 完成当前评估且不存在满足选择条件的方向
- **THEN** Optimization SHALL 以 `NO_ACTIONABLE` 收口
- **AND** Quality 可判断 Optimization 已完成
