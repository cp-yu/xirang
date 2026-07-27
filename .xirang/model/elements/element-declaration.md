---
entity: element-declaration
identity: element-declaration
kind: capability
parent: hierarchical-elements
title: "Element Declaration"
summary: "Element 的稳定身份、类型、概要与层级位置声明。"
---

## Requirements

### Requirement: 由 Frontmatter 承载
Element Declaration SHALL 由 Element Markdown 单元的 frontmatter 承载。

#### Scenario: 解析 Element 单元
- **WHEN** CLI 加载一个 Element Markdown 单元
- **THEN** 它从 frontmatter 读取 Declaration

### Requirement: 声明稳定 Element Identity
Element Declaration SHALL 声明稳定 `identity`；Element 改变 Kind、概要或层级位置时该 identity SHALL 继续指向同一 Element。

#### Scenario: Element 改变位置
- **WHEN** 一个 Element 移动到新的父 Element
- **THEN** Element identity 保持不变

### Requirement: 声明 Element Kind
Element Declaration SHALL 以 `kind` 引用 Metamodel 声明的 Element Kind。

#### Scenario: 验证 Element Kind
- **WHEN** Declaration 引用一个 Kind
- **THEN** 该 Kind 在 Metamodel 中存在

### Requirement: 声明作者表述
Element Declaration SHALL 声明 `title` 与作者定义的 `summary`。

#### Scenario: 呈现 Element
- **WHEN** CLI 或 Browser 展示 Element
- **THEN** 使用 Declaration 中的 title 与 summary

### Requirement: 声明层级位置
Element Declaration SHALL 以引用 Element identity 的 `parent` 声明层级位置；Project Root SHALL 使用 `parent: null`。

#### Scenario: 声明非根 Element
- **WHEN** Element 不是 Project Root
- **THEN** parent 引用其直接父 Element identity
