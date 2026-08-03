---
entity: element-declaration
identity: visual-presentation
kind: element
parent: view-presentation
title: Visual Presentation
definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
---

## Requirements

### Requirement: 以视觉形式传达 View

Visual Presentation SHALL 通过图形元素、空间组织与视觉编码向用户传达 View 所组织的语义信息，并 MAY 提供选择、导航和下钻交互。

#### Scenario: 浏览层级结构

- **WHEN** 用户通过 Visual Presentation 查看一个层级 View
- **THEN** 用户可观察整体结构并导航到局部语义

### Requirement: 视觉选择不构成规范性语义

图形布局、视觉样式与交互状态 SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。

#### Scenario: 调整视觉布局

- **WHEN** 同一 View 的节点位置、颜色或交互状态发生变化
- **THEN** View 的呈现视角与规范性依据保持不变
