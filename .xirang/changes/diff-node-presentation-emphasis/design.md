## Context

`diff-node-presentation` 已上线四态节点视觉，但实测（`browser-change` / `complete-with-diff`）区分度不足：outline 仅 2px（ADDED/REMOVED）且颜色为 `likec4.compare.manual.outline` 解析出的暗橙 `rgb(232,89,12)`，与普通元素视觉接近；节点无徽标通道，仅靠一圈细线，在完整图/聚焦视图中 changed 与 unchanged 难以一眼区分。当前 overlay 逻辑（`architectureView.ts` 的 25/45/100 透明度 + `nodes.tsx` 的 `diffOutline` 三线型 class）保持不变，本轮只增强节点呈现通道。

## Goals / Non-Goals

**Goals:**
- 在全部 diff 呈现中让 ADDED/MODIFIED/REMOVED 节点与 unchanged 节点可一眼区分
- outline 采用醒目的橙黄描边并加粗，线型/宽度组合两两可辨
- 为 changed 节点新增左上角 `+`/`~`/`−` 徽标作为独立 diff 通道，REMOVED 徽标保持 100% 醒目
- 保持布局几何、交互能力与关系边徽标不变；导出（PNG/JPG）所见即所得
- 仅在 Semantic Delta 含 `element-declaration` 或 `relationship` 条目时启用节点/边 diff 透明度；纯 contract、requirement、property 或 kind 变化不压暗架构图

**Non-Goals:**
- 不按状态区分 outline 颜色（三态共用橙黄，状态靠线型/宽度/透明度/徽标区分）
- 不为徽标增加 hover 提示或交互行为
- 不改变 `diff-only` 的节点过滤规则
- 不调整关系边呈现

## Decisions

**1. outline 颜色直接设橙黄 `#ff9f0a`**

弃用 `likec4.compare.manual.outline`（暗橙，与普通元素接近），在 `diffOutline` 的 CSS 中直接写 `outlineColor: '#ff9f0a'`。三态共用同一橙黄，不引入"按状态分色"的颜色语义；颜色仅作为统一 diff 通道，状态区分由线型、线宽、透明度与徽标承担。

**2. 线宽加粗、线形强化**

- ADDED：3px 点线（dotted）
- MODIFIED：5px 实线（solid）
- REMOVED：3px 虚线（dashed）
- outline-offset 从 6px 提到 8px，让描边更清晰

3 与 5 的宽度差配合三种线型，在两两比较时可辨。outline 在盒外绘制，不与 kind 的 `border` 冲突；不参与布局，不影响几何。

**3. 节点徽标（新增 `NodeDiffBadge`）**

按 `data.xirang.operation` 渲染：ADDED `+`、MODIFIED `~`、REMOVED `−`。徽标为绝对定位的左上角角标（24px × 24px，橙黄底白字），`data-xirang-node-diff` 属性，**以 100% 透明度呈现**（独立于宿主节点 opacity，REMOVED 节点 45% ghost 时徽标仍醒目）。挂载到 ElementNode / DeploymentNode / CompoundElementNode / CompoundDeploymentNode 的 React Flow node wrapper 内、宿主容器外。

- 位置：左上角，与右侧的 Element Details 按钮、compound 的 expand/collapse 按钮不冲突
- 尺寸：24px × 24px，16px 加粗字形，白色描边；徽标放在节点 wrapper 左上角内部，避免视口边缘裁切
- 复用关系边徽标的字符约定（`+`/`~`/`−`），视觉语言一致
- 徽标为纯呈现元素，不捕获指针事件（`pointer-events: none`），不改变交互

**4. 宿主可投影的 delta 才启用图上 diff**

节点与关系边是架构图上的 diff 载体。下列 delta 启用 25%/45%/100% 透明度与徽标：
- `element-declaration`：直接标在对应节点
- `relationship`：标在对应边
- `requirement` / `scenario` / `property`：identity 形如 `host#...`，将 operation 投影到宿主 element 节点（例如 requirement MODIFIED → 宿主节点 MODIFIED 橙黄实线 + `~`）

仅 metamodel（`element-kind` / `relationship-kind` / `authored-view`）变化不伪造节点 diff，不压暗架构图；文本差异仍在 Element Details / DiffTab 呈现。`diff-only` 已会保留 requirement 宿主及其祖先，因此宿主节点必须带 operation，否则会出现“只剩祖先路径、却无任何强调”的空白观感。

**5. unchanged 不变**

在 diff overlay 激活时，unchanged 节点维持 25% 透明度（compound 走 `--_compound-transparency`）、无 outline、无徽标。


## Risks / Trade-offs

- [加粗 outline 外扩约 11–13px 可能贴近相邻节点] → outline 不占布局，仅视觉贴近；节点间距通常足够，apply 阶段截图验证
- [徽标与节点标题/左上角内容重叠] → 24px 徽标位于 wrapper 左上角，保持与标题和操作按钮的间距；e2e 断言尺寸、位置与可见性
- [REMOVED 徽标 100% 但宿主 45%] → 明确期望：徽标独立于宿主透明度，作为“此处有 removed”的显式标记
- [导出继承依赖 DOM 元素] → outline 走 CSS class、徽标走 DOM 元素，截图自动捕获，一次性截图验证

## Migration Plan

无数据迁移；纯客户端渲染改动，随下一次 `@likec4/spa` 与 `xirang-likec4` 构建发布。
