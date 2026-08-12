## Why

Semantic Browser 单一路由化后，首页（`/` → `/single-index/`）只保留 Model/Authored Views 与 Candidate 卡片，活动 Change 的入口被移除：change-derived 内容只能通过视图页内的 Change Selection 下拉进入，无法从首页快速发现与点击。本次变更恢复首页对活动 Change 的快速入口，与既有 Candidate 卡片并列，使用户能从首页一步进入 Change-derived 差异审查。

## What Changes

首页新增 "Active Changes" 区块：为每个活动 Change 呈现一张卡片（名称、Valid/Invalid 状态、ADDED/MODIFIED/REMOVED 计数与诊断信息），点击后以 `change=<name>&mode=diff-only` 状态打开单一 Browser route，由既有 Controller 与投影服务端呈现 diff-only 投影与 Change 审查面板。活动 Change 仍只存在于 Change Selection 维度，不形成独立 View source，也不并入 View Selection 列表。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `semantic-browser`: 首页为 Candidate View、Candidate Diff View 与每个活动 Change 提供快速入口卡片，点击以对应 `view`/`change`/`mode` 状态打开单一 route（Change 默认 `diff-only`）

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

- `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`: `XirangViewSourceContextValue` 新增独立的 `changes` 通道（与 `sources` 并列），`manifestToSources` 保持不变
- `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`: 新增 Active Changes 区块与 Change 卡片组件
- `test/e2e/semantic-browser-candidate-views.spec.ts`: 新增首页 Change 卡片点击直达 diff-only 的用例（desktop + mobile）
- `playwright.config.ts`: desktop/mobile 项目 grep 白名单注册新用例标题（否则新用例不会执行）
- `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`: 投影更新视口锚点改为仅在存在真实 focus 时生效（修复首页点击进入 change-derived view 后白板）
- 无新依赖、无数据或配置变更
