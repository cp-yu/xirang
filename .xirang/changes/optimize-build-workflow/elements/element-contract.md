---
operation: MODIFIED
entity: element-declaration
identity: element-contract
kind: capability
parent: hierarchical-elements
title: "Element Contract"
summary: "Element 在一个确定模型状态中、其自身抽象层级上的完整规范性职责、保证、约束与行为。"
---

## ADDED Requirements

### Requirement: 完整表达自身抽象层级语义
Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、提供的保证、遵循的约束与表现的行为。

#### Scenario: 独立判断 Element 承诺
- **WHEN** 用户或 Agent 读取一个 Element Contract
- **THEN** 无需读取 children Contracts 即可理解并判断该 Element 在当前层级的规范承诺

### Requirement: 允许 Children 精化与共同实现
Element Contract MAY 表达由 children 进一步精化或共同实现的规范语义，并 SHALL 允许父子 Elements 在各自抽象层级表达相互覆盖的语义。

#### Scenario: 模块由多个组件共同实现
- **WHEN** 父 Element 承诺的功能由多个 child Elements 分别精化
- **THEN** 父 Contract 保留父层级完整承诺且 children Contracts 表达各自精化
