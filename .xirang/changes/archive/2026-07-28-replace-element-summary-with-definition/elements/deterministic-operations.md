---
entity: element-declaration
identity: deterministic-operations
kind: capability
parent: cli
title: Deterministic Operations
definition: 为查询、校验、证据与原子状态转换提供一致结果的 CLI 操作集合。
---

## ADDED Requirements

### Requirement: 完整处理 Element Definition
Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。

#### Scenario: 查询和搜索 Element
- **WHEN** Agent 通过 CLI query、search 或 impact 操作读取一个 Element
- **THEN** text 与 JSON 结果均返回完整 `definition`，search evidence 使用 `definition` 字段

#### Scenario: 比较和同步 Definition 变化
- **WHEN** ADDED 或 MODIFIED Declaration 携带完整目标 Definition
- **THEN** diff、fingerprint、Candidate validation 与 Sync 均以该完整文本确定目标语义

### Requirement: 拒绝 Legacy Declaration Summary
Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

#### Scenario: Parser 遇到 Legacy Summary
- **WHEN** 当前输入的 `element-declaration` 包含 `summary`
- **THEN** 加载失败并指出应迁移为 `definition`
