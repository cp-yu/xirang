---
entity: element-declaration
identity: semantic-model
kind: element
parent: semantic-objects
title: Semantic Model
definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
---

## ADDED Requirements

### Requirement: 保持 Identity 命名空间独立

Semantic Model SHALL 将 identity 唯一性约束在各自的实体类型命名空间内：Element identity、Metamodel Kind identity（Element Kind 与 Relationship Kind 共用）与 Authored View identity SHALL 各自独立；不同命名空间使用相同 identity SHALL 合法，MUST NOT 被报告为冲突，且引用 SHALL 按字段的实体类型解析。

#### Scenario: Element 与 Element Kind 跨类型同名

- **GIVEN** 模型同时包含 element-declaration `implementation` 与 element-kind `implementation`
- **WHEN** CLI 加载该模型
- **THEN** 两个实体 SHALL 各自独立存在且 MUST NOT 产生冲突诊断
- **AND** Element 的 `kind` 引用 SHALL 解析到 element-kind，引用 MUST NOT 因同名而解析到另一类型的实体

## MODIFIED Requirements

### Requirement: 建立 Identity Source Index

加载器 SHALL 以 entity type 与 identity 共同建立 `(entity type, identity) → source module` 索引；同一 identity 在不同实体类型下 SHALL 分别定位到各自的存储单元。

#### Scenario: 定位语义实体来源

- **WHEN** CLI 需要读取或重写一个实体
- **THEN** 它 SHALL 按该实体的 entity type 与 identity 通过索引定位对应存储单元

#### Scenario: 跨类型同名单元各自定位

- **GIVEN** 模型同时包含同名 element 与 element-kind
- **WHEN** CLI 通过索引定位其中任一实体
- **THEN** SHALL 定位到该实体所属类型的存储单元
- **AND** MUST NOT 定位到另一类型实体的存储单元
