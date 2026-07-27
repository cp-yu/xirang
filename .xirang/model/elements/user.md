---
entity: element-declaration
identity: user
kind: capability
parent: participants
title: "用户"
summary: "表达和确认用户意图并保留关键裁决权的参与者。"
---

## Requirements

### Requirement: 表达用户意图
用户 SHALL 表达项目或 Change 的用户意图。

#### Scenario: 发起项目演进
- **WHEN** 用户希望建立项目或改变目标状态
- **THEN** 用户说明期望意图

### Requirement: 确认用户意图
用户 SHALL 确认将被落实的用户意图。

#### Scenario: Agent 形成目标表达
- **WHEN** Agent 将意图编译为 Candidate 或 Change
- **THEN** 用户确认该目标表达

### Requirement: 裁决证据无法确定的问题
用户 SHALL 裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题。

#### Scenario: 存在多个合理解释
- **WHEN** 不同解释会改变目标语义
- **THEN** 用户选择目标解释

### Requirement: 授权重要决策与状态转换
用户 SHALL 授权需要用户判断的重要决策与状态转换。

#### Scenario: 提升 Candidate
- **WHEN** Candidate 已验证并呈现 digest
- **THEN** 用户决定是否授权 promotion

### Requirement: 无需亲自执行落实操作
用户 SHALL NOT 被要求亲自执行项目修改或确定性 CLI 操作。

#### Scenario: 已完成必要授权
- **WHEN** 后续步骤可由 Agent 与 CLI 确定推进
- **THEN** Agent 代表用户完成操作
