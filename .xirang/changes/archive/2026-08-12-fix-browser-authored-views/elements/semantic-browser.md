---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## MODIFIED Requirements

### Requirement: 保持 Authored View 声明视角

Authored View SHALL 以持久化 `include`、`exclude` 与可选 `of` 确定 View Selection 边界，并 SHALL 在该边界内支持与 Model 相同的 focus、下钻、breadcrumb 与就地展开；这些 runtime 状态 SHALL NOT 修改 View Definition。

#### Scenario: 浏览 Authored View 子树

- **WHEN** 用户在 Authored View 中 focus 或展开具有 children 的 Element
- **THEN** Browser 只显露该 View 选择闭包内且未被 `exclude` 剪除的 descendants
- **AND** Authored View 文件保持不变

#### Scenario: 切换后呈现声明边界内内容

- **WHEN** 用户从 Model View 切换到 Authored View
- **THEN** 投影只呈现该 View 选择闭包内的 Elements，边界外 Elements 不呈现
- **AND** 初始 focus 为该 View 的根 Element，不引用 View 外 Element

#### Scenario: 在 Authored View 内就地展开

- **WHEN** 用户在 Authored View 内就地展开选择闭包内的 Element
- **THEN** Browser 以与 Model View 一致的方式呈现其 children

#### Scenario: 在 Authored View 内显示 focus breadcrumb

- **WHEN** 用户在 Authored View 内下钻到闭包内 Element
- **THEN** focus breadcrumb 以该 View 根为起点呈现路径
- **AND** 路径在该 View 边界处截断，不包含 View 外祖先

### Requirement: 聚合当前层 Relationships

Semantic Browser SHALL 将每个深层 Relationship 的 endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 visual edge。每个 source Relationship SHALL 保留独立 edge identity、routing、Kind presentation、diff state 与详情三元组，即使多个 Relationships 具有相同可见 source/target；系统 SHALL NOT 合并同向不同 Kinds、同向不同 diff states 或 A→B 与 B→A。

#### Scenario: 展开后 endpoint 下移

- **WHEN** 一个 Relationship endpoint 的 ancestor 被就地展开且该 endpoint 随之可见
- **THEN** edge 连接该 endpoint 本身而不再连接其 ancestor container

#### Scenario: 存在 reciprocal Relationships

- **WHEN** source 同时包含 A→B 与 B→A
- **THEN** Graphviz 为两个方向产生可视觉区分的独立 edges 与箭头
- **AND** 任一 edge 可独立选择并打开对应详情

#### Scenario: 同向 Relationships 具有不同 Kinds

- **WHEN** 多个 Relationships 映射到相同可见 source/target，但使用不同 Kind presentation
- **THEN** 每个 Relationship 保留独立 visual edge、label 与 presentation
- **AND** 任一 Relationship 的 diff operation 只作用于自身 edge

#### Scenario: 查看投影边的关系详情

- **WHEN** 用户悬停投影视图中的关系边
- **THEN** 关系详情按 Xirang 关系三元组（`source|kind|target`）与 relationship-kind 语义呈现
- **AND** 呈现不依赖 LikeC4 relation id 在浏览器模型中的查找
