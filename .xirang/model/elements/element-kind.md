---
entity: element-declaration
identity: element-kind
kind: element
parent: metamodel
title: Element Kind
definition: Element Kind 是 Metamodel 中声明用于表达 Hierarchical Elements 的语义记法类别。每个 Element Kind 具有稳定 identity，可为所有实例定义共享语义；Kind 的变化影响不限于自身，目标 Metamodel 必须与 Element Declarations 和 Relationships 联合理解。
---

## Specification

### Section: Element Kind 声明

Metamodel SHALL 声明用于表达 Hierarchical Elements 的 Element Kinds，并可为每种 Kind 定义其所有实例共享的语义。

- **Kind 共享语义**

  - 多个 Element 声明同一 Element Kind
  - 该 Kind 的共享语义适用于其全部实例

- **Kind identity 稳定**

  - 相同 identity 的 Kind 跨模型状态出现
  - 表示同一个 Kind，其共享语义可以发生改变
  - Kind identity 变化表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化

### Section: 业务规格 Contract 格式声明

Element Kind MAY 声明 `contractFormat: business-specification`，此时 SHALL 同时声明 `contract: required`，全部实例 SHALL 使用业务规格 4+N 结构。未声明格式的 Kind 保持通用 Contract 结构。

格式声明 SHALL 随 Kind 的目标内容参与解析、序列化和 Semantic Delta 应用；其变更影响 Expected Semantic Model 中的全部实例，不限于本次有 Element Delta 的实例。CLI SHALL 拒绝未知格式。
