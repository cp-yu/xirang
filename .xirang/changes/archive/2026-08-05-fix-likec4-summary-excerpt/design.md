## Context

`src/core/likec4/definition.ts` 的 `definitionExcerpt(definition)` 把 Element Definition 的规范化第一段截断为 `EXCERPT_LIMIT`（原 120）Unicode code points，作为 LikeC4 视图节点标签正文（`generateLikeC4`）与浏览器 `projectBrowserDeclaration` 的 summary。当前模型 147 个元素中 124 个顶满 120 截断，节点标签宽度大且不均。

LikeC4 对 element view 的布局固定先执行 graphviz `unflatten`（`-l 1 -c 3`，`GraphvizLayoter.dot()`）再执行 `dot`。在该图（8 层嵌套 cluster + 跨 cluster 隐形链边）上，unflatten 重排后部分底部 cluster 包围盒退化（如 `cluster_propose` 仅 70pt 宽却不含其子节点），复合边 `propose_role -[responsible_for]-> propose`（`lhead=cluster_propose`）等 4 条边路由失败（pathplan: triangulation failed / source point not in any triangle），graphviz 对该边不输出 `_draw_`，`GraphvizParser.parseEdgePoints` 对 `undefined._draw_.filter()` 抛 TypeError，整个 `model` 视图布局失败。

## Goals / Non-Goals

**Goals:**
- 使 `view model` 视图可成功布局并渲染，不再出现 "layouted 0 of 1 views"。
- 保持 Element Contract 完整 Definition 不受影响（`description` 字段与详情面板仍完整呈现）。
- 仅通过 `definitionExcerpt` 的单一参数（`EXCERPT_LIMIT`）达成，不做结构性改动。

**Non-Goals:**
- 不改变 Element 层级、Relationships、Metamodel、Views 或 Semantic Model。
- 不修改 vendored LikeC4 布局管线（unflatten、`parseEdgePoints` 防御）——影响面大，另立 Change。
- 不按视图拆分 `view model`。

## Decisions

### 1. 摘录上限调整为 25 Unicode code points

`EXCERPT_LIMIT` 由 120 调整为 25。实测（真实中文文本、全 147 元素、所有 element kinds）：
- ≤25 码点：布局稳定成功；30 码点起失败；28 为边界附近（26/28 成功、30 失败），25 留安全边际。
- 全部替换为 `short`（5 码点）亦成功，但显示过短；25 是兼顾可读性与安全性的取值。

- 替代方案 A：仅改 LikeC4 布局（关闭 unflatten 或对 `_draw_` 缺失做防御）——根治 graphviz 布局 bug，但修改 vendored `likec4/` 与布局行为，影响面大，不在本 Change 范围。
- 替代方案 B：拆分巨型 `view model`——改变 View 结构，超出"参数修复"范围。
- 理由：触发条件是节点标签宽度分布与 unflatten 重排的几何共振（实测非单调、对任意单节点宽度变化敏感，属刀锋状态）；收缩标签是唯一可由单一参数达成的修复路径。

### 2. 完整 Definition 仍通过 description 呈现

`definitionExcerpt` 只作用于 summary 投影；`description` 字段始终携带完整 Definition 原文，浏览器详情面板与 Contract 展示不受影响。

## Risks / Trade-offs

- [刀锋状态非单调] → 实测 25 在边界（28–30）之下留 3–5 码点余量，当前模型稳定；模型持续演进后如再次出现布局退化，需另立 Change 走替代方案 A（布局管线防御）。
- [summary 显示变短] → Browser 与 LikeC4 节点标签摘要从 120 减至 25 码点，可读性下降；Element Details 与 Contract 面板仍展示完整 Definition，语义不损失。
- [测试同步] → `generator.test.ts` 的 excerpt 边界用例由 120 改为 25（24/25 不截断、26 截断），并新增两条回归守卫：`generator.test.ts` 断言生成产物中每个 summary 不超过 25+`...`；`generator-validate.test.ts` 对真实项目 Semantic Model 生成并完整布局，断言全部边均有路由点（无缩小 fixture 可复现该布局 bug，仅完整项目几何触发，故读真实模型）。
