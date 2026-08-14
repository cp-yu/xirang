---
entity: element-declaration
identity: derived-views
kind: element
parent: view-composition
title: Derived Views
definition: Derived Views 是由 Semantic Model、active Candidate 或 active Change 确定性推导、无需用户声明且不作为 durable artifact 持久化的 Views 与 runtime projections。它们独立建模以区别用户声明的 Authored Views；包含每个项目唯一的 Model View、active Candidate 存在时唯一的 Candidate View 与 Candidate Diff View，以及由当前 View Selection、单个 active Change 与 Presentation Mode 组合形成的 Change-derived runtime projections，不包含按 Element 生成的 View identities、运行时布局状态或 Authored View 定义。
---

## Requirements

### Requirement: 自动确定性推导

Derived View 或 projection SHALL 由 Semantic Model、active Candidate，或 Semantic Model、单个 active Change、当前 View Selection 与 Presentation Mode 自动且确定性推导。

#### Scenario: 相同输入重复派生

- **WHEN** 系统对相同语义输入与 Browser selection state 生成同类 Derived View 或 projection
- **THEN** 输出保持语义等价

#### Scenario: Candidate 改变后重建

- **WHEN** active Candidate 的四个分区内容发生变化
- **THEN** Candidate View 与 Candidate Diff View SHALL 从新的 Candidate 语义输入重新确定性派生

#### Scenario: Change 与 View 组合改变

- **WHEN** 用户改变 View Selection、单个 Change Selection 或 Presentation Mode
- **THEN** Change-derived runtime projection SHALL 从新的组合输入重新确定性派生
- **AND** SHALL NOT 创建新的 durable View identity

### Requirement: 无需用户声明

Derived View 或 projection SHALL NOT 要求用户为其结果另行声明 View；Authored View 只在被选为 View Selection 时提供持久选择边界，不声明 Change-derived result。

#### Scenario: 打开 Model 或 Change 视角

- **WHEN** 用户打开 Model View，或在 Model/Authored View Selection 中选择一个活动 Change
- **THEN** 系统从适用 Semantic Model、Authored selection 与 Semantic Delta 派生结果
- **AND** 不查找或创建用于声明 Change-derived projection 的 Authored View

#### Scenario: 打开 Candidate 视角

- **WHEN** active Candidate 存在且用户打开 Candidate View 或 Candidate Diff View
- **THEN** 系统直接从适用 Candidate 与 Semantic Model 派生该 View
- **AND** 不查找用于声明该 Derived View 的 Authored View

### Requirement: 不持久化

Derived View SHALL NOT 持久化为 Semantic Model、Candidate 或 Change 的 durable artifact；系统 MAY 生成不构成规范性语义且可从当前输入重建的运行时表示或缓存。

#### Scenario: 保存模型或 Change

- **WHEN** 系统持久化 Semantic Model、active Candidate 或 active Change
- **THEN** 持久化内容不包含 Derived View artifact

#### Scenario: 生成可重建运行表示

- **WHEN** Web 需要呈现 Derived View
- **THEN** 系统可生成临时 manifest 或缓存且其缺失不影响规范性语义

### Requirement: 不作为 Delta 作用对象

Derived View SHALL NOT 作为 Semantic Delta Entry 的作用对象。

#### Scenario: Change 修改呈现

- **WHEN** 模型或 Delta 内容发生变化
- **THEN** Derived View 随输入重新推导而不由 Delta 直接修改

### Requirement: 提供四类派生视图

Derived Views SHALL 包括每个项目唯一的 Model View、active Candidate 存在时唯一的 Candidate View 与 Candidate Diff View，以及由当前 Model/Authored View Selection、单个活动 Change 与 Presentation Mode 形成的 Change-derived runtime projections；Change-derived projections SHALL NOT 成为独立 View selector entries 或持久 identities，且系统 SHALL NOT 生成按 Element 命名的 Views。

#### Scenario: 选择派生上下文

- **WHEN** 用户浏览当前 Semantic Model、active Candidate 或一个活动 Change
- **THEN** 系统分别提供 Model View、Candidate View 与 Candidate Diff View，或在当前 View Selection 内形成 Change-derived projection
- **AND** Element 下钻保持在当前 View Selection 内

#### Scenario: Candidate 不存在

- **WHEN** 项目没有 active Candidate
- **THEN** Candidate Review 入口 SHALL NOT 提供 Candidate View 或 Candidate Diff View
- **AND** 普通 Web 界面 继续提供 Model、Authored Views 与活动 Changes
