---
entity: element-declaration
identity: requirement
kind: capability
parent: element-contract
title: Requirement
summary: Element Contract 中表达一项可独立演进规范承诺的稳定语义条目。
---

## Requirements

### Requirement: 表达可独立演进的规范承诺

Requirement SHALL 在宿主 Element 自身抽象层级上表达一项可独立演进的职责、保证、约束或行为。

#### Scenario: 规范承诺可以独立变化

- **WHEN** 一项语义能够独立新增、修改或移除而不要求其他 Requirements 同时改变
- **THEN** Element Contract 以独立 Requirement 表达该语义

### Requirement: 作为 Contract 的差量单位

Requirement SHALL 具有稳定 identity，并作为 Semantic Delta 直接作用于 Element Contract 的最小单位。

#### Scenario: 修改 Contract 中一项语义

- **WHEN** Change 只改变一个 Requirement
- **THEN** Semantic Delta 直接寻址该 Requirement 而不替换整份 Contract
