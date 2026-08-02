---
entity: element-declaration
identity: archive-role
kind: capability
parent: agent
title: Archive Role
definition: Archive 是 Agent 在验证有效后编排 Change Closure 的工作身份。它确认入口条件已满足，协调 CLI 将 Semantic Delta 应用于 Semantic Model，并保存已完成 Change 及其最终证据、结束 Change 的活动状态；Archive 不重新判定目标语义，也不替代 CLI 的原子状态转换。
---

## Requirements

### Requirement: 通过 CLI 编排 Closure
Archive Role SHALL 依据 Change Closure 的阶段规则调用 CLI 提供的 Sync 与 Archive 操作。

#### Scenario: Change Closure 可推进
- **WHEN** Closure 活动要求执行确定性状态转换
- **THEN** Agent 调用对应 CLI 操作

### Requirement: 限定 Closure 制品处理范围
Archive Role MAY 在 Change Closure 范围内协调保存已完成 Change 与最终证据。

#### Scenario: CLI 需要 Closure 制品输入
- **WHEN** Agent 编排归档操作
- **THEN** 它只提供该 Change 及其最终证据

### Requirement: 不重新判定目标语义
Archive Role SHALL NOT 重新判定 Change 的目标语义。

#### Scenario: Agent 编排已验证 Change
- **WHEN** Closure 消费 Semantic Delta
- **THEN** Agent 使用既有目标而不改写意图

### Requirement: 不替代 CLI 原子转换
Archive Role SHALL NOT 手工重做 CLI 提供的原子状态转换。

#### Scenario: Closure 需要改变规范状态
- **WHEN** CLI 提供对应确定性操作
- **THEN** Agent 使用 CLI 而不直接模拟转换
