## Why

Candidate 被建模为独立的 View 入口（`candidate`、`candidate-diff`），导致其无法复用 Change 的三态 Presentation Mode 控件，且 Candidate 的浏览编排语义（View × Change × Mode 三维正交）散落在各子系统的特殊分支中。将 Candidate 统一进 Change Selection、以 reserved identifier `'candidate'` 参与三维正交编排，可消除这一人为分裂，并从根本上解决 union sources 膨胀超出 Graphviz 容量的问题（`complete-with-diff` 使用 target sources，无需 union）。此变更为 **BREAKING**，不提供向后兼容。

## What Changes

- **BREAKING**：Candidate 从 View Selection 移至 Change Selection，以 reserved identifier `'candidate'` 参与三态 Mode（`complete` / `complete-with-diff` / `diff-only`），默认 `complete-with-diff`。
- **BREAKING**：URL 参数 `view=candidate` 与 `view=candidate-diff` 废弃，新路径为 `change=candidate&mode=<mode>`。
- `derived-views`、`candidate-derived-view`、`candidate-diff-derived-view`、`change-derived-views` 四个 Element 从 Semantic Model 中删除；`model-view` parent 从 `derived-views` 迁移至 `view-composition`。
- 新增 `semantic-browser`（parent: `web`），统一建模三维正交编排语义，包含 Candidate 作为 Change Selection 特殊选项的行为规范。
- Runtime manifest 删除 `candidateDiff` 字段；`candidate` source 结构与 Change source 对齐，携带 `diff`、`diffArchitecture`、`diffLikec4Sources` 等字段。
- 删除前端、后端所有 `candidate-diff` 特殊分支，陈旧代码一并清除。

## Source Impact

### Behavior Source

#### Modified Specs

- `web`：修改 `呈现 Change 目标与差异`（`complete-with-diff` 使用 change-only target sources，REMOVED ghosts 仅在 diff-only 呈现）；修改 `呈现 Candidate 目标与差异`（Candidate 现在通过 Change Selection 呈现，支持三态 Mode）；修改 `首页提供 Candidate 与活动 Change 快速入口`（Candidate 以 Change 方式展示）；修改 `提供三维独立控制`（Change Selection 现在包含 Candidate 选项）；修改 `支持分层语义浏览`（Candidate 不再作为独立 View）；修改 `focus 失效时确定性回退`（Candidate 作为 Change Selection 时的回退语义）。
- `xirang-projection-service`：修改 `使用分区 Runtime Manifest`（删除 `candidateDiff`，`candidate` 结构对齐 Change source）；修改 `服务端计算 Runtime Projection`（`change=candidate` 路由到 `manifest.candidate`，走三态投影逻辑）；修改 `Candidate source 按输入刷新`（只刷新 `candidate`，无 `candidateDiff`）；修改 `分层呈现 Element Definition`（删除 Candidate Diff View 引用）。
- `xirang-diff-overlay`：修改 `呈现语义差异视觉表达`（Candidate 与 Change 统一，complete-with-diff 使用 target sources）；修改 `合并呈现 Requirement 差异`（删除 Candidate Diff View 引用）；删除 `固定呈现 Candidate diff-only 差异`（Candidate 不再锁定 diff-only，由三态 Mode 控件管理）。
- `xirang-contract-delivery`：修改 `通过 Contract 接口加载 Element Contract`（删除 `候选 Diff Contract` 场景，`change=candidate` 时路由至 `manifest.candidate.contracts`）。

### Architecture Source

- `view-composition`（MODIFIED）：parent 不变，Definition 更新，移除 Derived View 概念，改为 authored-views 与 model-view 并列。
- `model-view`（MODIFIED）：parent 从 `derived-views` → `view-composition`，Definition 移除对 Candidate View 的引用。
- `semantic-browser`（ADDED）：parent: `web`，建模三维正交编排语义。
- `derived-views`（REMOVED）
- `candidate-derived-view`（REMOVED）
- `candidate-diff-derived-view`（REMOVED）
- `change-derived-views`（REMOVED）

## Impact

- `src/core/view.ts`：删除 `ViewRuntimeCandidateView`、`ViewRuntimeCandidateDiffView`；新增 `ViewRuntimeCandidateSource`；manifest 删除 `candidateDiff` 字段。
- `likec4/packages/vite-plugin/src/xirang/`：`xirang-projection-handler.ts` 删除 `candidate-diff` 特殊分支，`change=candidate` 走三态路径；`xirang-contract-handler.ts` 删除 `candidate-diff` 类型；`plugin.ts` 删除 `candidateDiff` sourceEntries。
- `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`：删除 `candidate`/`candidate-diff` 作为 viewSelection 的所有特殊路径；`validChanges` 增加 `'candidate'`；`defaultMode` 对 candidate 返回 `complete-with-diff`。
- `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`：Candidate 在 Change 列表中展示。
- `likec4/packages/diagram/src/`：`DiagramUI.tsx`、`ContractLoaderContext.tsx` 删除 `candidate-diff` source 特殊处理。
- 受影响测试：`SemanticBrowserController.spec.ts`、`xirang-projection-handler.spec.ts`、`xirang-contract-handler.spec.ts`、`ContractLoaderContext.spec.tsx`、`HttpContractLoader.spec.ts`、`test/core/view.test.ts`、`test/e2e/semantic-browser-candidate-views.spec.ts`、`test/e2e/semantic-browser-model-view.spec.ts` 全面更新。
