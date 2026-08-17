## Context

当前 Semantic Browser 将 Candidate 建模为独立 View 入口（`view=candidate` / `view=candidate-diff`），导致三个系统性问题：

1. **呈现分叉**：Candidate 无法复用 Change 的三态 Mode 控件（complete / complete-with-diff / diff-only），必须维护独立的 `candidateDiff` manifest 字段与 `candidate-diff` source 类型。
2. **Graphviz 容量问题**：`candidate-diff` 的 diff-only 模式使用 formal+candidate union sources 渲染 removed ghosts，在 Edera 规模（84 nodes / 685 diff entries）下触发 Graphviz triangulation failure，强制回退到 candidate-only sources，丢失 removed ghosts。
3. **结构层次混乱**：`derived-views`、`candidate-derived-view`、`candidate-diff-derived-view`、`change-derived-views` 把 View 入口（model-view）、呈现编排能力（change-derived-views）和被呈现对象（candidate）混在 `views` 层，不符合各概念的语义边界。

## Goals / Non-Goals

**Goals:**
- Candidate 作为 `change: 'candidate'` 参与 Change Selection，复用三态 Mode 控件，默认 `complete-with-diff`。
- `view-composition` 只保留 `authored-views` 和 `model-view`，结构清晰。
- `semantic-browser`（parent: web）统一建模三维正交编排语义。
- `complete-with-diff`（Change 与 Candidate 一致）使用 change-only / candidate-only target sources，彻底消除默认模式下的 Graphviz union 压力。
- 删除所有 `candidate-diff` 特殊路径与陈旧代码（Breaking Change，不做向后兼容）。

**Non-Goals:**
- 不改变 Candidate promotion、validation、`xirang candidate` 命令面的行为。
- 不改变 Authored Views 的声明与呈现逻辑。
- 不为旧 URL（`view=candidate` / `view=candidate-diff`）做重定向。
- 不在 `complete-with-diff` 下通过 overlay 注入 removed ghosts；removed ghosts 仅在 `diff-only` 的 union sources 中可见（与 Semantic Delta 一致，见 Decision 3 的偏差说明）。

## Decisions

1. **`change: 'candidate'` 作为 reserved identifier**：服务端 projection handler 识别 `request.change === 'candidate'` 时路由到 `manifest.candidate`，而非 `manifest.changes['candidate']`。这保持了投影请求 schema 不变（`{viewId, change, mode, focus, expanded}`），只需服务端增加一条路由分支。备选"新增独立字段"被拒绝：增加 schema 复杂度且无实质收益。

2. **合并 `ViewRuntimeCandidateView` / `ViewRuntimeCandidateDiffView` 为 `ViewRuntimeCandidateSource`**：与 `ViewRuntimeChangeDerivedView` 结构对齐，包含 `diff`、`diffArchitecture`、`diffLikec4Sources` 等字段，但不含 `changePlan`（Candidate 无 Change Plan）。`buildCandidateSources` 只返回一个统一对象，manifest 删除 `candidateDiff` 字段。

3. **`complete-with-diff` 使用 target-only sources**：`complete-with-diff` mode 下 diff overlay 叠加在 Change 或 Candidate 的 target projection 上，可见节点与边以 outline、badge、dim 标记差异；removed ghosts 不再通过 union sources 布局，仅在用户主动选择的 `diff-only` 模式（formal+change / formal+candidate union sources）中呈现。这消除了默认模式 `complete-with-diff` 下大规模 union 的主要 Graphviz 触发路径。

   > **偏差说明**：初稿方案（overlay 注入 removed ghosts）被 Semantic Delta 取代——xirang-diff-overlay 与 web 的 Delta 只要求标记可见节点与边（`diff-only` 保留 removed ghosts），因此本 Change 不实现 overlay ghost 注入能力。Change-derived View 的 `complete-with-diff` 源选择也从 union 切换为 target-only，与 Candidate 一致，这是由 Delta 授权的行为变更。

4. **`semantic-browser` Contract 描述三维正交编排**：`view-selection`、`change-selection`、`presentation-mode` 不独立建模为 Element，合并到 `semantic-browser` 的 Requirements 中描述。这些维度耦合紧密（Mode 依赖 Change Selection，View Selection 决定 Change 是否可用），独立 Element 只会增加维护负担而不提升表达能力。

5. **删除 `derived-views` 中间层**：`model-view` 直接作为 `view-composition` 的子元素，与 `authored-views` 并列。`derived-views` 在只剩 `model-view` 一个子元素后没有存在意义。

6. **陈旧代码一并清除**：`effectiveModeForSource` 的 candidate-diff 特殊分支、`ContractLoaderContext` 的 `candidate-diff` source 类型、`single-index.tsx` 的 candidateSources 过滤、`xirang-contract-handler` 的 `candidate-diff` 路由全部删除。不保留兼容层。

## Risks / Trade-offs

- [`diff-only` 模式下 union sources 的 Graphviz 压力依然存在] → `diff-only` 是用户主动选择的模式，而非默认；`complete-with-diff` 作为默认消除了最常见的大图触发路径。用户进入 `diff-only` 时若 union 失败，仍有 candidate-only fallback。
- [`complete-with-diff` 下 removed ghosts 不可见] → removed ghosts 仅在 `diff-only` 可见；这是 Semantic Delta（xirang-diff-overlay、web）授权的行为，Change 与 Candidate 一致。
- [Change-derived View 的 complete-with-diff 行为变更] → `complete-with-diff` 从 union sources 切换为 target-only sources，REMOVED elements 不再在该模式显示；这是 Delta 的统一三态语义所要求，不是仅针对 Candidate 的特殊处理。
- [旧 URL 直接失效] → Breaking Change，已确认不做向后兼容。用户需手动更新书签。
- [manifest 结构变化影响已有缓存] → `assertXirangManifest` 版本校验拒绝旧结构，无运行时错误；开发环境重启 `xirang view` 即可。

## Migration Plan

无数据迁移。代码删除即生效，回滚需代码回滚。测试全面重写。

## Open Questions

无。
