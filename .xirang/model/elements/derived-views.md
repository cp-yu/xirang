---
entity: element-declaration
identity: derived-views
kind: domain
parent: view-composition
title: Derived Views
definition: 由模型或 Change 确定性推导、无需持久化的 Views。
---

## Requirements

### Requirement: 自动确定性推导

Derived View SHALL 由 Semantic Model 或 Change 自动且确定性推导。

#### Scenario: 相同输入重复派生

- **WHEN** 系统对相同语义输入生成同类 Derived View
- **THEN** 输出保持语义等价

### Requirement: 无需用户声明

Derived View SHALL NOT 要求用户声明。

#### Scenario: 请求未声明的下钻视图

- **WHEN** 用户请求一个 Element 的派生视图
- **THEN** 系统直接从模型生成而不查找 Authored View

### Requirement: 不持久化

Derived View SHALL NOT 持久化为 Semantic Model 或 Change 的 durable artifact；系统 MAY 生成不构成规范性语义且可从当前输入重建的运行时表示或缓存。

#### Scenario: 保存模型或 Change

- **WHEN** 系统持久化 Semantic Model 或 active Change
- **THEN** 持久化内容不包含 Derived View artifact

#### Scenario: 生成可重建运行表示

- **WHEN** Semantic Browser 需要呈现 Derived View
- **THEN** 系统可生成临时 manifest 或缓存且其缺失不影响规范性语义

### Requirement: 不作为 Delta 作用对象

Derived View SHALL NOT 作为 Semantic Delta Entry 的作用对象。

#### Scenario: Change 修改呈现

- **WHEN** 模型或 Delta 内容发生变化
- **THEN** Derived View 随输入重新推导而不由 Delta 直接修改

### Requirement: 提供两类派生视图

Derived Views SHALL 包括 Element-derived Views 与 Change-derived Views。

#### Scenario: 选择派生上下文

- **WHEN** 用户查看 Element 或 Change
- **THEN** 系统分别使用对应类型的 Derived View
