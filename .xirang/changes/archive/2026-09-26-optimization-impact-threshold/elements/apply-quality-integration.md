---
entity: "element-declaration"
identity: "apply-quality-integration"
kind: "element"
parent: "apply"
title: "Apply Quality Integration"
definition: "Apply Quality Integration 定义 Apply 与 Quality 的集成契约：Review 记录先写回再持久化、以轮为单位的优化循环、失败方向记录、主 agent 与 subagent 的角色分工、配置驱动的优化控制，以及 Apply reference 拥有的 checkpoint 编排。它不定义 Quality 自身的状态判定与命令面。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 配置驱动优化控制

`optimization.enabled` SHALL 控制 Optimization 是否运行；`optimization.directionLimit` SHALL 限制可选取的新方向数；`optimization.directionRetries` SHALL 只限制同一方向的失败次数，不限制成功轮次数；`optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，未配置时视为 `low`。门槛由 CLI 在选择阶段确定性执行，低于门槛的方向永不被选中。

#### Scenario: 方向数上限与失败额度互不消耗

- **WHEN** `directionRetries` 为 2 且存在三个依次通过复核的方向
- **THEN** 三个方向 SHALL 均允许完成，成功不消耗失败额度

#### Scenario: 门槛由 CLI 确定性执行

- **WHEN** 已配置 `minImpactLevel` 且某方向低于该值
- **THEN** CLI 在选择阶段不选取该方向
- **AND** 当全部待选方向均低于门槛时该轮以 `NO_ACTIONABLE` 收口
