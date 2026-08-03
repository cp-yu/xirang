---
entity: element-declaration
identity: proposal-document
kind: element
parent: change-plan
title: Proposal Document
definition: Proposal Document 是 Change Plan 中说明为何发起 Change 及其范围与影响面的文档。它帮助用户审查 Change 的动机与边界，不独立定义目标语义。
---

## Requirements

### Requirement: Proposal 说明动机与范围

proposal.md SHALL 说明为何发起 Change 及其范围与影响面。

#### Scenario: 撰写 Proposal

- **WHEN** 形成 Change Plan
- **THEN** proposal.md 记录 Change 的动机、范围与影响面

#### Scenario: Proposal 不定义目标语义

- **WHEN** Change Plan 与 Semantic Delta 冲突
- **THEN** 以 Semantic Delta 为准
