---
entity: element-declaration
identity: view-presentation
kind: domain
parent: views
title: View Presentation
definition: View Presentation 是 Views 按语义信息如何传达给用户划分的呈现维度。View 可以采用 Visual Presentation、Text Presentation，或者同时提供两种呈现方法；呈现方法不改变 View 的呈现视角、组成方式或所依据的规范性语义。
---

## Requirements

### Requirement: 支持一种或多种呈现方法

View Presentation SHALL 允许一个 View 采用 Visual Presentation、Text Presentation 或同时采用两种方法。

#### Scenario: 同时提供视觉与文本呈现

- **WHEN** 一个 View 需要支持浏览和引用
- **THEN** 系统可同时提供 Visual Presentation 与 Text Presentation

### Requirement: 不改变 View 语义依据

同一个 View 的不同呈现方法 SHALL 表达同一呈现视角，并 SHALL NOT 改变该 View 的组成方式或规范性依据。

#### Scenario: 切换呈现方法

- **WHEN** 用户在同一 View 的视觉与文本形式之间切换
- **THEN** View 选择和组织的语义保持一致
