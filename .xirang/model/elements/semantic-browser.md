---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## Requirements

### Requirement: 启动边界：项目根发现与无项目失败

`xirang view` SHALL 从嵌套目录沿父目录向上发现最近的 `.xirang/` 项目根，并仅在该项目根下启动嵌入式浏览器；不存在 `.xirang/` 项目时 SHALL 以非零状态失败。

#### Scenario: 项目根向上发现

- **WHEN** 用户从 `.xirang/changes/some-change/` 等子目录运行 `xirang view`
- **THEN** CLI 沿父目录向上查找最近包含 `.xirang/` 的目录作为项目根
- **AND** 使用该项目根的 Formal source 与 active changes

#### Scenario: 未找到项目

- **WHEN** 用户在不包含 `.xirang/` 的目录运行 `xirang view`
- **THEN** CLI 报错："未找到 Xirang 项目"
- **AND** 以非零状态退出且不启动服务器

### Requirement: 支持分层语义浏览

Semantic Browser SHALL 在单一 route 中使用 Model 或 Authored View Selection，以及独立的 Candidate View 与 Candidate Diff View，在各自适用目标模型内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

#### Scenario: 下钻 Model 或 Authored View

- **WHEN** 用户在 Model 或 Authored View Selection 中进入具有 children 的 Element
- **THEN** Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context
- **AND** 不创建新的 View identity 或空 route

### Requirement: 呈现 Change 目标与差异

Semantic Browser SHALL 将当前 Semantic Model、一个可选活动 Change 与当前 View Selection 确定性组合，并提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode；系统 SHALL NOT 为每个 Change 创建独立可选 View source。diff overlay 激活时，Browser SHALL 以橙黄描边与徽标区分四态节点与关系边：unchanged 节点与边以 25% 透明度且无 outline、无徽标呈现；ADDED 节点以 100% 透明度、橙黄点线 outline 与 `+` 徽标呈现；MODIFIED 节点以 100% 透明度、加粗橙黄实线 outline 与 `~` 徽标呈现；REMOVED 节点以 45% ghost 透明度、橙黄虚线 outline 与 `−` 徽标呈现，且其徽标保持 100% 透明度；changed 关系边保留其 `+`/`~`/`−` 徽标。

#### Scenario: Complete 模式

- **WHEN** 用户使用 `complete`
- **THEN** 无 Change 时呈现当前模型，有 Change 时呈现 after model
- **AND** 不添加 diff overlay

#### Scenario: Complete with diff 模式

- **WHEN** 用户使用 `complete-with-diff`
- **THEN** Browser 呈现完整目标上下文与 ADDED、MODIFIED、REMOVED overlay
- **AND** REMOVED objects 以可选择的 ghost 保留

#### Scenario: Diff only 模式

- **WHEN** 用户使用 `diff-only`
- **THEN** Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
- **AND** unchanged context 不计入 diff counts

#### Scenario: 四态节点视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 ADDED、MODIFIED、REMOVED 与 unchanged 元素
- **THEN** unchanged 元素以 25% 透明度且无 outline、无徽标呈现
- **AND** ADDED 元素以 100% 透明度、橙黄点线 outline 与 `+` 徽标呈现
- **AND** MODIFIED 元素以 100% 透明度、加粗橙黄实线 outline 与 `~` 徽标呈现，其 outline 宽于 ADDED
- **AND** REMOVED 元素以 45% ghost 透明度、橙黄虚线 outline 与 `−` 徽标呈现，且 `−` 徽标保持 100% 透明度

#### Scenario: 关系边视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 changed 与 unchanged 关系
- **THEN** unchanged 关系边以 25% 透明度呈现
- **AND** changed 关系边保留其 `+`/`~`/`−` 徽标且以全透明度呈现

#### Scenario: 无 diff 时默认呈现

- **WHEN** 用户使用 `complete` 模式，或在无 diff 的 Candidate View 中浏览
- **THEN** 节点与关系边保持默认透明度且不施加四态视觉

### Requirement: 保持 LikeC4 投影有效

Semantic Browser SHALL 关闭 `implicitViews`，将受管语义内容降为原生 LikeC4 model 内容并由官方 parser 与 validator 建立 base model，再让每个 runtime semantic projection 完整经过官方 compute-view 与 Graphviz layout；降级与投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain Relationships，同时保持 siblings、跨子树关系及 source 中的原始 Relationships 不变。

#### Scenario: 生成 runtime projection

- **WHEN** 服务端从 Model、Authored selection、Change target 或 Candidate 生成当前可见投影
- **THEN** 该投影在已 parse 与 validate 的 base model 上经官方 compute-view 与 Graphviz layout 生成唯一 layouted result
- **AND** Browser 不再通过固定网格或中心曲线重建最终 `DiagramView`

#### Scenario: LikeC4 无法表达 source Relationship

- **WHEN** source 包含 self 或 ancestor-chain Relationship
- **THEN** LikeC4 projection 确定性省略该 edge
- **AND** Semantic Model、Candidate 或 Change source 保留原始三元组

### Requirement: 分层呈现 Element Definition

Semantic Browser SHALL 在 Semantic Model、Candidate View、Candidate Diff View 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Semantic Model、Candidate 或 Change target Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 确定性派生 Definition Excerpt

Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 25 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

#### Scenario: Definition 超过显示上限

- **WHEN** 第一段规范化后超过 25 Unicode code points
- **THEN** Browser summary 包含前 25 个 code points 和 `...`，description 保持完整原文

#### Scenario: Definition 不超过显示上限

- **WHEN** 第一段规范化后不超过 25 Unicode code points
- **THEN** Browser summary 原样使用该规范化段落且不追加省略号

### Requirement: 通过 Contract 接口加载 Element Contract

Semantic Browser SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract`，按统一 source reference 加载 Semantic Model、active Candidate、Candidate Diff 或活动 Change target 中的 Element Contract；请求 MAY 使用 `source=change:<change-name>`、`source=candidate` 或 `source=candidate-diff` 选择来源。

#### Scenario: 加载 Semantic Model Contract

- **WHEN** 用户在 Model View 中打开一个 Element 的 Contract tab
- **THEN** Browser 不提供 `source` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户在 Change-derived View 中打开一个 Element Contract
- **THEN** loader 携带 `source=change:<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Scenario: 加载 Candidate Contract

- **WHEN** 用户在 Candidate View 中打开一个 Element Contract
- **THEN** loader 携带 `source=candidate` 并呈现 active Candidate target 中的 `XirangContractContent`

#### Scenario: 加载 Candidate Diff Contract

- **WHEN** 用户在 Candidate Diff View 中打开一个 Element Contract
- **THEN** loader 携带 `source=candidate-diff` 并呈现 Candidate target 中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与可选 source 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: Contract state 与当前选择一致

- **WHEN** Contract tab 呈现
- **THEN** Contract state 对应当前选中的 Element 与 View source，且仅反映最新加载请求的结果

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element、Model View、Candidate source 或 Change-derived View
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors

### Requirement: 条件式 Contracts tab 显示

Semantic Browser SHALL 仅当当前选中 Element 在 Semantic Model 或 Change-derived projection 中存在其单一 Contract 时显示 `Contracts` tab；无 Contract 时隐藏该 tab，其他详情 tabs 保持可用。

#### Scenario: Element 无 Contract 时隐藏 tab

- **WHEN** 当前选中 Element 的 projection 中不存在 Contract
- **THEN** 详情 SHALL NOT 显示 `Contracts` tab
- **AND** 其他详情 tabs SHALL 保持可用

#### Scenario: Element 有 Contract 时显示 tab

- **WHEN** 当前选中 Element 的 projection 中存在其单一 Contract
- **THEN** 详情 SHALL 显示 `Contracts` tab
- **AND** SHALL 使用该 Element 的稳定 identity 关联内容

### Requirement: Contract 异步加载状态

Semantic Browser SHALL 为 Contract 加载呈现 Loading、Success 与 Error 三种状态，并在 Element 或 source 变化时清除前一 Element 的内容，旧请求不得显示 stale content。

#### Scenario: 加载中状态

- **WHEN** Contract 正在从加载器读取
- **THEN** 内容区 SHALL 显示加载指示器
- **AND** SHALL NOT 显示过期内容

#### Scenario: 加载成功

- **WHEN** Contract 成功加载
- **THEN** 内容区 SHALL 渲染完整 Contract 内容
- **AND** SHALL 显示宿主 Element identity

#### Scenario: 加载失败

- **WHEN** Contract 加载失败（网络错误、权限错误或不可读）
- **THEN** 内容区 SHALL 显示错误消息与 Element identity
- **AND** SHALL NOT 关闭详情弹窗其他 tabs

#### Scenario: 切换 Element 清除旧状态

- **WHEN** 用户从 Element A 切换到 B，或 source 变化使当前 selection 不再适用
- **THEN** SHALL 清除 A 的 Contract state
- **AND** SHALL NOT 短暂显示 A 的内容
- **AND** 旧请求 SHALL 被取消或忽略，不得覆盖当前 state

#### Scenario: 单一 Contract 加载

- **WHEN** 用户打开 `Contracts` 标签且宿主 Element 携带单一 Contract
- **THEN** SHALL 显示该 Contract 的完整 Markdown 与宿主 Element identity
- **AND** SHALL NOT 显示 Contract selector

#### Scenario: 单一 Contract 缺失

- **WHEN** identity 索引无法定位对应 Element 单元或其正文无 Contract
- **THEN** SHALL 在内容区显示 identity 与错误
- **AND** SHALL NOT 关闭 element details

### Requirement: 桌面与移动视口兼容

Contract 详情弹窗、tabs 与可滚动内容 SHALL 在桌面和移动视口中保持 viewport containment，无溢出、无重叠。

#### Scenario: 桌面视口

- **WHEN** 在桌面浏览器中打开 Element 详情
- **THEN** 详情弹窗 SHALL 不溢出视口
- **AND** 长 Contract 内容 SHALL 可垂直滚动

#### Scenario: 移动视口

- **WHEN** 在移动设备视口中打开 Element 详情
- **THEN** 弹窗 SHALL 位于视口边界内
- **AND** tabs 与 Contract 内容 SHALL 位于弹窗边界内且无重叠
- **AND** 长 Contract 内容 SHALL 可垂直滚动

### Requirement: 安全渲染 Contract Markdown

Semantic Browser SHALL 使用 Markdown 渲染管线渲染 Contract 内容，支持标准 Markdown 元素，并禁止执行脚本与危险 HTML。

#### Scenario: 支持标准 Markdown 元素

- **WHEN** 渲染 Contract Markdown
- **THEN** 系统 SHALL 支持标题、段落、列表、表格、代码块与链接
- **AND** SHALL 正确显示嵌套列表与多级标题

#### Scenario: 禁止危险内容

- **WHEN** Contract 内容包含 `<script>` 标签或事件处理属性
- **THEN** 系统 SHALL 清理或转义这些内容
- **AND** SHALL NOT 执行任何 JavaScript

### Requirement: Contract source 热更新

Semantic Browser 服务端 SHALL 在当前有效模型、Authored View、Candidate 或活动 Change source 变化后重建对应 manifest 与基础 LikeC4 cache，并使受旧 fingerprint 约束的 Contract 与 projection requests 失效；未打开的 Contract 不需要独立网络请求，但下次访问 SHALL 使用最新有效 manifest 内容。

#### Scenario: 打开的 Contract 被修改

- **WHEN** 当前 Element 的 Contract source 变化且缓存重建成功
- **THEN** Browser 失效旧 Contract state 并呈现新内容
- **AND** 旧 request 不得覆盖最新 selection

#### Scenario: source 无效

- **WHEN** 修改后的 source 导致完整缓存生成失败
- **THEN** Browser 保留 last-known-good projection
- **AND** 显示新 source 的 diagnostics，不显示半更新 Contract

### Requirement: Contract 内容只读展示

Semantic Browser 中的 Contract 内容 SHALL 只读，不提供编辑功能。

#### Scenario: 无编辑交互

- **WHEN** 用户查看 Contract 内容
- **THEN** 系统 SHALL NOT 提供文本编辑框或保存按钮
- **AND** 用户 SHALL NOT 能在浏览器中直接修改 Contract

### Requirement: 只列出真实 Views

Semantic Browser 的 View Selection SHALL 只列出唯一 Model 与实际 Authored Views；Candidate View 与 Candidate Diff View SHALL 位于独立 Build Review 入口，活动 Changes SHALL 只出现在 Change Selection，focus projections 与 Change-derived combinations SHALL NOT 作为 View entries。

#### Scenario: 项目具有 Authored Views、Candidate 与 Changes

- **WHEN** 用户打开普通 Semantic Browser
- **THEN** View Selection 显示 Model 与实际 Authored Views
- **AND** Change Selection 显示活动 Changes
- **AND** Candidate 不出现在这两个控件中

### Requirement: 保持 Authored View 声明视角

Authored View SHALL 以持久化 `include`、`exclude` 与可选 `of` 确定 View Selection 边界，并 SHALL 在该边界内支持与 Model 相同的 focus、下钻、breadcrumb 与就地展开；这些 runtime 状态 SHALL NOT 修改 View Definition。

#### Scenario: 浏览 Authored View 子树

- **WHEN** 用户在 Authored View 中 focus 或展开具有 children 的 Element
- **THEN** Browser 只显露该 View 选择闭包内且未被 `exclude` 剪除的 descendants
- **AND** Authored View 文件保持不变

#### Scenario: 切换后呈现声明边界内内容

- **WHEN** 用户从 Model View 切换到 Authored View
- **THEN** 投影只呈现该 View 选择闭包内的 Elements，边界外 Elements 不呈现
- **AND** 初始 focus 为该 View 的根 Element，不引用 View 外 Element

#### Scenario: 在 Authored View 内就地展开

- **WHEN** 用户在 Authored View 内就地展开选择闭包内的 Element
- **THEN** Browser 以与 Model View 一致的方式呈现其 children

#### Scenario: 在 Authored View 内显示 focus breadcrumb

- **WHEN** 用户在 Authored View 内下钻到闭包内 Element
- **THEN** focus breadcrumb 以该 View 根为起点呈现路径
- **AND** 路径在该 View 边界处截断，不包含 View 外祖先

### Requirement: 聚合当前层 Relationships

Semantic Browser SHALL 将每个深层 Relationship 的 endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 visual edge。每个 source Relationship SHALL 保留独立 edge identity、routing、Kind presentation、diff state 与详情三元组，即使多个 Relationships 具有相同可见 source/target；系统 SHALL NOT 合并同向不同 Kinds、同向不同 diff states 或 A→B 与 B→A。

#### Scenario: 展开后 endpoint 下移

- **WHEN** 一个 Relationship endpoint 的 ancestor 被就地展开且该 endpoint 随之可见
- **THEN** edge 连接该 endpoint 本身而不再连接其 ancestor container

#### Scenario: 存在 reciprocal Relationships

- **WHEN** source 同时包含 A→B 与 B→A
- **THEN** Graphviz 为两个方向产生可视觉区分的独立 edges 与箭头
- **AND** 任一 edge 可独立选择并打开对应详情

#### Scenario: 同向 Relationships 具有不同 Kinds

- **WHEN** 多个 Relationships 映射到相同可见 source/target，但使用不同 Kind presentation
- **THEN** 每个 Relationship 保留独立 visual edge、label 与 presentation
- **AND** 任一 Relationship 的 diff operation 只作用于自身 edge

#### Scenario: 查看投影边的关系详情

- **WHEN** 用户悬停投影视图中的关系边
- **THEN** 关系详情按 Xirang 关系三元组（`source|kind|target`）与 relationship-kind 语义呈现
- **AND** 呈现不依赖 LikeC4 relation id 在浏览器模型中的查找

### Requirement: focus 失效时确定性回退

Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Semantic Browser SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

#### Scenario: Change 更新移除当前 focus

- **WHEN** 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- **THEN** Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

#### Scenario: Candidate 更新移除当前 focus

- **WHEN** 用户正在 Candidate View 或 Candidate Diff View 中浏览的 Element 被更新后的 Candidate 移除
- **THEN** Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus

### Requirement: 合并呈现 Requirement 差异

Semantic Browser SHALL 在 Change-derived View 与 Candidate Diff View 的 Element Details 中，将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本

### Requirement: 按需安全读取 Contract 单元

Semantic Browser 的服务端 SHALL 从当前 Semantic Model 或所选 Change 目标模型的 `.xirang/model/elements/` 单元构建 identity→content 索引（manifest），并按稳定 Element identity 提供 Contract 内容读取。请求 SHALL 携带 project identity 与 Element identity；授权 SHALL 以 identity 为 key 的查找完成，请求输入不触达文件系统；absolute、`..`、backslash、非 `.md` 与 symlink 逃逸类输入作为查找 miss 处理，不构成路径读取。未打开的 Contract 内容无需单独请求即随 manifest 可用；Browser 的标签可见性由 manifest 中的 contracts map 决定。

#### Scenario: Identity 授权校验

- **WHEN** browser 请求某 Element 的 Contract 内容
- **THEN** request SHALL 携带当前 model project identity 与稳定 Element identity
- **AND** server SHALL 以 identity 为 key 从 manifest 查找对应内容

#### Scenario: 路径类输入不触达文件系统

- **WHEN** 请求携带 absolute、包含 `..`、包含 backslash、非 `.md` 或 symlink 逃逸类路径输入
- **THEN** 该输入仅作为 identity lookup miss 处理
- **AND** SHALL NOT 作为路径读取任何文件

#### Scenario: 路径授权校验

- **WHEN** 请求的 identity 不在 manifest 中
- **THEN** server SHALL 拒绝读取
- **AND** SHALL NOT 仅凭路径存在授权

#### Scenario: 符号链接逃逸

- **WHEN** `.xirang/model/` 下存在指向目录外的 symlink
- **THEN** 请求不会因该 symlink 触达目录外文件
- **AND** 读取仅发生在本端 manifest 构建阶段对受管单元目录

#### Scenario: Manifest 预载 Contract 内容

- **WHEN** manifest 构建
- **THEN** SHALL 将全部 Element Contract 内容序列化进 manifest
- **AND** Browser 启动时获取该 manifest
- **AND** 标签可见性由 manifest contracts map 决定，无需按请求读取未打开的单元

### Requirement: 呈现 Candidate 目标与差异

Semantic Browser SHALL 在 active Candidate 存在时提供唯一的 Candidate View 与 Candidate Diff View：Candidate View 由 Candidate Semantic Model 确定性派生并呈现完整但尚未确认的目标模型，Candidate Diff View 由当前 Semantic Model 与 Candidate 确定性派生并固定呈现 diff-only 差异。

#### Scenario: 浏览 active Candidate

- **WHEN** active Candidate 存在且用户选择 Candidate View
- **THEN** Browser 显示 Candidate 四分区形成的完整目标模型，且 SHALL NOT 将当前 Semantic Model 的差异标记混入 Candidate View

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 可用于比较且用户选择 Candidate Diff View
- **THEN** Browser 显示 Candidate target 以及相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 差异，且不提供 Full context 切换

#### Scenario: Candidate invalid

- **WHEN** active Candidate validation 返回 ERROR
- **THEN** Browser 仍保留两个 Candidate sources，显示 `valid: false` 与 diagnostics，能解析的 architecture MAY 继续只读呈现，且 SHALL NOT 显示 stale Candidate snapshot

### Requirement: Candidate source 按输入刷新

Semantic Browser SHALL 以 source identity、partition fingerprint 与 model fingerprint 区分 Candidate runtime data；Candidate source 变化 SHALL 刷新 Candidate 与 Candidate Diff，Semantic Model 变化 SHALL 在基础缓存原子替换成功后刷新 Model、Candidate、Candidate Diff 与活动 Change 数据，并失效旧 runtime projections。

#### Scenario: Candidate 修改后刷新

- **WHEN** `.xirang/candidate/` 下任一受管 Candidate file 发生变化
- **THEN** Browser 刷新独立 Candidate 与 Candidate Diff data
- **AND** 普通 Browser 的 View 与 Change selections 保持不变

#### Scenario: Semantic Model 修改后刷新

- **WHEN** `.xirang/model/` 下任一受管 Semantic Model file 发生变化
- **THEN** Browser 在完整缓存重建成功后发布新 manifest 与 fingerprint
- **AND** 旧 projection response 不得覆盖新状态

### Requirement: URL 编码导航状态并响应浏览器前进后退

Semantic Browser SHALL 在单一 route 的 URL 中编码 `view`、`change`、`mode` 与 `focus`，并将三维选择与 focus 变化呈现为浏览器历史步；expanded set SHALL 只存储于 Controller 会话和 browser history state，不进入 URL。浏览器前进/后退 SHALL 恢复对应状态，且同步 SHALL NOT 产生循环或重复历史条目。

#### Scenario: 下钻与 breadcrumb 跳转

- **WHEN** 用户下钻 Element 或点击 breadcrumb ancestor
- **THEN** Browser 将新 focus 写入 URL 并新增历史步
- **AND** 浏览器后退恢复先前 focus 与 projection

#### Scenario: 控件变化

- **WHEN** 用户改变 View Selection、Change Selection 或 Presentation Mode
- **THEN** Browser 将对应 `view`、`change` 或 `mode` 写入 URL
- **AND** 一次用户操作只形成一个历史步

#### Scenario: expanded 不进入 URL

- **WHEN** 用户就地展开任意数量的 Elements
- **THEN** URL 不增加 expanded identities
- **AND** 前进后退可通过 history state 恢复，刷新后使用当前 focus 的默认折叠状态

#### Scenario: 深链恢复

- **WHEN** 用户直接打开携带有效 `view`、`change`、`mode` 或 `focus` 的 URL
- **THEN** Controller 建立对应合法状态
- **AND** 不存在的 identity 触发确定性默认回退而不是空白画布

### Requirement: focus breadcrumb 可拖动

Semantic Browser 的 focus breadcrumb 导航 SHALL 可通过拖动手柄在 diagram 容器内移动，使用户可将它移开以避免遮挡编辑器控件；拖动 SHALL NOT 触发 diagram 平移，且 breadcrumb 内元素按钮的 focus 导航 SHALL 保持可用。

#### Scenario: 拖动 breadcrumb

- **WHEN** 用户按住 breadcrumb 拖动手柄并在 diagram 容器内移动指针
- **THEN** breadcrumb 跟随指针移动
- **AND** diagram 视图 SHALL NOT 随之平移或缩放

#### Scenario: breadcrumb 按钮仍可导航

- **WHEN** 用户点击 breadcrumb 内的元素按钮
- **THEN** 对应元素成为 focus
- **AND** 该点击 SHALL NOT 启动拖动

### Requirement: 提供当前 view 的层级树导出

Semantic Browser SHALL 为当前 view 提供层级树导出：按视图内呈现元素的父子层级构建树，根为视图根元素，子元素按声明层级嵌套，且树 SHALL 仅包含当前 view 呈现的元素。

#### Scenario: 导出当前 view 层级树

- **WHEN** 用户从导出菜单选择层级树导出
- **THEN** 打开层级树导出页，内容为当前 view 的元素层级树
- **AND** 根节点为当前 view 的根元素，子孙按父子关系嵌套

#### Scenario: 树仅含当前 view 元素

- **WHEN** 当前 view 只呈现模型的一部分元素
- **THEN** 层级树 SHALL 只包含该 view 呈现的元素及其层级
- **AND** SHALL NOT 混入 view 之外的模型元素

### Requirement: 层级树多格式与字段选择

层级树导出 SHALL 支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表与 JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容 SHALL 按 `title`/`fqn`/`kind` 字段组合呈现，JSON SHALL 恒包含 `title`、`fqn`、`kind` 与 `children`。

#### Scenario: 切换导出格式

- **WHEN** 用户在层级树导出页选择纯文本、Markdown 或 JSON 格式
- **THEN** 内容按所选格式重新渲染
- **AND** 复制与下载的文件扩展名与所选格式一致（`.tree.txt`/`.tree.md`/`.tree.json`）

#### Scenario: 选择每行字段

- **WHEN** 用户勾选 `title`、`fqn` 与 `kind` 字段
- **THEN** 文本与 Markdown 的每行按选中字段组合呈现
- **AND** 未选中的字段不出现在行内容中

#### Scenario: JSON 输出全字段

- **WHEN** 格式为 JSON
- **THEN** 输出为嵌套 JSON，每个节点包含 `title`、`fqn`、`kind` 与 `children`
- **AND** 不受字段选择影响

### Requirement: 图片导出所见即所得

Semantic Browser SHALL 通过既有图片导出入口导出当前 layouted projection：PNG/JPG SHALL 包含当前 View Selection、optional Change、Presentation Mode、focus、direct children 与已就地展开后代对应的画布内容；交互式 Browser chrome SHALL 被排除，在没有可用 snapshot 时 SHALL 回退到既有默认导出行为。

#### Scenario: 导出聚焦且就地展开的 Authored View

- **WHEN** 用户在 Authored View Selection 中 focus 并展开部分后代后导出 PNG 或 JPG
- **THEN** 导出节点和 edges 与屏上 projection 一致
- **AND** 不包含三个控制器或 breadcrumb

#### Scenario: 导出 Complete with diff

- **WHEN** 用户在 `complete-with-diff` 中导出 PNG 或 JPG
- **THEN** 导出图片保留业务 presentation、diff overlay 与 REMOVED ghosts

#### Scenario: 无前置 snapshot

- **WHEN** 用户直接打开导出页且没有交互 Browser 写入的 snapshot
- **THEN** 导出回退到既有默认行为且不产生错误

### Requirement: 文件类导出保持完整模型结构

Semantic Browser 的 dot、d2、mmd、puml、Draw.io 与层级树导出 SHALL 导出当前所选 source 的完整模型结构（全部 Elements 与其层级），SHALL NOT 反映当前 focus 与就地展开状态；该行为是导出能力的既定范围而非缺陷，图片导出（PNG/JPG）按“图片导出所见即所得”呈现当前视图。

#### Scenario: 导出 dot/mmd/puml/d2/Draw.io 文件

- **WHEN** 用户在聚焦并就地展开后导出 dot、d2、mmd、puml 或 Draw.io
- **THEN** 导出内容为完整模型结构，包含全部 Elements 与其层级，与当前 focus 和就地展开无关

#### Scenario: 导出层级树

- **WHEN** 用户在聚焦后导出层级树
- **THEN** 树包含当前 source 的完整模型层级，而非仅当前 focus 视图

### Requirement: 提供三维独立控制

Semantic Browser SHALL 在单一 Browser route 中以持久可见且相互独立的 View Selection、Change Selection 与 Presentation Mode 控件形成当前浏览状态；View Selection SHALL 只选择 Model 或一个 Authored View，Change Selection SHALL 为无 Change 或一个活动 Change，Presentation Mode SHALL 为 `complete`、`complete-with-diff` 或 `diff-only`。

#### Scenario: 无 Change 时限制模式

- **WHEN** Change Selection 为无 Change
- **THEN** 仅 `complete` 可用
- **AND** 其他模式保持可见但 disabled，并说明需要选择 Change

#### Scenario: 选择和清除 Change

- **WHEN** 用户选择一个活动 Change
- **THEN** Presentation Mode 默认变为 `complete-with-diff`
- **AND** 用户可切换到 `complete` 或 `diff-only`
- **WHEN** 用户清除 Change Selection
- **THEN** Presentation Mode 回到 `complete`

### Requirement: 使用分区 Runtime Manifest

Semantic Browser runtime manifest SHALL 使用 `version: 4`，分别表达 `model`、`authoredViews`、`changes` 以及可选的 `candidate` 与 `candidateDiff`；Browser SHALL NOT 将 Model、Authored View、Candidate、Candidate Diff 与 Change-derived projection 合并为同一 source 列表，旧 manifest version SHALL NOT 被静默解释为 version 4。

#### Scenario: 构建普通 Browser 状态

- **WHEN** Browser 加载 version 4 manifest
- **THEN** View Selection 从 `model` 与 `authoredViews` 建立
- **AND** Change Selection 从 `changes` 建立
- **AND** Change-derived projection 不作为独立 source entry

#### Scenario: Candidate 可用

- **WHEN** active Candidate 存在
- **THEN** manifest 包含独立 `candidate` 与 `candidateDiff`
- **AND** 它们不进入普通 Browser 的 View Selection 或 Change Selection

#### Scenario: 读取旧 manifest

- **WHEN** Browser 收到非 version 4 manifest
- **THEN** Browser 返回明确协议错误
- **AND** SHALL NOT 猜测或迁移字段含义

### Requirement: 服务端计算 Runtime Projection

Semantic Browser SHALL 由服务端根据 View Selection、可选 Change Selection、Presentation Mode、focus、expanded set 与 expected model fingerprint 确定当前可见 projection，并通过官方 LikeC4 compute-view 与 Graphviz layout 返回 layouted projection；该 projection SHALL 基于已由官方 parser 与 validator 建立的 base model，服务端 SHALL NOT 为单次 request 重复 parse 或 validate 同一 base model；Browser SHALL NOT 在已 layout 的 view 上自行计算最终节点 geometry 或 Relationship spline。

#### Scenario: 请求有效 projection

- **WHEN** Controller 提交与当前模型 fingerprint 一致的 projection descriptor
- **THEN** 服务端以官方 include/exclude predicates 在已 parse 且已 validate 的 base model 上计算该 projection
- **AND** 返回 projection key、layouted `DiagramView` 与 diagnostics
- **AND** 该 view 的 geometry 与 routing 来自 LikeC4/Graphviz 官方管线

#### Scenario: 请求使用旧 fingerprint

- **WHEN** request 的 expected model fingerprint 已不是当前有效版本
- **THEN** 服务端拒绝该 request 并返回结构化 stale diagnostic
- **AND** Controller 丢弃旧响应后使用当前 fingerprint 重试

#### Scenario: 新交互替代旧请求

- **WHEN** 用户在前一 projection request 完成前改变 View、Change、Mode、focus 或 expanded set
- **THEN** Controller 取消或忽略旧 request
- **AND** 旧结果不得覆盖当前 Browser state

### Requirement: 原子刷新基础 LikeC4 缓存

Semantic Browser 服务端 SHALL 在受管 Semantic Model、Authored View、Relationship、Metamodel、Contract、Candidate 或活动 Change source 变化时合并连续事件，依据显式生成文件清单完整重建基础 `.cache-likec4` 内容，并在临时目录校验成功后以保留 live 目录身份的方式原子发布：每个生成文件先写入 live 目录内的同目录临时文件再 rename 覆盖，SHALL NOT 整体 rename 或删除被监听的 live 目录；发布后失效旧 fingerprint 对应的 runtime projections。发布失败时 SHALL 从 last-known-good 备份恢复 live 内容、发布结构化 diagnostics，并在源修复后自动重试；恢复也失败时 SHALL 保留备份目录并报告包含发布与恢复错误的复合失败。

#### Scenario: 模型变化后刷新 Browser

- **WHEN** 一个受管模型 source 发生变化且完整缓存重建成功
- **THEN** 服务端原子替换基础缓存、重建 manifest、失效旧 projections 并发送一次 HMR 更新
- **AND** Browser 无需重启即可呈现新模型

#### Scenario: 发布保持被监听目录稳定

- **WHEN** 服务端在递归 watcher 监听 live 目录期间重建基础缓存
- **THEN** 发布以 live 目录内逐文件临时文件 rename 完成，SHALL NOT 整体 rename 或删除被监听目录
- **AND** watcher 不因 backup 目录被清理而报未处理错误

#### Scenario: 重建失败

- **WHEN** 新 source 无法解析、验证或生成完整 LikeC4 cache
- **THEN** 当前 last-known-good cache 保持可用
- **AND** Browser 显示结构化 diagnostics，且不读取半成品

#### Scenario: 跨平台处理缓存路径

- **WHEN** watcher 在 Windows、macOS 或 Linux 返回 source path
- **THEN** 服务端使用 Node.js path API 与 normalized project-relative key 定位显式缓存依赖
- **AND** 不假设路径分隔符或通过模糊 pattern 删除生成文件

### Requirement: 协调 View Selection 运行时状态

Semantic Browser SHALL 在切换 View Selection 时保留仍属于新选择边界的 focus，并将 expanded set 限制为新选择中仍有效且可达的 Elements；focus 不再有效时 SHALL 回到新 View 默认 root，Change Selection 与 Presentation Mode SHALL 保持不变。

#### Scenario: 切换到仍包含当前 focus 的 Authored View

- **WHEN** 当前 focus 与部分 expanded Elements 仍属于新 Authored View 的选择边界
- **THEN** Browser 保留 focus 与仍有效的 expanded Elements
- **AND** 使用新 projection key 重新布局

#### Scenario: 切换后 focus 不可用

- **WHEN** 当前 focus 不在新选择中或被 `exclude` 剪除
- **THEN** Browser 回到新 View 默认 root
- **AND** 被排除或不可达的 expanded Elements 不得重新出现

#### Scenario: 当前 Change 在新 View 中无差异

- **WHEN** 保留的 Change Selection 与新 View Selection 没有交集
- **THEN** Browser 显示明确的空差异状态
- **AND** 不自动修改 View、Change 或 Mode

### Requirement: 静态渲染不呈现交互式 Browser Chrome

Semantic Browser 的三个控制器、breadcrumb、loading/error controls 与其他交互式 Browser chrome SHALL 只在交互页面呈现；首页卡片、悬停预览与 PNG/JPG 导出 SHALL 只呈现当前 layouted projection。

#### Scenario: 导出当前 projection

- **WHEN** 用户从交互 Browser 导出 PNG 或 JPG
- **THEN** 图片包含当前 projection 内容
- **AND** 不包含 View、Change、Mode 控件、breadcrumb 或 diagnostics chrome

### Requirement: 活动 Change 生命周期变化时收敛状态

当当前选中的活动 Change 被归档或移除时，Semantic Browser SHALL 检测其生命周期变化并收敛状态：服务端 SHALL 将活动 Change 目录自身事件、`changes/archive` 侧事件以及缺少 filename 的 watcher 事件视为重建 manifest 的信号，使该 Change 不再出现在 Change Selection；Browser 收到不含该 Change 的 manifest 后 SHALL 清空 Change Selection、将 Presentation Mode 回到 `complete`，并清除来自被移除 Change projection 的 expanded set，旧 Change 的 diff 状态与投影 SHALL NOT 残留。

#### Scenario: 查看中的 Change 被归档

- **WHEN** 用户正在浏览一个活动 Change 且该 Change 被移到 `changes/archive/`
- **THEN** Change Selection 移除该 Change，Presentation Mode 回到 `complete`
- **AND** 不残留该 Change 的 diff overlay 或就地展开状态

#### Scenario: 活动 Change 目录被移除

- **WHEN** 一个活动 Change 目录被整体移动或删除
- **THEN** 服务端重建 manifest 且该 Change 不再可选
- **AND** Browser 收敛到无 Change 状态

#### Scenario: 缺少 filename 的 watcher 事件

- **WHEN** watcher 返回缺少 filename 的事件或 `changes/archive` 侧事件
- **THEN** 服务端触发一次完整重建，使活动 Change 列表与磁盘当前状态一致
