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

Candidate Diff View SHALL 以当前 Semantic Model 为 before、active Candidate Semantic Model 为 after，呈现四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异。画布 SHALL 使用与 Candidate View 一致的层级折叠基线（默认根子级或 Authored View roots），并在可见节点上叠加差异视觉表达（ADDED/MODIFIED/REMOVED outline、徽标、dim）；深层差异需通过 focus 下钻与就地展开逐层查看。REMOVED ghosts SHALL 仅在其父容器可见时显示。

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 均可用且用户选择 Candidate Diff View
- **THEN** Browser 显示 Candidate target 与相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 语义差异
- **AND** 画布初始显示根子级（或 Authored View roots），差异标记叠加在可见节点上
- **AND** 用户通过 focus 下钻与就地展开逐层查看深层差异
- **AND** REMOVED ghosts 仅在其父容器可见时显示

#### Scenario: Candidate 只修改 Contract

- **WHEN** Candidate 只修改一个 Element 的 Contract
- **THEN** Candidate Diff View SHALL 保留该 Element 的目标架构上下文，并在 Element details 中呈现 Requirement 与 Scenario 的合并 before/after diff
