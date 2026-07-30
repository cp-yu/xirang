---
operation: MODIFIED
entity: element-declaration
identity: change-derived-views
kind: capability
parent: derived-views
title: Change-derived Views
definition: 由当前 Semantic Model 与一个活动 Change 的 Semantic Delta 确定性推导、用于呈现目标模型及语义差异的 View。它按 Change 独立建模以支持对一次演进意图的理解与审查；包含目标模型的层级浏览和 diff，不包含当前 Semantic Model 的默认浏览或 Authored View 视角。
---

## ADDED Requirements

### Requirement: 每个活动 Change 形成唯一 View

每个活动 Change SHALL 只形成一个 Change-derived View，其 identity SHALL 在该 Change 存续期间稳定，且 Element focus 变化 SHALL NOT 创建其他 Views。

#### Scenario: 浏览 Change 中的不同层级

- **WHEN** 用户在同一活动 Change 中连续下钻多个 Elements
- **THEN** Browser 保持同一 Change-derived View identity 并只更新 focus 与导航历史

### Requirement: 支持目标模型层级下钻

Change-derived View SHALL 以目标模型的 Project Root 作为初始 focus，并 SHALL 使用与 Model View 相同的 focus projection、breadcrumb、前进后退与 leaf details 行为，同时保留 Semantic Delta 的差异编码。

#### Scenario: 下钻已修改子树

- **WHEN** 用户从 Change-derived View 进入目标模型中具有 children 的 Element
- **THEN** Browser 在同一 View 内显示新的当前层投影并继续区分 ADDED、MODIFIED 与 REMOVED 语义
