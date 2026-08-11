---
entity: element-declaration
identity: visual-presentation
kind: element
parent: view-presentation
title: Visual Presentation
definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
---

## ADDED Requirements

### Requirement: 跳过 Compound Projection 的 disconnected-node chaining 预处理

Visual Presentation SHALL 在官方 Graphviz layout 之前，对包含 compound endpoint edges 的 Element View projection 跳过 `unflatten` 的 disconnected-node chaining 预处理，直接使用 LikeC4 printer 生成的原始 DOT 进入 Graphviz layout；对不包含 compound endpoint edges 的 Element View projection，SHALL 保留既有 `unflatten` 预处理。判定 SHALL 基于 layout 前已建立的 compound endpoint 拓扑，不依赖 View 来源、focus、expanded set 或 Presentation Mode。

#### Scenario: 呈现 Compound Projection

- **WHEN** 当前 Element View projection 至少一条 visual edge 的 source 或 target endpoint 是 compound container
- **THEN** 布局前 SHALL NOT 执行 `unflatten`
- **AND** 该 projection 的原始 DOT 直接进入 Graphviz layout

#### Scenario: 呈现非 Compound Projection

- **WHEN** 当前 Element View projection 不含 compound endpoint edges
- **THEN** 布局前 SHALL 执行既有 `unflatten` 预处理
- **AND** 布局行为与预处理加入前保持一致

#### Scenario: Compound 存在但 edges 均为 leaf-to-leaf

- **WHEN** 视图包含 compound nodes，但所有 visual edges 的 endpoints 均不是 compound
- **THEN** 布局前 SHALL 执行既有 `unflatten` 预处理
- **AND** 判定依据为 edge endpoints 而非视图是否包含 compound nodes
