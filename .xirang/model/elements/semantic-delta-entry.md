---
entity: element-declaration
identity: semantic-delta-entry
kind: capability
parent: semantic-delta
title: Semantic Delta Entry
summary: 以修改语、entity type 与稳定 identity 为单位的目标语义声明。
---

## Requirements

### Requirement: 使用统一修改语

Semantic Delta Entry SHALL 使用 ADDED、MODIFIED 或 REMOVED；ADDED 与 MODIFIED SHALL 携带对应实体的完整目标内容，REMOVED SHALL 只声明 entity type 与 identity。

#### Scenario: 修改规范性实体

- **WHEN** 一个现有实体在目标状态中内容变化
- **THEN** MODIFIED Entry 直接声明其完整目标态而不叙述变化过程

### Requirement: 以实体粒度作用

Entry SHALL 作用于 Element Declaration、Requirement、Relationship、Element Kind、Relationship Kind 或 Authored View；同一 entity type 与 identity 在一个 Delta 中 SHALL NOT 存在冲突操作。

#### Scenario: 检测冲突操作

- **WHEN** 同一实体在一个 Delta 中出现互相冲突的 Entries
- **THEN** CLI 拒绝该 Delta

### Requirement: 限制 Relationship 操作

Relationship Entry SHALL 只使用 ADDED 或 REMOVED，因为其有向 source-kind-target 全部内容就是 identity。

#### Scenario: 改变 Relationship

- **WHEN** 目标状态需要不同的 Relationship 三元组
- **THEN** Delta 移除旧三元组并新增新三元组

### Requirement: 将 Scenario 变化归入 Requirement

Scenario 的新增、修改或移除 SHALL 由宿主 Requirement Entry 的完整目标内容表达。

#### Scenario: 修改 Requirement 的条件行为

- **WHEN** Change 改变一个 Requirement 的 Scenarios
- **THEN** Delta 使用 MODIFIED Requirement 而不创建 Scenario Entry
