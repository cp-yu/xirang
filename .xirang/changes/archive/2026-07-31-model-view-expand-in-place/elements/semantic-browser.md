---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
---

## MODIFIED Requirements

### Requirement: 支持分层语义浏览

Semantic Browser SHALL 使用 Model View 或 Change-derived View 在单一 View identity 内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；初始 focus SHALL 为 Project Root，当前层 SHALL 包含 focus Element、direct children、已就地展开 Element 的后代与可映射到不同可见 endpoints 的 Relationships。

#### Scenario: 下钻 Element

- **WHEN** 用户进入一个具有 children 的 Element
- **THEN** Browser 保持当前 View identity，更新 focus、当前层布局、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context 且不创建空 View

### Requirement: 聚合当前层 Relationships

Semantic Browser SHALL 将深层 Relationship endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 edge，同一可见 endpoints 的 edge 标签 SHALL 按 UTF-8 byte order 显示去重后的全部 Relationship Kind identities，详情 SHALL 保留原始三元组。

#### Scenario: 展开后 endpoint 下移

- **WHEN** 一个 Relationship endpoint 的祖先被就地展开而该 endpoint 随之可见
- **THEN** edge 连接该 endpoint 本身而不再连接其祖先容器

### Requirement: 呈现 Perspective Elements

Semantic Browser SHALL 只对 Kind 为 `perspective` 的可见 Elements 使用 `document` shape 与基于 identity 确定性分配的不同无障碍颜色；该 shape SHALL 将全部装饰限制在节点边界内；普通 descendants SHALL 保持自身 Kind 样式，且这些样式 SHALL NOT 写入 Semantic Model 或 Semantic Delta。

#### Scenario: 区分同层 Perspectives

- **WHEN** 当前层包含多个 Kind 为 `perspective` 的 Elements
- **THEN** 每个 Perspective 使用 `document` shape 与由 identity 确定的互不相同的无障碍颜色
