## Why

`diff-node-presentation` 已实现不依赖颜色的四态节点视觉，但在 `browser-change` 的实际观察中区分度不足：ADDED/MODIFIED/REMOVED 节点与 unchanged 节点难以一眼区分。根因是 outline 线宽过细（ADDED/REMOVED 仅 2px）、描边颜色偏暗（`likec4.compare.manual.outline` 解析为暗橙，与普通元素视觉接近），且节点没有像关系边那样的 `+`/`~`/`−` 徽标作为独立 diff 通道。用户需要在完整图与聚焦视图中都能立即识别哪些节点被新增、修改或移除。

## What Changes

Semantic Browser 在全部 diff 呈现（`complete-with-diff`、`diff-only`、`candidate-diff`）中强化节点四态视觉：节点 outline 统一改用醒目的橙黄描边（`#ff9f0a`）并加粗 —— ADDED 3px 点线、MODIFIED 5px 实线、REMOVED 3px 虚线，outline 距节点 8px；同时为 ADDED/MODIFIED/REMOVED 节点新增左上角 `+`/`~`/`−` 徽标，徽标以 100% 透明度呈现（REMOVED 节点整体 45% ghost 时徽标仍保持醒目）。unchanged 节点与边维持 25% 淡出且无 outline。不改变关系边徽标、布局几何与交互能力，不为徽标引入新的 kind 颜色语义。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: "呈现 Change 目标与差异"的行为细化 —— 节点 diff 视觉从"仅细线 outline"增强为"橙黄加粗 outline + 节点徽标"的复合通道

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- 代码：`likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`（outline 颜色/线宽/线形调整 + 新增 `NodeDiffBadge` 徽标组件并挂载到四类节点容器）、`likec4/packages/diagram/src/base-primitives/element/ElementNodeContainer.tsx` 与 `compound/CompoundNodeContainer.tsx`（如徽标需要挂载点）
- 测试：`architectureView.spec.ts` 无需变更（overlay 逻辑不变）；`test/e2e/semantic-browser-model-view.spec.ts` 四态断言新增徽标可见性与线宽断言
- 无 API、依赖、数据或操作面变更；PNG/JPG 导出自动继承
