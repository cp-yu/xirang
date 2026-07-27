---
entity: element-declaration
identity: semantic-delta
kind: domain
parent: change
title: "Semantic Delta"
summary: "相对于当前 Semantic Model 声明目标语义差量的规范性 Change 组成。"
---

## Requirements

### Requirement: 唯一确定目标模型
Semantic Delta SHALL 由一组 Semantic Delta Entries 构成，并与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

#### Scenario: 应用完整 Delta
- **WHEN** 同一 Change 的全部 Entries 一并应用
- **THEN** 结果是唯一的 Expected Semantic Model

### Requirement: 与 Model 同构存储
Semantic Delta SHALL 持久化于 `.xirang/changes/<change>/` 的四个模型分区，并在 Model 单元字段基础上为每个 Entry 携带 operation。

#### Scenario: 加载 Change Delta
- **WHEN** CLI 读取一个活动 Change
- **THEN** CLI 从四分区联合加载全部 Entries 而不从 Plan 推断缺失语义

### Requirement: 不污染目标状态
Delta operation 与变更历史 SHALL 只属于 Change，SHALL NOT 成为 Expected Semantic Model 或同步后 Semantic Model 的组成。

#### Scenario: 同步 Delta
- **WHEN** Semantic Delta 成功应用到正式模型
- **THEN** 结果只保留目标语义内容而不保留修改语

### Requirement: 在 Entry 粒度表达 operation
Delta 中的 Metamodel、View 与 Element Declaration Entry SHALL 在 frontmatter 携带 `operation`；Element Contract 的 Requirement Entries SHALL 通过 `## ADDED Requirements`、`## MODIFIED Requirements` 与 `## REMOVED Requirements` 分节获得修改语；Relationship entries SHALL 各自携带 operation。

#### Scenario: 仅修改 Element Contract
- **WHEN** Delta 只改变一个 Element 的 Requirements
- **THEN** Element frontmatter 只用于定位且不声明 Declaration operation

### Requirement: 支持 Element 单元内独立 Entries
一个 Element Delta 单元 SHALL 能独立表达 Declaration Entry 与零到多个 Requirement Entries；仅修改 Declaration 时正文 SHALL 为空。

#### Scenario: 同时修改声明和契约
- **WHEN** 一个 Element 的 parent 与多个 Requirements 均需改变
- **THEN** 同一单元分别以 frontmatter operation 和 Requirements 分节表达完整目标 Entries
