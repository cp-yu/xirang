---
entity: element-declaration
identity: semantic-delta-entry
kind: element
parent: semantic-delta
title: Semantic Delta Entry
definition: Semantic Delta Entry 是 Semantic Delta 的组成单位。每个 Entry 由修改语、entity type 与 identity 构成：修改语确定应用方式，entity type 与 identity 共同确定作用对象；Entry 的 entity type 覆盖 Element Declaration、Requirement、Relationship、Element Kind、Relationship Kind 与 Authored View。
---

## Requirements

### Requirement: 使用统一修改语

Semantic Delta Entry SHALL 使用 ADDED、MODIFIED 或 REMOVED；ADDED 与 MODIFIED SHALL 携带对应实体的完整目标内容，REMOVED SHALL 只声明 entity type 与 identity。

#### Scenario: 修改规范性实体

- **WHEN** 一个现有实体在目标状态中内容变化
- **THEN** MODIFIED Entry 直接声明其完整目标态而不叙述变化过程
#### Scenario: 新增 element
- **WHEN** delta 在 `ADDED` 中声明 element
- **THEN** payload SHALL 包含 stable identity、kind、parent、title、definition 与完整目标 metadata
- **AND** identity SHALL 不存在于 Formal Model
#### Scenario: 修改 parent
- **WHEN** `MODIFIED element` 的 target parent 与 Formal Model 不同
- **THEN** Target SHALL 保持 stable element identity
- **AND** validation SHALL 重新检查 containment 与 Metamodel constraints
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

### Requirement: 保持 Relationship 三元组唯一

Relationship identity SHALL 为 `(source elementId, relationship kind, target elementId)`，同一 tuple SHALL 最多存在一条 relationship；endpoint 或 kind 变化 SHALL 使用 `REMOVED + ADDED`。

#### Scenario: 重复三元组被拒绝

- **WHEN** 同一 `{source, kind, target}` 在一个 Delta 中重复
- **THEN** validation SHALL 拒绝该重复并保持旧三元组不变

### Requirement: 将 Scenario 变化归入 Requirement

Scenario 的新增、修改或移除 SHALL 由宿主 Requirement Entry 的完整目标内容表达。

#### Scenario: 修改 Requirement 的条件行为

- **WHEN** Change 改变一个 Requirement 的 Scenarios
- **THEN** Delta 使用 MODIFIED Requirement 而不创建 Scenario Entry

### Requirement: 省略的属性不得存在于目标态

ADDED 与 MODIFIED 声明实体完整目标态时，omitted optional 直接属性 SHALL NOT 存在于 Target Model。

#### Scenario: MODIFIED 省略可选属性

- **WHEN** MODIFIED Element Declaration 未声明某个可选字段
- **THEN** Target Model 中该字段 SHALL 不存在

### Requirement: 作用于 Element Contract 的 Entry 以 Requirement 为对象

Element Contract Entry SHALL 以 Requirement 为粒度，而不是整份 Contract。

#### Scenario: 修改 Contract 中一项语义

- **WHEN** Change 只改变一个 Requirement
- **THEN** Delta 只寻址该 Requirement 的 identity 与完整目标内容
