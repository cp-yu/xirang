## Context

当前 Element Details 面板的 tab 组织方式无法有效支持 Change-derived View 的语义变更查看需求。Properties tab 展示的 summary 和 description 与 declaration 字段重叠，Contracts tab 同时展示 diff 和 after-content 导致信息混杂，缺少独立的变更差异视图。

## Goals / Non-Goals

**Goals:**
- Properties tab 全局展示 declaration 字段（kind、parent、title、definition），移除 summary，标签 "description" → "definition"
- Contracts tab 全局只展示更新后的 contract after-content
- Diff tab 仅在 change-derived view 中出现，展示 declaration 和 contract 的左右两栏 before/after diff
- Tab 顺序全局统一：Properties → Contracts → Diff → Relationships → Views → Structure → Deployments
- 面板 metamodel 行可点击弹出模态框展示 before/after diff

**Non-Goals:**
- 不修改任何 semantic model 内容
- 不修改 diagram node 上的 summary 展示（保留在节点 tooltip 中）
- 不修改 Model View 或 Authored View 的 tab 结构（无 Diff tab）
- 不引入新的后端 API 或数据源

## Decisions

### 1. Diff tab 仅对 change-derived view 可见

通过 `runtime.selected.source === 'change-derived-view'` 条件判断，Model View 和 Authored View 不渲染 Diff tab。

### 2. Declaration diff 逐字段比较

将 `XirangDiffEntry` 中 element-declaration 的 `before`/`after` 对象解析为字段列表（kind、parent、title、definition），逐字段比较标记 changed/unchanged。definition 字段使用 `createTextDiff` 做行级 diff。

### 3. Contract diff 复用已有结构化 diff

`getStructuredContractDiff` 和 `createTextDiff` 已存在且成熟，Diff tab 的 contract diff 部分直接复用，将其从 ContractsTab 迁移到 DiffTab。

### 4. 左右两栏布局

使用 CSS Grid 两栏布局，左列 Before、右列 After。changed 字段使用 amber/yellow 背景高亮，definition 文本使用 `TextDiff` 组件（已有）。

### 5. Metamodel diff 模态框

使用 @mantine/core 的 `Modal` 组件，内嵌左右两栏 diff 展示 metamodel 条目的 `before`/`after` 原始内容。点击面板中的 metamodel 行触发打开。

### 6. 不存在语义模型变更

本变更为纯 UI 改动，不涉及 Semantic Model 变化，因此无 Semantic Delta 条目。

## Risks / Trade-offs

- **Low**: Diff tab 中 declaration 的 definition 字段若内容很长，两栏布局可能导致水平滚动。权衡：使用 `TextDiff` 组件（行级 diff）并允许纵向滚动，不强制横向对齐。
- **Low**: Metamodel diff 模态框的打开不涉及路由或状态持久化，关闭后状态丢失可接受。
- **Low**: Tab 顺序变更影响全局，需确保所有现有引用（如 `setActiveTab` 默认值）与新顺序一致。