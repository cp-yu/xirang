---
operation: MODIFIED
entity: element-declaration
identity: propose
kind: capability
parent: intent-first-path
title: Propose
definition: Intent-first Path 中把已确认设计及可用结构定义收成完整 Change 的阶段。
---

## ADDED Requirements

### Requirement: 处理已确认结构定义
Explore 形成了 Change Structural Definition 时，Propose SHALL 读取其完整 payload，重新检查 Semantic Model drift 与 impacts，并将其中已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries；Explore 未形成 Change Structural Definition 时，Propose SHALL 依据 Semantic Model 与已确认设计直接形成 Semantic Delta。

#### Scenario: Propose 接收 Definition Framing 输出
- **WHEN** explorationId 可解析且 relevant baseline 未漂移
- **THEN** Propose 联合结构定义与 Design Summary 形成完整 Change

#### Scenario: Explore 未形成结构定义
- **WHEN** Propose 只接收已确认设计
- **THEN** Propose 不以 Change Structural Definition 为形成完整 Change 的前提

### Requirement: 验证结构降低覆盖
Change Structural Definition 存在时，Propose SHALL 在完成前验证 Semantic Delta 对其中 ADDED、MODIFIED、REMOVED 与 no-op 目标进行了确定性完整覆盖。

#### Scenario: 一个确认目标缺少 Delta Entry
- **WHEN** baseline 与目标要求结构变化但完整 Change 未表达该变化
- **THEN** Propose 不得完成 Formation

### Requirement: 冻结结构定义来源
Change Structural Definition 存在且完整 Change validation 与 coverage 通过后，Propose SHALL 通过 `xirang framing consume` 将来源冻结为 `change-structural-definition.md` 并完成隐藏源清理。

#### Scenario: Consume 失败
- **WHEN** provenance 冲突、相关 drift 或清理前校验失败
- **THEN** Propose 保留隐藏源且不得声明 Formation 完成
