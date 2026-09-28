---
entity: element-declaration
identity: relationship-kind
kind: element
parent: metamodel
title: Relationship Kind
definition: Relationship Kind 是 Metamodel 中声明用于表达 Elements 之间关系的语义记法类别。每个 Relationship Kind 具有稳定 identity，表达 Elements 之间的协作、依赖或约束；方向与 Kind 共同表达 Relationship 的语义。
---

## Specification

### Section: Relationship Kind 声明

Metamodel SHALL 声明用于表达 Elements 之间关系的 Relationship Kinds。

- **Kind 表达关系语义**

  - 一个 Relationship 使用某个 Relationship Kind
  - 该 Kind 定义其表达的联系类别（协作、依赖或约束）
  - Relationship 的方向与 Kind 共同表达其语义

- **Kind identity 稳定**

  - 相同 identity 的 Relationship Kind 跨模型状态出现
  - 表示同一个 Kind，其共享语义可以发生改变
