## Context

Semantic Browser 的 Change-derived View 由服务端从 union LikeC4 sources 计算投影（`xirang-projection-handler.ts`），SPA 侧的基础 `LikeC4Model` 仍由 vite plugin 从基础语义模型 sources 构建。ADDED 元素只在投影与 union model 中存在，不在基础 model 中。当前 `ElementDetailsCard` 用 LikeC4 FQN 同时查 `findElement`、diff entries 与 architecture declarations：FQN（如 `root.realization...artifact_authoring`）与语义 identity（`artifact-authoring`）永不相等，三处查询全部落空，面板退化显示 FQN 标题与空属性。投影节点已通过 `applyXirangPresentationOverlay` 携带 `metadata.elementId`（语义 identity）与 `xirangOperation`。

diff 徽标现状：`operationByIdentity`（`architectureView.ts`）为 element-declaration 之外提供 host-contract 回退，requirement 级变更会给宿主元素打 `~` 徽章；节点徽章是单字符 `+`/`~`/`−`，无法表达同一元素多类 requirement 变更，也无法区分元素级与 contract 级变更。

## Goals / Non-Goals

**Goals:**
- 单击/详情按钮打开 ADDED 元素时，详情面板显示真实 title/kind/parent/definition 与 Properties、Contracts、Diff 标签页，`complete` 模式同样生效。
- 节点 outline 只表达 element-declaration 级操作；requirement 级变更以三色计数徽章 `+N`/`~N`/`−N` 表达，可共存。
- Change 面板 `+N ~N −N` 只统计结构级 diff（element-declaration + relationship）。
- dimming 只在存在结构级 diff 时激活。

**Non-Goals:**
- 不改变服务端 manifest / diff entries / LikeC4 sources 生成逻辑。
- 不改变 relationship 边的 `+`/`~`/`−` 徽标。
- 不在详情面板头部增加徽章。
- 不改动 CLI、Semantic Model 存储或其他视图。

## Decisions

1. **详情面板用投影节点携带的语义 identity 解析**：`openElementDetails`（`machine.actions.ts`）从投影节点 `data.xirang.identity` 读取语义 identity，经 details actor（`actor.ts`/`ElementDetails.tsx`）传入 `resolveElementDetails` 作为最高优先级输入；`nodeModel.$node.metadata` 与 elementModel metadata 作为回退。
   - 关键依据：SPA 的基础 `LikeC4Model` 不包含 ADDED/投影元素，`viewModel.findNode(fromNode)` 对投影节点返回 null，单靠卡片内 `nodeModel` 查找无法取得 identity；而详情 actor 在 `openElementDetails` 中已持有投影节点 data，透传 identity 是唯一可靠的解析路径（e2e 实测验证：不传 identity 时单击 ADDED 元素面板仍显示 FQN）。
   - 备选 A（仅靠卡片内 `nodeModel.metadata` 解析）：对投影节点 `findNode` 落空，无法工作，拒绝。
   - 备选 B：让 SPA 的 LikeC4Model 包含 union model——破坏“投影节点不依赖 base-model 查找”的既有架构约定，拒绝。
2. **简化卡片触发条件改为"不在 base model 且有 declaration"**：`isAddedElement` 依赖 diff entries 的 ADDED 判定改为 `elementModel === null && declaration !== null`。diff 存在时 ADDED 判定仅影响是否显示 Diff 标签页；`complete` 模式（diff 被剥离）下仍显示 Properties + Contracts。
3. **徽章分层**：`architectureView.ts` 将 `operationByIdentity` 拆为 element-op（仅 element-declaration，供 outline 与 opacity）与 per-element requirement 计数（按 `host#name` 聚合 `requirement` entries；scenario/property 不计）。计数对所有元素统一计算（含 ADDED/REMOVED），非零即渲染——统一代码路径，符合确认的方案 3。
4. **徽章传输**：`xirangProjectionMetadata` 扩展 `xirangRequirementCounts`；`readXirangProjectionNode` 支持"无 element op 仅有计数"的节点返回 xirang data（否则 contract-only 变更的节点拿不到徽章数据）。
5. **颜色**：`+N` 绿 `#2f9e44`、`~N` 琥珀 `#ff9f0a`（沿用）、`−N` 红 `#e03131`。outline 保持橙黄，样式（点线/实线/虚线）区分操作。
6. **dimming 与面板计数**：`diffActive` 与 `getArchitectureOverlayModel` 的计数都只基于 element-declaration + relationship entries；移除 host-contract 回退。面板计数因此与 outline 语义一致，requirement 级变更只体现在节点徽章与 Diff 标签页。
7. **测试策略**：
   - Persistent：`architectureView.spec.ts` 更新 host-contract 用例（无 outline、计数 metadata 正确）并新增计数/dimming 用例；`projectionNode.spec.ts` 扩展 counts-only 解析；`ElementDetailsCard` 的 identity 解析抽成纯函数并新增 spec；`getArchitectureOverlayModel` 计数新增 spec；e2e 更新 `+`/`~`/`−` 徽章断言为 `+2`/`~1` 等计数形态，新增单击 ADDED 元素打开详情面板用例。
   - Obsolete tests：`architectureView.spec.ts` 中 "marks the host element MODIFIED when only its contract requirement changes" 由新语义用例取代；e2e 既有 `[data-xirang-node-diff]` 断言全部改为计数徽章断言。

## Risks / Trade-offs

- [e2e 断言遗漏] 既有徽章断言散落在多个用例中，改语义后可能漏改 → 全量重跑 Playwright 桌面+移动端，按失败清单逐条修正，不用旧断言迁就新行为。
- [Playwright 读旧 bundle] typecheck/单测通过不代表浏览器行为更新，`xirang-likec4` 服务的是预构建 SPA bundle → 按固定顺序重建 `@likec4/spa` → `xirang-likec4` 后再跑 e2e。
- [ADDED 元素显示 requirement 计数可能视觉冗余] 方案 3 的已知取舍，已由用户确认；计数徽章只在非零时渲染。
- [颜色硬编码] 使用固定色值；若后续设计系统提供 diff token 可再迁移，本次不引入新依赖。
