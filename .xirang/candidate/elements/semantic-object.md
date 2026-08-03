---
entity: element-declaration
identity: semantic-object
kind: perspective
parent: project.root
title: 语义对象
definition: 语义对象是从语义角度组织息壤项目表达内容的 Perspective：它容纳表达项目"应该是什么"的 Semantic Model 与承载"应该如何变化"的 Change，两者共同构成 Agent 理解、决策和演进项目所依据的结构化语义。
---

## Requirements

### Requirement: 语义对象维度组织

semantic-object SHALL 从语义角度组织 Semantic Model 与 Change：Semantic Model 表达项目当前状态下的结构化语义，Change 表达针对该模型的一次演进意图。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

#### Scenario: 语义对象容纳模型与变更

- **WHEN** 浏览 semantic-object 的 descendants
- **THEN** 同时呈现 Semantic Model 的组成（Metamodel、Hierarchical Elements、Relationships、Views）与 Change 的组成（Semantic Delta、Change Plan）

#### Scenario: 维度独立演进

- **WHEN** Change 以 Semantic Delta 表达针对 Semantic Model 的演进意图
- **THEN** Semantic Model 与 Change 各自作为独立语义对象演进
- **AND** 语义对象的组织不引入新的规范性语义
