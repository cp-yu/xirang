---
entity: element-declaration
identity: element-contract
kind: capability
parent: hierarchical-elements
title: Element Contract
summary: Element 在一个确定模型状态中、其自身抽象层级上的完整规范性职责、保证、约束与行为。
---

## Requirements

### Requirement: 只表达当前模型状态

Element Contract SHALL 只包含当前模型状态下成立的规范性语义，SHALL NOT 保留新增、修改、删除或历史过程叙述。

#### Scenario: 移除一项语义

- **WHEN** 某项规范性语义不再属于目标状态
- **THEN** 更新后的 Contract 不再包含该项语义

### Requirement: 使用规范 Contract 结构

Element Contract 正文 SHALL 仅包含 `## Requirements`，其下以有序 `### Requirement` 与 `#### Scenario` 表达规范性语义；描述性文字 SHALL 由 Declaration summary 承载。

#### Scenario: 校验 Contract 单元

- **WHEN** 正文包含 Requirements 之外的内容
- **THEN** CLI 报告验证错误

### Requirement: 稳定寻址 Requirement

Requirement identity SHALL 由宿主 Element identity 与 Requirement name 共同确定；Element 内 SHALL 使用 name，跨模型全局寻址 SHALL 使用 `<element identity>#<name>`。

#### Scenario: Delta 修改 Requirement

- **WHEN** Semantic Delta 作用于一个 Contract Requirement
- **THEN** 宿主 Element 与 Requirement name 唯一定位目标条目

### Requirement: 完整表达自身抽象层级语义

Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、提供的保证、遵循的约束与表现的行为。

#### Scenario: 独立判断 Element 承诺

- **WHEN** 用户或 Agent 读取一个 Element Contract
- **THEN** 无需读取 children Contracts 即可理解并判断该 Element 在当前层级的规范承诺

### Requirement: 允许 Children 精化与共同实现

Element Contract MAY 表达由 children 进一步精化或共同实现的规范语义，并 SHALL 允许父子 Elements 在各自抽象层级表达相互覆盖的语义。

#### Scenario: 模块由多个组件共同实现

- **WHEN** 父 Element 承诺的功能由多个 child Elements 分别精化
- **THEN** 父 Contract 保留父层级完整承诺且 children Contracts 表达各自精化
