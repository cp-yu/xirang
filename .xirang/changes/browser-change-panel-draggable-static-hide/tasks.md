### Task 1: 静态渲染能力位

**Goal**: 新增 `enableStaticView` 能力位，`LikeC4Diagram` 提供 `static` prop 并接入 `StaticLikeC4Diagram` 与 `ExportPage` 的静态渲染路径。

**Files**:
- Modify: `likec4/packages/diagram/src/context/DiagramFeatures.tsx`
- Modify: `likec4/packages/diagram/src/LikeC4Diagram.tsx`
- Modify: `likec4/packages/diagram/src/LikeC4Diagram.props.ts`
- Modify: `likec4/packages/diagram/src/StaticLikeC4Diagram.tsx`
- Modify: `likec4/packages/likec4-spa/src/pages/ExportPage.tsx`

**Requirements**:
- `FeatureNames` 新增 `StaticView`，`DefaultFeatures.enableStaticView` 为 false
- `LikeC4Diagram` 新增 `static?: boolean` prop，置位时映射进 `DiagramFeatures.features.enableStaticView`
- `StaticLikeC4Diagram` 与 `ExportPage` 均传入 `static`，使静态渲染上下文置位能力位

#### Checks

- [x] C1 验证能力位与 static prop 接入
  - Verifies: `elements/semantic-browser.md` / Requirement "静态渲染上下文不呈现浮动 Change 面板" / Scenario "首页视图卡片不显示浮动面板"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck && pnpm --filter @likec4/spa typecheck`
  - Expect: 能力位、static prop、`StaticLikeC4Diagram` 与 `ExportPage` 改动通过 typecheck

### Task 2: 静态隐藏与面板拖动

**Goal**: `XirangArchitectureOverlay` 在静态模式下不渲染浮动 chrome；浮动 Change 面板改为 framer-motion 可拖动。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`

**Requirements**:
- 静态模式（`enableStaticView`）下不渲染浮动 Change 面板与 breadcrumb，仅保留隐藏标记 Box；hooks 保持注册
- 面板包 `motion.div` + `drag`、`dragMomentum={false}`、`dragListener={false}` + `dragControls`，头部「Change / …」行作 drag handle 且 `stopPropagation`；头部显示 grip 图标与 grab 光标（`data-xirang-drag-handle`）作为视觉提示
- focus breadcrumb 包 `motion.div` + `dragControls` 可拖动（`touch-action: none`），带 grip 图标与 grab 光标；breadcrumb 按钮 focus 导航不被拖动干扰
- 面板内控件（View source 选择、Full/Diff 切换、Plan 文档入口）交互不受拖动干扰；面板与 breadcrumb 位置均仅内存态不持久化

#### Checks

- [x] C1 验证面板拖动与静态隐藏编译
  - Verifies: `elements/semantic-browser.md` / Requirement "浮动 Change 面板可拖动" / Scenario "拖动 Change 面板"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: DiagramUI 拖动与静态隐藏改动通过 typecheck
- [x] C2 验证静态渲染单元行为
  - Verifies: `elements/semantic-browser.md` / Requirement "静态渲染上下文不呈现浮动 Change 面板" / Scenario "交互式页面仍呈现浮动面板"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/xyflow-diagram/diagram-view.spec.ts src/xirang/architectureView.spec.ts src/xirang/projectionNode.spec.ts`
  - Expect: 既有 diagram 单元测试全过，无回归

### Task 3: e2e 验证

**Goal**: 新增 e2e 覆盖首页卡片无浮动面板、模型页面板可见且可拖动。

**Files**:
- Create: `test/e2e/browser-change-panel-static-hide.spec.ts`

**Requirements**:
- 导出页 `/export/model` 以静态模式渲染：隐藏标记存在且无可见 `data-xirang-architecture-overlay` 与 breadcrumb
- 首页 `/` 视图卡片网格 SHALL NOT 呈现 `data-xirang-architecture-overlay` 面板
- `/view/model/` 选择 `change:browser-change` 后面板可见，且拖动面板头部后面板位置变化、画布不平移
- 测试名匹配既有 playwright desktop/mobile grep 模式（含 "browses Model View"），无需改 grep 列表

#### Checks

- [x] C1 验证首页卡片无浮动面板
  - Verifies: `elements/semantic-browser.md` / Requirement "静态渲染上下文不呈现浮动 Change 面板" / Scenario "首页视图卡片不显示浮动面板"
  - Command: `pnpm likec4:build && pnpm exec playwright test --project=desktop --project=mobile -g "hides the Change panel on landing cards"`
  - Expect: 选择 change source 后访问 `/`，全部视图卡片均无可见 `[data-xirang-architecture-overlay]`
- [x] C2 验证面板可拖动
  - Verifies: `elements/semantic-browser.md` / Requirement "浮动 Change 面板可拖动" / Scenario "拖动 Change 面板"
  - Command: `pnpm likec4:build && pnpm exec playwright test --project=desktop --project=mobile -g "drags the Change panel"`
  - Expect: 模型页面板可见，拖动头部后 bounding box 移动且 `.react-flow__viewport` 不变
- [x] C3 一次性人工验证导出图无面板
  - Verifies: `elements/semantic-browser.md` / Requirement "静态渲染上下文不呈现浮动 Change 面板" / Scenario "导出图不包含浮动面板"
  - Command: `pnpm likec4:build && pnpm exec playwright test --project=desktop --project=mobile -g "exports without the Change panel"`（导出页静态模式断言：`/export/model` 无可见 overlay 与 breadcrumb）；另人工导出 PNG/JPG 目视确认
  - Expect: 导出图像不包含浮动 Change 面板或 breadcrumb
- [x] C4 验证 breadcrumb 可拖动与视觉提示
  - Verifies: `elements/semantic-browser.md` / Requirement "focus breadcrumb 可拖动" / Scenario "拖动 breadcrumb"；Requirement "浮动 Change 面板可拖动" / Scenario "拖动手柄带视觉提示"
  - Command: `pnpm likec4:build && pnpm exec playwright test --project=desktop --project=mobile -g "drags the Change panel"`
  - Expect: 面板与 breadcrumb 拖动手柄均含 grip 图标（`[data-xirang-drag-handle] svg`）；breadcrumb 拖动后 bounding box 移动且画布不平移

## Required Corrections

- [x] [artifact_fix] C3 一次性人工验证导出图无面板：人工导出 PNG/JPEG 并确认导出图无浮动 Change 面板或 breadcrumb 后再勾选。
