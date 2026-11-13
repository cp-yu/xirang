---
operation: "ADDED"
entity: "element-declaration"
identity: "zoom-level-presentation"
kind: "browser-specification"
parent: "visual-presentation"
title: "缩放分级呈现"
definition: "缩放分级呈现是 Visual Presentation 中按观察尺度调节内容密度与文字大小的呈现能力。它独立建模以维护总览和细节阅读之间的切换边界，包含节点名称与摘要、容器标题的空间适配和关系标签显隐；不决定节点布局、嵌套填充配色或语义差异操作。"
---

## ADDED Sections

### Section: Scope and Non-goals

缩放分级呈现 SHALL 负责随画布 zoom 调节节点名称、摘要、容器标题和关系标签的显示密度，保持文字在可用边界内；不改变节点身份、语义内容或布局。

### Section: Business Logic

缩放分级呈现 SHALL 根据量化后的画布 zoom 分级呈现节点文本：当基础标题的屏幕字号小于 11px 时使用总览级，仅呈现名称；达到阈值时使用详情级，呈现名称与可用摘要。总览标题 SHALL 以 14px 屏幕字号为目标，在节点形状与内边距限定的文本空间内测量并选择可容纳的字号。标题 SHALL NOT 超出节点边框。

容器标题 SHALL 随缩放趋向 13px 屏幕字号，并根据横向空间及与标题横向重叠的子节点顶部位置限制字号。关系标签 SHALL 在以 19.2px 基础标题计算的总览级隐藏，但被悬停、选中或激活的关系 SHALL 仍显示标签；关系本体和差异标记 SHALL 保持可见。

### Section: Edge Cases and Exception Handling

文字空间不足时 SHALL 以节点边界约束为准，不保证任意长度名称在任意缩放下完整可读；容器标题必要时 SHALL 以省略号截断。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 缩小查看全图

- 一个节点具有名称与摘要，基础标题的屏幕字号低于 11px
- 节点仅显示名称，字号在可用空间内尽量放大，不越过节点边框
- 空闲关系标签隐藏

#### Acceptance Case: 放大或交互查看细节

- 用户放大至详情级
- 节点显示名称与可用摘要
- 总览级悬停、选中或激活某条关系时，该关系标签仍显示

#### Acceptance Case: 极小缩放与长名称

- **GIVEN** 一个长名称在目标 14px 屏幕字号下无法容纳于节点文本空间
- **WHEN** 用户缩小画布
- **THEN** 标题按可容纳字号显示且不越出边框，不为达到目标字号而撑大节点
