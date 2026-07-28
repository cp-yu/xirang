---
operation: MODIFIED
entity: element-declaration
identity: element-declaration
kind: capability
parent: hierarchical-elements
title: Element Declaration
definition: Element Declaration 定义 Element 在 Semantic Model 中的稳定结构身份与完整概念语义；它以 identity、kind、parent、title 和 definition 声明该 Element 是什么、为何独立存在及其抽象边界，但不承载属于 Element Contract 的职责、保证、约束或行为。
---

## MODIFIED Requirements

### Requirement: 声明稳定 Element Identity
Element Declaration SHALL 声明稳定 `identity`；Element 改变 Kind、Definition 或层级位置时该 identity SHALL 继续指向同一 Element。

#### Scenario: Element 改变位置
- **WHEN** 一个 Element 移动到新的父 Element
- **THEN** Element identity 保持不变

### Requirement: 声明作者表述
Element Declaration SHALL 声明 `title` 与作者定义的非空 `definition`；Definition SHALL 在 Element 自身抽象层级完整表达该 Element 是什么、为何独立存在、包含与排除什么，以及消除歧义所需的 parent、children 与 siblings 边界。

#### Scenario: 查询 Element
- **WHEN** CLI 或 Agent 查询一个 Element
- **THEN** Declaration 返回完整 title 与 Definition，使其无需从 Contract 或实现反推该 Element 的概念身份和边界

## ADDED Requirements

### Requirement: 保持 Definition 为稳定概念语义
Definition SHALL 描述 Element 的稳定目标概念，SHALL NOT 包含规范义务、Scenario、验收条件、实现路径、代码结构、Change 动机或历史，也 SHALL NOT 通过机械拼接相邻 Elements 的 Definitions 形成。

#### Scenario: 编写 Element Definition
- **WHEN** Agent 创建或修改一个 Element Declaration
- **THEN** Definition 只表达该 Element 的概念身份和边界，规范性承诺仍由 Element Contract 表达

### Requirement: 只持久化 Definition
Element Declaration SHALL 只以 `definition` 持久化作者概念表述，SHALL NOT 持久化 `summary` 或任何 Definition excerpt。

#### Scenario: 加载 Legacy Declaration
- **WHEN** 当前 Semantic Model、Candidate 或活动 Change 中的 Element Declaration 使用 `summary`
- **THEN** CLI 返回明确的 legacy field ERROR，且不静默忽略、回退或改写该字段
