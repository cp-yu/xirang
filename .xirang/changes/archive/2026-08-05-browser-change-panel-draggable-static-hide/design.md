## Context

Semantic Browser 的浮动 Change 面板位于 `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx` 的 `XirangArchitectureOverlay`：一个 Mantine `Stack`（DOM 类名 `mantine-Stack-root`）包在 `position: absolute; right:16; top:16; zIndex:5` 的 Box 内，仅当选中 Change-derived View / Candidate / Candidate Diff 时渲染。`XirangArchitectureOverlay` 由 `LikeC4DiagramUI` 无条件渲染，而 `LikeC4DiagramUI` 同时服务于交互式页面（`ViewReact`/`ViewEditor` 的 `LikeC4Diagram`）与静态渲染（首页卡片与侧边栏预览的 `StaticLikeC4Diagram`、导出页 `ExportPage` 的 `LikeC4Diagram`），后三处均带 `likec4-static-view` 类。静态渲染中 `useXirangViewSources()` 仍返回全局选中的 Xirang source，导致浮动面板与 breadcrumb 错误出现在每个静态视图之上。约束：不改 diagram state machine，不改面板交互入口语义，嵌入式浏览器 `isRpcAvailable=false` 走 `ViewReact.tsx`。

## Goals / Non-Goals

**Goals:**
- 浮动 Change 面板可通过面板头部手柄在 diagram 容器内拖动，拖动不触发画布平移、不干扰面板内控件。
- 静态渲染上下文（首页视图卡片、侧边栏悬停预览、PNG/JPG 导出图）不呈现浮动 Change 面板与 breadcrumb；交互式页面呈现不变。
- 面板位置仅内存态，不持久化。

**Non-Goals:**
- 不改变 View identity、Element 层级、Relationships、Metamodel 或 Authored Views。
- 不重写 diagram state machine，不改 Change 面板的交互入口与内容。
- 不引入持久化（localStorage）的面板位置记忆。

## Decisions

### 1. 静态渲染以 `enableStaticView` 能力位区分

`DiagramFeatures` 的 `FeatureNames` 新增 `StaticView`，默认 `enableStaticView: false`；`LikeC4Diagram` 新增 `static?: boolean` prop，置位时映射进 `DiagramFeatures.features.enableStaticView`。`StaticLikeC4Diagram` 与 `ExportPage` 均传入 `static`。

- 替代方案 A：纯 CSS 规则 `.likec4-static-view [data-xirang-architecture-overlay]{display:none}`——零 React 改动但面板仍在 DOM、语义弱、无法区分"不渲染"与"隐藏"，弃用。
- 替代方案 B：复用 `reduceGraphics` 等既有开关作静态判据——语义错位（`reduceGraphics` 是渲染质量开关，静态导出 `reduceGraphics={false}` 与其反向），弃用。
- 理由：`DiagramFeatures` 是既有能力位机制，显式、可单测，且 `static` prop 与 `likec4-static-view` 类同源，三处静态上下文一致覆盖。

### 2. 静态模式下 `XirangArchitectureOverlay` 不渲染浮动 chrome

`XirangArchitectureOverlay` 读取 `useEnabledFeatures().enableStaticView`，为 true 时仅输出 `data-xirang-architecture-overlay` 的 `hidden` 标记 Box（供测试与诊断），不渲染浮动 Change 面板与 breadcrumb；hooks（`useOnDiagramEvent`、materialize effect 等）保持注册以满足 hooks 规则，静态模式下无 diagram 事件、行为无副作用。

### 3. 面板拖动用 framer-motion `drag`

面板外包 `motion.div`，配置 `drag`、`dragMomentum={false}`、`dragListener={false}`、`dragControls`；面板头部「Change / …」Group 作为 drag handle，`onPointerDown={(e) => dragControls.start(e)}` 并 `stopPropagation()`，避免触发画布平移。面板内控件（`NativeSelect`、Button、`UnstyledButton`）不在 handle 上，交互不受拖动干扰。位置为 `motion.div` 的 x/y transform 偏移（组件 state），刷新复位，不持久化。

- 替代方案 A：手写 pointer 事件（`onPointerDown/Move/Up`）更新 `left/top`——无新依赖但需处理边界、多指针、释放等细节，代码量更大，弃用。
- 替代方案 B：引入 `@dnd-kit`——单浮动面板过重，弃用。
- 理由：`motion`（framer-motion）已是 `@likec4/diagram` 既有依赖（`NavigationPanel` 等已使用），drag handle 模式成熟，代码量约 10 行。

### 4. 视觉提示与 breadcrumb 拖动

面板与 focus breadcrumb 的拖动手柄均加 `IconGripVertical` 图标与 `cursor: grab`，并以 `data-xirang-drag-handle` 标记供测试定位；拖动容器加 `touchAction: 'none'`，防止浏览器把触摸手势接管为滚动并触发 `pointercancel` 中断拖拽（实测触摸拖拽在修复前只移动首段）。focus breadcrumb 同法包 `motion.div` + `dragControls` 可拖动，使用户可将它移开避免遮挡 LikeC4 原生编辑控件；breadcrumb 按钮点击导航与拖动互不干扰（framer-motion 的 click-vs-drag 阈值区分）。

- 替代方案：将 LikeC4 原生编辑组件整体下移以避开 breadcrumb——侵入 vendored 编辑器布局、影响面大，弃用；改为可拖动 breadcrumb，更通用且用户可控。

## Risks / Trade-offs

- [拖动与画布平移冲突] → drag handle `stopPropagation` + `dragListener={false}`，仅头部启动拖动，画布不受影响。
- [motion transform 与 `right:16` 锚定的叠加] → 面板初始定位保持 `right:16; top:16`，拖动以 x/y transform 偏移叠加，视觉正确；刷新复位避免累积漂移。
- [静态隐藏影响既有 e2e] → 既有 `semantic-browser-navigation-history`、`contract-browser` 断言均在交互页 `/view/model/`、`/view/index/`，`enableStaticView` 默认 false 不回归。
- [`ExportPage` 直接使用 `LikeC4Diagram` 而非 `StaticLikeC4Diagram`] → 需单独置位 `static`，与本 Change 一并处理，否则导出图仍含面板。

## Migration Plan

1. 合并后，静态渲染（首页卡片、侧边栏预览、导出图）不再呈现浮动面板与 breadcrumb；交互式页面不受影响。
2. 无需数据迁移；无持久化 schema 变化。
3. 回滚：移除 `enableStaticView` 判定与面板 drag 包装即可恢复现状，不影响模型与既有功能。

## Open Questions

- 无阻塞项。面板拖动位置不持久化（刷新复位），如需会话记忆另立 Change。
