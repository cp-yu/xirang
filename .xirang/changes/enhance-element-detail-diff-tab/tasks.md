### Task 1: 重构 Properties tab 展示 declaration 字段

**Goal**: Properties tab 全局展示 declaration 字段（kind、parent、title、definition），移除 summary，将 "description" 标签改为 "definition"

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`

**Requirements**:
- `ElementDefinitionProperties` 组件展示 declaration 的 kind、parent、title、definition 字段
- 移除 summary 字段的展示（保留在 diagram node 的 description 中）
- 标签 "description" 改为 "definition"
- 数据来源：change-derived view 取 `architecture.elements[].declaration`，model view 取 `elementModel`

#### Checks

- [x] C1 Properties tab 展示 declaration 字段
  - Verifies: change-derived view 中 element details 的 Properties tab 包含 kind、parent、title、definition
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Evidence: 测试通过

### Task 2: 清理 Contracts tab 移除 structured diff

**Goal**: Contracts tab 全局只保留更新后的 contract after-content，移除 requirement diff 和 diagnostics 段

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx`

**Requirements**:
- ContractsTab 的 `structuredDiff` 段（requirement diff + diagnostics）移除
- `displayState.content` 渲染部分（after-content Markdown 展示）保持不变
- `getStructuredContractDiff` 改为返回 requirement/scenario 的原始 before/after 文本（Diff tab 复用）

#### Checks

- [x] C2 Contracts tab 不再展示 structured diff
  - Verifies: ContractsTab 渲染内容不再包含 `data-xirang-structured-diff` 选择器
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ContractsTab.spec.tsx`
  - Evidence: 测试通过

### Task 3: 新建 Diff tab 组件（仅 change-derived view）

**Goal**: 新建 `DiffTab.tsx`，使用标准双栏 diff 展示 declaration 和 contract 的 before/after diff

**Files**:
- Create: `likec4/packages/diagram/src/overlays/element-details/DiffTab.tsx`
- Create: `likec4/packages/diagram/src/overlays/element-details/XirangDiffViewer.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/package.json`
- Modify: `likec4/pnpm-workspace.yaml`
- Test: `likec4/packages/diagram/src/overlays/element-details/DiffTab.spec.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/XirangDiffViewer.spec.tsx`

**Requirements**:
- Diff tab 从 `XirangViewSource.diff.entries` 中获取当前 element 的 element-declaration 和 requirement 变更
- Declaration diff：逐字段比较 before/after（kind、parent、title、definition），使用 `XirangDiffViewer`
- Contract diff：使用 `getStructuredContractDiff` 返回的原始 before/after 文本，交给 `XirangDiffViewer`
- 使用 `react-diff-viewer-continued` 标准双栏 diff，支持独立行号、Before/After 标题、word diff
- 仅在 `runtime.selected.source === 'change-derived-view'` 时渲染
- Diff tab 整体支持纵向滚动，移动端 split diff 通过横向滚动查看

#### Checks

- [x] C3 Diff tab 渲染 declaration + contract diff
  - Verifies: 标准双栏 diff 展示，支持纵向滚动，移动端横向滚动，ADDED 元素 Before 为空时自动滚动到 After
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/DiffTab.spec.tsx`
  - Evidence: Vitest 通过；Playwright 5/5 通过，覆盖 Element Diff 和 Metamodel Diff 的短内容宽度收缩、Before/After 标题 margin、桌面/移动端 diff 滚动；pnpm-lock.yaml 为依赖锁定生成产物

### Task 4: 调整全局 tab 顺序 + 条件渲染 Diff tab + ADDED 安全 tabs

**Goal**: 全局 tab 顺序改为 Properties → Contracts → Diff → Relationships → Views → Structure → Deployments；Diff tab 仅在 change-derived view 出现；ADDED 元素隐藏基础模型依赖 tabs

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`

**Requirements**:
- `TABS` 常量顺序改为 `['Properties', 'Relationships', 'Views', 'Structure', 'Deployments']`
- `TabName` 类型扩展为 `typeof TABS[number] | 'Contracts' | 'Diff'`
- Contracts tab 始终在 Properties 之后渲染（有 contract 时）
- Diff tab 在 Contracts 之后、Relationships 之前渲染（仅 change-derived view 时）
- ADDED 元素使用 `visibleElementDetailTabs` 过滤，仅显示 Properties、Contracts、Diff
- `useSessionStorage` 默认值仍为 `'Properties'`；当 activeTab 切换且对应 tab 不可用时回退到 Properties

#### Checks

- [x] C4 Tab 顺序和条件渲染正确
  - Verifies: Model View 中无 Diff tab；change-derived view 中有 Diff tab 且在 Contracts 之后；ADDED 元素无 Relationships/Views/Structure/Deployments tabs
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Evidence: 测试通过；e2e 验证 ADDED 元素 tabs

### Task 5: 面板 metamodel 行可点击弹出 diff 模态框

**Goal**: XirangArchitectureOverlay 面板中的 metamodel 行改为可点击，点击后弹出模态框展示 before/after diff

**Files**:
- Create: `likec4/packages/diagram/src/overlays/element-details/MetamodelDiffModal.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`

**Requirements**:
- Metamodel 行使用 `Button` 或 `UnstyledButton` 替代 `Text`，点击打开 `MetamodelDiffModal`
- 模态框内使用 `XirangDiffViewer` 展示该条目的 `before` 和 `after` 原始内容（JSON 格式化）
- 模态框标题为条目操作和 identity，如 `+ element-kind test-component`
- 关闭模态框后状态重置

#### Checks

- [x] C5 Metamodel 行可点击弹出 diff
  - Verifies: 点击面板中的 metamodel 行弹出模态框，展示 before/after 内容
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Evidence: Vitest 通过；Playwright 5/5 通过，验证 Metamodel diff modal 的 Before/After 展示、短内容不固定为 1000px 且表头不重叠

### Task 6: ADDED 元素投影与交互

**Goal**: ADDED 元素在架构图上投影显示，支持展开/收起、详情打开、安全 tabs

**Files**:
- Create: `likec4/packages/diagram/src/xirang/projectionNode.ts`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/types.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/ElementActions.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/CompoundActions.tsx`
- Test: `likec4/packages/diagram/src/xirang/projectionNode.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`

**Requirements**:
- ADDED elements 通过投影层渲染，不查询 LikeC4 基础模型
- 投影 metadata 在 architectureView、diagram-view、XYFlow node data 和 DOM 之间传递
- 折叠节点展示 Expand 按钮，展开后 compound 节点展示 Collapse 按钮（始终可交互）
- 双击 ADDED 节点打开详情（桌面），移动端通过 `Open details` 按钮打开
- ADDED 详情仅显示安全 tabs（Properties、Contracts、Diff）

#### Checks

- [x] C6 ADDED 元素投影与交互
  - Verifies: desktop 和 mobile 均可展开/收起、打开详情、查看安全 tabs 和 split diff
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/xirang/ src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`
  - Evidence: 49 个 Vitest 测试通过；5 个 desktop/mobile e2e 测试通过

### Task 7: 移动端支持和多端验证

**Goal**: 确保所有交互在桌面和移动端均可操作、可读且无布局重叠

**Files**:
- Modify: `playwright.config.ts`
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Create: `test/fixtures/contract-browser/.xirang/changes/browser-change/elements/capability.added-parent.md`
- Create: `test/fixtures/contract-browser/.xirang/changes/browser-change/metamodel/test-component.md`
- Create: `test/fixtures/contract-browser/.xirang/changes/browser-change/elements/capability.added-child.md`

**Requirements**:
- 移动端 split diff 通过固定列宽和横向滚动查看，不逐字折行
- Collapse 按钮始终可交互，不依赖 hover
- 移动端通过 `Open details` 可访问按钮打开详情
- 桌面/移动端 e2e 覆盖 expand/collapse、双击/按钮详情、安全 tabs、split diff、关闭详情卡

#### Checks

- [x] C7 移动端和桌面端验证通过
  - Verifies: Playwright 5/5 测试通过（desktop 3 项 + mobile 2 项）
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts`
  - Evidence: 所有 e2e 测试通过，截图无布局重叠