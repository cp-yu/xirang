## Why

当前 Change-derived View 的 Element Details 面板无法直观查看 declaration 和 contract 的变更差异；Properties tab 展示的 summary 与 declaration 字段重叠；Contracts tab 混杂了 diff 与 after-content。用户无法在单一视图中比较变更前后完整语义。

## What Changes

- **Properties tab（全局）**：展示 declaration 字段（kind、parent、title、definition），移除 summary，将 "description" 标签改为 "definition"
- **Contracts tab（全局）**：移除 structured diff，只保留更新后的 contract after-content
- **Diff tab（新增，仅 change-derived view）**：左右两栏展示 declaration 和 contract 的 before/after diff
- **Tab 顺序（全局）**：Properties → Contracts → (Diff) → Relationships → Views → Structure → Deployments
- **Metamodel diff**：面板中 metamodel 行可点击，弹出模态框展示 before/after diff

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `change-derived-views`: 新增 Element 级别的 declaration 和 contract 的 before/after diff 查看能力

### Architecture Source

None

## Impact

- `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx` — tab 顺序、Properties 内容、新增 Diff tab 条件渲染
- `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx` — 移除 structured diff 段
- `likec4/packages/diagram/src/overlays/element-details/DiffTab.tsx`（新建）— declaration + contract 左右 diff
- `likec4/packages/diagram/src/overlays/element-details/MetamodelDiffModal.tsx`（新建）— metamodel diff 模态框
- `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx` — metamodel 行可点击
- `likec4/packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx` — 更新测试
- `likec4/packages/diagram/src/overlays/element-details/DiffTab.spec.tsx`（新建）— 新增测试