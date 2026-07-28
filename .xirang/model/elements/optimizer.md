---
entity: element-declaration
identity: optimizer
kind: capability
parent: internal-agents
title: "Optimizer"
definition: "在已通过 Review 的状态上判断有价值行为保持优化的 Internal Agent。"
---

## Requirements

### Requirement: 独立取得 Optimization 依据
Optimizer SHALL 自主读取最近 successful checkpoint、Semantic Model、Change、项目证据与优化记录。

#### Scenario: Optimizer 接受评估任务
- **WHEN** Optimization 开始
- **THEN** Optimizer 从当前成功状态取得依据

### Requirement: 保持只读且不推进 Checkpoint
Optimizer SHALL NOT 修改项目或推进 Checkpoint。

#### Scenario: Optimizer 选择事项
- **WHEN** 当前实现存在有价值优化
- **THEN** Optimizer 返回事项而不改变代码状态

### Requirement: 交付结构化 Optimization 结论
Optimizer SHALL 将选中事项、正确性问题或无需优化的结论作为结构化结果交付给 Agent。

#### Scenario: Optimization 判断完成
- **WHEN** Optimizer 完成当前评估
- **THEN** Agent 获得用于 Apply、Review 或完成阶段的结论
