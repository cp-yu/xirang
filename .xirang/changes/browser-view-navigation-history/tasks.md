### Task 1: URL 导航参数 schema 扩展

**Goal**: 在 `searchParamsSchema` 增加持久 `source`/`focus`/`mode` 查询参数，支持深链恢复。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/searchParams.ts`
- Modify: `likec4/packages/likec4-spa/src/routes/__root.tsx`
- Test: `likec4/packages/likec4-spa/src/searchParams.spec.ts`

**Requirements**:
- `source`（string，缺省 `model`）、`focus`（string，可选）、`mode`（`full`|`diff`，缺省 `full`）作为持久查询参数加入 schema
- 三个参数注册进根路由 `stripSearchParams`（`source: 'model'`、`mode: 'full'`、`focus: undefined`），仅剥离等于默认值的参数以保持 URL 规范
- 携带参数的 View URL 可解析出对应导航状态

#### Checks

- [x] C1 验证参数解析
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "深链定位导航状态"
  - Command: `pnpm --dir likec4 test -- packages/likec4-spa/src/searchParams.spec.ts`
  - Expect: 新增 source/focus/mode 解析断言全部通过

### Task 2: URL⇄导航状态桥

**Goal**: 新增 ViewHistoryBridge 与可单测纯函数，双向同步 URL 参数与 diagram/runtime 导航状态。

**Files**:
- Create: `likec4/packages/likec4-spa/src/xirang/history-bridge.ts`
- Create: `likec4/packages/likec4-spa/src/xirang/ViewHistoryBridge.tsx`
- Test: `likec4/packages/likec4-spa/src/xirang/history-bridge.spec.ts`
- Modify: `likec4/packages/likec4-spa/src/pages/ViewReact.tsx`
- Modify: `likec4/packages/likec4-spa/src/pages/ViewEditor.tsx`

**Requirements**:
- 观察 `focusIdentity`/`runtime.selected`/mode 变化按 push/replace 规则写 URL；下钻与 breadcrumb 跳转 push，面板相邻步与 view/source 切换内 focus reset replace
- 观察 URL 参数变化（含 popstate）驱动 `focusWithinView`/`navigate('back'|'forward')`/`runtime.select`/mode setter；参数与当前状态一致时 no-op 防循环
- `matchHistoryNeighbor` 与 `classifyFocusUrlChange` 为可单测纯函数

#### Checks

- [x] C1 验证桥纯函数
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "浏览器前进后退恢复导航状态"
  - Command: `pnpm --dir likec4 test -- packages/likec4-spa/src/xirang/history-bridge.spec.ts`
  - Expect: 相邻步命中与 push/replace 分类断言全部通过
- [x] C2 验证桥组件接入
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "下钻与 breadcrumb 跳转作为历史步"
  - Command: `pnpm --dir likec4 typecheck`
  - Expect: ViewReact 与 ViewEditor 均挂载 ViewHistoryBridge，typecheck 通过
- [ ] C3 开发模式人工验证（一次性，无持久测试）
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "下钻与 breadcrumb 跳转作为历史步"
  - Command: `pnpm --dir likec4/packages/likec4-spa dev` 启动后手动下钻并执行浏览器前进/后退
  - Expect: ViewEditor（RPC/HMR）路径下导航历史正常、编辑流程不回归

### Task 3: mode 提升与全 source 层级导航

**Goal**: full/diff mode 改为 context 受控并由 URL 驱动；下钻与 breadcrumb 在全部 Xirang source 可用。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Modify: `likec4/packages/diagram/src/index.ts`
- Test: `likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`

**Requirements**:
- `XirangViewSourceContextValue` 增加 `mode`/`setMode`；overlay 的局部 `useState` 改为读 context
- 下钻/Ctrl+click 展开/breadcrumb 的 `currentView.id === 'model'` 门控保持现状——全部 Xirang source 均在该 View identity 下渲染，行为等价于"仅限 Xirang architecture 视图"，无需代码改动
- breadcrumb 对全部 Xirang source 渲染；diff-only 布局仍以 diff root 为准

#### Checks

- [x] C1 验证 context mode 受控
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "full/diff 切换作为历史步"
  - Command: `pnpm --dir likec4 test -- packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`
  - Expect: mode 读写断言通过
- [x] C2 验证 diagram 包改动可编译
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "下钻与 breadcrumb 跳转作为历史步"
  - Command: `pnpm --dir likec4/packages/diagram typecheck`
  - Expect: ContractLoaderContext 与 DiagramUI 改动 typecheck 通过

### Task 4: e2e 导航历史验证

**Goal**: 更新与新增 e2e，覆盖 URL 历史步、浏览器前进/后退、source 与 full/diff 切换、Authored View 参数剥离。

**Files**:
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Create: `test/e2e/semantic-browser-navigation-history.spec.ts`

**Requirements**:
- 下钻后 URL 含 `focus=<identity>`；`page.goBack()`/`page.goForward()` 恢复 focus、breadcrumb 与可见节点
- source 切换为历史步且 focus 重置并入同一步；full/diff 切换为历史步
- Authored View 路由不携带 Xirang 导航参数
- 新增测试名匹配既有 playwright desktop/mobile grep 模式

#### Checks

- [x] C1 验证下钻 URL 与浏览器前进后退
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "下钻与 breadcrumb 跳转作为历史步"
  - Command: `pnpm likec4:build && pnpm test:e2e -- -g "browses Model View through nested focus"`
  - Expect: 下钻后 URL 含 `focus=`，goBack/goForward 恢复 focus 与 breadcrumb
- [x] C2 验证 source 与 full/diff 切换历史步
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "source 切换作为历史步"
  - Command: `pnpm likec4:build && pnpm test:e2e -- -g "keeps View source"`
  - Expect: source 切换产生历史步且 focus 同一步重置；full/diff 切换产生历史步
- [x] C3 验证 Authored View 参数剥离
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "Authored View 不携带导航参数"
  - Command: `pnpm likec4:build && pnpm test:e2e -- -g "keeps View source"`
  - Expect: Authored View URL 不含 source/focus/mode 参数
