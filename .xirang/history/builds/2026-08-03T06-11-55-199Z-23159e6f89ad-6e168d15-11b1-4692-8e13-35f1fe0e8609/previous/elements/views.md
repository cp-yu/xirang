---
entity: element-declaration
identity: views
kind: domain
parent: semantic-model
title: Views
definition: 面向用户选择并组织模型信息的呈现层。
---

## Requirements

### Requirement: 组织面向用户的模型视角

View SHALL 从 Semantic Model 中选择并组织 Elements 与 Relationships，以形成面向用户的特定视角。

#### Scenario: 用户切换视角

- **WHEN** 用户选择一个 View
- **THEN** 系统按该视角组织相关 Elements 与 Relationships

### Requirement: 不承载规范性语义

View SHALL NOT 引入规范性语义，且 View 的变化 SHALL NOT 改变 Semantic Model 的语义。

#### Scenario: 调整 View 布局

- **WHEN** View 的选择或布局发生变化
- **THEN** 模型规范性语义保持不变

### Requirement: 区分 Authored 与 Derived Views

Views SHALL 由 Authored Views 与 Derived Views 组成。

#### Scenario: 确定 View 来源

- **WHEN** 系统提供一个 View
- **THEN** 该 View 要么由用户声明，要么由语义输入派生

### Requirement: 区分 View Composition 与 View Presentation

Views SHALL 以 View Composition 表达呈现视角如何形成，并以 View Presentation 表达语义信息如何传达给用户；两个维度 SHALL 相互独立。

#### Scenario: 同一 View 采用多种呈现方法

- **WHEN** 一个 Authored View 或 Derived View 同时提供 Visual Presentation 与 Text Presentation
- **THEN** 两种方法表达同一呈现视角且不改变该 View 的组成方式
