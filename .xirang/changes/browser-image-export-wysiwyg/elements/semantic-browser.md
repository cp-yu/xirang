---
operation: MODIFIED
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: 图片导出所见即所得

Semantic Browser SHALL 通过既有图片导出入口导出与当前屏上呈现一致的内容：PNG/JPG 导出 SHALL 包含当前 source、full/diff 显示模式、当前 focus Element、direct children 与已就地展开 Element 的后代；导出 SHALL NOT 新增或移除导出入口与格式选项，且在没有可用前置呈现状态时回退到既有默认导出行为。

#### Scenario: 导出聚焦且就地展开的 Model View

- **WHEN** 用户在 Model View 下钻到具有 children 的 Element 并就地展开部分后代后导出 PNG 或 JPG
- **THEN** 导出图片包含当前 focus Element、其 direct children 与已就地展开的后代
- **AND** 导出图片的节点集合与用户导出前屏上呈现的节点集合一致

#### Scenario: 导出 Change-derived View 的 diff 呈现

- **WHEN** 用户在 Change-derived View 以 diff 模式查看并导出 PNG 或 JPG
- **THEN** 导出图片呈现该 Change 的目标模型与 diff 显示内容，与屏上呈现一致

#### Scenario: 导出页直接打开且无前置呈现状态

- **WHEN** 用户直接打开导出页 URL 且不存在由交互视图写入的导出快照
- **THEN** 导出行为回退到既有默认行为，不产生错误且不导出意外内容
