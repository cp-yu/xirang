## Context

本 Change 对齐已提交的 `d9939b6bcc366bdf46b1d8e36868e0a5d01eff2b`。用户授权直接优化 Web UI、后补 snack，随后确认启用折行尝试；完成浏览器检查后用户目视验收并要求提交。证据包括会话确认、该 commit 的完整累计 diff、包级测试、浏览器测试与 92 个投影的布局度量。

用户随后确认将新增内容拆成五个子 Element，并要求采用当前 4+N Contract 形式。父 `visual-presentation`、`xirang-diff-overlay` 与 `web` 保留自身抽象层级的完整承诺。已有“合并呈现 Section 差异”要求完整 Acceptance Cases，本次字段读取修正落实该既有要求；本轮格式整理将其父层承诺及案例纳入固定 Sections，并在文本差异子 Element 进一步精化。

## Goals / Non-Goals

**Goals:**

- 将已验收的缩放显示、差异审阅、变化对象定位与布局选择行为编译为完整的目标态 Sections。
- 保留原生 LikeC4 parser、validator、compute-view 和 Graphviz geometry/routing 管线，以及 compound endpoint edges 禁止 unflatten 的约束。

**Non-Goals:**

- 只增加已确认的五个呈现子 Element，不重组其他层级，不改变 View identity，不持久化运行时布局或新增规范性来源。
- 不修改本次实现，不扩展既有 focus/展开后的视觉锚点行为，不重做既有关系聚合或导出语义。
- 不执行 Sync、Quality Seal 或 Archive。

## Decisions

### 按呈现职责细化结构

用户确认如下结构：

```text
visual-presentation
├── zoom-level-presentation（缩放分级呈现）
├── nested-container-presentation（嵌套容器呈现）
└── full-model-layout-selection（Full Model 布局择优）

xirang-diff-overlay
├── diff-overview-navigation（差异概览与导航）
└── text-diff-presentation（文本差异呈现）
```

前一组按视觉呈现能力分解：尺度内容适配、嵌套对比、空间布局选择；后一组按差异审阅能力分解：从总体变化找到对象、阅读具体内容。分类计数和列表定位共同完成概览与导航，不按实现 helper 或每个原 Section 机械拆分。每个新 Declaration 定义其独立建模理由、包含范围和相邻边界。

父 Contract 完整描述其层级承诺，children 精化参数与行为，不把父 Contract 写成子文件索引。`xirang-diff-overlay` 的 Definition 相应明确概览、导航、文本差异与 Contract 内容投递之间的边界；其余两个父 Element 的概念身份不变。

### 4+N 与 Metamodel

本次八个目标 Contracts 均具有 `Scope and Non-goals`、`Business Logic`、`Edge Cases and Exception Handling`、`Key Acceptance Cases` 四个固定 Sections，全部 Acceptance Cases 归入最后一节。五个新子 Element 与 `visual-presentation` 使用 4+0；`xirang-diff-overlay` 的节点操作标记单独保留为 +1；`web` 原有独立承诺及本次 minimap 共保留为 +17，不借此重组其他 Web 能力。

新增 `browser-specification` Kind，显式声明 `contract: required` 与 `contractFormat: business-specification`，用于这八个规格 Elements，以使 CLI 校验四个固定 Sections 与非空 Acceptance Case；不把通用 `element` Kind 改成 required，以免改变其余概念和组织性 Elements。Kind 的具体 identity 为满足用户格式要求的局部建模选择。

原 Sections 被移入固定 Sections 时，Delta 对旧标题使用 REMOVED、对完整目标 Sections 使用 ADDED；仍保留的 +N 标题使用 MODIFIED，不将变化历史写入目标正文。保留旧承诺、条件、数值与正反例，在必要父子层级保留语义覆盖，不新增实现义务。

### 缩放与画布

用户确认的方向是在总览只显示名称并增大字号、放大后显示名称与摘要，同时保证文本不超出节点。`lodMath`、`titleFit`、`compoundTitleRoom` 与 `useZoomLod` 使用量化 zoom、实际字体测量和形状内边距决定展示，减少连续缩放引起的重复渲染。容器标题按与其横向重叠的子节点顶部限制空间；透明填充按嵌套层级封顶。总览隐藏空闲关系标签，交互中的标签继续显示。

[INFERRED FROM CODE] 11px 分级阈值、14px 叶子标题目标、13px 容器标题目标、分层填充上限与反向缩放上限来自已验收实现，作为该显示机制的具体参数纳入 Delta；不会承诺极小 zoom 或极长名称仍能全文可读。

### 折行与布局择优

实验先比较了同 cluster 内 invisible 约束边折行与强制 unflatten。强制 unflatten 在深层 compound 视图中出现 routing 失败，不能采用。0.8 目标在真实尺寸度量中使部分投影变高、fit zoom 下降，因此最终采用 1.6，并将折行候选与普通候选比较；安全检查通过、参考视口 fit zoom 至少提高 5%、总边长不超过 1.5 倍时才保留折行。用户在该规则披露并运行后确认呈现无问题。

`ElementViewPrinter` 使用实际节点尺寸、cluster margin 与标题空间估算各 sibling set，在原 DOT 生成阶段添加不含 `likec4_id` 的 invisible edges；解析器不将约束边输出为业务 edges。`GraphvizLayouter` 与 binary/WASM adapters 按调用收集诊断，恢复的错误仍淘汰折行。`xirang-adhoc-layout` 只为 Full Model 投影传递 opt-in；Authored、dynamic、deployment 保持既有路径。每次比较只计算一次普通布局。

### 变化列表与导航

[INFERRED FROM CODE] `changePanelModel` 按显式 entity-kind 分类映射共享首页和面板计数，不按文件名或代码结构推断语义。列表将 Sections 归并到宿主 identity；Sections-only 宿主可定位但不伪造 Declaration entry。定位已投影节点时计算面板遮挡的可用视口；未投影时先 focus 父再定位，不能定位则显示原因，不擅自改变 View 边界或 mode。Relationship 优先定位 source，不可用时尝试 target。

导航标题在原生标题缺失时使用当前视图与 focus 名称；breadcrumb 对所有 Model Selection 可用。minimap 使用 xyflow 组件、操作配色与 Mantine 主题，窄屏默认隐藏，静态呈现中排除。

### 文本差异

采用本地 `Intl.Segmenter` 与 LCS 文本差异，替代旧依赖，避免引入额外第三方库。`DiffTab` 将未变化字段折叠；短值紧凑显示，长文本提供 Inline/Split。`ContractsTab` 从 `acceptanceCases` 读取全部案例，维持 Section 级 diff 边界。详情卡片在 Diff tab 使用更宽桌面空间，并保留滚动与移动端 containment。

### 实现与验证证据

本次 snack 使用上述 commit 与已有会话验证记录，不将任务勾选或子 Agent 完成声明视为独立 Review。已经实际运行并通过：layouts 66 项、vite-plugin 124 项、diagram 292 项、根测试 2228 项；桌面与移动端 Playwright 合计 50 项；相关包 typecheck 与按 spa→xirang-likec4 顺序的 bundle 构建。用户在运行中的页面目视确认“现在完全没有问题”。本次仅修改 Change 制品，未重跑实现测试。结构和格式调整后，重新运行 Change preview 与 Expected Semantic Model validation，并逐项检查旧承诺及案例的目标位置。

92 个投影中 37 个采用折行，0 次安全回退；48 个大投影 fit zoom 几何均值从 0.30500 至 0.33031，累计边长从 1,094,470 至 948,151，交叉计数从 1095 至 659。root depth 5 的 fit zoom 从 0.14225 至 0.18018，root depth 8 从 0.06607 至 0.09208；未观察到 fit zoom 变差或边长超出 1.5 倍。浏览器 diff 总览测得 68 nodes、35 edges、无非包含节点重叠、标题溢出或空路径。这些是一份模型上的验证结果，不定义所有模型的性能保证。

## Risks / Trade-offs

- 两次 Graphviz 布局增加每个未缓存投影的计算成本 → 普通候选只计算一次，保留既有 projection cache；不声明所有模型中的固定延迟。
- 折行可能拉长关系或改变交叉分布 → 安全检查和总边长阈值限制退化；交叉计数仅为控制折线相交近似，不是最终曲线可读性保证。
- 择优参考视口固定为 1600×1000 → 不承诺所有移动或其他屏幕比例均有相同 fit 收益。
- 极短边可能经原解析器取整成为零长度，但仍有两个点 → 沿用已验收的路径点数规则，不新增零长度拒绝条件。
- 填充上限也适用于模型显式较高的容器不透明度 → 保留业务颜色与边框，明确这是呈现层约束。
- 本次不改变文件路径读取、生成清单或文件系统操作 → macOS、Linux、Windows 沿用既有路径机制，不引入新的路径分隔符假设；Graphviz 诊断同时覆盖 binary 与 WASM adapter。
- Quality 独立审查与 Seal 尚未形成 → 本次 snack 形成完整 Change 供后续验证与收束，不以现有测试或用户目视确认替代该流程。
