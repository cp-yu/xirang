---
entity: element-declaration
identity: semantic-objects
kind: perspective
parent: project.root
title: 语义对象
definition: 语义对象是从项目规范语义构成角度组织 Semantic Model 与 Change 的 Perspective。它独立建模以将项目应该是什么及应该如何变化，与负责落实这些意图的 Realization 区分开；包含 Semantic Model 与 Change，不包含落实过程、参与者或交互界面。
---

## Requirements

### Requirement: 语义对象维度组织

semantic-objects SHALL 从语义角度组织 Semantic Model 与 Change：Semantic Model 表达项目当前状态下的结构化语义，Change 表达针对该模型的一次演进意图。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

#### Scenario: 语义对象容纳模型与变更

- **WHEN** 浏览 semantic-objects 的 descendants
- **THEN** 同时呈现 Semantic Model 的组成（Metamodel、Hierarchical Elements、Relationships、Views）与 Change 的组成（Semantic Delta、Change Plan）

#### Scenario: 维度独立演进

- **WHEN** Change 以 Semantic Delta 表达针对 Semantic Model 的演进意图
- **THEN** Semantic Model 与 Change 各自作为独立语义对象演进
- **AND** 语义对象的组织不引入新的规范性语义
