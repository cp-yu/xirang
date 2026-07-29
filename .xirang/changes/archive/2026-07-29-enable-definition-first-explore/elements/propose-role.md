---
operation: MODIFIED
entity: element-declaration
identity: propose-role
kind: capability
parent: agent
title: Propose Role
definition: 依据已确认设计与可用结构定义编译完整 Change 的 Agent 工作身份。
---

## ADDED Requirements

### Requirement: 编排结构定义消费
Explore 形成了 Change Structural Definition 时，Propose Role SHALL 在完整 Change 通过 validation 与 structural coverage 后调用 `xirang framing consume`，并仅在 provenance 冻结与源 lifecycle 成功时交付 Change Formation 结果；Explore 未形成 Change Structural Definition 时，SHALL 直接按既有 Propose 路径交付完整 Change。

#### Scenario: 带结构定义的完整 Change 已生成
- **WHEN** validation 没有 ERROR 且 Change Structural Definition coverage 完整
- **THEN** Agent 消费对应 exploration identity 并确认 frozen path

#### Scenario: Explore 未形成结构定义
- **WHEN** 完整 Change 仅由 Semantic Model 与已确认设计形成
- **THEN** Agent 不调用 framing consume
