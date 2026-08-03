---
entity: element-declaration
identity: tasks-document
kind: element
parent: change-plan
title: Tasks Document
definition: Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。
---

## Requirements

### Requirement: Tasks 安排执行与验证

tasks.md SHALL 安排执行步骤与验证检查。

#### Scenario: 撰写 Tasks

- **WHEN** 形成 Change Plan
- **THEN** tasks.md 安排执行步骤与验证检查

#### Scenario: Tasks 不定义目标语义

- **WHEN** Change Plan 与 Semantic Delta 冲突
- **THEN** 以 Semantic Delta 为准
