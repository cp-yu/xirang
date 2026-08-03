---
entity: element-declaration
identity: derived-views
kind: element
parent: view-composition
title: Derived Views
definition: Derived Views 是由 Semantic Model 或 Change 确定性派生的 Views。Derived View 无需用户声明，其内容随派生依据变化而重新确定；它不作为 Semantic Model 或 Change 的 durable artifact 持久化，也不作为 Semantic Delta Entry 的作用对象。
---

## Requirements

### Requirement: 自动确定性推导

Derived View SHALL 由 Semantic Model 或 Change 自动且确定性推导。

#### Scenario: 相同输入重复派生

- **WHEN** 系统对相同语义输入生成同类 Derived View
- **THEN** 输出保持语义等价

### Requirement: 无需用户声明

Derived View SHALL NOT 要求用户声明。

#### Scenario: 打开默认或 Change 视角

- **WHEN** 用户打开 Model View 或一个活动 Change 的 Change-derived View
- **THEN** 系统直接从适用 Semantic Model 或 Semantic Delta 派生该 View 而不查找 Authored View

### Requirement: 不持久化

Derived View SHALL NOT 持久化为 Semantic Model 或 Change 的 durable artifact；系统 MAY 生成不构成规范性语义且可从当前输入重建的运行时表示或缓存。

#### Scenario: 保存模型或 Change

- **WHEN** 系统持久化 Semantic Model 或 active Change
- **THEN** 持久化内容不包含 Derived View artifact

### Requirement: 不作为 Delta 作用对象

Derived View SHALL NOT 作为 Semantic Delta Entry 的作用对象。

#### Scenario: Change 修改呈现

- **WHEN** 模型或 Delta 内容发生变化
- **THEN** Derived View 随输入重新推导而不由 Delta 直接修改

### Requirement: 提供两类派生视图

Derived Views SHALL 包括每个项目唯一的 Model View 与每个活动 Change 唯一的 Change-derived View，且 SHALL NOT 包括按 Element 生成的 Views。

#### Scenario: 选择派生上下文

- **WHEN** 用户浏览当前 Semantic Model 或一个活动 Change
- **THEN** 系统分别提供 Model View 或对应 Change-derived View，Element 下钻保持在所选 View identity 内
