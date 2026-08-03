---
operation: ADDED
entity: element-declaration
identity: candidate-diff-derived-view
kind: element
parent: derived-views
title: Candidate Diff View
definition: Candidate Diff View 是由当前 Semantic Model 与一个项目唯一的 active Candidate Semantic Model 确定性派生、专门用于审查 Candidate 相对当前 Semantic Model 语义差异的唯一运行时 View。它独立建模以将完整 Candidate 浏览与 before/after 比较分离；包含四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异及理解这些差异所需的模型上下文，不包含 build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
---

## ADDED Requirements

### Requirement: 呈现 Candidate 语义差异

Candidate Diff View SHALL 以当前 Semantic Model 为 before、active Candidate Semantic Model 为 after，呈现四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异。

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 均可用且用户选择 Candidate Diff View
- **THEN** Browser SHALL 显示 Candidate target 与其相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 语义差异

#### Scenario: Candidate 只修改 Contract

- **WHEN** Candidate 只修改一个 Element 的 Contract
- **THEN** Candidate Diff View SHALL 保留该 Element 的目标架构上下文，并在 Element details 中呈现 Requirement 与 Scenario 的合并 before/after diff

### Requirement: 固定 diff-only 呈现

Candidate Diff View SHALL 固定使用 diff-only 画布与 diff details，不提供将该 View 切换为 Candidate View 完整上下文的 Full context 模式。

#### Scenario: 选择 Candidate Diff View

- **WHEN** 用户选择 Candidate Diff View
- **THEN** Browser SHALL 直接进入 diff-only 呈现，且 Candidate View 仍作为独立 source 提供完整目标态浏览

### Requirement: 保持唯一 Candidate Diff View

active Candidate 与当前 Semantic Model 可用于比较时 SHALL 只形成一个 identity 为 `candidate-diff` 的 Candidate Diff View；Element focus 变化 SHALL NOT 创建其他 View identities。

#### Scenario: 在 Candidate diff 中连续下钻

- **WHEN** 用户在 Candidate Diff View 中查看多个 changed Elements
- **THEN** Browser SHALL 保持 `candidate-diff` source identity，只更新 focus、diff 投影与导航历史

### Requirement: 共享 Candidate target 与刷新状态

Candidate Diff View SHALL 与 Candidate View 使用同一 Candidate validation snapshot、target architecture、Contract projection 和 source revision；Candidate 或 Semantic Model 变化后 SHALL 重新计算比较结果。

#### Scenario: Candidate 内容发生变化

- **WHEN** `.xirang/candidate/` 或 `.xirang/model/` 的语义内容发生变化
- **THEN** Candidate Diff View SHALL 从最新 source 重新生成 target、diff、Contracts 与 diagnostics，且 SHALL NOT 保留旧 source 内容
