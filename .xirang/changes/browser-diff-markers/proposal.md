## Why

Change-derived View 中单击 ADDED 元素的详情面板为空（标题显示 FQN、kind/tags 全空、无 Diff 标签页），因为详情面板用 LikeC4 FQN 而非语义 identity 查询 diff 与 architecture，且 ADDED 元素不在基础 LikeC4 model 中。同时节点 `+ ~ −` 标记语义混用：requirement 级变更错误地给宿主元素打单字符徽章，元素级操作与 contract 级变更无法区分。

## What Changes

- 详情面板以投影节点携带的语义 identity 解析 declaration 与 diff，ADDED 元素（含 `complete` 模式）显示 Properties、Contracts、Diff 标签页与真实标题，不再出现空面板或 FQN 标题。
- 节点 diff 标记分层：element-declaration 操作由 outline（点线/实线/虚线）表达；requirement 级变更按宿主元素聚合为计数徽章 `+N`/`~N`/`−N`，同一元素可同时呈现，三色区分，元素级与 contract 级信号不再混用。
- 右上角 `+N ~N −N` 面板计数改为仅统计结构级变更（element-declaration 与 relationship）。
- 未变节点 25% dimming 仅在存在结构级 diff 时激活。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: diff overlay 四态视觉区分改为 outline 表达元素级操作、计数徽章表达 requirement 级变更，面板计数改为结构级统计。
- `change-derived-views`: ADDED 元素的详情面板通过投影节点语义 identity 解析，单击打开同样显示 declaration 内容与投影支持的标签页。

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

- `likec4/packages/diagram/src/xirang/architectureView.ts`：diff 操作与 requirement 计数拆分。
- `likec4/packages/diagram/src/xirang/projectionNode.ts`：投影节点 metadata 携带 requirement 计数。
- `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`：计数徽章渲染。
- `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`：面板计数改为结构级。
- `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`：语义 identity 解析与简化卡片触发条件。
- Vitest specs 与 `test/e2e/semantic-browser-model-view.spec.ts` 更新与新增用例。
