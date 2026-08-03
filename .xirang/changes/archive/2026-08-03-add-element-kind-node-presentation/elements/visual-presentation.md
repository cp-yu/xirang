---
operation: MODIFIED
entity: element-declaration
identity: visual-presentation
kind: element
parent: view-presentation
title: Visual Presentation
definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
---

## MODIFIED Requirements

### Requirement: 视觉选择不构成规范性语义

图形布局、视觉样式与运行时交互状态 SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。持久呈现配置可存在于 Metamodel 中作为 Element Kind 的全局节点呈现默认值，不改变该 Kind 的规范语义；Renderer 不支持某个值时可以确定性降级，但不得改变 View composition 或模型语义。

#### Scenario: 调整视觉布局

- **WHEN** 同一 View 的节点位置、颜色或交互状态发生变化
- **THEN** View 的呈现视角与规范性依据保持不变

#### Scenario: 持久呈现配置不改变 Kind 语义

- **WHEN** Element Kind 声明 `nodePresentation` 并持久化于 Metamodel
- **THEN** 该 Kind 的 Element 职责、行为、层级与 Relationship 语义保持不变
- **AND** 视觉配置不参与 View composition 决策