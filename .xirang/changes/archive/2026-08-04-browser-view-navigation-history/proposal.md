## Why

Semantic Browser 中 focus 下钻、source 切换与 full/diff 切换目前只改变运行时状态，不产生 URL 历史；浏览器原生前进/后退无法沿这些导航步返回，用户只能依赖 breadcrumb 与面板按钮，导航历史不可分享、不可深链、不可前进后退。

## What Changes

将 Semantic Browser 的导航状态编码到 URL 查询参数（`source`、`focus`、`mode`），并把下钻、breadcrumb 跳转、source 切换与 full/diff 切换呈现为浏览器历史步；浏览器前进/后退按 URL 恢复对应导航状态。下钻与 breadcrumb 层级导航在所有 Xirang source（Model View、Candidate View、Candidate Diff View、Change-derived View）可用，与既有"支持分层语义浏览"契约一致；Authored View 路由不携带 Xirang 导航参数。不改变 View identity、Element 层级或语义模型本身。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: 新增"URL 编码导航状态并响应浏览器前进后退"承诺——下钻、breadcrumb 跳转、source 切换与 full/diff 切换均为 URL 历史步，浏览器前进/后退按 URL 恢复 focus、source 与 mode，且同步不产生循环或重复历史。

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

- **likec4-spa**：`searchParamsSchema` 增加持久 `source`/`focus`/`mode` 参数；`ViewReact.tsx`（及 `ViewEditor.tsx` 对等复用）新增 URL 桥组件做导航状态双向同步。
- **diagram 包**：`XirangArchitectureOverlay` 的 full/diff mode 从局部 state 提升为 URL 驱动；移除下钻/breadcrumb 的 Model View 限定；`ContractLoaderContext` 暴露 mode 状态。
- **测试**：`test/e2e/semantic-browser-model-view.spec.ts` 下钻 URL 断言更新；新增浏览器前进/后退、source 切换、full/diff 切换历史步 e2e；`searchParams.spec.ts` 与桥纯函数单测；新增 e2e 测试名匹配既有 playwright desktop/mobile grep 模式，无需改 grep 列表。
