---
entity: element-declaration
identity: candidate
kind: element
parent: semantic-model-build
title: Candidate
definition: Candidate 是 Semantic Model Build 中由 Agent 编写的完整 Candidate Semantic Model。它以统一形式表达目标模型（Architecture 与 Element Contracts 一体），经 CLI 只读确定性校验给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model。
---

## Requirements

### Requirement: Candidate 统一表达目标模型

Candidate SHALL 以统一形式表达目标 Semantic Model：Architecture 与 Element Contracts 一体编写。

#### Scenario: Candidate 校验

- **WHEN** 用户确认 Candidate 版本
- **THEN** CLI 对 Candidate 做只读确定性校验并给出 review digest

#### Scenario: Candidate 原子提升

- **WHEN** 用户确认该版本
- **THEN** CLI 将 Candidate 原子提升为 Semantic Model
- **AND** 保留必要 history

#### Scenario: 临时 scaffolding 不定义 durable 语义

- **WHEN** Candidate 过程中存在临时 scaffolding（如 build.md）
- **THEN** 该 scaffolding 不定义 durable 语义
