---
entity: element-declaration
identity: definition-framing-operations
kind: element
parent: deterministic-operations
title: Definition Framing Operations
definition: Definition Framing Operations 是 CLI 中管理 Change Structural Definition 的确定性操作集合。它通过 `xirang framing` commands 管理 Change Structural Definition 的持久化、查询、校验和生命周期转换，并根据其中记录的 Semantic Model 基准快照识别相关结构是否发生变化。
---

## ADDED Requirements

### Requirement: 返回全量替换的相对变化

`framing update` SHALL 返回相对上一 payload 的标准三段式 diff（added / modified / removed），按 elementKinds、relationshipKinds、elements、relationships 四分区组织；elements 与 Kinds 以 identity 为键、relationships 以 source/kind/target 三元组为键；added 列目标键，modified 携带目标在旧 payload 与新 payload 中的完整前后内容（before / after），removed 携带被移除目标的完整旧条目内容；显式 `operation: REMOVED` 的目标归入 removed；update 的 JSON status 保持 ok 且不阻塞删除。

#### Scenario: 省略目标出现在 removed

- **WHEN** 新 payload 省略了旧 payload 中存在的目标
- **THEN** diff 的 removed 包含该目标及其完整旧条目内容

#### Scenario: 显式删除归入 removed

- **WHEN** 新 payload 以 `operation: REMOVED` 声明目标
- **THEN** diff 的 removed 包含该目标

#### Scenario: 内容变化归入 modified

- **WHEN** 目标在新旧 payload 均存在但 normalized 内容不同
- **THEN** diff 的 modified 包含该目标的 before 与 after 完整内容

#### Scenario: 新增目标归入 added

- **WHEN** 新 payload 引入旧 payload 没有的目标
- **THEN** diff 的 added 包含该目标
