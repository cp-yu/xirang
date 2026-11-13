---
operation: "MODIFIED"
entity: "element-declaration"
identity: "visual-presentation"
kind: "browser-specification"
parent: "view-presentation"
title: "Visual Presentation"
definition: "Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。"
---

## ADDED Sections

### Section: Scope and Non-goals

Visual Presentation SHALL 通过图形元素、空间组织与视觉编码传达 View 的语义信息，并 MAY 提供选择、导航和下钻交互；负责布局与关系呈现、尺度相关可读性和嵌套对比，不改变 View composition 或模型规范性语义。

### Section: Business Logic

Visual Presentation SHALL 通过以下规则保持原生布局、业务样式、关系身份与运行时可读性。

#### 视觉选择不构成规范性语义

图形布局、视觉样式与 runtime interaction state SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。持久 presentation MAY 存在于 Metamodel，作为 Element Kind 的 `nodePresentation` 或 Relationship Kind 的 `presentation` 全局默认值；它不改变 Kind 的规范语义、View composition 或 Relationship identity。Renderer SHALL 使用 LikeC4 默认值补全缺失字段，且非法值 SHALL 在 Xirang 输入校验阶段被拒绝。

#### 原生布局管线

Visual Presentation SHALL 基于由官方 LikeC4 parser 与 validator 建立的 base model，让每个 Web runtime projection 通过官方 compute-view 与 Graphviz layout 产生最终 geometry 与 Relationship routing；正常呈现 SHALL NOT 在 layout 后使用另一套固定网格或手工 spline 替换结果。

#### 叠加差异而不覆盖业务呈现

Visual Presentation SHALL 将 Element Kind 与 Relationship Kind presentation 作为前景业务样式，并通过独立 overlay 呈现 ADDED、MODIFIED 与 REMOVED；diff state SHALL 同时使用非颜色视觉标记，SHALL NOT 仅通过覆盖业务 color、line、head、tail、shape 或 border 表达。

#### 分离 Relationship Edges

Visual Presentation SHALL 为每个 Xirang Relationship 保留独立 visual edge，分别使用各自 identity、Kind presentation、diff state、label、arrow 与 details mapping。布局前，映射到相同可见 endpoints 的同向 Relationships 聚合为单条携带全部 relation identities 的官方 Graphviz edge 以复用 geometry，避免平行关系数导致的布局/内存爆炸；布局后，Xirang 依据聚合 edge 携带的 identities 恢复独立 visual edges，并重新应用各自的 Kind presentation 与 diff state。A→B 与 B→A 作为不同方向由 Graphviz 分别 routing，不得方向合并；同向不同 Kind 或同向不同 diff operation 的 Relationships 保持独立 identity、label、presentation 与详情映射，共享 geometry 不改变语义或交互身份。

#### 在重新布局时保持视觉锚点

Graphviz 在 focus、展开或 Mode 变化后 MAY 重新排列 projection；Visual Presentation SHALL 以触发 Element 或当前 focus 作为视觉锚点，尽量保持其屏幕位置与 viewport，并以平滑过渡更新其他节点。系统 SHALL NOT 在每次交互后自动 fit 全图。

#### Compound endpoint 布局预处理

Visual Presentation SHALL 在官方 Graphviz layout 之前，对包含 compound endpoint edges 的 Element View projection 跳过 `unflatten` 的 disconnected-node chaining 预处理，直接使用 LikeC4 printer 生成的 DOT 进入 Graphviz layout；Full Model 的折行候选与普通候选均遵守该约束；对不包含 compound endpoint edges 的 Element View projection，SHALL 保留既有 `unflatten` 预处理。判定 SHALL 基于 layout 前已建立的 compound endpoint 拓扑，不依赖 View 来源、focus、expanded set 或 Presentation Mode。

#### 可读性与安全布局选择

Visual Presentation SHALL 随观察尺度调整内容密度和文字大小，在可用边界内保持节点与容器文字可读，并在多层嵌套中保持标题和边框可辨识。Full Model SHALL 仅在原生折行布局安全且改善参考视口可读性、边长增长处于约定范围内时采用折行，否则保留普通 Graphviz 布局；Authored、dynamic 与 deployment views 保持既有布局行为。

### Section: Edge Cases and Exception Handling

当前 projection 无法完成普通 Graphviz layout 时，Browser SHALL 显示结构化错误与 retry，不静默切换其他 renderer。折行候选路由失败或收益不足时 SHALL 使用普通候选；文本空间不足时 SHALL 优先保持节点边界，必要时截断。非法 Kind presentation SHALL 在 Xirang 输入校验阶段拒绝，缺失字段使用 LikeC4 默认值。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 以视觉形式传达 View：浏览层级结构

- 用户通过 Visual Presentation 查看一个层级 View
- 用户可观察整体结构并导航到局部语义

#### Acceptance Case: 视觉选择不构成规范性语义：调整视觉布局

- 同一 semantic projection 的节点位置、routing 或 viewport 发生变化
- View Selection 与模型规范语义保持不变

#### Acceptance Case: 视觉选择不构成规范性语义：Kind presentation 不改变语义

- Element Kind 声明 `nodePresentation` 或 Relationship Kind 声明 `presentation`
- 该 Kind 实例的职责、行为、层级与 Relationship 语义保持不变
- presentation 不参与 View Selection 决策

#### Acceptance Case: 视觉选择不构成规范性语义：缺失 Relationship presentation 字段

- Relationship Kind 未声明 `presentation` 或只声明部分子字段
- 缺失内容分别使用 LikeC4 默认值

#### Acceptance Case: 使用原生 LikeC4 布局管线：呈现 Model 与等价 Authored View

- Model Selection 与 Authored View Selection 形成相同可见语义集合
- 两者使用相同 LikeC4/Graphviz 管线
- Full Model MAY 在该管线的 DOT 生成阶段启用兄弟单元折行择优；Authored View 保留既有布局配置
- 两者均不在 layout 后替换 Graphviz geometry 或 spline

#### Acceptance Case: 使用原生 LikeC4 布局管线：Graphviz 失败

- 当前 projection 无法完成 Graphviz layout
- Browser 显示结构化错误与 retry
- 不静默回退低质量 renderer

#### Acceptance Case: 叠加差异而不覆盖业务呈现：呈现修改的 Relationship

- 一个具有 Kind presentation 的 Relationship 为 MODIFIED
- 前景 edge 保持该 Kind 的 color、line、head 与 tail
- 更宽的半透明 underlay 与状态图标表达 MODIFIED

#### Acceptance Case: 叠加差异而不覆盖业务呈现：呈现 REMOVED Element

- diff-capable projection 包含 REMOVED Element
- Element 保留 before-state 业务样式并降低主体透明度
- 状态描边与图标明确表示 REMOVED

#### Acceptance Case: 叠加差异而不覆盖业务呈现：非颜色识别

- 用户无法依赖颜色区分 diff state
- 状态图标、形态与 tooltip 仍可区分 ADDED、MODIFIED 与 REMOVED

#### Acceptance Case: 分离 Relationship Edges：同时呈现两个方向

- 当前 projection 包含 A→B 与 B→A
- 两个方向的路径由 Graphviz 分别 routing，且任一 edge 可独立 hover、选择和打开详情

#### Acceptance Case: 分离 Relationship Edges：一个方向发生变化

- reciprocal pair 中只有一个 Relationship 携带 diff operation
- diff overlay 只作用于该方向
- 另一方向的业务 presentation 保持不变

#### Acceptance Case: 分离 Relationship Edges：同向 Relationships 具有不同 Kind presentation

- 多个同向 Relationships 映射到相同可见 source/target 且使用不同 Kind presentation
- 每个 Relationship 保留独立 visual edge、label 与业务 presentation
- 一个 edge 的 diff operation 不改变其他 edge

#### Acceptance Case: 在重新布局时保持视觉锚点：就地展开 Element

- 用户展开一个具有 children 的 Element并收到新 layout
- 该 Element 尽量保持原屏幕锚点
- viewport 不被自动重置为全图

#### Acceptance Case: 在重新布局时保持视觉锚点：首次打开 projection

- 一个 projection 首次显示且没有既有视觉锚点
- Browser MAY 执行初始 fit view

#### Acceptance Case: 跳过 Compound Projection 的 disconnected-node chaining 预处理：呈现 Compound Projection

- 当前 Element View projection 至少一条 visual edge 的 source 或 target endpoint 是 compound container
- 布局前 SHALL NOT 执行 `unflatten`
- 该 projection 的 printer DOT 直接进入 Graphviz layout，折行候选与普通候选均不执行 `unflatten`

#### Acceptance Case: 跳过 Compound Projection 的 disconnected-node chaining 预处理：呈现非 Compound Projection

- 当前 Element View projection 不含 compound endpoint edges
- 布局前 SHALL 执行既有 `unflatten` 预处理
- Full Model 的候选择优不改变该预处理判定

#### Acceptance Case: 跳过 Compound Projection 的 disconnected-node chaining 预处理：Compound 存在但 edges 均为 leaf-to-leaf

- 视图包含 compound nodes，但所有 visual edges 的 endpoints 均不是 compound
- 布局前 SHALL 执行既有 `unflatten` 预处理
- 判定依据为 edge endpoints 而非视图是否包含 compound nodes

#### Acceptance Case: 子能力保持父层可读性保证

- **GIVEN** 用户在有多层容器的 Full Model 中缩小画布
- **WHEN** 浏览全图并选择一条关系
- **THEN** 总览隐藏节点摘要和空闲关系标签，选中关系标签仍可查看，文字保持在节点可用边界内

## REMOVED Sections

### Section: 以视觉形式传达 View

### Section: 视觉选择不构成规范性语义

### Section: 使用原生 LikeC4 布局管线

### Section: 叠加差异而不覆盖业务呈现

### Section: 分离 Relationship Edges

### Section: 在重新布局时保持视觉锚点

### Section: 跳过 Compound Projection 的 disconnected-node chaining 预处理
