---
entity: element-declaration
identity: semantic-model
kind: element
parent: semantic-objects
title: Semantic Model
definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
---

## MODIFIED Requirements

### Requirement: 只以 Identity 建立引用

`parent`、Relationship endpoints、Kind 的 `parents`、`children`、`sourceKinds`、`targetKinds` 以及 View 的 `of`、`include`、`exclude` SHALL 只引用对应语义对象的 identity。

#### Scenario: 被引用单元改名

- **WHEN** 一个存储文件改名但其中实体 identity 不变
- **THEN** 全部语义引用仍解析到同一实体

### Requirement: 验证 Authored View 引用

Authored View 的 `of`、list-form `include` 与 `exclude` SHALL 只引用已声明的 Elements；`include: '*'` SHALL 不要求逐项引用检查。

#### Scenario: View 引用未声明 Element

- **WHEN** Validator 无法解析 `of`、list-form `include` 或 `exclude` 中的 Element identity
- **THEN** Validator 返回 `UNRESOLVED_VIEW_REFERENCE` ERROR
