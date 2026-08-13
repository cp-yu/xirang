---
operation: MODIFIED
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、制品定义先行写作、不生成 `tasks.md` 与自检流程。
---

## REMOVED Requirements

### Requirement: Snack 使用 definition-first authoring

## ADDED Requirements

### Requirement: Snack 使用制品定义先行写作

每个 artifact 写入前，snack SHALL 读取 resolved `definition`，按内容归属判断，遵守 write policy，再执行 `instruction` 并填充 `template`。Projection、context、rules 与 reasoning MUST NOT 被复制进 artifact。

#### Scenario: Design 保持 template

- **WHEN** snack reconcile `design.md`
- **THEN** SHALL 保持 Context、Goals / Non-Goals、Decisions、Risks / Trade-offs
- **AND** inferred content SHALL 标记 `[INFERRED FROM CODE]`
