---
entity: element-declaration
identity: authored-views
kind: element
parent: view-composition
title: Authored Views
definition: Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息；其声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。
---

## Requirements

### Requirement: 由用户显式声明

Authored View SHALL 由用户显式声明。

#### Scenario: 用户未声明 View

- **WHEN** 模型没有用户声明的 Authored View
- **THEN** `views` 分区可保持为空

### Requirement: 持久化 View Definition

Authored View SHALL 以 `views` 分区中的单个无正文 Markdown 单元持久化 View Definition。

#### Scenario: 加载 Authored View

- **WHEN** CLI 读取一个 View Definition File
- **THEN** 它从 frontmatter 加载 Authored View

### Requirement: 声明 View Identity

Authored View SHALL 声明稳定 `identity`。

#### Scenario: 引用 Authored View

- **WHEN** 系统寻址一个持久化 View
- **THEN** 使用该 View identity

### Requirement: 声明选择范围

Authored View SHALL 声明 `include`，其值 SHALL 为 `*` 或 Element identity 列表。

#### Scenario: 选择部分 Elements

- **WHEN** 用户只将指定 Elements 纳入 View
- **THEN** `include` 以这些 Elements 的 identities 表达选择范围

### Requirement: 声明可选 View 属性

Authored View MAY 声明 `of`、`title` 与 `autoLayout`，其中 `of` SHALL 为单个 Element identity。

#### Scenario: 声明 Element 上下文

- **WHEN** 用户将 Authored View 绑定到一个 Element
- **THEN** `of` 引用该 Element identity
