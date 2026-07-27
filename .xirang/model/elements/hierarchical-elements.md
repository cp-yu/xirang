---
entity: element-declaration
identity: hierarchical-elements
kind: domain
parent: semantic-model
title: "Hierarchical Elements"
summary: "从 Project Root 开始、可任意深入的项目抽象结构。"
---

## Requirements

### Requirement: 以父子层级精化语义
Hierarchical Elements SHALL 只有一个 Project Root；每个非根 Element SHALL 通过显式 parent identity 归属父 Element，子 Element SHALL 对父 Element 作进一步精化。

#### Scenario: 下钻项目抽象
- **WHEN** 用户从一个 Element 查看其 children
- **THEN** 每个 child 在更具体的抽象层级细化该 Element

### Requirement: 联合声明与契约
每个 Element SHALL 由 Element Declaration 与其至多一个 Element Contract 共同表达，且 Contract 是否必需 SHALL 由对应 Element Kind 决定。

#### Scenario: 理解一个 Element
- **WHEN** Agent 读取一个 Element
- **THEN** Agent 联合其 Declaration 与 Contract 判断结构身份和规范行为
