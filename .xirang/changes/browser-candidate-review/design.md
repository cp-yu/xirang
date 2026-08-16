## Context

Semantic Browser 的 Candidate 审查路径目前有三个相互放大的呈现缺陷：

1. Change 审查面板（`DiagramUI.changeDetailsPanel`）只有 `right` 定位、无宽度，被拉伸到 `maxWidth` 上限（1280 视口下 1248px），整宽横跨画布；Edera candidate-diff 的 48 条 Metamodel 条目逐条平铺成整墙按钮，无法定位单条修改。
2. `xirang-projection-handler` 对 `candidate` / `candidate-diff` 无条件 include 全部 Element（Edera 实测 84 节点全展开），且 `isInteractiveBrowserSource` 排除 candidate 来源，focus 下钻、就地展开、Shift+N 全部禁用——与 Model View 的折叠基线交互不一致。
3. `expandXirangRelationshipEdges` 把 LikeC4 布局已聚合好的多关系 edge 拆成几何完全相同的独立视觉边（重叠线 + 叠压 label），diff 徽标按"首条 changed Relationship"单字符呈现，合并后多条关系的差异信息丢失。

探索阶段已确认的设计决策：面板 Metamodel 三点分组（Kind / Relationship / View）且总数 > 6 折叠、`[...]` 聚合 label 合并线、合并边徽标聚合计数、Candidate 折叠基线、Candidate Diff 变更驱动可见集合。

## Goals / Non-Goals

**Goals:**
- Candidate 审查回到"汇总 → 点开看细节"形态：面板收缩、Metamodel 分组折叠；合并线 + 聚合徽标。
- Candidate / Candidate Diff 与 Model View 的 focus、下钻、breadcrumb、就地展开交互保持一致。
- 合并后每条关系的详情与 diff state 仍可在悬停 popover / 关系详情中分别查看。

**Non-Goals:**
- 不改 Change-derived View 的 Mode 语义与 Model View 行为；不改首页卡片、导出、Contract 投递、Candidate 校验与 promotion。
- 不新增持久化配置面：分组阈值、分组顺序为 diagram 源码常量。
- 不为 reciprocal（A→B 与 B→A）关系做合并——两个方向仍独立成边。

## Decisions

1. **面板宽度**：`changeDetailsPanel` 增加 `width: 'max-content'`，保留 `maxWidth` 安全帽。备选固定宽度被拒绝：诊断文本长短不一，内容驱动更稳。
2. **Metamodel 分组**：在 `DiagramUI` 中新增纯函数 `getMetamodelGroups(entries, threshold)`，固定分组顺序 `element-kind`（Kind）、`relationship-kind`（Relationship）、`authored-view`（View），每组按 operation 统计 `+N ~N −N`；阈值常量 `METAMODEL_COLLAPSE_THRESHOLD = 6`：总数超过阈值时渲染汇总行（单组互斥展开，点击就地平铺该组条目），否则保持现有平铺。备选按组独立阈值被拒绝：同面板两种样式并存，复杂且无实际收益。点击条目仍打开现有 `MetamodelDiffModal`。
3. **Candidate 投影基线**：`xirang-projection-handler` 删除 candidate/candidate-diff 的 include-all 分支，走与 Model View 相同的标准分支（focus + direct children + expanded 后代；无 focus 时根子级 + expanded）。`DiagramUI` 将 `isInteractiveBrowserSource` 扩展到 candidate/candidate-diff（ctrl+点击展开、双击下钻、Shift+N），breadcrumb 条件从 `source === 'semantic-model'` 扩展到 Candidate 来源。备选"仅折叠不启用交互"被拒绝：没有交互的折叠基线会把用户困在根层。
4. **Candidate Diff 可见集合**：把 change-derived diff-only 现有的 boundary 逻辑（changed + ancestors + relationship endpoints + removed ghosts，focus 内收窄）泛化到 `candidate-diff`（`source.diff` 存在时）；diff 为空时回退根子级基线，避免 include 空集合落入全量图。removed ghosts 需要在画布上渲染 before-only 元素，因此 `src/core/view.ts` 为 Candidate Diff 镜像 change-derived view 的 before-after union sources（`diffArchitecture` / `diffLikec4Sources` / `diffLikec4ElementPaths` / `diffSourceFingerprint`，来自 formal+candidate 并集模型）。大型 Candidate 的并集模型可能超出 Graphviz 路由容量，此时投影确定性回退到 candidate-only target sources，removed ghosts 在回退中丢弃。unchanged 上下文 dim 规则沿用现有 `applyXirangPresentationOverlay`。
5. **关系边合并**：`expandXirangRelationshipEdges` 改为不再拆分（重命名 `applyXirangRelationshipPresentation`）：单条关系保留该 Kind 的 color/line/head/tail 呈现与 label；多条关系保留 LikeC4 布局原边（label `[...]`、`xirangRelations` 全量三元组），不改变 edge id 与 geometry。子元素可见性聚合由 LikeC4 `clean-connections` 在服务端完成，popover 的 DIRECT / RESOLVED FROM NESTED 分组继续生效。备选"仅 nested 场景合并"被拒绝：与 LikeC4 原生行为分叉且复杂度更高。
6. **合并边徽标聚合**：`applyXirangPresentationOverlay` 按边聚合各三元组的 diff operation 计数，写入 metadata `xirangRelationCounts`（`added,modified,removed`）；`readXirangProjectionEdge` 解析为 `xirang.relationCounts`。`RelationshipEdge` 在仅一条 changed Relationship 时保留现有单字符 glyph 与 `data-xirang-edge-diff` aria-label；多条时以节点徽章同款三色小徽标并排渲染在 label 上方（绿色 `+N`、琥珀 `~N`、红色 `−N`，仅非零项）。
7. **测试基线**：fixture candidate diff 只有 7 条条目且无多关系对，合并线与聚合徽标以 Vitest 单测覆盖，真实规模呈现用 Edera 一次性验证（不新增持久化 fixture）。

## Risks / Trade-offs

- [合并线丢失 per-kind 线条呈现] → 单关系边保留 Kind 呈现；多关系边的 kind 语义经 popover / 关系详情按三元组呈现。
- [合并边 mixed diff state 曾被"首条变更"误标] → 聚合计数徽标如实呈现；仅一条 changed Relationship 的边保持旧单字符形式，既有 e2e aria-label 断言不受影响。
- [candidate e2e 用例语义改变] → 用例按新基线语义改写（断言根子级可见、深级元素需展开/下钻），改写是设计目标而非迁就实现。
- [fixture 无多关系对，合并线缺 e2e] → Vitest 覆盖数据与渲染逻辑，Edera 一次性验证覆盖真实规模呈现。
- [超长诊断文本仍可能把面板顶到 maxWidth] → 保留 `maxWidth` 安全帽，面板在内容驱动宽度内收缩。
- [Candidate 投影请求缓存] → 服务端 projection cache 以 request（含 focus/expanded/viewId）为 key，基线变化自然产生新 key，无陈旧缓存风险。
- [超大 Candidate 并集模型超出 Graphviz 路由容量] → 投影确定性回退到 candidate-only target sources，removed ghosts 丢弃；回退路径有单测覆盖，回退后仍保证差异集合可见。

## Migration Plan

无数据迁移。部署即生效；回滚即恢复旧呈现（行为由前后端代码同时决定，需一起回滚）。

## Open Questions

无。

## Post-implementation Decision

实现完成后，在 Edera 真实 Candidate（685 条 diff entries / 84 nodes / 首次 build）的实际验证中发现：本 Change 对 Candidate Diff View 所采用的"变更驱动可见集合"（Decision 4）在首次 build 场景下退化为全量展开，与"汇总 → 点开看细节"的目标相悖。层级基线（方案 A）虽修复了退化问题，但仍是两个独立 View 的补丁方案。

**更优方向（将作为新 Change 推进）**：将 Candidate 视为 Change without Plan，直接复用 Change 的三态 presentation mode（`complete` / `complete-with-diff` / `diff-only`），移除独立的 `candidate-diff` View identity 与 manifest 字段，Candidate 默认以 `complete-with-diff` 打开（完整目标模型 + diff overlay）。此方向消除了 Candidate / Change 的呈现分叉，也从根本上解决了 union sources 膨胀与 Graphviz 容量问题（`complete-with-diff` 使用 target sources，REMOVED ghosts 通过叠加层实现）。

本 Change 的实现（层级基线 + 交互解锁 + 关系边合并 + Metamodel 面板分组）作为过渡态保留，相关基础设施（union sources、diff overlay、breadcrumb 扩展、面板折叠）将在新 Change 中继续沿用。
