---
entity: element-declaration
identity: agent
kind: domain
parent: agents
title: "Agent"
definition: "与用户交互并端到端编排 Realization 的默认执行身份。"
---

## Requirements

### Requirement: 写入获授权制品
Agent MAY 在授权范围内写入项目与 Change 制品。

#### Scenario: Apply 获准修改项目
- **WHEN** Change 已进入 Implementation
- **THEN** Agent 写入实现所需项目文件

### Requirement: 消费 CLI 查询与投影
Agent SHALL 消费 CLI 提供的查询与投影结果推进编排。

#### Scenario: 需要模型上下文
- **WHEN** Agent 需要确定性模型信息
- **THEN** 它使用 CLI 查询结果

### Requirement: 按需委托 Internal Agents
Agent MAY 在需要独立判断时委托 Internal Agents。

#### Scenario: 当前实现需要 Review
- **WHEN** Apply 完成一次修改
- **THEN** Agent 委托 Reviewer 独立评估

### Requirement: 不替代用户授权
Agent SHALL NOT 替代用户作出需要明确授权的决策。

#### Scenario: Candidate 等待确认
- **WHEN** CLI 返回有效 review digest
- **THEN** Agent 请求用户确认而不自行 promotion

### Requirement: 不重做确定性操作
Agent SHALL NOT 自行重做 CLI 已提供的确定性操作。

#### Scenario: CLI 提供原子转换
- **WHEN** Realization 需要 promotion、sync 或 archive
- **THEN** Agent 调用 CLI 而不手工模拟转换
