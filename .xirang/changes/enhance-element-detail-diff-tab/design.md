## Context

当前 Element Details 面板的 tab 组织方式无法有效支持 Change-derived View 的语义变更查看需求。Properties tab 展示的 summary 和 description 与 declaration 字段重叠，Contracts tab 同时展示 diff 和 after-content 导致信息混杂，缺少独立的变更差异视图。此外，ADDED 元素在 Change-derived View 中没有可视化表示，用户无法感知、浏览或操作不存在的投影元素。

## Goals / Non-Goals

**Goals:**
- Properties tab 全局展示 declaration 字段（kind、parent、title、definition），移除 summary，标签 "description" → "definition"
- Contracts tab 全局只展示更新后的 contract after-content
- Diff tab 仅在 change-derived view 中出现，使用标准双栏 diff 展示 declaration 和 contract 的 before/after diff
- ADDED 元素在架构图上投影显示，支持展开/收起、详情打开、安全 tabs
- 移动端完整支持上述交互（横向滚动 diff、可点击展开/收起、可访问的详情打开）
- Tab 顺序全局统一：Properties → Contracts → Diff → Relationships → Views → Structure → Deployments
- 面板 metamodel 行可点击弹出模态框展示 before/after diff

**Non-Goals:**
- 不修改任何 semantic model 内容
- 不修改 diagram node 上的 summary 展示（保留在节点 tooltip 中）
- 不修改 Model View 或 Authored View 的 tab 结构（无 Diff tab）
- 不引入新的后端 API 或数据源
- 不修改 `.xirang/changes/enhance-element-detail-diff-tab/` 的 proposal/design/specs 以外的用户维护制品

## Decisions

### 1. Diff tab 仅对 change-derived view 可见

通过 `runtime.selected.source` 条件判断，Model View 和 Authored View 不渲染 Diff tab。

### 2. Declaration diff 使用 XirangDiffViewer

将 `XirangDiffEntry` 中 element-declaration 的 `before`/`after` 对象解析为字段列表（kind、parent、title、definition），逐字段比较标记 changed/unchanged。每个字段的 diff 使用 `XirangDiffViewer` 展示。

### 3. Contract diff 返回原始文本

`getStructuredContractDiff` 改为返回 requirement/scenario 的原始 `before`/`after` 文本，直接交给 `XirangDiffViewer` 处理，不再自研行/词对齐。

### 4. 使用 react-diff-viewer-continued

选择 `react-diff-viewer-continued@4.4.0` 作为 diff 引擎，替代自研行/词 diff 算法：
- 支持 React 19
- 提供 split view、独立行号、空白占位和 word diff
- 比 Monaco 更轻量，不需要额外 webpack/vite 配置
- 通过 `XirangDiffViewer` 封装隔离第三方 API 和主题适配

### 5. ADDED 元素使用投影层

ADDED 元素不伪造进 LikeC4 基础模型，而是通过 Xirang 投影层在架构图上渲染：
- `architectureView.ts` 标记 operation/identity/hidden children 到 DOM
- `diagram-view.ts` 转为 typed XYFlow node data 和可观测 DOM 属性
- `projectionNode.ts` 提供编解码函数，在 XYFlow node data 和 DOM 之间传递
- 双击路径从 `xynode.data.xirang` 识别投影节点并调用 `openElementDetails`，不请求基础模型

### 6. 隐藏基础模型依赖 tab

ADDED 元素仅显示 Xirang 数据可支持的 tabs（Properties、Contracts、Diff）。`visibleElementDetailTabs` 过滤掉 `Relationships`、`Views`、`Structure`、`Deployments`，避免调用不存在的模型元素。

### 7. 按节点渲染类型提供展开动作

折叠节点由 `ElementActions` 展开，展开后 compound 节点由 `CompoundActions` 收起。Collapse 按钮始终可交互（不依赖 hover/selection 解除 `inert`），确保移动端可用。

### 8. 移动端 split diff 使用固定最小列宽

通过 `minWidth: 640` 和横向滚动保持标准代码 diff 可读性，不逐字折行。ADDED 元素的 Before 为空时自动滚动到 After 栏，减少移动端无意义操作。

### 9. Metamodel diff 模态框

使用 @mantine/core 的 `Modal` 组件，内嵌 `XirangDiffViewer` 展示 metamodel 条目的 `before`/`after` 原始内容。点击面板中的 metamodel 行触发打开。

### 10. 不存在语义模型变更

本变更为纯 UI 改动，不涉及 Semantic Model 底层变化。

## Risks / Trade-offs

- **Low**: `react-diff-viewer-continued` 增加依赖体积，但比 Monaco 轻量，且消除了自研 diff 算法的维护成本。
- **Low**: ADDED 投影层增加了架构复杂度，但避免了伪造基础模型元素的副作用风险。
- **Low**: 移动端 diff 需要横向滚动，不能自动适应窄屏。权衡：标准代码 diff 的可读性优先于自动适应。
- **Low**: Metamodel diff 模态框的打开不涉及路由或状态持久化，关闭后状态丢失可接受。