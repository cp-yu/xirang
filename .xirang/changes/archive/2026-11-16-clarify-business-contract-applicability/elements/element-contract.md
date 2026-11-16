---
entity: element-declaration
identity: element-contract
kind: element
parent: hierarchical-elements
title: Element Contract
definition: Element Contract 定义 Element 在一个确定模型状态中、其自身抽象层级上的完整规范性语义。它以该模型状态自身为视角，描述 Element 承担的职责、提供的保证、遵循的约束与表现的行为，只包含在该状态下成立的语义，不包含相对于其他模型状态的变更叙述。
---

## MODIFIED Sections

### Section: 完整表达自身抽象层级语义

Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、提供的保证、遵循的约束与表现的行为；属于 business-specification Contract 时 SHALL 以业务规格内容标准要求的容器承载各类细节，使规范细节不因表达简略而丢失。通用概念与组织性 Contract 不因具有 Contract 而强制适用 4+N；Root 的层级位置不决定格式适用性。

#### Acceptance Case: 独立判断 Element 承诺

- **WHEN** 用户或 Agent 读取一个 Element Contract
- **THEN** 无需读取 children Contracts 即可理解并判断该 Element 在当前层级的规范承诺

#### Acceptance Case: 细节缺失在读取时可见

- **WHEN** business-specification Contract 未表达业务目标、范围边界、边界值与异常防御或适用的 +N 大点
- **THEN** 读取者可从缺失的容器直接识别未撰写内容
