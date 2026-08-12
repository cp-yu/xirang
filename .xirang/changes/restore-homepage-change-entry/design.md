## Context

Semantic Browser 单一路由化（`unify-semantic-browser-views`）后，`likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx` 的 `manifestToSources` 只派生 Model、Authored Views、Candidate 与 Candidate Diff，活动 Change 不再暴露给首页；`likec4/packages/likec4-spa/src/routes/_single/single-index.tsx` 的 "Active Changes" 区块随重构被移除。当前活动 Change 只能通过视图页内 Change Selection 下拉进入，首页无法快速发现与点击。Semantic Model 契约明确活动 Changes 只存在于 Change Selection 维度（"只列出真实 Views"、"使用分区 Runtime Manifest"），因此入口恢复不能把 Change 并入 View source 列表。

## Goals / Non-Goals

**Goals:**

- 首页恢复活动 Change 快速入口卡片，点击一步进入该 Change 的 `diff-only` 差异审查
- 保持既有 Candidate 卡片行为不变
- 遵守"活动 Changes 不作为 View source 枚举"的契约与既有 spec 约束

**Non-Goals:**

- 不改变 Change Selection、Presentation Mode 等控制器状态机的行为
- 不为每个 Change 创建独立 View source、route 或持久 identity
- 不改变模型、Metamodel、Relationships 或 Authored Views

## Decisions

### 1. 通过独立 `changes` 通道暴露活动 Change

在 `XirangViewSourceContextValue` 上新增只读字段 `changes: readonly XirangChangeSource[]`，与 `sources` 并列；provider 从 `manifest.changes` 派生，默认 context value 为 `[]`。`manifestToSources` 保持不变，既有的 "keeps change input separate from view source identities" spec 断言（changes 无 `id`/`source`、不进入 sources 列表）继续成立。

备选：首页直接读 `useSemanticBrowserController()` 的 manifest——但该 provider 在 manifest 未加载时不挂载，`useSemanticBrowserController` 会抛错，需要新增安全访问 hook，侵入更大，未采用。

### 2. 首页卡片以 URL 状态打开单一 route

`single-index.tsx` 新增 "Active Changes" 区块与 `ChangeDerivedViewCard`，样式与信息对齐既有 `CandidateViewCard`（label、Valid/Invalid 徽标、ADDED/MODIFIED/REMOVED 计数、ERROR 诊断）。点击执行 `navigate({ to: '/view/$viewId/', params: { viewId: 'model' }, search: previous => ({ ...previous, view: 'model', change: <name>, mode: 'diff-only' }) })`。

- 显式 `view: 'model'`：防止上一跳转残留的 `view=candidate` 污染新状态（候选视图会钳制 changeSelection 为 null）
- 显式 `mode: 'diff-only'`：从首页进入是全新 route mount，URL 同步会以 `search.mode` 的 schema 默认值 `complete` 覆盖控制器模式；必须显式携带 `diff-only` 才能稳定呈现差异投影
- 导航后由既有 `SemanticBrowserRouteSync` 与投影服务端接管，Change 审查面板随 change 选中自动出现

### 3. 测试维护

`test/e2e/semantic-browser-candidate-views.spec.ts` 是既有的首页入口 spec（"shows candidate cards on the landing page"），新增用例覆盖 Change 卡片：首页可见 `browser-change` 卡片 → 点击 → URL 含 `change=browser-change&mode=diff-only`、diff-only 差异节点与 Change 审查面板可见。desktop + mobile 双 project 运行。既有用例不改动。

## Risks / Trade-offs

- `changes` 是新增只读 API 面：默认空数组、不参与选择状态机，无破坏性；`XirangChangeSource` 类型已由 `@likec4/diagram` 导出，无需新增导出
- `diff-only` 丢失上下文是用户已确认的行为取舍；需要完整上下文时用户可在视图页内切回 `complete` / `complete-with-diff`
- 首页卡片呈现的是 manifest 编译时的 diff 计数快照，Change 内容变化后随 manifest 订阅自动刷新，无额外机制
