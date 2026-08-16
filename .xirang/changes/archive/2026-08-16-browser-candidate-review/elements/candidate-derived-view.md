---
entity: element-declaration
identity: candidate-derived-view
kind: element
parent: derived-views
title: Candidate View
definition: Candidate-derived View 是由一个项目唯一的 active Candidate Semantic Model 确定性派生、用于在 promotion 前浏览完整但尚未确认的目标 Semantic Model 的唯一运行时 View。它独立建模，因为 Candidate 不是当前 Semantic Model 或 Change；包含 Candidate 四分区联合形成的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views，不包含相对当前 Semantic Model 的 diff、build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
---

## MODIFIED Requirements

### Requirement: 提供完整 Candidate 目标模型

Candidate View SHALL 从 active Candidate 的四个分区联合形成完整目标 Semantic Model，并 SHALL 以该目标模型提供层级浏览、Element details、Element Contracts 与 Relationships。Candidate View SHALL 以 Candidate 的 Project Root 作为默认 focus，由 focus Element、direct children 与已就地展开后代及当前层可表达的 Relationships 形成 runtime projection，并 SHALL 与 Model View 一致支持 focus 下钻、breadcrumb 与就地展开；完整目标层级 SHALL 经逐层浏览可达。

#### Scenario: 浏览有效 Candidate

- **WHEN** active Candidate 通过 deterministic validation 且用户选择 Candidate View
- **THEN** Browser 以 Candidate Project Root 为默认 focus，呈现其当前层（direct children 与已就地展开后代）
- **AND** 用户可在同一 View identity 内进行 focus 下钻、就地展开、details 与 Contract 浏览，完整目标层级经逐层浏览可达

#### Scenario: Candidate 包含正式模型没有的 Element

- **WHEN** Candidate 声明当前 Semantic Model 不存在的 Element
- **THEN** Candidate View SHALL 以 Candidate identity 将该 Element 投影到画布，并提供其可用的 Properties、Contracts 与 Diff 以外的目标态 details
