---
operation: MODIFIED
entity: element-declaration
identity: metamodel
kind: element
parent: semantic-model
title: Metamodel
definition: Semantic Model 使用的可扩展语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds 与用于表达 Relationships 的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。
---

## MODIFIED Requirements

### Requirement: 使用规范 Kind 字段

Element Kind SHALL 声明 `identity` 与 `contract`，并可声明 `root`、`parents`、`children`、`nodePresentation`；`nodePresentation` SHALL 是可选的 mapping，可声明 `shape`、`color`、`border` 三个子字段，其值域由 Xirang 自有枚举定义并受校验器约束。Relationship Kind SHALL 声明 `identity`，并可声明 `sourceKinds` 与 `targetKinds`。Kind 正文可表达其所有实例共享的语义。

#### Scenario: 声明受约束 Relationship Kind

- **WHEN** Relationship Kind 限制允许的端点类型
- **THEN** Metamodel 以 sourceKinds 与 targetKinds 声明并由模型验证器执行约束

#### Scenario: Element Kind 声明节点呈现

- **WHEN** Element Kind 声明 `nodePresentation` 且字段值属于 Xirang 自有枚举
- **THEN** 呈现仅作为全局默认节点呈现，不改变该 Kind 的规范语义
- **AND** 校验器验证字段枚举合法性

#### Scenario: 非法节点呈现值被拒绝

- **WHEN** Element Kind 的 `nodePresentation` 包含未知字段、非法枚举或错误类型
- **THEN** 校验器返回 `ERROR`