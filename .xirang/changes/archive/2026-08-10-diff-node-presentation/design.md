## Context

`applyXirangPresentationOverlay`（`likec4/packages/diagram/src/xirang/architectureView.ts`）是 diff 呈现的唯一入口：当前只有 REMOVED 节点被压到 45% 透明度（ghost），ADDED/MODIFIED 节点只写 `xirangOperation` metadata 而无视觉样式；关系边带 `+`/`~`/`−` 徽标（underlay 描边 0.28、徽标文字本身 100%）。因此 `complete-with-diff` 下 diff 节点与 unchanged 节点外观一致。约束：Element Kind 的 `nodePresentation` 已占用 color/shape/border 语义，diff 标记不能走颜色通道。

## Goals / Non-Goals

**Goals:**
- 在全部 diff 呈现（`complete-with-diff`、`diff-only`、`candidate-diff`）中让用户一眼确定 diff 节点与边
- 视觉通道与 kind 颜色正交，不改变布局几何与交互能力
- 导出（PNG/JPG）所见即所得地保留四态视觉

**Non-Goals:**
- 不区分 ADDED/MODIFIED 的二级语义（由 diff 摘要与 Element Details 承担）
- 不为 dim 节点增加 hover 提亮等交互增强
- 不改变 `diff-only` 的节点过滤规则

## Decisions

**1. 四态视觉系统（不依赖颜色）**

unchanged 节点与边 25% 透明度且无 outline；ADDED 100% 透明度 + 点线 outline；MODIFIED 100% 透明度 + 加粗 outline；REMOVED 45% ghost + 虚线 outline；changed 边保留徽标。三个线型（点线/粗实线/虚线）与三个透明度层级（25/45/100）构成两两可辨的四态。

- 备选：仅 dim（识别最强但上下文导航弱）、仅 outline（上下文保留但 diff 突显弱）。选择 dim + outline 组合，同时建立"哪些被改"与"哪些没改"的对比。

**2. 以 `source.diff` 存在与否作为统一开关，不改 mode 传递链路**

`complete` 模式下 `source.diff` 被剥离（`ContractLoaderContext.tsx` 的 `!showDiff` 分支），`complete-with-diff`、`diff-only`、`candidate-diff` 均携带 `source.diff`。因此 overlay 内判定"diff 激活"即可统一覆盖三个 diff 来源，无需把 `effectiveMode` 传入 overlay。

**3. outline 通过节点容器 CSS class 实现，复用既有 outline 机制**

按 `data.xirang.operation`（`diagram-view.ts` 已挂载）给 ElementNode / DeploymentNode / CompoundElementNode / CompoundDeploymentNode 容器加 3 个 CSS class，复用 `compoundHasDrifts` 的 CSS outline 先例（outline 在盒外，不与 kind 的 `border` 冲突）。

**4. 边处理**

unchanged 边在 overlay 中压到 25%（当前 overlay 未处理边 opacity，需新增）；changed 边徽标已是 100% 无需改动，underlay 保持 0.28。

**5. 导出自动继承**

导出复用同一 view 对象与节点组件：dim 走 `node.style.opacity`，outline 走 DOM CSS class，均被截图捕获，无需额外导出逻辑。

## Risks / Trade-offs

- [整图上下文压暗削弱导航位置感] → 切回 `complete` 模式即可恢复；dim 节点保持可交互
- [导出继承依赖"outline 走 CSS class"的假设] → 一次性截图验证 PNG/JPG 导出
- [fixture `browser-change` 缺 MODIFIED 元素导致四态无法全覆盖] → 在 fixture 补充一个 MODIFIED 元素（新增，不改既有用例）
- [outline 与 kind border 视觉叠加可能过重] → outline 走盒外 CSS outline，线型与 kind 的 border 可区分；若叠加过重在 apply 阶段微调

## Migration Plan

无数据迁移；纯客户端渲染改动，随下一次 `@likec4/spa` 与 `xirang-likec4` 构建发布。

## Open Questions

无（设计已全部确认）。
