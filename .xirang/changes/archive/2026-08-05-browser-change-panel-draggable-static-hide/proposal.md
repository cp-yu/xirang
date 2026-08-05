## Why

Semantic Browser 的浮动 Change 面板（`XirangArchitectureOverlay` 的「Change / …」面板，含 View source 选择、Full/Diff 切换、操作计数与 Plan 文档入口）当前固定定位，用户无法在 diagram 容器内移动它；同时该面板与 breadcrumb 由 `LikeC4DiagramUI` 无条件渲染，在静态渲染上下文——首页视图卡片、侧边栏视图悬停预览、PNG/JPG 导出图——错误地浮现在每个视图之上。面板是浏览器控制层 UI，不应成为视图内容或导出产物的一部分。

## What Changes

将浮动 Change 面板改为可通过面板头部手柄在 diagram 容器内拖动，拖动 SHALL NOT 触发画布平移、不干扰面板内控件交互；在静态渲染上下文（首页视图卡片、侧边栏视图悬停预览、PNG/JPG 导出图）SHALL NOT 呈现浮动 Change 面板与 breadcrumb。交互式页面（如 `/view/model/`）中的面板呈现与功能保持不变。不改变 View identity、Element 层级、Relationships、Metamodel 或语义模型本身。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: 新增"浮动 Change 面板可拖动"与"静态渲染上下文不呈现浮动 Change 面板"两项承诺。

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

- **diagram 包**：`DiagramFeatures` 新增 `enableStaticView` 能力位（默认 false）；`LikeC4Diagram` 新增 `static?: boolean` prop 映射到该能力位；`XirangArchitectureOverlay` 在静态模式下不渲染浮动面板与 breadcrumb（hooks 保持注册，仅 JSX 不输出），面板包 framer-motion `drag` 实现拖动。
- **likec4-spa**：`ExportPage` 的 `LikeC4Diagram` 置位 `static`，导出图不包含浮动面板。
- **测试**：新增 e2e——首页 `/` 视图卡片无 `data-xirang-architecture-overlay`、`/view/model/` 面板可见且头部可拖动；现有 `semantic-browser-navigation-history`、`contract-browser` e2e 全绿回归。
