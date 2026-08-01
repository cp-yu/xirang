## Why

当前 Change-derived View 的 Element Details 面板无法直观查看 declaration 和 contract 的变更差异；Properties tab 展示的 summary 与 declaration 字段重叠；Contracts tab 混杂了 diff 与 after-content。用户无法在单一视图中比较变更前后完整语义。此外，ADDED 元素在架构图上没有任何可视化表示，用户无法直观浏览、展开或查看其详情，也无法在移动端正常操作。

## What Changes

- **Properties tab（全局）**：展示 declaration 字段（kind、parent、title、definition），移除 summary，将 "description" 标签改为 "definition"
- **Contracts tab（全局）**：移除 structured diff，只保留更新后的 contract after-content；`getStructuredContractDiff` 改为返回 requirement/scenario 的原始 before/after 文本
- **Diff tab（新增，仅 change-derived view）**：使用 `react-diff-viewer-continued` 标准双栏 diff 展示 declaration 和 contract 的 before/after diff，替代自研行/词对齐算法
- **XirangDiffViewer（新增）**：统一 diff 组件，封装 `react-diff-viewer-continued`，适配 Mantine 明暗主题，支持独立行号、Before/After 标题、水平滚动
- **ADDED 元素投影**：Xirang ADDED 元素通过投影层渲染到架构图，不查询 LikeC4 基础模型；支持展开/收起子元素、双击打开详情（桌面）、移动端通过 `Open details` 按钮打开
- **安全 tabs（ADDED 元素）**：ADDED 元素详情仅显示投影数据可支持的 tabs（Properties、Contracts、Diff），隐藏基础模型依赖的 tabs
- **Tab 顺序（全局）**：Properties → Contracts → (Diff) → Relationships → Views → Structure → Deployments
- **Metamodel diff**：面板中 metamodel 行可点击，弹出模态框展示 before/after diff
- **移动端支持**：split diff 双栏固定列宽，通过横向滚动查看；Collapse 按钮始终可交互，不依赖 hover

## Source Impact

### Behavior Source

#### New Specs

- `change-derived-views`: ADDED requirement "支持 Element 级别的变更差异审查" 及其三个 scenario（查看变更差异、ADDED 元素投影与交互、标准分栏 diff 展示）

#### Modified Specs

- `change-derived-views`: 新增 Element 级别的 declaration 和 contract 的 before/after diff 查看能力

### Architecture Source

- `likec4/packages/diagram/src/xirang/projectionNode.ts`（新建）— Xirang 投影 metadata 编解码
- `likec4/packages/diagram/src/xirang/architectureView.ts` — 架构视图投影 layer 标记
- `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.ts` — XYFlow 节点数据投影传递
- `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx` — ADDED 双击/展开详情、metamodel 行可点击、materialize effect 稳定化
- `likec4/packages/diagram/src/likec4diagram/custom/nodes/ElementActions.tsx` — ADDED parent Expand 按钮
- `likec4/packages/diagram/src/likec4diagram/custom/nodes/CompoundActions.tsx` — ADDED compound Collapse 按钮（始终可交互）
- `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx` — tab 顺序、安全 tabs、ADDED 条件渲染
- `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx` — 移除 structured diff 段
- `likec4/packages/diagram/src/overlays/element-details/DiffTab.tsx` — 使用 XirangDiffViewer 的标准双栏 diff
- `likec4/packages/diagram/src/overlays/element-details/XirangDiffViewer.tsx`（新建）— 统一 diff 组件
- `likec4/packages/diagram/src/overlays/element-details/MetamodelDiffModal.tsx`（新建）— metamodel diff 模态框
- `likec4/packages/diagram/package.json` — 新增 react-diff-viewer-continued 依赖
- `likec4/pnpm-workspace.yaml` — 新增 react-diff-viewer-continued catalog
- `playwright.config.ts` — 新增 mobile 项目定义
- `test/e2e/semantic-browser-model-view.spec.ts` — 新增 ADDED 投影交互与 split diff e2e 测试
- `test/fixtures/contract-browser/.xirang/changes/browser-change/elements/capability.added-parent.md`（新建）— 测试 fixture
- `test/fixtures/contract-browser/.xirang/changes/browser-change/elements/capability.added-child.md`（新建）— 测试 fixture