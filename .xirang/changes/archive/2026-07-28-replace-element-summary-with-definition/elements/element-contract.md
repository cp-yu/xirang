---
entity: element-declaration
identity: element-contract
kind: capability
parent: hierarchical-elements
title: Element Contract
definition: Element 在一个确定模型状态中、其自身抽象层级上的完整规范性职责、保证、约束与行为。
---

## MODIFIED Requirements

### Requirement: 使用规范 Contract 结构
Element Contract 正文 SHALL 仅包含 `## Requirements`，其下以有序 `### Requirement` 与 `#### Scenario` 表达规范性语义；Element 的完整描述性概念语义 SHALL 由 Declaration Definition 承载。

#### Scenario: 校验 Contract 单元
- **WHEN** 正文包含 Requirements 之外的内容
- **THEN** CLI 报告验证错误
