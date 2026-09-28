---
entity: element-declaration
identity: optimization
kind: element
parent: quality
title: Optimization
definition: Optimization 是 Quality 中，在代码已通过 Review 的状态上对实现进行优化评估的活动，以一轮为单位推进。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化方向都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。
---

## Specification

### Section: 仅在 Successful Checkpoint 上开始

Optimization SHALL 仅在 Review 通过并保存 successful checkpoint 后执行。

- **Review 尚未通过**

  - 当前状态没有 successful checkpoint
  - Optimization 不开始

### Section: 读取完整优化依据

Optimization SHALL 读取 Semantic Model、Change、successful checkpoint 对应代码、项目证据与既有优化记录。

- **Optimizer 评估当前状态**

  - Optimization 开始
  - 全部适用依据参与判断

### Section: 优先消除不必要复杂度

Optimization SHALL 优先识别可删除或简化的不必要复杂度。

- **正确实现含冗余复杂度**

  - 删除或简化可保持行为
  - Optimization 将其作为候选事项

### Section: 优化必须存在的工作

Optimization SHALL 评估必要工作是否可通过更合适的算法、数据结构、控制流、I/O 或资源使用提高效率。

- **必要工作存在可证明低效**

  - 更合适实现可保持目标语义
  - Optimization 可形成候选事项

### Section: 只选择有价值且可验证的事项

每项选中优化 SHALL 有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式，且其 `impactLevel` SHALL 不低于 `optimization.minImpactLevel`。低于门槛的方向 SHALL NOT 作为 actionable 报告、SHALL NOT 被标注为 deferred 以填充结果、SHALL NOT 通过抬高 `impactLevel` 越过门槛。`impactLevel` SHALL 度量改动价值而非实现难度：有真实可证效果的小改动仍可为 `high`，仅重排代码而无效果的大重构在任何规模下都低于门槛。

- **建议无法证明收益**

  - 候选事项不满足选择条件
  - Optimization 延后或拒绝该事项

- **方向低于收益门槛**

  - 某个待选方向的 `impactLevel` 低于 `optimization.minImpactLevel`
  - 该方向不报告为 actionable，也不标注为 deferred
  - 不通过抬高其 `impactLevel` 使其越过门槛

### Section: 将选中事项返回 Apply

选中的 Optimization 事项 SHALL 返回 Apply 实现。

- **优化事项被确认**

  - Optimization 选择事项
  - 当前 checkpoint 保持不变，事项交给 Apply

### Section: 正确性问题返回 Review

Optimization 发现正确性问题时 SHALL 停止并将问题返回 Review。

- **当前实现不符合 Expected Model**

  - Optimizer 识别行为缺陷
  - 问题不作为优化事项处理

### Section: 语义变化形成新 Change

改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

- **建议会改变目标行为**

  - 候选方向不是行为保持优化
  - 它不在当前 Optimization 中实施

### Section: 无需继续优化时完成

最新 successful checkpoint 不再存在需要执行的优化方向，或全部待选方向均低于 `optimization.minImpactLevel`，或方向数上限用尽，或用户拒绝继续优化时，Optimization SHALL 收口。全部方向低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口并在 summary 中说明剩余机会低于门槛，该结论 SHALL 被视为正当结果而非未找到工作的失败。

- **没有满足方向**

  - Optimizer 完成当前评估且不存在满足选择条件的方向
  - Optimization SHALL 以 `NO_ACTIONABLE` 收口
  - Quality 可判断 Optimization 已完成

- **全部方向低于门槛**

  - 该轮所有待选方向的 `impactLevel` 均低于 `optimization.minImpactLevel`
  - Optimization SHALL 以 `NO_ACTIONABLE` 收口并在 summary 说明门槛
  - 不消耗方向额度，也不报告任何 sub-threshold 方向
