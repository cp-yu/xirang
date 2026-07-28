---
entity: element-declaration
identity: snack
kind: capability
parent: implementation-first-path
title: Snack
definition: 依据已有实现证据调和 Semantic Model 与完整 Change。
---

## ADDED Requirements

### Requirement: 仅从充分证据调和 Definition
Snack SHALL 只有在已确认用户意图与实现证据足以确定稳定概念身份和边界时才创建或修改 Element Definition；文件名、类名、符号、调用关系或实现移动 SHALL NOT 单独证明 Declaration 变化。

#### Scenario: 代码结构不足以确定概念边界
- **WHEN** 多个 Definition 均与当前实现证据相容
- **THEN** Snack 标记未决内容并等待用户确认，不从代码结构自动生成 Definition

#### Scenario: 实现重构不改变概念
- **WHEN** 已发生修改只移动代码或重命名实现符号且 Element 概念边界不变
- **THEN** Snack 不产生 Declaration Delta
