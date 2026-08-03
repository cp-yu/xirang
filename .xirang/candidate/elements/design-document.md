---
entity: element-declaration
identity: design-document
kind: element
parent: change-plan
title: Design Document
definition: Design Document 是 Change Plan 中记录关键决策、理由与实现策略的文档。它帮助用户审查 Change 的实现路径，不独立定义目标语义。
---

## Requirements

### Requirement: Design 记录决策与策略

design.md SHALL 记录关键决策、理由与实现策略。

#### Scenario: 撰写 Design

- **WHEN** 形成 Change Plan
- **THEN** design.md 记录关键决策、理由与实现策略

#### Scenario: Design 不定义目标语义

- **WHEN** Change Plan 与 Semantic Delta 冲突
- **THEN** 以 Semantic Delta 为准
