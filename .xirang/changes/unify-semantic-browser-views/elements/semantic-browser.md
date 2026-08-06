---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

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

Semantic Browser SHALL 由服务端根据 View Selection、可选 Change Selection、Presentation Mode、focus、expanded set 与 expected model fingerprint 生成原生 LikeC4 model/view，并依次通过 LikeC4 parser、validator、compute-view 与 Graphviz layout 返回 layouted projection；Browser SHALL NOT 在已 layout 的 view 上自行计算最终节点 geometry 或 Relationship spline。

#### Scenario: 请求有效 projection

- **WHEN** Controller 提交与当前模型 fingerprint 一致的 projection descriptor
- **THEN** 服务端返回 projection key、layouted `DiagramView` 与 diagnostics
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

Semantic Browser 服务端 SHALL 在受管 Semantic Model、Authored View、Relationship、Metamodel、Contract、Candidate 或活动 Change source 变化时合并连续事件，依据显式生成文件清单完整重建基础 `.cache-likec4` 内容，在临时目录校验成功后原子替换，并失效旧 fingerprint 对应的 runtime projections；失败时 SHALL 保留 last-known-good cache、发布结构化 diagnostics，并在源修复后自动重试。

#### Scenario: 模型变化后刷新 Browser

- **WHEN** 一个受管模型 source 发生变化且完整缓存重建成功
- **THEN** 服务端原子替换基础缓存、重建 manifest、失效旧 projections 并发送一次 HMR 更新
- **AND** Browser 无需重启即可呈现新模型

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

## MODIFIED Requirements

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

Semantic Browser SHALL 将当前 Semantic Model、一个可选活动 Change 与当前 View Selection 确定性组合，并提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode；系统 SHALL NOT 为每个 Change 创建独立可选 View source。

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

### Requirement: 保持 LikeC4 投影有效

Semantic Browser SHALL 关闭 `implicitViews`，将每个 runtime semantic projection 转为原生 LikeC4 model/view 并完整经过官方 parser、validator、compute-view 与 Graphviz layout；投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain Relationships，同时保持 siblings、跨子树关系及 source 中的原始 Relationships 不变。

#### Scenario: 生成 runtime projection

- **WHEN** 服务端从 Model、Authored selection、Change target 或 Candidate 生成当前可见投影
- **THEN** 原生 LikeC4 内容通过官方管线生成唯一 layouted result
- **AND** Browser 不再通过固定网格或中心曲线重建最终 `DiagramView`

#### Scenario: LikeC4 无法表达 source Relationship

- **WHEN** source 包含 self 或 ancestor-chain Relationship
- **THEN** LikeC4 projection 确定性省略该 edge
- **AND** Semantic Model、Candidate 或 Change source 保留原始三元组

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

## REMOVED Requirements

### Requirement: 优先使用 Authored scoped View

### Requirement: Candidate source manifest 使用 version 3

### Requirement: 浮动 Change 面板可拖动

### Requirement: 静态渲染上下文不呈现浮动 Change 面板
