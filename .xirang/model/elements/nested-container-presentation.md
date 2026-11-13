---
entity: element-declaration
identity: nested-container-presentation
kind: browser-specification
parent: visual-presentation
title: 嵌套容器呈现
definition: 嵌套容器呈现是 Visual Presentation 中维持层级容器文字与背景可辨识度的呈现能力。它独立建模以约束多层填充叠加和主题下的标题对比，包含容器填充透明度、边框保持及标题视觉样式；不决定缩放分级、节点 geometry 或差异操作颜色。
---

## Specification

### Section: Scope and Non-goals

嵌套容器呈现 SHALL 负责透明填充容器的标题对比和层级填充上限，不修改节点位置、子节点边界或语义层级。

### Section: Business Logic

嵌套容器呈现 SHALL 使透明填充容器的标题具有随明暗主题变化的高对比度文字、粗体及反向辉光。对具有填充透明度的容器，系统 SHALL 按从根开始的嵌套层级将填充不透明度分别限制为 20%、14%、10%、7%、5%，第五层及更深层保持 5% 上限。该限制 SHALL 只作用于填充，不改变容器边框不透明度。

### Section: Edge Cases and Exception Handling

显式填充不透明度低于对应层级上限时 SHALL 保持原值，不因上限较高而增大填充。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 深层嵌套容器

- 多层容器在同一位置叠加，原有填充不透明度均高于对应上限
- 各层填充按层级上限呈现，边框保持原有不透明度
- 透明填充容器标题在浅色和深色主题中均具有相应的高对比度文字

#### Acceptance Case: 保留较低的填充值

- **GIVEN** 第一层容器填充不透明度为 10%，深层容器填充不透明度为 30%
- **WHEN** 深层容器位于第五层或更深层
- **THEN** 第一层保持 10%，深层限制为 5%，边框不透明度保持原值
