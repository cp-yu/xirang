---
entity: element-declaration
identity: element-kind
kind: element
parent: metamodel
title: Element Kind
definition: Element Kind 是 Metamodel 中声明用于表达 Hierarchical Elements 的语义记法类别。每个 Element Kind 具有稳定 identity，可为所有实例定义共享语义；Kind 的变化影响不限于自身，目标 Metamodel 必须与 Element Declarations 和 Relationships 联合理解。
---

## Requirements

### Requirement: Element Kind 声明

Metamodel SHALL 声明用于表达 Hierarchical Elements 的 Element Kinds，并可为每种 Kind 定义其所有实例共享的语义。

#### Scenario: Kind 共享语义

- **WHEN** 多个 Element 声明同一 Element Kind
- **THEN** 该 Kind 的共享语义适用于其全部实例

#### Scenario: Kind identity 稳定

- **WHEN** 相同 identity 的 Kind 跨模型状态出现
- **THEN** 表示同一个 Kind，其共享语义可以发生改变
- **AND** Kind identity 变化表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化
