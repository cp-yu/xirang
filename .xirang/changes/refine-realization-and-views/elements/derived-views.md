---
operation: MODIFIED
entity: element-declaration
identity: derived-views
kind: domain
parent: view-composition
title: Derived Views
summary: 由模型或 Change 确定性推导、无需持久化的 Views。
---

## MODIFIED Requirements

### Requirement: 不持久化

Derived View SHALL NOT 持久化为 Semantic Model 或 Change 的 durable artifact；系统 MAY 生成不构成规范性语义且可从当前输入重建的运行时表示或缓存。

#### Scenario: 保存模型或 Change

- **WHEN** 系统持久化 Semantic Model 或 active Change
- **THEN** 持久化内容不包含 Derived View artifact

#### Scenario: 生成可重建运行表示

- **WHEN** Semantic Browser 需要呈现 Derived View
- **THEN** 系统可生成临时 manifest 或缓存且其缺失不影响规范性语义
