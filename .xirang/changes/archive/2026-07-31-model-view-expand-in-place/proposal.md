## Why

Model View 只能以 focus 下钻逐层浏览，用户无法在同一层同时看到多个层级，难以在一屏内建立跨层级的整体认识。同时 `semantic-browser` 的 Element Contract 规范要求 Perspective 使用 `component` shape，而实现使用 `document`，规范与实现存在偏离，必须以 Semantic Delta 收敛。

## What Changes

- Model View 增加就地展开（expand-in-place）：展开状态是整个 View 的全局集合，下钻与前进后退只改变 focus，不重置展开集合。
- **BREAKING** 单击有 children 的 Element 不再下钻；下钻改为双击，就地展开/折叠改为 Ctrl+点击，Shift+N 展开至 N 层、Shift+0 折叠全部。
- 当前层的定义从 focus 与 direct children 扩展为 focus、direct children 与展开集合内的递归后代；Relationship endpoint 相应映射到最深可见 Element。
- Perspective 的呈现 shape 规范由 `component` 收敛为 `document`，与 Perspective 颜色区分共同保证其视觉可辨识。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `model-view`: 当前层可包含展开后代；新增就地展开的交互与全局展开状态承诺
- `semantic-browser`: 分层浏览的当前层定义、Relationship endpoint 映射深度、Perspective shape

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- None

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- `likec4/packages/diagram/src/xirang/architectureView.ts`：布局改为递归测量与放置，`materializeXirangArchitectureView` 接受展开集合
- `likec4/packages/diagram/src/likec4diagram/state/`：`Context` 新增 `expandedNodes`，新增 `expand.toggle`、`expand.set`、`xyflow.nodeDoubleClick` 事件与 `nodeDoubleClick` 发射事件
- `likec4/packages/diagram/src/likec4diagram/DiagramXYFlow.tsx`：转发 `ctrlKey`、接入双击、抑制多击序列中的第二次 click
- `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`：交互改写与 Shift+N 键盘处理
- `test/e2e/semantic-browser-model-view.spec.ts` 与 `playwright.config.ts`：下钻改双击并新增展开用例
- vendored LikeC4 源码改动后必须执行 `pnpm --dir likec4 build`，否则 CLI 与浏览器仍加载旧 `dist/`
