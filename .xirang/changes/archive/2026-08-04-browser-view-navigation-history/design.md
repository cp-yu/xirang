## Context

Semantic Browser 以单一 `/view/model/` 路由承载全部 Xirang source（Model View、Candidate View、Candidate Diff View、Change-derived View），Authored View 是独立 LikeC4 路由。当前导航状态分布三处：focus 存于 diagram state machine（`focusIdentity` + 内存 `navigationHistory`），source 存于 `XirangViewSourceContext`（`runtime.select`），full/diff mode 是 `XirangArchitectureOverlay` 的局部 React state。下钻（双击）、breadcrumb 跳转、source 切换、full/diff 切换均不产生 URL 历史；浏览器前进/后退只响应 View 路由变化。约束：不改 diagram state machine、不改双击/breadcrumb/下拉交互入口，嵌入式浏览器 `isRpcAvailable=false` 走 `ViewReact.tsx`。

## Goals / Non-Goals

**Goals:**
- 将 `source`、`focus`、`mode` 编码为 `/view/model/` 的持久 URL 查询参数，URL 成为导航状态的单一事实源。
- 下钻、breadcrumb 跳转、source 切换、full/diff 切换均为浏览器历史步；前进/后退按 URL 恢复导航状态。
- 下钻与 breadcrumb 层级导航在全部 Xirang source 可用，与既有"支持分层语义浏览"契约一致。
- 双向同步不产生循环、不产生重复历史条目；深链（带参数 URL）可恢复导航状态。

**Non-Goals:**
- 不改变 View identity、Element 层级、Relationships、Metamodel 或 Authored Views。
- 不重写 diagram state machine 的导航历史，不改 `DiagramUI` 的交互入口。
- 不改变 Authored View 路由语义（其不承载 Xirang 导航参数）。
- 不改 `?focusOnElement=`、`?relationships=` 等瞬态参数语义。

## Decisions

### 1. URL 编码采用查询参数而非路径段

`/view/model/?source=<id>&focus=<identity>&mode=full|diff`；缺省 source 为 `model`、缺省 focus 为 Project Root、缺省 mode 为 `full`。`candidate` 恒为 `full`、`candidate-diff` 恒为 `diff`（无切换），仅 Change-derived View 可切 mode。

- 替代方案：把 focus 作为路径段（`/view/<focus>/`）——与固定 View identity 语义冲突，破坏单一 View identity，弃用。
- 理由：查询参数与现有 `searchParamsSchema` 机制一致，改动最小。`source`/`focus`/`mode` 加入 schema，并注册进根路由 `stripSearchParams`（`source: 'model'`、`mode: 'full'`、`focus: undefined`）：TanStack Router 会把带 `.default()` 的 search 参数注入 URL，`stripSearchParams` 仅剥离等于默认值的参数，使 URL 保持规范（根 focus 下钻 URL 为 `?focus=<id>`、change source URL 为 `?source=change:<name>`），非默认导航状态不被剥离。

### 2. 双向桥架构（URL 单一事实源 + 镜像）

新增 SPA 组件 `ViewHistoryBridge`，单向各一：

- **diagram/runtime → URL**：观察 `focusIdentity`、`runtime.selected.id`、mode 变化，按 push/replace 规则写 URL。
- **URL → diagram/runtime**：观察 `source`/`focus`/`mode` 参数变化（含 popstate），驱动 `diagram.focusWithinView()` / `diagram.navigate('back'|'forward')` / `runtime.select()` / mode setter；参数与当前状态一致时 no-op 防循环。

- 替代方案 A：全量走 URL（双击/breadcrumb/toggle 改为发事件给 SPA 统一 navigate）——一致性强但需跨包事件通道，侵入大，弃用。
- 替代方案 B：仅内存历史 + URL 单向镜像——浏览器与面板两套历史易漂移，不满足"前进后退被响应"的一致性，弃用。
- 理由：镜像层只读现状、只补 URL 通道，不重写交互入口；防循环用"值相同 no-op"，历史一致性用相邻步检测。

### 3. push/replace 规则

| 导航操作 | URL 动作 |
|---|---|
| 下钻（双击 compound） | push `focus` |
| breadcrumb 跳转 | push `focus` |
| 面板 back/forward 引起 focus 变化 | replace（新 focus 命中内存历史相邻步） |
| full/diff 切换 | push `mode` |
| source 切换 | push `source`，focus 重置为 root 并入同一步（replace 落参） |
| view/source 变化触发的 focus reset | replace |

相邻步判定抽为纯函数 `matchHistoryNeighbor(history, currentIndex, focusIdentity)`：命中 `history[currentIndex±1].focusIdentity` 时面板 back/forward 已移动内存索引，URL 用 replace 避免产生重复条目。push/replace 分类抽为纯函数 `classifyFocusUrlChange`，两者均单测覆盖。

### 4. mode 提升到 `XirangViewSourceContext`

`XirangViewSourceContextValue` 增加 `mode`/`setMode`；`XirangArchitectureOverlay` 的 `useState<'full'|'diff'>` 改为读 context。SPA 桥从 URL 驱动 `setMode`，toggle 按钮仍留在 overlay 调 `setMode`。理由：mode 当前在 diagram 包内、无对外 API，提升到现有 context 是侵入最小的受控化路径。

### 5. 全 Xirang source 的下钻/breadcrumb（无门控改动）

`XirangArchitectureOverlay` 的下钻、Ctrl+click 展开与 breadcrumb 门控保持 `currentView.id === 'model'`：`materializeXirangArchitectureView` 返回 `{...modelView}` 保持 View identity 为 `model`，全部 Xirang source（Model/Candidate/Candidate Diff/Change-derived）都在 `/view/model/` 路由下渲染，该门控在行为上等价于"仅限 Xirang architecture 视图"，因此无需修改代码。breadcrumb 对全部 Xirang source 渲染。diff-only 布局以 diff root 为准（`materializeXirangArchitectureView` 既有行为），focus 参数仍携带于 URL 并尽力呈现。

### 6. Authored View 路由剥离 Xirang 导航参数

导航到非 `model` View 路由（Authored View）时，`source`/`focus`/`mode` 参数不作用于该 View 且不泄漏到其 URL（`onNavigateTo` 对非 Xirang 路由清理这三个参数）。

### 7. 桥逻辑拆分与复用

- `ViewHistoryBridge` 放在 `ViewReact.tsx`；`ViewEditor.tsx`（RPC/HMR 开发模式）复用同一组件，保持行为对等。
- 不改 diagram state machine；只调用现有公开 API（`focusWithinView`、`navigate('back'|'forward')`、`useDiagramSelector`、`useOnDiagramEvent`）。
- 纯函数放独立模块（如 `likec4-spa/src/xirang/history-bridge.ts`）供单测。

## Risks / Trade-offs

- [双向同步循环（URL ⇄ diagram 互相触发）] → 参数与当前状态一致时 no-op；相邻步检测避免重复导航。
- [面板 back/forward 与浏览器历史产生重复条目] → 相邻步命中用 replace。
- [diff-only 下 focus 仅尽力呈现] → 接受：布局以 diff root 为准是既有确定性行为，URL 仍携带 focus，full 模式完整呈现。
- [状态更新顺序竞态（source 切换后 focus reset 与 URL 写入交错）] → 桥对 view/source 变化记录"刚切换"标记，期间 focus 变化一律 replace，避免生成独立历史步。
- [ViewEditor（HMR）路径无自动化覆盖] → Xirang 生产走 ViewReact；对等复用，仅一次性人工验证。

## Migration Plan

1. 合并本 Change 后，Semantic Browser 的 URL 开始携带导航参数；旧 URL（无参数）等价于默认状态，向后兼容。
2. 无需数据迁移；无持久化 schema 变化。
3. 回滚：移除桥组件与 schema 参数即可恢复现状，不影响模型与既有测试断言外的功能。

## Open Questions

- 无阻塞项。`focusOnElement`/`relationships` 瞬态参数与新增持久参数共存，互不干扰。
