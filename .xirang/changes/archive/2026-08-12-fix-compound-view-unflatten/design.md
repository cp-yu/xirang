## Context

`xirang view` 的 Model View 在 LikeC4 Element View 布局前被无条件执行 `unflatten(1, false, 3)`。`unflatten` 的 `chainLimit=3` 会为 disconnected nodes 注入 invisible edges 链。当前模型新增的 `arch-outline` 是没有 Relationship 的 disconnected node，被注入 `arch_impact -> arch_outline -> arch_plan_remove [style=invis]` 等 54 条隐形约束，改变深层 compound cluster 几何后，使既有 `semantic-delta -> apply` 的 `constrains` edge 无法完成 Graphviz pathplan routing；Graphviz 返回缺少 `_draw_` 的部分 JSON，LikeC4 `parseEdgePoints` 直接抛 TypeError，整个 View 布局被丢弃（`layouted 0 of 1 views`）。

实验证据（当前 vendored Graphviz WASM 15.0.0、155 元素 / 50 条语义关系 / 38 条 visual edges）：

- 原始 DOT 直接布局：38/38 条业务边全部具有路由。
- `unflatten(1, false, 3)` 后布局：edge `14zmes4` 缺失 `_draw_`。
- `maxMinlen=0` 仅启用 `chainLimit=3`：同样失败。
- `chainLimit=0`：全部成功；`chainLimit=1/2`：当前模型恰好成功但仍是几何临界值。
- 最小差异实验：旧模型（8/5，154 元素）单独加入 `arch-outline` 即稳定复现；其余 6 个 Declaration 改写分别加入均不触发；Relationship 三元组无变化。

结论：`unflatten` 的 disconnected-node chaining 与 compound `lhead`/`ltail` routing 不兼容，属于预处理不安全，而非模型关系错误、摘要长度或 Graphviz 原始布局缺陷。

## Goals / Non-Goals

**Goals:**

- 具有 compound endpoint edges 的 Element View 布局前跳过 `unflatten`，直接使用 LikeC4 printer 生成的原始 DOT 进入官方 Graphviz layout。
- 非 compound Element View 保留现有 `unflatten` 行为不变。
- 全部节点与 visual edges 具有完整路由，修复不再依赖几何阈值。

**Non-Goals:**

- 不引入用户配置开关或模型内容规避。
- 不调整 `chainLimit` 为另一个临界值。
- 不让 `GraphvizParser` 忽略或删除缺失 `_draw_` 的 edge。
- 不引入第二套 renderer 或手工 geometry。
- 不改变 Dynamic、Deployment、Projects View 与 AI layout 路径。
- 不解决 Graphviz 对任意合法 DOT 独立失败的通用韧性。

## Decisions

### 决策 1：在 `GraphvizLayouter.dot()` 按 compound 拓扑跳过 `unflatten`

`likec4/packages/layouts/src/graphviz/GraphvizLayoter.ts` 的 `dot()` 是 Element View 布局前唯一执行 `unflatten` 的位置（`likec4/packages/layouts/src/graphviz/wasm/GraphvizWasmAdapter.ts` 的 `unflatten(dot, 1, false, 3)`）。修改为：`ElementViewPrinter.print()` 之后、`graphviz.unflatten` 之前，读取 `printer.hasEdgesWithCompounds`；为真时直接 `normalizeDot(dot)` 返回，为假时保留现有 `unflatten` 流程。判定在 `print()` 之后执行，而该拓扑在 `DotPrinter` 构造函数中已从 computed view 的 edge endpoints 建立。

替代方案（已拒绝）：

- **全局移除 `unflatten`**：非 compound 视图失去纵横比优化，影响面过大。
- **验证后回退原始 DOT**：先布局 unflattened DOT，发现缺失 spline 再布局 raw DOT。引入结果验证与重试状态，复杂度高，且只在失败后才正确；本方案在布局前即可确定性判定。
- **调整 `chainLimit` 到更小值**：`1/2` 在当前模型恰好通过，但仍是几何临界修补，与 120→25 摘要缩短同类，不构成根治。

### 决策 2：复用 `DotPrinter.hasEdgesWithCompounds` 既有判定

`likec4/packages/layouts/src/graphviz/DotPrinter.ts` 已有 `hasEdgesWithCompounds`，基于至少一条 edge 的 source/target endpoint 属于 `compoundIds`（`lhead`/`ltail` 建立），不是“视图包含 compound nodes”。该判定与语义一致：存在 compound nodes 但所有 edges 均为 leaf-to-leaf 的视图仍应保留 `unflatten`（`chainLimit` 对 leaf 链仍有压缩意义）。不新增拓扑分析。

### 决策 3：Semantic Delta 只修改 `visual-presentation` Contract

行为属于布局管线，由 `visual-presentation` 的“使用原生 LikeC4 布局管线”所在 Contract 承载，新增独立 Requirement“跳过 Compound Projection 的 disconnected-node chaining 预处理”。不新增 Element，不改 Declaration、层级、Relationship 或 Metamodel；`semantic-browser` 的“保持 LikeC4 投影有效”与“服务端计算 Runtime Projection”契约继续成立，不重复声明机制。

### 决策 4：回归测试断言布局前后 edge 对齐，而非只查幸存 edges

`parseGraphvizJson` 对 Graphviz 输出中缺失的 edge 会记录并跳过；若回归只检查 layouted 结果中“幸存 edges 的 points”，Graphviz 整条丢边时仍会假通过。真实项目回归须分别导出 layout 前后视图，比较 node/edge identities 一致（数量或 identities），再断言每条结果 edge 至少两个 routing points。同步更新既有注释中“摘要长度是根因”的过期诊断。

## Risks / Trade-offs

- [compound Model View 更宽] → 已接受的正确性优先取舍：原始 DOT 宽度约 21602，失败路径约 17579；非 compound 视图不受影响。
- [vendored LikeC4 与上游分叉] → 准备最小复现提交上游；subtree 更新时检查上游是否吸收该判断，避免永久维护重复 patch。
- [修复扩大为全局禁用] → 单元测试锁定非 compound 视图仍调用 `unflatten`。
- [source/dist/bundle 多路径假通过] → 浏览器验证前必须按序重建（先 `@likec4/layouts` dist，再 `@likec4/spa`，再 `xirang-likec4`）。

## Migration Plan

无数据迁移。部署即合并代码改动；回滚为还原 `GraphvizLayouter.dot()` 分支，不影响语义模型。
