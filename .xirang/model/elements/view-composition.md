---
entity: element-declaration
identity: view-composition
kind: perspective
parent: views
title: View Composition
definition: View Composition 是 Views 按形成方式划分的组成维度。每个 View 要么由用户显式声明并持久化为 Authored View，要么由被浏览 Model 实例确定性派生为 Full Model；两类 View 共同构成 Semantic Browser 的 View Selection，并对被浏览 Model 实例解析。
---

## Requirements

### Requirement: 按形成方式区分 Views

View Composition SHALL 将每个 View 区分为用户显式声明的 Authored View 或由被浏览 Model 实例确定性派生的 Full Model。

#### Scenario: 确定 View 的组成方式

- **WHEN** 系统提供一个 View
- **THEN** 该 View 属于 Authored Views 或由被浏览 Model 实例派生的 Full Model 且不同时属于两类

### Requirement: 组成方式独立于呈现方法

View 的组成方式 SHALL NOT 限制其采用 Visual Presentation、Text Presentation 或两者组合。

#### Scenario: Derived View 使用文本呈现

- **WHEN** 系统以人类可读文本呈现一个 Derived View
- **THEN** 该 View 仍由其派生依据决定而不转为 Authored View
