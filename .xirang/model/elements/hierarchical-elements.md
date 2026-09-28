---
entity: element-declaration
identity: hierarchical-elements
kind: element
parent: semantic-model
title: Hierarchical Elements
definition: 从 Project Root 开始、可任意深入的项目抽象结构。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，父 Element 表达较高层抽象，子 Element 对其进一步精化。
---

## Specification

### Section: 以父子层级精化语义

Hierarchical Elements SHALL 只有一个 Project Root；每个非根 Element SHALL 通过显式 parent identity 归属父 Element，子 Element SHALL 对父 Element 作进一步精化。

- **下钻项目抽象**

  - 用户从一个 Element 查看其 children
  - 每个 child 在更具体的抽象层级细化该 Element

- **唯一 Project Root 校验通过**
  - 模型包含一个标记为 root 的 project element 且其他 elements 均可追溯到该 root
  - root validation SHALL 通过
### Section: 联合声明与契约

每个 Element SHALL 由 Element Declaration 与其至多一个 Element Contract 共同表达，且 Contract 是否必需 SHALL 由对应 Element Kind 决定。

- **理解一个 Element**

  - Agent 读取一个 Element
  - Agent 联合其 Declaration 与 Contract 判断结构身份和规范行为

### Section: Containment 表达抽象精化

非根 Element 的 parent SHALL 表达其高层抽象；`belongs_to`、`refines` 与 `abstracts` SHALL NOT 作为重复的持久化 Relationship edges。

- **多层精化合法**

  - 模型使用任意深度的 single-parent nesting 且满足全部可选 Metamodel constraints
  - containment validation SHALL 通过，query SHALL 返回 parent、children 与 depth
