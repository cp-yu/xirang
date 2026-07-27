---
entity: element-declaration
identity: semantic-delta-entry
kind: capability
parent: semantic-delta
title: "Semantic Delta Entry"
summary: "以修改语、entity type 与稳定 identity 为单位的目标语义声明。"
---

## MODIFIED Requirements

### Requirement: 以实体粒度作用
Entry SHALL 作用于 Element Declaration、Requirement、Relationship、Element Kind、Relationship Kind 或 Authored View；同一 entity type 与 identity 在一个 Delta 中 SHALL NOT 存在冲突操作。

#### Scenario: 检测冲突操作
- **WHEN** 同一实体在一个 Delta 中出现互相冲突的 Entries
- **THEN** CLI 拒绝该 Delta

## ADDED Requirements

### Requirement: 将 Scenario 变化归入 Requirement
Scenario 的新增、修改或移除 SHALL 由宿主 Requirement Entry 的完整目标内容表达。

#### Scenario: 修改 Requirement 的条件行为
- **WHEN** Change 改变一个 Requirement 的 Scenarios
- **THEN** Delta 使用 MODIFIED Requirement 而不创建 Scenario Entry
