---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、definition-first authoring、不生成 `tasks.md` 与自检流程。
---

## ADDED Requirements

### Requirement: 仅对已授权结构 reconciliation 应用拆分指导

Snack Workflow SHALL 仅当 conversation context、Formal Semantic Model 与 implementation evidence 共同证明本次已发生实现需要新增或重组 durable hierarchy 时消费 normalized `decomposition`。拆分指导 SHALL 帮助形成目标结构，SHALL NOT 将文件、symbol、import 或 call 变化直接提升为 Element 或 containment。

#### Scenario: 已发生实现包含结构变化

- **WHEN** 授权证据明确要求新增 Element 或改变 hierarchy
- **THEN** Snack 使用配置的方法或调用配置的 skill 形成目标 sibling set
- **AND** 仍以 Formal Semantic Model 与用户意图确定 stable identity 和边界

#### Scenario: 实现移动但结构语义不变

- **WHEN** code 只发生文件移动、重命名、import 或调用重排且 durable graph facts 不变
- **THEN** Snack 不调用 decomposition skill
- **AND** Architecture Source 保持 `None`

#### Scenario: 拆分结果无法由证据授权

- **WHEN** 方法或 skill 建议的结构超出已发生实现和用户授权
- **THEN** Snack 不写入该结构
- **AND** 标记需要用户确认而不借机重排 Formal 模型

#### Scenario: custom skill 不可用

- **WHEN** 已确认需要结构 reconciliation 但配置的 skill 找不到或调用失败
- **THEN** Snack fail closed 并报告逻辑名称
- **AND** 不生成猜测性的 hierarchy Delta
