---
operation: ADDED
entity: element-declaration
identity: candidate-derived-view
kind: element
parent: derived-views
title: Candidate View
definition: Candidate-derived View 是由一个项目唯一的 active Candidate Semantic Model 确定性派生、用于在 promotion 前浏览完整但尚未确认的目标 Semantic Model 的唯一运行时 View。它独立建模，因为 Candidate 不是当前 Semantic Model 或 Change；包含 Candidate 四分区联合形成的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views，不包含相对当前 Semantic Model 的 diff、build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
---

## ADDED Requirements

### Requirement: 提供完整 Candidate 目标模型

Candidate View SHALL 从 active Candidate 的四个分区联合形成完整目标 Semantic Model，并 SHALL 以该目标模型提供层级浏览、Element details、Element Contracts 与 Relationships。

#### Scenario: 浏览有效 Candidate

- **WHEN** active Candidate 通过 deterministic validation 且用户选择 Candidate View
- **THEN** Browser SHALL 呈现 Candidate 的完整目标层级，并允许用户在同一 View identity 内进行 focus、下钻、details 与 Contract 浏览

#### Scenario: Candidate 包含正式模型没有的 Element

- **WHEN** Candidate 声明当前 Semantic Model 不存在的 Element
- **THEN** Candidate View SHALL 以 Candidate identity 将该 Element 投影到画布，并提供其可用的 Properties、Contracts 与 Diff 以外的目标态 details

### Requirement: 不混入 Candidate 差异

Candidate View SHALL 呈现 Candidate 目标态而不呈现相对当前 Semantic Model 的 ADDED、MODIFIED 或 REMOVED diff；Candidate 的差异审查 SHALL 由 Candidate Diff View 提供。

#### Scenario: 查看 Candidate 目标态

- **WHEN** 用户选择 Candidate View
- **THEN** Browser SHALL 显示 Candidate 目标模型，且 SHALL NOT 显示 Candidate Diff View 的差异标记或 diff-only 布局

### Requirement: 保持唯一 Candidate View

active Candidate 存在时 SHALL 只形成一个 identity 为 `candidate` 的 Candidate View；Element focus、导航历史与布局状态 SHALL NOT 创建其他 Candidate View identities。

#### Scenario: 在 Candidate 中连续下钻

- **WHEN** 用户在 Candidate View 中连续下钻多个 Element
- **THEN** Browser SHALL 保持 `candidate` source identity，只更新 focus、投影与导航历史

### Requirement: 保留 invalid Candidate 的只读状态

Candidate View SHALL 在 active Candidate invalid 时保留 source、`valid: false` 与 diagnostics；能解析的 Candidate architecture MAY 继续只读呈现，不能形成完整目标模型时 SHALL NOT 使用 stale Candidate snapshot。

#### Scenario: Candidate 校验失败

- **WHEN** Candidate validation 返回 ERROR
- **THEN** selector SHALL 保留 Candidate View 并显示 Invalid 与 diagnostics，且 SHALL NOT 把上一次有效 Candidate 当作当前目标
