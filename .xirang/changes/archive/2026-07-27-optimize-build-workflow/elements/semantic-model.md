---
entity: element-declaration
identity: semantic-model
kind: domain
parent: project.root
title: "Semantic Model"
summary: "项目用户意图的完整结构化语义表达。"
---

## MODIFIED Requirements

### Requirement: 自声明实体类型
除 Relationship 与 Requirement 的结构化标识外，每个 Markdown 单元 SHALL 在 frontmatter 以 `entity` 声明自身类型；分区 SHALL NOT 决定 entity type，错置单元 SHALL 按自声明解析并产生 `ENTITY_PARTITION_MISMATCH` WARNING。

#### Scenario: Element 单元位于错误分区
- **WHEN** 一个自声明 `element-declaration` 的单元出现在非 `elements` 分区
- **THEN** 加载器按 Element 解析、报告 warning，且不因该 warning 判定模型无效

## ADDED Requirements

### Requirement: 保持 Requirement Name 唯一
同一 Element Contract 内的 Requirement names SHALL 唯一。

#### Scenario: Contract 包含重名 Requirements
- **WHEN** Validator 发现同一 Contract 中两个 Requirements 使用相同 name
- **THEN** Validator 返回 `DUPLICATE_REQUIREMENT_NAME` ERROR

### Requirement: 保持 Scenario Name 唯一
同一 Requirement 内的 Scenario names SHALL 唯一。

#### Scenario: Requirement 包含重名 Scenarios
- **WHEN** Validator 发现同一 Requirement 中两个 Scenarios 使用相同 name
- **THEN** Validator 返回 `DUPLICATE_SCENARIO_NAME` ERROR

### Requirement: 要求 Requirement 包含 Scenario
每个 Requirement SHALL 至少包含一个 Scenario。

#### Scenario: Requirement 没有 Scenario
- **WHEN** Validator 发现 Requirement 的 Scenarios 为空
- **THEN** Validator 返回 `MISSING_REQUIREMENT_SCENARIO` ERROR

### Requirement: 验证 Element Kind 引用
每个 Element Declaration 的 `kind` SHALL 引用已声明的 Element Kind。

#### Scenario: Element 使用未声明 Kind
- **WHEN** Validator 无法在 Metamodel 中解析 Element 的 kind
- **THEN** Validator 返回 `UNDECLARED_ELEMENT_KIND` ERROR

### Requirement: 验证 Relationship Kind 引用
每个 Relationship 的 `kind` SHALL 引用已声明的 Relationship Kind。

#### Scenario: Relationship 使用未声明 Kind
- **WHEN** Validator 无法在 Metamodel 中解析 Relationship 的 kind
- **THEN** Validator 返回 `UNDECLARED_RELATIONSHIP_KIND` ERROR

### Requirement: 验证 Kind Constraint 引用
Element Kind 的 `parents`、`children` 与 Relationship Kind 的 `sourceKinds`、`targetKinds` SHALL 只引用已声明的 Element Kinds；该引用闭包 SHALL NOT 要求 `parents` 与 `children` 机械对称。

#### Scenario: Constraint 引用未声明 Kind
- **WHEN** Validator 在任一 Kind constraint 字段发现无法解析的 identity
- **THEN** Validator 返回 `UNRESOLVED_KIND_REFERENCE` ERROR

### Requirement: 验证 Authored View 引用
Authored View 的 `of` 与 list-form `include` SHALL 只引用已声明的 Elements；`include: '*'` SHALL 不要求逐项引用检查。

#### Scenario: View 引用未声明 Element
- **WHEN** Validator 无法解析 `of` 或 list-form `include` 中的 Element identity
- **THEN** Validator 返回 `UNRESOLVED_VIEW_REFERENCE` ERROR
