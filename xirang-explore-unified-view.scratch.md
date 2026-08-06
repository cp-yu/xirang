# Xirang Semantic Browser 统一 View 体验 — Explore 临时草稿

> **状态：临时 conversation scratch，非持久化制品。**
> 本文件仅用于在 Explore 期间避免遗忘已确认内容；不代表任何持久语义。
> 最终权威输出是 conversation-only 的 Design Summary；Propose 会把结论分别路由到
> Element Contract（`elements/<identity>.md`）、Metamodel（`metamodel/<kind>.md`）、
> Authored View（`views/<view>.md`）与 `design.md`。
> 本文件不创建 Definition Framing record，也不修改 `.xirang/` 下任何模型或 Change 文件。
> 草稿完成后可删除本文件。

---

## 0. 目标仓库与问题

- 目标：当前 OpenSpec 工作区中的 Semantic Browser / LikeC4 实现。
- 外部参考样本（仅可复现，不是修改目标）：
  `/home/yunxin/Documents/Code/tools/screenAnswer/.xirang/model/views/app-overview.md`。
- 问题：默认 Model View 与 Authored View 尽管内容等价、都经 xirang-likec4 处理，
  呈现质量却明显不同（节点布局、关系线 routing）。

## 1. 根因证据（已核实）

- **两条不同渲染路径**：
  - Authored View：直接使用 LikeC4/Graphviz 生成的节点几何与 edge routing。
  - Model View / Candidate / Change-derived View：进入
    `materializeXirangArchitectureView()`，用固定尺寸网格自行排节点，用节点中心间的
    三次曲线自行造 edge；只借用原始 `modelView` 的样式/identity，不使用 Graphviz 几何。
  - 关键文件：`src/core/likec4/generator.ts`、
    `src/core/likec4/presentation-adapter.ts`、
    `likec4/packages/diagram/src/xirang/architectureView.ts`（`createEdge` /
    `materializeXirangArchitectureView`）、`likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`。
- **双向关系被覆盖**：双向关系按 `source|target` 聚合，两条 edge 都存在，但
  `createEdge()` 对 A→B 与 B→A 生成同一条中心路径，后绘制线完全覆盖前一条
  → 用户只能看见一个方向。
- **diff 样式冲突**：diff 目前直接以 green/amber/red 覆盖 node/edge 的业务颜色；
  新增可配置 Relationship Kind 颜色后会产生冲突。
- **缓存不刷新**：已有文件 watcher 只重写 runtime manifest；基础
  `.cache-likec4/*.c4` 只在启动时生成一次 → 模型文件修改后 Authored View 的
  LikeC4 数据不更新（不是“周期性刷新”缺失，而是 watcher 不重新生成基础缓存并触发 HMR）。

## 2. 术语（已确认）

- **View Selection**：View 当前选择哪些 Elements 与 Relationships（来自完整 Model，
  或来自 Authored View 的 `include` / `exclude`）。
- **Presentation Mode**：如何呈现选择 —— `complete`、`complete-with-diff`、`diff-only`。
- **Change Selection**：当前关联的单个 Change；无 Change 时 Presentation Mode 只能是 `complete`。
- **Authored View**：用户持久化声明的 View（正式概念名，保持不改）；“authorized”
  只作为用户授权来源的说明，不是该语义对象的名称。
- 注意：不是 LikeC4 的 “scoped view / view scope”（该词含义更窄，指
  `view <name> of <element>` 与关系浏览器的 global/view 范围）；`content scope` 在
  LikeC4 中无对应正式概念。

## 3. 统一 View 使用体验与布局管线（已确认）

- 目标：综合两者 —— **保留 Model View 的交互体验**（focus、下钻、就地展开、
  breadcrumb、前进后退），**采用 Authored View 的布局与关系线质量**。
- 不应按 Model View / Authored View / Change View 分裂渲染路径；而应把
  **View Selection（选择）**、**Presentation Mode（内容模式）**、**布局与交互** 作为正交维度。
- `all`、`all + diff highlight`、`diff only` 应是同一套 View projection 的三种内容模式。
- **每个可见 runtime projection 独立交给 LikeC4/Graphviz 布局和 routing**：
  `View Selection + focus + expanded set + Presentation Mode + optional Change`
  先形成确定性 visible semantic projection，再转成 LikeC4 ComputedView 和 DiagramView。
- 使用模型 fingerprint、View Selection、Change、mode、focus、expanded set 组成确定性的
  projection key；相同 projection 复用缓存结果。
- Model、Authored、Candidate、Change-derived 统一走该管线；当前自制固定网格与节点中心
  三次曲线不再作为正常渲染路径。
- projection 首次布局允许短暂 loading；布局失败必须显式呈现并允许重试，不能静默回退到
  低质量自制布局，否则会重新引入两套呈现语义。
- Graphviz 可在 focus/展开后重新优化布局；Controller/Diagram 以触发 Element 或当前 focus
  作为视觉锚点，尽量保持其屏幕位置和当前 viewport，其他节点平滑过渡到新坐标。
- 不在每次交互后自动 fit 全图；只在 projection 首次打开或用户主动请求时 fit view。
- Semantic Browser 顶部工具栏按固定顺序、持久显示三个独立控件：
  `View Selection` → `Change Selection` → `Presentation Mode`。
- Change Selection 为 `None` 时只允许 `Complete`；其余 modes 保持可见但 disabled，并解释
  需要先选择 Change。选择 Change 后默认进入 `Complete with diff`。
- 不把组合伪装成新的 View 条目；当前三维状态写入新的 URL state schema，刷新与分享链接
  可恢复。由于本次允许 breaking change，不要求兼容旧 URL 参数。

## 4. 差异语义（已确认）

- **仅单个 Change**，不考虑多 Change 聚合 / 按序列浏览。
- 无 Change Selection 时只有 `complete` 有效；选择一个 Change 时默认进入
  `complete-with-diff`，用户可切换到 `complete` 或 `diff-only`；清除 Change Selection
  时自动回到 `complete`。
- 三种 Presentation Mode：
  1. **Complete**：呈现所选 View Selection 的完整目标态，无差异标记；有 Change
     Selection 时目标态为 after model（Semantic Model + Delta）。
  2. **Complete With Diff**：完整目标态 + ADDED/MODIFIED/REMOVED 差异状态；
     REMOVED 以轻量 ghost/tombstone 保留。
  3. **Diff Only**：仅 Change 影响的对象 + 理解所需的层级上下文；
     REMOVED 用 ghost/tombstone；端点不因删除丢失。
- **采用 before/after 联合图形集合**（已确认方案一）：
  ADDED、MODIFIED、REMOVED 属于同一张可布局图；删除内容作为图上 ghost/tombstone。
- 与 View Selection 正交：Model / Authored 均可承载上述模式。

## 5. Authored View 选择语义（已确认）

- `include` 形成基础 View Selection；`exclude` 从选择中剪枝。
- Authored View frontmatter 使用顶层并列列表，保持现有格式兼容：
  ```yaml
  include:
    - project.root
    - domain
  exclude:
    - domain.internal
  ```
- `exclude` 缺失或为空表示不额外排除；不使用 `!identity`，也不引入嵌套
  `selection.include/selection.exclude`。
- 多根 Authored View 使用非语义 virtual projection root：默认画布显示选择中的最小顶层
  Elements；virtual root 只服务布局和导航，不进入 Semantic Model，也不显示 Element Details。
- Authored View breadcrumb 首项显示 View 标题，focus 后追加 Element 路径；Model Selection
  有唯一项目根时继续直接使用真实 Element，不额外显示 virtual root。
- **层级闭包**：被选择 Element 的 descendants 属于该 View 的选择闭包；
  focus 下钻或就地展开时可逐层显示 children —— 这是“显露已确定内容”，
  不是扩大 View Selection。
- **不自动引入邻居**：不因 Relationship 引入选择范围外的 Elements；关系仅在两个
  endpoint 都进入当前画布（或按现有规则映射到两个不同可见 ancestor）时呈现。
- focus 与展开集合只改变 runtime projection，不改变持久化 Authored View。
- 切换 View Selection 时按新边界协调 runtime 状态：当前 focus 仍在选择内则保留，否则
  回到新 View 的默认 root；expanded set 只保留仍有效且可达的 Elements。
- Change Selection 与 Presentation Mode 在切换 View Selection 时保持不变；若所选 Change
  与新 View 无交集，显式呈现“当前选择中无差异”，不偷偷切换 Change 或 View。
- **`exclude` 优先并剪除整个子树**：被排除 Element 及全部 descendants 都不进入
  View Selection；focus/下钻/就地展开/关系映射不能把它们带回。

## 6. Relationship presentation（已确认）

- 采用 LikeC4 原生字段集合，不新增含义模糊的 `shape` 字段：
  ```yaml
  presentation:
    color: <LikeC4 color>
    line: solid | dashed | dotted
    head: <arrow type>
    tail: <arrow type>
  ```
- 未声明字段继承 LikeC4 默认值。
- Relationship presentation 的字段和值集合完整复用 LikeC4，并在 Xirang 输入层严格校验：
  `color`、`line`、`head`、`tail` 不维护第二套枚举或自由字符串透传。
- 该校验与 Element presentation 的做法一致；适配器将合法值直接映射到 LikeC4。
- 当前已有的 `constrains`、`consumes`、`invokes`、`precedes`、`produces`、
  `responsible-for`、`supports-presentation`、`validates` 八个 Relationship Kind
  初始均不填写具体 `presentation`，不猜测业务视觉值，统一继承 LikeC4 默认值。
- `presentation` 只定义在 Relationship Kind 层级，所有使用该 Kind 的 Relationship 实例共享；
  不增加单个 Relationship 覆盖，也不增加 Authored View 级 presentation 覆盖。
- 只有后续有明确业务需求时，才为单个 Relationship Kind 显式配置字段。
- Model View、Authored View、Candidate、Change-derived View 使用同一套 Relationship presentation。
- LikeC4 现有关系视觉字段证据：`color`、`line`（solid/dashed/dotted）、
  `head`、`tail`（如 arrow/diamond/dot/none 等）在
  `likec4/packages/core/src/types/view-computed.ts`、
  `likec4/packages/core/src/styles/defaults.ts` 中。
- Xirang `RelationshipKind` 当前只有 `identity`、`sourceKinds`、`targetKinds` + body
  （`src/core/model/types.ts`）；`nodePresentation`（shape/color/border）仅存在于 Element Kind。

## 7. 双向 Relationship routing（已确认）

- A→B 与 B→A 始终是两条独立有向 edge，不合并成一条双向 edge，也不默认 bundle。
- 每条 edge 独立保留 Relationship identity、Kind/标签、`color/line/head/tail`、diff 状态、
  点击/悬停/详情行为。
- 两条 edge 分别交给 Graphviz routing，并禁止 edge concentration/方向合并。
- 验收必须覆盖视觉与交互，而不只是数据存在：路径可区分、两个方向箭头都清晰、任一 edge
  可独立选中；一个方向的 diff overlay 不影响另一个方向的业务 presentation。

## 8. diff 独立视觉通道（已确认）

采用**非破坏性 diff 叠加层**，业务 presentation 始终作为前景保留：

- Element：保留 Kind 的 `shape` / `color` / `border`，另加 diff 状态描边和角标。
- Relationship：保留 `color` / `line` / `head` / `tail`，在业务线下方增加更宽、
  半透明的 diff underlay，并在路径中部显示状态图标。
- ADDED / MODIFIED / REMOVED 使用不同图标或形态；颜色仅作为辅助，不作为唯一识别手段。
- REMOVED 额外降低主体透明度形成 ghost/tombstone，但仍可选中并查看详情。
- 图例与 tooltip 解释状态图标，保证大图扫描能力与非颜色识别。

## 9. 模型缓存刷新与 HMR（已确认）

- 模型、Relationship、Contract、Authored View 等相关源文件变化后，watcher 合并短时间内的
  连续事件，再完整重建基础 `.cache-likec4/*.c4`。
- 新缓存先写入临时目录，校验成功后原子替换；不让浏览器读取半成品。
- 随后重建 runtime manifest，失效受影响的 projection-key 缓存，并发送一次 LikeC4 HMR /
  Xirang manifest 更新事件。
- 解析或生成失败时保留上一次成功缓存，向浏览器发送结构化诊断；修复源文件后自动重试，
  不把损坏或不完整的数据作为新模型展示。
- 采用完整重建保证跨 Architecture、Contracts、Authored Views、Change Delta 的依赖不会
  因增量依赖图遗漏而产生旧视图。

## 10. Candidate View 范围（已确认）

- Candidate View / Candidate Diff View 共享统一的 projection → Graphviz layout/routing、
  Relationship presentation、双向 edge routing 和 diff overlay 底层能力。
- Candidate 保持 Semantic Model Build 的独立审查语义：Candidate View 展示完整 Candidate，
  Candidate Diff View 固定展示 Candidate 与当前模型的差异。
- Candidate UI 不增加普通 Semantic Browser 的 `View Selection` /
  `Presentation Mode` / `Change Selection` 三维控件；Candidate 不是 Change，避免让
  `Change Selection` 在此处失去语义。

## 11. Change 拆分（已确认）

- 本次作为一个端到端 Change，目标覆盖统一 View projection、三态 Presentation Mode、
  Change Selection、Authored `exclude`、Relationship Kind presentation、双向 edge routing、
  diff overlay、Graphviz runtime layout 以及 cache regeneration/HMR。
- Change 内部按阶段执行和 Review，不拆成多个独立 Change，避免中间状态长期暴露不完整的
  选择/呈现语义。
- 与现有 active `test-change-derived-view` 的归属关系仍待决定，不先推断。

## 12. 验证策略（已确认）

- 采用**持久回归测试 + 一次性端到端证据**。
- 持久测试覆盖：
  - `include/exclude` 层级闭包与排除优先级；
  - 三态 Presentation Mode 的 before/after 联合集合、REMOVED ghost 和必要上下文；
  - projection key 确定性与缓存失效；
  - Relationship presentation 解析、默认继承和 LikeC4 映射；
  - A→B / B→A 独立 identity；
  - 完整缓存重建、原子替换、manifest/HMR 更新、last-known-good 与结构化诊断；
  - Model/Authored/Candidate/Change-derived 统一渲染路径和 Browser 交互。
- 一次性验证使用 `screenAnswer` 的 `app-overview` 复现原始问题，覆盖模型修改后的无重启
  刷新、Model/Authored 对照、Graphviz canvas 非空、双向 edge 路径分离、diff overlay
  与业务 presentation 共存，并保存命令、截图和结果作为 Verify evidence。
- 一次性视觉证据不作为脆弱的长期截图基线；可重复的语义/协议行为进入测试套件。

## 13. Change 归属与兼容策略（已确认）

- 本次创建一个全新的独立 Change。
- `.xirang/changes/test-change-derived-view/` 保持不变；它只是验证
  Change-derived View 能力的展示/测试用 Change，不是本次设计的前置 Change，也不并入本次范围。
- 本次 Change 允许直接替换旧的渲染/浏览行为，允许 breaking change；不保留旧 renderer 的
  长期 feature flag，也不增加并行实验性 route。
- `exclude` 缺失等价于空集合，不剪除任何内容；显式空列表也表示不排除。
- `presentation` 缺失时使用 LikeC4 默认值；只填写部分字段时，未填写字段分别继承对应默认值。
- View identity、URL 是否兼容不再作为本次约束；没有明确需求时不无故改名。
- `focus`、下钻、就地展开仍是统一 View 体验的目标语义，但不是旧实现兼容承诺。
- Candidate 保持固定 Candidate Build Review 模式，是已确认的产品语义边界，不是兼容策略。
- 本次 Change 的名称留到 Propose 阶段确定。

## 14. Definition Framing 记录（未创建，原因）

- 用户曾要求持久化当前定义内容以免丢失；经核查：
  - 当前无 framing record（`xirang framing list` 为空）。
  - `RelationshipKind` 正式结构只有 `identity`、`sourceKinds`、`targetKinds` + body；
    framing payload 不支持 `color/line/head/tail` 字段。
  - 这四个字段的具体目标值未确认；塞进 body 会把视觉实现方案错误变成 Kind 规范语义。
- 结论：**未创建 Definition Framing record**；改为本临时草稿 + 最终 Design Summary。
- 若后续确认了完整 Relationship Kind 结构 payload，可再走
  `xirang framing create --slug <slug> --from <path> --json`（先展示完整 payload 并获显式确认）。

## 16. Semantic Browser route 与 source/state 重构（已确认）

- 采用单一 Semantic Browser route：Model 与 Authored View 都作为 `View Selection` 选项，
  由同一套 runtime projection 和 Graphviz layout/routing 呈现。
- 删除旧的 Authored View 独立 route、独立渲染入口及其旧导航/状态同步逻辑；
  不删除 `.xirang/model/views/*.md` 持久化 Authored View 定义，它们继续作为 View Selection
  的来源，并保留 `include/exclude` 选择语义。
- 允许修改 Xirang/LikeC4 代码，重构当前 `XirangViewSource` 的混合职责：Model、Authored、
  Candidate、Candidate Diff、Change-derived 不再伪装成同一种 source。
- 网页层使用三个独立控件：`View Selection`、`Change Selection`、`Presentation Mode`；
  新 URL state schema 只表达三个维度与 focus，不序列化 expanded set。
- expanded 按 View Selection 保存在 Controller 会话和浏览器 history state 中；前进/后退可
  恢复，页面刷新后回到当前 focus 的默认折叠状态，避免 URL 随展开节点数量爆炸。
- 当前代码只在基础生成和 Authored View 路径使用完整 LikeC4 管线；Model、Change-derived、
  Candidate 会在已 layout 的 `modelView` 之后再通过 `materializeXirangArchitectureView()` 的
  `visibleTree/diffTree → measure/place → createEdge` 自制最终 `DiagramView`。
- 本次保留并扩展 `src/core/likec4/generator.ts` 的 Semantic Model → LikeC4 转换基础，
  将 runtime projection 放到 LikeC4 compute/layout 之前；所有投影完整经过官方
  parser → validator → compute-view → Graphviz layout → renderer。
- 删除或重构 `materializeXirangArchitectureView()`、固定尺寸网格和中心三次曲线作为正常
  渲染路径；Xirang 只保留 identity、Contract、diff metadata 等薄适配。
- 整体采用三层结构：底层 Semantic Model 是持久化与规范语义来源；中间层使用原生 LikeC4
  表示和官方 compute/layout/render 管线；顶层 `SemanticBrowserController` 负责 View/Change/
  Mode/focus/expanded 控制。
- LikeC4 中间内容是从 Semantic Model、Authored View、Change 与 runtime projection 派生的，
  不成为新的语义来源；目标是尽量复用 LikeC4 官方能力，使 LikeC4 更新可自然惠及 Browser。
- LikeC4 中间内容分两层缓存：
  - `.cache-likec4` 持久保存由当前 Semantic Model 确定的基础原生 LikeC4 内容，源变化时
    完整重建并原子替换，供 workspace 启动、调试和诊断使用；
  - runtime projection 以 projection key 做有容量上限和淘汰策略的服务端内存缓存，
    正常运行不为每个 focus/expanded/mode 组合写临时文件。
- 模型 fingerprint 变化后旧 projection key 自然失效；调试模式可按需输出单个 projection
  的 LikeC4 DSL/DOT，但调试输出不成为持久语义或正常 watcher 输入。
- projection 与 Graphviz layout 由服务端控制；客户端 Controller 负责状态、请求取消、
  过期响应丢弃以及 loading/error UI。
- SPA route 级 `SemanticBrowserController` 是普通 Browser 状态的唯一所有者：负责 URL state、
  manifest、三维选择、focus/expanded 合法性协调、projection key、请求与缓存。
- Toolbar 直接消费 Controller；LikeC4 Diagram 只接收已 layouted `DiagramView`，并上报
  node/edge/focus/expand 事件，不再决定 Xirang 的业务选择。
- 删除当前 `ViewHistoryBridge`、Diagram context、Navigation dropdown 之间的多向状态纠正逻辑。
- Candidate Build Review 可复用 projection service，但使用独立 Controller/state。
- runtime manifest 按语义分区，不再提供混合 `sources` 数组：
  `model`、`authoredViews`、`changes`、可选 `candidate` / `candidateDiff` 分别承载各自数据。
- Browser state 独立保存 `viewSelection`、`changeSelection`、`presentationMode`、`focus`、
  `expanded`；投影时再与 manifest 组合。
- Change-derived View 不再是一个可选 source，而由
  `View Selection + optional Change Selection + Presentation Mode` 推导。
- Authored View 作为 selection descriptor 传入，不提前生成固定 LikeC4 route；Candidate 数据
  保持独立，不进入普通 Browser 的三个控件。
- Candidate 保持独立 Candidate Build Review 入口，但复用统一 projection/layout、
  Relationship presentation、双向 edge routing 和 diff overlay 基础设施。

## 17. 风险边界（已确认）

1. Graphviz runtime latency：使用 projection-key 有界内存缓存、请求取消、过期响应丢弃、
   事件合并和明确 loading；不静默回退旧 renderer。
2. LikeC4 升级兼容：生成原生 LikeC4 内容并走官方 parser/validator/compute/layout；Xirang
   只保留薄适配和兼容测试，不依赖内部 `ComputedView` 不变量或自行构造最终 `DiagramView`。
3. 模型变更竞态：请求携带 expected model fingerprint；服务端拒绝旧 fingerprint；基础缓存
   原子替换；Controller 丢弃旧响应并重新请求。
4. diff 联合图的 REMOVED ghost 仅存在于派生 projection，携带明确 metadata/图标/透明度，
   不写回 Semantic Model 或 Authored View。
5. 删除旧 Authored View route 是已接受的 breaking change；新的单一 Semantic Browser URL
   是唯一入口，不保留长期双路由兼容层。
6. Graphviz 重排通过 Element/focus 视觉锚点、viewport 保持和平滑过渡控制；不自动 fit 全图。
7. diff overlay 使用半透明 underlay、图标、图例/tooltip，业务 presentation 始终为前景，
   颜色不作为唯一状态通道。
8. runtime projection 只进入服务端有界内存缓存并淘汰；不为每个 projection 写磁盘；
   model fingerprint 变化后旧 key 失效。

## 18. 已核实的语义边界（防止误写）


- `Authored View`：持久化 View Definition，目前只有 `include`（`*` 或 identity 列表），
  可选 `of`、`title`、`autoLayout`；不为其呈现对象增加规范性语义；
  严格呈现声明、不自动下钻（当前 Contract）。
- `Model View`：identity 保留为 `model`；focus/导航历史/布局是运行时状态；
  当前 Contract 不承担 Change 差异审查（本次将扩展 Presentation Mode，需同步改 Contract）。
- `Change-derived View`：按 Change 独立推导，当前只有 Full context / Diff only 两态。
- `Candidate Diff View`：固定 diff-only，无 Full context 切换。
- `Visual Presentation`：布局/样式/交互只服务呈现，不是规范语义；
  持久呈现配置可存在于 Metamodel（Element Kind 的 `nodePresentation` 先例）。
- 本次 `include/exclude` 属于 Authored View（View Selection），不进 Definition Framing。

---

*草稿结束。下一步：继续 Explore（回答待决问题）→ 产出 conversation-only Design Summary → 用户调用 `/skill:xirang-propose <change-name>`。*
