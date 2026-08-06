### Task 1: 状态机播种支持

**Goal**: 让 `LikeC4Diagram`/`DiagramActorProvider` 接受可选的初始 focus 与展开集合并播种进状态机，交互视图不传时行为完全不变。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.setup.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/DiagramActorProvider.tsx`
- Modify: `likec4/packages/diagram/src/LikeC4Diagram.tsx`
- Modify: `likec4/packages/diagram/src/LikeC4Diagram.props.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/state/machine.setup.spec.ts`

**Requirements**:
- `Input`/`Context` 增加可选 `initialFocusIdentity`、`initialExpanded`，`Context()` 以其为初始值（缺省回退 `null` / 空 Set），交互视图不传时行为不变
- `DiagramActorProvider` 与 `LikeC4Diagram` 透传这两个可选 prop 到机器 input

#### Checks

- [x] C1 播种单测
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得" / Scenario "导出聚焦且就地展开的 Model View"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/state/machine.setup.spec.ts`
  - Expect: 断言 `Context()` 使用 `initialFocusIdentity`/`initialExpanded` 初始化，缺省时 `null` / 空 Set；全部通过

- [x] C2 类型检查
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误，可选 prop 透传类型一致

### Task 2: 导出快照 store 与交互视图镜像

**Goal**: 新增模块级导出快照 store；`XirangArchitectureOverlay` 在状态变化时镜像 `{source, mode, focus, expanded}`，静态渲染上下文跳过写入。

**Files**:
- Create: `likec4/packages/diagram/src/xirang/export-state.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/index.ts`
- Test: `likec4/packages/diagram/src/xirang/export-state.spec.ts`

**Requirements**:
- 快照 store 提供 `getSnapshot`/`setSnapshot`，快照含 `source`、`mode`、`focus`、`expanded`（有序数组）
- overlay effect 在 `selected`/`mode`/`focusIdentity`/`expandedNodes` 变化时写入快照；`enableStaticView` 时不写入

#### Checks

- [x] C3 快照 store 单测
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/export-state.spec.ts`
  - Expect: 快照写入/读取往返一致，expanded 序列化顺序稳定；全部通过

- [x] C4 类型检查
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 3: Header 导出入口传输快照

**Goal**: Header 的 PNG/JPG 导出在 xirang 视图下把当前快照写入 sessionStorage，其余格式与 auth 视图分支不变。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/components/view-page/Header.tsx`

**Requirements**:
- 当 `viewId === 'model'` 且点击 PNG/JPG 导出时，把 store 快照序列化写入 `sessionStorage['xirang:export-snapshot']` 后再打开导出标签页
- 非 xirang 视图与其它导出格式保持既有行为

#### Checks

- [x] C5 Header 类型检查
  - Command: `cd likec4 && pnpm --filter @likec4/spa typecheck`
  - Expect: 无类型错误；Header 的 PNG/JPG 分支与其它分支类型一致

### Task 4: ExportPage 应用快照并门控下载

**Goal**: ExportPage 读取 sessionStorage 快照，把 focus/expanded 播种给机器、用桥应用 source/mode，并在快照应用前不触发自动下载；无快照时回退现状。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/pages/ExportPage.tsx`

**Requirements**:
- 读 `sessionStorage['xirang:export-snapshot']`，把 `focus`/`expanded` 作为初始状态传给 `LikeC4Diagram`
- 挂载时用小桥对 `useXirangViewSources` 应用 `source`/`mode`（沿用 ViewHistoryBridge 模式）
- 自动下载在快照应用完成前不触发；无快照时立即放行回退现状

#### Checks

- [x] C6 类型检查
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 5: 浏览器端到端验证导出所见即所得

**Goal**: 重建 bundle 后，用 Playwright 验证导出页渲染与屏上一致，覆盖 Model View 与 Change 源。

**Files**:
- Create: `test/e2e/semantic-browser-image-export.spec.ts`
- Modify: `playwright.config.ts`

**Requirements**:
- Model View 下钻 + 就地展开后，导出页渲染节点集合与交互视图一致
- Change-derived View 以 diff 模式导出时渲染其目标模型与 diff 内容
- 直接打开导出 URL（无快照）时回退默认行为且不报错

#### Checks

- [x] C7 重建 bundle（先 spa 后 xirang-likec4）
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: 两个构建均成功，顺序为先 spa 再 xirang-likec4

- [x] C8 e2e：Model View 聚焦 + 展开导出（含 Header 快照写入）
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得" / Scenario "导出聚焦且就地展开的 Model View"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-image-export.spec.ts --project=desktop`
  - Expect: 交互视图下钻并就地展开后点击 Header 的 Export → PNG，断言当前标签页 `sessionStorage['xirang:export-snapshot']` 已写入且含 focus 与展开 identity；随后同标签页打开导出 URL，断言导出页渲染节点 id 集合与交互视图一致（Header 的 sessionStorage 写入是导出页正确渲染的前置环节）

- [x] C9 e2e：Change 源 diff 导出
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得" / Scenario "导出 Change-derived View 的 diff 呈现"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-image-export.spec.ts --project=desktop`
  - Expect: 导出页渲染 Change 目标模型与 diff 内容（断言含 change source 的节点）

- [x] C10 e2e：无快照回退
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得" / Scenario "导出页直接打开且无前置呈现状态"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-image-export.spec.ts --project=desktop`
  - Expect: 直接打开导出 URL 不报错，渲染回退行为与现状一致
