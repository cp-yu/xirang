## Why

`complete-with-diff` 下 ADDED 与 MODIFIED 节点与 unchanged 节点外观完全一致，用户无法一眼确定什么是 diff；颜色通道已被 Element Kind 的 `nodePresentation`（color/shape/border）语义占用，需要不依赖颜色的视觉通道来凸显差异。

## What Changes

Semantic Browser 在所有 diff 呈现（`complete-with-diff`、`diff-only`、`candidate-diff`）中对节点与关系边施加四态视觉：unchanged 节点与边降至 25% 透明度，ADDED 节点以点线 outline、MODIFIED 节点以加粗 outline、REMOVED 节点以 ghost + 虚线 outline 呈现；changed 关系边维持现有 `+`/`~`/`−` 徽标。`complete` 与 `candidate`（无 diff）呈现不受影响。不引入颜色语义，不改变布局几何与交互能力。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: diff 呈现的视觉凸显——四态节点与边的差异呈现，作为"呈现 Change 目标与差异"的行为细化

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

- 代码：`likec4/packages/diagram/src/xirang/architectureView.ts`（overlay 对 unchanged 节点与边施加 opacity）、`likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`（按 `xirang.operation` 挂 outline class）、相关 CSS 样式
- 测试：`architectureView.spec.ts` 新增用例；`test/e2e/semantic-browser-model-view.spec.ts` 新增四态断言；fixture `browser-change` 若缺 MODIFIED 元素则补充
- 无 API、依赖、数据或操作面变更；PNG/JPG 导出自动继承
