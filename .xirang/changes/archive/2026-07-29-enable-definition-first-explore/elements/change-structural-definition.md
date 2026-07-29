---
operation: ADDED
entity: element-declaration
identity: change-structural-definition
kind: domain
parent: definition-framing
title: Change Structural Definition
definition: Definition Framing 在 Propose 前持久化的、用户已确认的当前完整结构目标。
---

## ADDED Requirements

### Requirement: 保存完整当前结构目标
Change Structural Definition SHALL 在一个文件中联合保存 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 的当前完整确认目标，并 MAY 保存非规范性的 hierarchy preview。

#### Scenario: 同一 framing 同时新增 Kind 与 Element
- **WHEN** 用户通过明确的持久化确认授权完整 payload
- **THEN** 四类结构内容作为同一当前状态被保存

### Requirement: 区分目标态与删除
无 operation 的条目 SHALL 表达完整目标态，删除 SHALL 仅使用 `operation: REMOVED`；Change Structural Definition SHALL NOT 携带显式 `ADDED` 或 `MODIFIED`。

#### Scenario: 替换 Relationship triple
- **WHEN** 用户确认移除旧 triple 并加入新 triple
- **THEN** 旧 triple 使用 REMOVED 且新 triple 使用无 operation 的完整目标态

### Requirement: 保持稳定身份与最新状态
Change Structural Definition SHALL 使用不可变 `explorationId` 与可变 slug，并 SHALL 只保留最新确认 payload，不保存 revision history、开放问题或 readiness 状态。

#### Scenario: 已确认结构被修订
- **WHEN** 用户通过新的明确持久化确认更新完整 payload
- **THEN** 文件替换为最新目标且 explorationId 保持不变

### Requirement: 保存相关 Semantic Model 基准快照
Change Structural Definition SHALL 保存 CLI 计算的 Semantic Model fingerprint 与 normalized relevant context，并区分当前对象或依赖在捕获时存在或不存在。

#### Scenario: Semantic Model 全局变化
- **WHEN** 当前 fingerprint 不同于保存值
- **THEN** CLI 比较 relevant normalized context 并报告 unrelated 或 relevant drift

### Requirement: 仅作为形成来源与历史记录
Change Structural Definition SHALL 在 Propose 编译前作为已确认结构来源；编译为相应 Semantic Delta Entries 后，冻结副本 SHALL 只记录形成历史，SHALL NOT 参与后续语义解析、validation、sync 或 Change Closure。

#### Scenario: Propose 完成结构编译
- **WHEN** 完整 Change 通过 validation 与 coverage
- **THEN** 原文件冻结为 `change-structural-definition.md` 且 Semantic Delta 仍是目标语义唯一依据
