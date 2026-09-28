---
entity: element-declaration
identity: element-contract
kind: element
parent: hierarchical-elements
title: Element Contract
definition: Element Contract 定义 Element 在一个确定模型状态中、其自身抽象层级上的完整规范性语义。它以该模型状态自身为视角，描述 Element 承担的职责、提供的保证、遵循的约束与表现的行为，只包含在该状态下成立的语义，不包含相对于其他模型状态的变更叙述。
---

## Specification

### Section: 只表达当前模型状态

Element Contract SHALL 只包含当前模型状态下成立的规范性语义，SHALL NOT 保留新增、修改、删除或历史过程叙述。

#### Acceptance Case: 移除一项语义

- **WHEN** 某项规范性语义不再属于目标状态
- **THEN** 更新后的 Contract 不再包含该项语义

### Section: 使用规范 Contract 结构

Element Contract 正文 SHALL 仅包含 `## Specification`，其下以 `### Section:` 与可选的 `#### Acceptance Case:` 表达规范性语义；Element 的完整描述性概念语义 SHALL 由 Declaration Definition 承载。Section 正文内部 SHALL NOT 受载体、结构或子标题形式限制。

#### Acceptance Case: 校验 Contract 单元

- **WHEN** 正文包含 Specification 之外的结构内容
- **THEN** CLI 报告验证错误

### Section: 稳定寻址 Section

Section identity SHALL 由宿主 Element identity 与 Section 标题共同确定；Element 内 SHALL 使用标题，跨模型全局寻址 SHALL 使用 `<element identity>#<title>`。

#### Acceptance Case: Delta 修改 Section

- **WHEN** Semantic Delta 作用于一个 Contract Section
- **THEN** 宿主 Element 与 Section 标题唯一定位目标条目

### Section: 完整表达自身抽象层级语义

Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、提供的保证、遵循的约束与表现的行为，并 SHALL 以业务规格内容标准要求的容器承载各类细节，使规范细节不因表达简略而丢失。

#### Acceptance Case: 独立判断 Element 承诺

- **WHEN** 用户或 Agent 读取一个 Element Contract
- **THEN** 无需读取 children Contracts 即可理解并判断该 Element 在当前层级的规范承诺

#### Acceptance Case: 细节缺失在读取时可见

- **WHEN** Contract 未表达业务目标、范围边界、边界值与异常防御或适用的 +N 大点
- **THEN** 读取者可从缺失的容器直接识别未撰写内容

### Section: 允许 Children 精化与共同实现

Element Contract MAY 表达由 children 进一步精化或共同实现的规范语义，并 SHALL 允许父子 Elements 在各自抽象层级表达相互覆盖的语义。

#### Acceptance Case: 模块由多个组件共同实现

- **WHEN** 父 Element 承诺的功能由多个 child Elements 分别精化
- **THEN** 父 Contract 保留父层级完整承诺且 children Contracts 表达各自精化
