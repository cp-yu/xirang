---
entity: element-declaration
identity: visual-presentation
kind: element
parent: view-presentation
title: Visual Presentation
definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
---

## ADDED Requirements

### Requirement: 使用原生 LikeC4 布局管线

Visual Presentation SHALL 基于由官方 LikeC4 parser 与 validator 建立的 base model，让每个 Semantic Browser runtime projection 通过官方 compute-view 与 Graphviz layout 产生最终 geometry 与 Relationship routing；正常呈现 SHALL NOT 在 layout 后使用另一套固定网格或手工 spline 替换结果。

#### Scenario: 呈现 Model 与等价 Authored View

- **WHEN** Model Selection 与 Authored View Selection 形成相同可见语义集合
- **THEN** 两者使用相同 LikeC4/Graphviz 管线
- **AND** 不因 View 来源不同切换布局算法

#### Scenario: Graphviz 失败

- **WHEN** 当前 projection 无法完成 Graphviz layout
- **THEN** Browser 显示结构化错误与 retry
- **AND** 不静默回退低质量 renderer

### Requirement: 叠加差异而不覆盖业务呈现

Visual Presentation SHALL 将 Element Kind 与 Relationship Kind presentation 作为前景业务样式，并通过独立 overlay 呈现 ADDED、MODIFIED 与 REMOVED；diff state SHALL 同时使用非颜色视觉标记，SHALL NOT 仅通过覆盖业务 color、line、head、tail、shape 或 border 表达。

#### Scenario: 呈现修改的 Relationship

- **WHEN** 一个具有 Kind presentation 的 Relationship 为 MODIFIED
- **THEN** 前景 edge 保持该 Kind 的 color、line、head 与 tail
- **AND** 更宽的半透明 underlay 与状态图标表达 MODIFIED

#### Scenario: 呈现 REMOVED Element

- **WHEN** diff-capable projection 包含 REMOVED Element
- **THEN** Element 保留 before-state 业务样式并降低主体透明度
- **AND** 状态描边与图标明确表示 REMOVED

#### Scenario: 非颜色识别

- **WHEN** 用户无法依赖颜色区分 diff state
- **THEN** 状态图标、形态与 tooltip 仍可区分 ADDED、MODIFIED 与 REMOVED

### Requirement: 分离 Relationship Edges

Visual Presentation SHALL 为每个 Xirang Relationship 保留独立 visual edge，分别使用各自 identity、Kind presentation、diff state、label、arrow 与 details mapping，并 SHALL 由 Graphviz 分别 routing；A→B 与 B→A、同向不同 Kind 或同向不同 diff operation 均不得集中或合并为同一路径。

#### Scenario: 同时呈现两个方向

- **WHEN** 当前 projection 包含 A→B 与 B→A
- **THEN** 两条路径与两个方向箭头在视觉上可区分
- **AND** 任一 edge 可独立 hover、选择和打开详情

#### Scenario: 一个方向发生变化

- **WHEN** reciprocal pair 中只有一个 Relationship 携带 diff operation
- **THEN** diff overlay 只作用于该方向
- **AND** 另一方向的业务 presentation 保持不变

#### Scenario: 同向 Relationships 具有不同 Kind presentation

- **WHEN** 多个同向 Relationships 映射到相同可见 source/target 且使用不同 Kind presentation
- **THEN** 每个 Relationship 保留独立 visual edge、label 与业务 presentation
- **AND** 一个 edge 的 diff operation 不改变其他 edge


### Requirement: 在重新布局时保持视觉锚点

Graphviz 在 focus、展开或 Mode 变化后 MAY 重新排列 projection；Visual Presentation SHALL 以触发 Element 或当前 focus 作为视觉锚点，尽量保持其屏幕位置与 viewport，并以平滑过渡更新其他节点。系统 SHALL NOT 在每次交互后自动 fit 全图。

#### Scenario: 就地展开 Element

- **WHEN** 用户展开一个具有 children 的 Element并收到新 layout
- **THEN** 该 Element 尽量保持原屏幕锚点
- **AND** viewport 不被自动重置为全图

#### Scenario: 首次打开 projection

- **WHEN** 一个 projection 首次显示且没有既有视觉锚点
- **THEN** Browser MAY 执行初始 fit view

## MODIFIED Requirements

### Requirement: 视觉选择不构成规范性语义

图形布局、视觉样式与 runtime interaction state SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。持久 presentation MAY 存在于 Metamodel，作为 Element Kind 的 `nodePresentation` 或 Relationship Kind 的 `presentation` 全局默认值；它不改变 Kind 的规范语义、View composition 或 Relationship identity。Renderer SHALL 使用 LikeC4 默认值补全缺失字段，且非法值 SHALL 在 Xirang 输入校验阶段被拒绝。

#### Scenario: 调整视觉布局

- **WHEN** 同一 semantic projection 的节点位置、routing 或 viewport 发生变化
- **THEN** View Selection 与模型规范语义保持不变

#### Scenario: Kind presentation 不改变语义

- **WHEN** Element Kind 声明 `nodePresentation` 或 Relationship Kind 声明 `presentation`
- **THEN** 该 Kind 实例的职责、行为、层级与 Relationship 语义保持不变
- **AND** presentation 不参与 View Selection 决策

#### Scenario: 缺失 Relationship presentation 字段

- **WHEN** Relationship Kind 未声明 `presentation` 或只声明部分子字段
- **THEN** 缺失内容分别使用 LikeC4 默认值
