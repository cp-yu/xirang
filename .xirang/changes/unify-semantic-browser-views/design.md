## Context

当前 `xirang view` 先从 Semantic Model 生成基础 `.cache-likec4/*.c4`，再由 LikeC4 parser、compute 与 Graphviz 得到基础 `modelView`。Authored View 直接使用该原生管线；Model、Candidate、Candidate Diff 与 Change-derived 内容则在浏览器端通过 `materializeXirangArchitectureView()` 重新执行 `visibleTree/diffTree`、`measure/place` 与 `createEdge`，自行生成固定网格、节点中心曲线和最终 `DiagramView`。

该分叉造成四类问题：同一语义选择在 Model 与 Authored View 中呈现质量不同；A→B 与 B→A 使用同一路径而互相覆盖；diff 颜色覆盖 Kind 业务样式；`XirangViewSource`、LikeC4 route 与 URL bridge 将 View、Candidate、Change 和显示模式混为一组 source 状态。同时，现有 watcher 只重写 runtime manifest，基础 `.cache-likec4` 在启动后不会随模型源重新生成。

本 Change 允许 breaking migration。Semantic Model 继续是唯一规范底层；LikeC4 作为派生中间表示和官方布局/渲染管线；SPA route 级 Semantic Browser Controller 作为顶层交互控制。现有 `test-change-derived-view` 仅是展示 Change-derived View 的测试 Change，不属于本 Change。

## Goals / Non-Goals

**Goals:**

- 将 Model 与 Authored View 统一为一个 Semantic Browser route 下的 View Selection，并保留 focus、下钻、就地展开、breadcrumb 与历史导航。
- 将 View Selection、单个 Change Selection 与 Presentation Mode 建模为三个正交状态。
- 让每个 runtime projection 在服务端生成原生 LikeC4 内容，并完整经过官方 parser、validator、compute-view 与 Graphviz layout。
- 使用独立 diff overlay 保留 Element 与 Relationship 的业务 presentation，并让 reciprocal Relationships 始终可分别观察和操作。
- 为 Authored View 增加 `exclude`，为 Relationship Kind 增加 Kind 级 `presentation`。
- 通过原子基础缓存重建、fingerprint 与有界 runtime projection cache 保证热更新一致性。
- Candidate 与 Candidate Diff 保持独立 Build Review 语义，同时复用统一投影基础设施。

**Non-Goals:**

- 不支持多 Change 聚合、Change range 或时间线浏览。
- 不为单个 Relationship 或单个 Authored View 增加 presentation override。
- 不保留旧 Authored View route、旧混合 source manifest、旧 URL schema 或旧 renderer 的长期兼容开关。
- 不将 runtime projection、virtual root、diff ghost、布局或交互状态写回 Semantic Model。
- 不把 Graphviz WASM 加入浏览器作为服务端失败 fallback。
- 不改变 Candidate View 与 Candidate Diff View 的 Build Review 产品语义。

## Decisions

### 1. 使用三层控制与派生结构

Semantic Model 是规范持久化层；服务端 projection service 将当前模型、Authored View、Change 与交互状态翻译为原生 LikeC4 中间内容；Semantic Browser Controller 持有顶层状态并请求 layouted projection。

选择该结构是为了复用 LikeC4 的官方 parser、compute、Graphviz routing 与后续升级。拒绝直接构造 `ComputedView`，因为其内部不变量不是稳定集成边界；拒绝继续构造最终 `DiagramView`，因为这会复制 LikeC4 的 geometry、routing 与样式默认逻辑。

### 2. 将 runtime projection 放在 LikeC4 compute/layout 之前

服务端按以下顺序处理投影：

```text
Semantic Model + View Selection + optional Change + Mode + focus/expanded
  -> visible semantic projection
  -> native LikeC4 model/view
  -> parser
  -> validator
  -> compute-view
  -> Graphviz layout
  -> DiagramView
```

`materializeXirangArchitectureView()`、`measure()`、`place()` 和中心曲线 `createEdge()` 不再是正常渲染路径。Xirang 仅通过薄适配携带稳定 identity、Contract availability、diff operation 与详情所需 metadata。

### 3. 使用分区 manifest 与单一 Browser Controller

runtime manifest 升级为 version 4，并分区表达 `model`、`authoredViews`、`changes`、可选 `candidate` 与 `candidateDiff`。不再生成混合 `sources` 数组，也不再把 Change-derived View 当作 source。

普通 Browser Controller 独立持有：

```ts
viewSelection
changeSelection
presentationMode
focus
expanded
```

Controller 负责默认值、合法性协调、URL/history、projection key、请求取消、stale response 丢弃、loading/error/retry。LikeC4 Diagram 只接收 layouted view 并上报交互事件。

Candidate 使用独立 Controller/state；它可以调用同一个 projection service，但不进入普通 Browser 的三个控件。

### 4. 删除旧 Authored View route

持久化 Authored View 定义仍位于 `.xirang/model/views/`，作为 View Selection descriptor 使用。旧 LikeC4 Authored View route、Navigation Panel 中的旧 route/source 互斥逻辑，以及 Authored route 对 Xirang URL params 的清理逻辑被移除。

新的单一 Semantic Browser route 在固定工具栏中依次显示 View Selection、Change Selection、Presentation Mode。无 Change 时后两种 diff modes 保持可见但 disabled；选择 Change 后默认 `complete-with-diff`；清除 Change 后回到 `complete`。

### 5. 使用新的 URL 与 history contract

URL 只编码 `view`、`change`、`mode` 与 `focus`。`expanded` 按 View Selection 保存在 Controller 会话和 browser history state，不进入 URL；刷新后恢复 focus 并使用默认折叠状态。

切换 View Selection 时保留仍属于新选择边界的 focus；否则回到新 View 默认 root。expanded set 与新选择求交。Change 与 mode 保持不变；没有交集时显示明确的空差异状态。

### 6. Authored View 使用 include/exclude 选择边界

`include` 形成基础选择，缺失或空 `exclude` 等价于空集合。`exclude` 优先并剪除匹配 Element 的整个 descendants 子树。Relationship 不拉入选择外邻居；endpoint 只能映射到选择中当前可见的自身或最深 ancestor。

被 include 的 Element 形成 descendants 选择闭包，focus 与展开只是显露闭包内内容，不修改持久定义。多个独立顶层选择使用非语义 virtual projection root；它只参与布局和 breadcrumb，不进入模型或 Element Details。

### 7. 使用三种 Presentation Mode

`complete` 在无 Change 时呈现当前模型，在有 Change 时呈现 after model，不添加 diff overlay。

`complete-with-diff` 呈现完整目标上下文，并在同一 before/after 联合图中保留 ADDED、MODIFIED 与 REMOVED。

`diff-only` 只保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts。View Selection 边界始终优先，不因 Change 引入选择外对象。

### 8. 使用非破坏性 diff overlay

Element 保留 Kind 的 shape、color 与 border，额外使用状态描边和角标。Relationship 保留 color、line、head 与 tail，在前景业务 edge 下方增加更宽的半透明 underlay，并在路径中部显示状态图标。

状态不能只靠颜色识别。REMOVED 对象额外降低透明度，但仍支持选中和详情。ghost 只存在于派生 LikeC4 projection，不写回 Semantic Model、Change 或 Authored View。

### 9. Relationship presentation 与 reciprocal routing

Relationship Kind 可声明可选 `presentation`，字段为 `color`、`line`、`head`、`tail`。字段和值直接复用 LikeC4 的公开合法集合，并在 Xirang parser/validator 层严格校验。缺失 mapping 或子字段时分别继承 LikeC4 默认值。

presentation 只存在于 Relationship Kind，不允许单个 Relationship 或 View 覆盖。现有 Relationship Kinds 不增加显式值。

A→B 与 B→A 保持两个独立 edge identities、样式、diff operations、labels 与详情映射。所有 Xirang source Relationships 均使用独立 visual edges；同向不同 Kind、presentation 或 diff operation 的 Relationships 也不得聚合。禁止 edge concentration 或方向合并，并使用 Graphviz 分别 routing。

### 10. 服务端 projection API 与缓存

projection request 通过 Vite plugin 提供的 `POST /__xirang/projection` HTTP middleware 传输，包含 View Selection、optional Change、mode、focus、排序后的 expanded set 与 expected model fingerprint。服务端 handler 校验 payload 与 fingerprint 后生成 projection，并返回 projection key、layouted `DiagramView` 与 diagnostics；SPA 使用独立 `HttpProjectionLoader` 调用该 endpoint，HMR 继续通过 versioned protocol event 通知 manifest 更新。

基础 `.cache-likec4` 继续持久保存显式文件清单中的生成内容。生成文件由现有常量或新增明确常量列出，不通过 glob 或模糊 pattern 判断删除目标。源变化时先在临时目录完整生成和校验，再原子替换。所有路径使用 Node.js `path.join()`、`path.resolve()` 与 normalized project-relative keys，Windows watcher 的 backslash 输入必须规范化。

runtime projection 只进入服务端有界内存 cache。模型 fingerprint 变化后旧 key 自然失效。调试模式可显式导出单个 projection 的 LikeC4 DSL/DOT，但调试输出不进入正常 watcher 输入。

### 11. HMR 与 last-known-good

watcher 合并短时间内的连续事件，再重建完整基础 LikeC4 cache、runtime manifest 与必要 fingerprints。成功替换后失效旧 projections 并发送一次 HMR 事件。

解析、验证或生成失败时保留 last-known-good cache，向 Browser 返回结构化 diagnostics，并在源修复后自动重试。正在执行的 projection request 携带 expected fingerprint；服务端拒绝旧 fingerprint，Controller 丢弃已经返回的 stale response。

### 12. Graphviz 重排与视觉锚点

每个可见 projection 独立布局，允许 Graphviz 为新内容重新优化 geometry 和 routing。Controller/Diagram 以触发展开的 Element 或当前 focus 为视觉锚点，尽量保持其屏幕位置与 viewport；其他节点平滑过渡。除首次打开或用户主动请求外，不自动 fit view。

### 13. Candidate 与导出

Candidate View 展示完整 Candidate；Candidate Diff View 固定 diff-only，不提供普通 Browser 的三个控件。两者复用 projection、Graphviz、Relationship presentation 和 diff overlay。

PNG/JPG 使用当前 layouted projection snapshot，保持 View、Change、Mode、focus 与 expanded 的所见即所得。静态导出不包含交互式 toolbar、breadcrumb 或 diagnostics chrome。直接打开导出页且无 snapshot 时保留既有默认 fallback。

### 14. 验证顺序

unit/component tests 与 typecheck 先读源码执行。Playwright 前必须先构建 `@likec4/spa`，再构建 `xirang-likec4`，因为 `xirang view` 服务预构建 bundle。desktop 与 mobile 均需验证，移动端交互不得依赖 hover。

## Risks / Trade-offs

- [首次 projection 存在 Graphviz latency] → 使用有界 projection cache、请求取消、过期响应丢弃与明确 loading；不回退旧 renderer。
- [LikeC4 DSL 或公开 API 升级] → 只通过原生内容和官方 parser/compute/layout 集成，并增加兼容测试；薄适配不依赖内部 `ComputedView` 结构。
- [模型刷新与 projection 并发产生竞态] → 请求绑定 expected fingerprint，基础 cache 原子替换，服务端拒绝旧 fingerprint，Controller 自动重试。
- [联合图中的 REMOVED ghost 被误解为目标模型对象] → 使用明确 metadata、状态图标和透明度，并保证 ghost 不进入任何持久语义。
- [删除旧 Authored route 使旧链接失效] → 接受 breaking migration，只维护新的单一 Browser URL contract。
- [Graphviz 重排造成视觉跳动] → 保持 focus/trigger viewport anchor、使用坐标过渡且不自动 fit 全图。
- [diff overlay 增加图面密度] → 业务 style 始终为前景，underlay 半透明，图标与颜色并用，并提供 `diff-only`。
- [projection 组合导致 cache 增长] → 使用有容量上限和淘汰策略的内存 cache，禁止为每个组合写磁盘。
- [完整基础 cache 重建成本高于增量更新] → 以正确性和跨分区依赖完整性优先；事件合并避免编辑过程重复重建。
- [Windows、macOS 与 Linux watcher path 表达不同] → 全部使用 Node.js path API 和 normalized project-relative keys，并在 Windows CI 覆盖 backslash 事件。

## Migration Plan

1. 先扩展 Xirang model schema、parser、serializer、comparison 与 tests，使 `exclude` 和 Relationship Kind `presentation` 可被完整往返处理。
2. 将基础 LikeC4 generator/presentation adapter 扩展到新选择和样式字段，并建立原生 runtime projection service。
3. 引入 version 4 分区 manifest 与 Semantic Browser Controller，再迁移 Diagram、Contract/details 与 Candidate consumers。
4. 用新的固定 toolbar 和 URL adapter 替换旧 source selector、Authored routes、`ViewHistoryBridge` 与浮动 Change 面板。
5. 切换 Model/Authored/Change/Candidate 到统一 projection service，并删除正常路径中的自制 geometry/routing。
6. 完成 cache/HMR、export snapshot、跨平台与浏览器验证后移除旧 manifest/route/rendering contracts。

回滚只能以整个 Change 的代码回滚完成；不保留运行时双实现开关。

## Open Questions

- None
