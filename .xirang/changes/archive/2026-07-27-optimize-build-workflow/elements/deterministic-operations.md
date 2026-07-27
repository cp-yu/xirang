---
entity: element-declaration
identity: deterministic-operations
kind: capability
parent: cli
title: "Deterministic Operations"
summary: "为查询、校验、证据与原子状态转换提供一致结果的 CLI 操作集合。"
---

## ADDED Requirements

### Requirement: 区分初始化来源与 Formal Comparison
Candidate validation SHALL 将 `candidate.yaml.baseline` 的初始化来源与当前 Formal Semantic Model 的 comparison availability 分别表达。

#### Scenario: Clean Candidate 面对现有 Formal Model
- **WHEN** Candidate 从 clean 初始化且当前 Formal Model 存在
- **THEN** validation 仍以当前 Formal Model 作为 comparison baseline

### Requirement: Formal 缺失时报告 Diff 不可用
当前 Formal Semantic Model 不存在时，Candidate validation SHALL 返回 `comparison.baseline: absent`、`comparison.diff: unavailable` 与 `reason: formal-model-absent`，SHALL NOT 构造无效空 diff 或假设空 Formal Model。

#### Scenario: 构建首个 Formal Model
- **WHEN** 有效 Candidate 没有可比较的当前 Formal Model
- **THEN** validation 仍返回 review digest 且 comparison 明确不可用

### Requirement: Formal 存在时生成 Promotion Diff
当前 Formal Semantic Model 存在且有效时，Candidate validation SHALL 返回 `comparison.baseline: formal`、`comparison.diff: available`、Formal fingerprint 与从当前 Formal 到 Candidate 的真实 semantic diff。

#### Scenario: Candidate 改变正式语义
- **WHEN** validation 比较有效 Formal Model 与 Candidate
- **THEN** diff entries 完整表达 promotion 将产生的 ADDED、MODIFIED 与 REMOVED 语义

### Requirement: Comparison 不参与 Review Digest
Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

#### Scenario: Formal 状态在 Candidate 不变时变化
- **WHEN** 相同 Candidate 针对不同 comparison availability 进行校验
- **THEN** Candidate review digest 保持不变
