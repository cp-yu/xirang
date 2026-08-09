---
entity: element-declaration
identity: metamodel
kind: element
parent: semantic-model
title: Metamodel
definition: Semantic Model 使用的可扩展语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds 与用于表达 Relationships 的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。
---

## Requirements

### Requirement: 声明模型记法

Metamodel SHALL 以稳定 identity 声明 Element Kinds 与 Relationship Kinds，并可规定各 Kind 的共享语义、契约策略、层级约束与关系端点约束。

#### Scenario: 验证模型实体

- **WHEN** Element 或 Relationship 引用一个 Kind
- **THEN** 该 Kind 在 Metamodel 中存在且实体满足其约束

### Requirement: 联合理解 Kind 变更

Metamodel Kind 的变化 SHALL 与使用该 Kind 的 Element Declarations 或 Relationships 联合验证。

#### Scenario: 修改 Kind 约束

- **WHEN** 一个 Kind 的共享约束发生变化
- **THEN** 目标模型中的全部相关实例按新约束重新验证

### Requirement: 使用规范 Kind 字段

Element Kind SHALL 声明 `identity` 与 `contract`，并可声明 `root`、`parents`、`children`、`nodePresentation`；`nodePresentation` SHALL 是可选 mapping，可声明 `shape`、`color`、`border`，其值域由 Xirang 与 LikeC4 适配所使用的显式枚举定义并由校验器约束。Relationship Kind SHALL 声明 `identity`，并可声明 `sourceKinds`、`targetKinds` 与 Kind 级 `presentation`；`presentation` SHALL 是可选 mapping，仅可声明 `color`、`line`、`head`、`tail`，各字段值域 SHALL 完整复用 LikeC4 公开支持的对应合法集合并由 Xirang 输入校验器严格执行。Kind 正文可表达其所有实例共享的语义。

#### Scenario: 声明受约束 Relationship Kind

- **WHEN** Relationship Kind 限制允许的 endpoint Kinds
- **THEN** Metamodel 以 `sourceKinds` 与 `targetKinds` 声明并由模型校验器执行约束

#### Scenario: Element Kind 声明节点呈现

- **WHEN** Element Kind 声明合法 `nodePresentation`
- **THEN** 呈现只作为全局默认节点呈现，不改变该 Kind 的规范语义
- **AND** 校验器验证字段和值合法性

#### Scenario: Relationship Kind 声明关系呈现

- **WHEN** Relationship Kind 声明合法 `presentation`
- **THEN** 该 Kind 的全部 Relationship instances 共享已声明的 `color`、`line`、`head` 与 `tail`
- **AND** 未声明子字段分别继承 LikeC4 默认值
- **AND** presentation 不改变 Relationship 的规范语义或 identity

#### Scenario: Relationship presentation 缺失

- **WHEN** Relationship Kind 未声明 `presentation`
- **THEN** 该 Kind 的 Relationships 使用 LikeC4 默认关系呈现

#### Scenario: 非法 Kind presentation 被拒绝

- **WHEN** `nodePresentation` 或 Relationship `presentation` 包含未知字段、非法值或错误类型
- **THEN** 模型校验器返回 `ERROR`
- **AND** 系统不将未知值自由透传给 LikeC4 renderer

### Requirement: 默认开放 nesting

未声明的 Kind pair constraint 不构成隐式禁止；显式声明的 parent/child 约束 SHALL 由验证器执行。

#### Scenario: 未声明约束时通过

- **WHEN** parent kind 与 child kind 均存在且 Metamodel 未声明对应限制
- **THEN** containment SHALL 通过验证，不因深度或 kind pair 未列入固定表而失败
