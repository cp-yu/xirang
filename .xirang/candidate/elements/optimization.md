---
entity: element-declaration
identity: optimization
kind: capability
parent: verify
title: Optimization
definition: Optimization 是 Verify 中对已通过 Review 并保存为 Checkpoint 的代码实现进行优化评估的阶段。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化事项都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。
---

## Requirements

### Requirement: 仅在 Successful Checkpoint 上开始
Optimization SHALL 仅在 Review 通过并保存 successful checkpoint 后执行。

#### Scenario: Review 尚未通过
- **WHEN** 当前状态没有 successful checkpoint
- **THEN** Optimization 不开始

### Requirement: 读取完整优化依据
Optimization SHALL 读取 Semantic Model、Change、successful checkpoint 对应代码、项目证据与既有优化记录。

#### Scenario: Optimizer 评估当前状态
- **WHEN** Optimization 开始
- **THEN** 全部适用依据参与判断

### Requirement: 优先消除不必要复杂度
Optimization SHALL 优先识别可删除或简化的不必要复杂度。

#### Scenario: 正确实现含冗余复杂度
- **WHEN** 删除或简化可保持行为
- **THEN** Optimization 将其作为候选事项

### Requirement: 优化必须存在的工作
Optimization SHALL 评估必要工作是否可通过更合适的算法、数据结构、控制流、I/O 或资源使用提高效率。

#### Scenario: 必要工作存在可证明低效
- **WHEN** 更合适实现可保持目标语义
- **THEN** Optimization 可形成候选事项

### Requirement: 只选择有价值且可验证的事项
每项选中优化 SHALL 有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式。

#### Scenario: 建议无法证明收益
- **WHEN** 候选事项不满足选择条件
- **THEN** Optimization 延后或拒绝该事项

### Requirement: 将选中事项返回 Apply
选中的 Optimization 事项 SHALL 返回 Apply 实现。

#### Scenario: 优化事项被确认
- **WHEN** Optimization 选择事项
- **THEN** 当前 checkpoint 保持不变，事项交给 Apply

### Requirement: 正确性问题返回 Review
Optimization 发现正确性问题时 SHALL 停止并将问题返回 Review。

#### Scenario: 当前实现不符合 Expected Model
- **WHEN** Optimizer 识别行为缺陷
- **THEN** 问题不作为优化事项处理

### Requirement: 语义变化形成新 Change
改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

#### Scenario: 建议会改变目标行为
- **WHEN** 候选方向不是行为保持优化
- **THEN** 它不在当前 Optimization 中实施

### Requirement: 无需继续优化时完成
最新 successful checkpoint 不再存在需要执行的优化事项时，Optimization SHALL 完成。

#### Scenario: 没有满足条件的事项
- **WHEN** Optimizer 完成当前评估
- **THEN** Verify 可判断 Optimization 已完成
