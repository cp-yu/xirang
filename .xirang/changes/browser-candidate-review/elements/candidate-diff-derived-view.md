---
entity: element-declaration
identity: candidate-diff-derived-view
kind: element
parent: derived-views
title: Candidate Diff View
definition: Candidate Diff View 是由当前 Semantic Model 与一个项目唯一的 active Candidate Semantic Model 确定性派生、专门用于审查 Candidate 相对当前 Semantic Model 语义差异的唯一运行时 View。它独立建模以将完整 Candidate 浏览与 before/after 比较分离；包含四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异及理解这些差异所需的模型上下文，不包含 build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
---

## MODIFIED Requirements

### Requirement: 呈现 Candidate 语义差异

Candidate Diff View SHALL 以当前 Semantic Model 为 before、active Candidate Semantic Model 为 after，呈现四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异。diff-only 画布 SHALL 仅投影 changed Elements、其必要 ancestors、changed Relationships 的 endpoints 与 removed ghosts；存在 focus 时 SHALL 在该 focus 的子树内收窄该集合，并 SHALL 支持与 Candidate View 一致的 focus 下钻与就地展开。

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 均可用且用户选择 Candidate Diff View
- **THEN** Browser 显示 Candidate target 与相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 语义差异
- **AND** 画布仅投影 changed Elements、必要 ancestors、changed Relationship endpoints 与 removed ghosts
- **AND** 用户可在该可见集合内继续下钻与就地展开

#### Scenario: Candidate 只修改 Contract

- **WHEN** Candidate 只修改一个 Element 的 Contract
- **THEN** Candidate Diff View SHALL 保留该 Element 的目标架构上下文，并在 Element details 中呈现 Requirement 与 Scenario 的合并 before/after diff
