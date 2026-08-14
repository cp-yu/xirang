---
entity: element-declaration
identity: visual-presentation
kind: element
parent: view-presentation
title: Visual Presentation
definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
---

## MODIFIED Requirements

### Requirement: 使用原生 LikeC4 布局管线

Visual Presentation SHALL 基于由官方 LikeC4 parser 与 validator 建立的 base model，让每个 Web runtime projection 通过官方 compute-view 与 Graphviz layout 产生最终 geometry 与 Relationship routing；正常呈现 SHALL NOT 在 layout 后使用另一套固定网格或手工 spline 替换结果。

#### Scenario: 呈现 Model 与等价 Authored View

- **WHEN** Model Selection 与 Authored View Selection 形成相同可见语义集合
- **THEN** 两者使用相同 LikeC4/Graphviz 管线
- **AND** 不因 View 来源不同切换布局算法

#### Scenario: Graphviz 失败

- **WHEN** 当前 projection 无法完成 Graphviz layout
- **THEN** Browser 显示结构化错误与 retry
- **AND** 不静默回退低质量 renderer
