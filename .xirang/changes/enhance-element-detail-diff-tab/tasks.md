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

- [ ] C1 Properties tab 展示 declaration 字段
  - Verifies: change-derived view 中 element details 的 Properties tab 包含 kind、parent、title、definition
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Expect: 测试通过

### Task 2: 清理 Contracts tab 移除 structured diff

**Goal**: Contracts tab 全局只保留更新后的 contract after-content，移除 requirement diff 和 diagnostics 段

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx`

**Requirements**:
- ContractsTab 的 `structuredDiff` 段（requirement diff + diagnostics）移除
- `displayState.content` 渲染部分（after-content Markdown 展示）保持不变
- `getStructuredContractDiff` 和 `createTextDiff` 等导出函数保留（Diff tab 复用）

#### Checks

- [ ] C2 Contracts tab 不再展示 structured diff
  - Verifies: ContractsTab 渲染内容不再包含 `data-xirang-structured-diff` 选择器
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ContractsTab.spec.tsx`
  - Expect: 测试通过

### Task 3: 新建 Diff tab 组件（仅 change-derived view）

**Goal**: 新建 `DiffTab.tsx`，展示 declaration 和 contract 的左右两栏 before/after diff

**Files**:
- Create: `likec4/packages/diagram/src/overlays/element-details/DiffTab.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/DiffTab.spec.tsx`

**Requirements**:
- Diff tab 从 `XirangViewSource.diff.entries` 中获取当前 element 的 element-declaration 和 requirement 变更
- Declaration diff：逐字段比较 before/after（kind、parent、title、definition），definition 使用 `createTextDiff` 行级 diff
- Contract diff：复用 `getStructuredContractDiff` 和 `createTextDiff` 展示 requirement 级别的 before/after diff
- 左右两栏 CSS Grid 布局，changed 字段高亮（amber/yellow 背景）
- 仅在 `runtime.selected.source === 'change-derived-view'` 时渲染

#### Checks

- [ ] C3 Diff tab 渲染 declaration + contract diff
  - Verifies: `.xirang/changes/enhance-element-detail-diff-tab/elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "查看 Element 变更差异"
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/DiffTab.spec.tsx`
  - Expect: 测试通过

### Task 4: 调整全局 tab 顺序 + 条件渲染 Diff tab

**Goal**: 全局 tab 顺序改为 Properties → Contracts → Diff → Relationships → Views → Structure → Deployments；Diff tab 仅在 change-derived view 出现

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`

**Requirements**:
- `TABS` 常量顺序改为 `['Properties', 'Relationships', 'Views', 'Structure', 'Deployments']`（删除原有顺序中的 Contracts）
- `TabName` 类型扩展为 `typeof TABS[number] | 'Contracts' | 'Diff'`
- Contracts tab 始终在 Properties 之后渲染（有 contract 时）
- Diff tab 在 Contracts 之后、Relationships 之前渲染（仅 change-derived view 时）
- `useSessionStorage` 默认值仍为 `'Properties'`；当 activeTab 切换且对应 tab 不可用时回退到 Properties

#### Checks

- [ ] C4 Tab 顺序和条件渲染正确
  - Verifies: Model View 中无 Diff tab；change-derived view 中有 Diff tab 且在 Contracts 之后
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Expect: 测试通过

### Task 5: 面板 metamodel 行可点击弹出 diff 模态框

**Goal**: XirangArchitectureOverlay 面板中的 metamodel 行（`+ element-kind test-component` 等）改为可点击，点击后弹出模态框展示 before/after diff

**Files**:
- Create: `likec4/packages/diagram/src/overlays/element-details/MetamodelDiffModal.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`

**Requirements**:
- Metamodel 行使用 `Button` 或 `UnstyledButton` 替代 `Text`，点击打开 `MetamodelDiffModal`
- 模态框内使用左右两栏 diff 展示该条目的 `before` 和 `after` 原始内容（JSON 格式化）
- 模态框标题为条目操作和 identity，如 `+ element-kind test-component`
- 关闭模态框后状态重置

#### Checks

- [ ] C5 Metamodel 行可点击弹出 diff
  - Verifies: 点击面板中的 metamodel 行弹出模态框，展示 before/after 内容
  - Command: `cd likec4/packages/diagram && pnpm vitest run --no-isolate`
  - Expect: 测试通过