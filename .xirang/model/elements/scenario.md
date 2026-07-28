---
entity: element-declaration
identity: scenario
kind: capability
parent: requirement
title: Scenario
definition: 具体化宿主 Requirement 在特定条件下行为的规范性组成。
---

## Requirements

### Requirement: 具体化宿主 Requirement

Scenario SHALL 只表达宿主 Requirement 在特定条件下应表现的行为，SHALL NOT 引入可独立演进的职责、保证、约束或行为。

#### Scenario: 条件分支属于同一规范承诺

- **WHEN** 同一 Requirement 在不同条件下具有不同结果
- **THEN** Scenarios 分别具体化这些条件化行为

### Requirement: 保持规范约束力

每个 Scenario SHALL 是宿主 Requirement 中具有规范约束力的组成。

#### Scenario: 判断实现是否符合 Requirement

- **WHEN** 实现进入 Scenario 声明的条件
- **THEN** 实现满足该 Scenario 的规范结果

### Requirement: 不默认穷尽适用情况

一个 Requirement 下的 Scenarios SHALL NOT 默认构成该 Requirement 全部适用情况的穷尽枚举。

#### Scenario: 未单独列出共识行为

- **WHEN** 某种情况没有专门 Scenario
- **THEN** Requirement 的一般规范语义仍然约束该情况

### Requirement: 从属于 Requirement 差量

Scenario SHALL NOT 作为独立 Semantic Delta Entry；其变化 SHALL 作为宿主 Requirement 的完整目标内容变化表达。

#### Scenario: 新增一个 Scenario

- **WHEN** Change 为现有 Requirement 增加条件化行为
- **THEN** Delta 使用 MODIFIED Requirement 携带全部目标 Scenarios
