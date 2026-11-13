---
operation: "MODIFIED"
entity: "element-declaration"
identity: "web"
kind: "browser-specification"
parent: "interaction-surfaces"
title: "Web"
definition: "Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。"
---

## ADDED Sections

### Section: Scope and Non-goals

Web SHALL 作为与 CLI 并列的 Interaction Surface，提供 Semantic Model、active Candidate 与活动 Change 的分层浏览和差异审阅；不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 或 Change Closure。

### Section: Business Logic

Web SHALL 将 Model Selection、View Selection 与 Presentation Mode 组合为单一 route 中的浏览状态，依据 View 边界和 focus 呈现层级、详情与差异，维持 URL 与导航历史一致。交互式页面 SHALL 提供可识别的视图标题、各 Model 的 breadcrumb、差异审阅入口和可收起的 minimap；静态呈现 SHALL 排除交互 chrome。当前状态、导出与刷新 SHALL 分别遵循本 Contract 的对应独立承诺。

### Section: Edge Cases and Exception Handling

找不到 Xirang 项目时 SHALL 以非零状态失败且不启动服务器；focus 失效时 SHALL 沿旧 ancestor 链回退至最近仍存在的 Element，无可用 ancestor 时回退 Project Root。新 View 不含当前 focus 时 SHALL 使用该 View 默认 root；新组合没有差异时 SHALL 显示空差异状态而不修改选择。没有可用图片 snapshot 时 SHALL 沿用默认导出行为。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 启动边界：项目根发现与无项目失败：项目根向上发现

- 用户从 `.xirang/changes/some-change/` 等子目录运行 `xirang view`
- CLI 沿父目录向上查找最近包含 `.xirang/` 的目录作为项目根
- 使用该项目根的 Formal source 与 active changes

#### Acceptance Case: 启动边界：项目根发现与无项目失败：未找到项目

- 用户在不包含 `.xirang/` 的目录运行 `xirang view`
- CLI 报错："未找到 Xirang 项目"
- 以非零状态退出且不启动服务器

#### Acceptance Case: 支持分层语义浏览：下钻 Full Model 或 Authored View

- 用户在 Full Model 或 Authored View Selection 中进入具有 children 的 Element
- Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

#### Acceptance Case: 支持分层语义浏览：浏览 Element 详情

- 用户选择没有 children 的 Element
- Browser 展示其声明、Contract、Relationships 与 refinement context
- 不创建新的 View identity 或空 route

#### Acceptance Case: 支持分层语义浏览：在 Change 中导航层级

- 用户在活动 Change 的 Full Model 中下钻
- breadcrumb 呈现当前层级，点击 ancestor 更新 focus
- 缺少原生标题时使用当前视图名称，而不是 `Untitled View`

#### Acceptance Case: 保持 Authored View 声明视角：浏览 Authored View 子树

- 用户在 Authored View 中 focus 或展开具有 children 的 Element
- Browser 只显露该 View 选择闭包内且未被 `exclude` 剪除的 descendants
- Authored View 文件保持不变

#### Acceptance Case: 保持 Authored View 声明视角：切换后呈现声明边界内内容

- 用户从 Model View 切换到 Authored View
- 投影只呈现该 View 选择闭包内的 Elements，边界外 Elements 不呈现
- 初始 focus 为该 View 的根 Element，不引用 View 外 Element

#### Acceptance Case: 保持 Authored View 声明视角：在 Authored View 内就地展开

- 用户在 Authored View 内就地展开选择闭包内的 Element
- Browser 以与 Model View 一致的方式呈现其 children

#### Acceptance Case: 保持 Authored View 声明视角：在 Authored View 内显示 focus breadcrumb

- 用户在 Authored View 内下钻到闭包内 Element
- focus breadcrumb 以该 View 根为起点呈现路径
- 路径在该 View 边界处截断，不包含 View 外祖先

#### Acceptance Case: focus 失效时确定性回退：Change 更新移除当前 focus

- 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

#### Acceptance Case: focus 失效时确定性回退：Candidate 更新移除当前 focus

- 用户正在 Candidate 目标模型中浏览的 Element 被更新后的 Candidate 移除
- Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus

#### Acceptance Case: URL 编码导航状态并响应浏览器前进后退：下钻与 breadcrumb 跳转

- 用户下钻 Element 或点击 breadcrumb ancestor
- Browser 将新 focus 写入 URL 并新增历史步
- 浏览器后退恢复先前 focus 与 projection

#### Acceptance Case: URL 编码导航状态并响应浏览器前进后退：控件变化

- 用户改变 View Selection、Model Selection 或 Presentation Mode
- Browser 将对应 `view`、`model` 或 `mode` 写入 URL
- 一次用户操作只形成一个历史步

#### Acceptance Case: URL 编码导航状态并响应浏览器前进后退：expanded 不进入 URL

- 用户就地展开任意数量的 Elements
- URL 不增加 expanded identities
- 前进后退可通过 history state 恢复，刷新后使用当前 focus 的默认折叠状态

#### Acceptance Case: URL 编码导航状态并响应浏览器前进后退：深链恢复

- 用户直接打开携带有效 `view`、`model`、`mode` 或 `focus` 的 URL
- Controller 建立对应合法状态
- 不存在的 identity 触发确定性默认回退而不是空白画布

#### Acceptance Case: focus breadcrumb 可拖动：拖动 breadcrumb

- 用户按住 breadcrumb 拖动手柄并在 diagram 容器内移动指针
- breadcrumb 跟随指针移动
- diagram 视图 SHALL NOT 随之平移或缩放

#### Acceptance Case: focus breadcrumb 可拖动：breadcrumb 按钮仍可导航

- 用户点击 breadcrumb 内的元素按钮
- 对应元素成为 focus
- 该点击 SHALL NOT 启动拖动

#### Acceptance Case: 提供当前 view 的层级树导出：导出当前 view 层级树

- 用户从导出菜单选择层级树导出
- 打开层级树导出页，内容为当前 view 的元素层级树
- 根节点为当前 view 的根元素，子孙按父子关系嵌套

#### Acceptance Case: 提供当前 view 的层级树导出：树仅含当前 view 元素

- 当前 view 只呈现模型的一部分元素
- 层级树 SHALL 只包含该 view 呈现的元素及其层级
- SHALL NOT 混入 view 之外的模型元素

#### Acceptance Case: 层级树多格式与字段选择：切换导出格式

- 用户在层级树导出页选择纯文本、Markdown 或 JSON 格式
- 内容按所选格式重新渲染
- 复制与下载的文件扩展名与所选格式一致（`.tree.txt`/`.tree.md`/`.tree.json`）

#### Acceptance Case: 层级树多格式与字段选择：选择每行字段

- 用户勾选 `title`、`fqn` 与 `kind` 字段
- 文本与 Markdown 的每行按选中字段组合呈现
- 未选中的字段不出现在行内容中

#### Acceptance Case: 层级树多格式与字段选择：JSON 输出全字段

- 格式为 JSON
- 输出为嵌套 JSON，每个节点包含 `title`、`fqn`、`kind` 与 `children`
- 不受字段选择影响

#### Acceptance Case: 图片导出所见即所得：导出聚焦且就地展开的 Authored View

- 用户在 Authored View Selection 中 focus 并展开部分后代后导出 PNG 或 JPG
- 导出节点和 edges 与屏上 projection 一致
- 不包含三个控制器或 breadcrumb

#### Acceptance Case: 图片导出所见即所得：导出 Complete with diff

- 用户在 `complete-with-diff` 中导出 PNG 或 JPG
- 导出图片保留业务 presentation、diff overlay 与 REMOVED ghosts

#### Acceptance Case: 图片导出所见即所得：无前置 snapshot

- 用户直接打开导出页且没有交互 Browser 写入的 snapshot
- 导出回退到既有默认行为且不产生错误

#### Acceptance Case: 文件类导出保持完整模型结构：导出 dot/mmd/puml/d2/Draw.io 文件

- 用户在聚焦并就地展开后导出 dot、d2、mmd、puml 或 Draw.io
- 导出内容为完整模型结构，包含全部 Elements 与其层级，与当前 focus 和就地展开无关

#### Acceptance Case: 文件类导出保持完整模型结构：导出层级树

- 用户在聚焦后导出层级树
- 树包含当前 source 的完整模型层级，而非仅当前 focus 视图

#### Acceptance Case: 提供三维独立控制：三维独立切换

- 用户改变 Model Selection、View Selection 或 Presentation Mode
- 另外两个维度的选择保持不变
- 新的组合状态立即生成对应 projection

#### Acceptance Case: 提供三维独立控制：Candidate 提供三态 Mode

- Model Selection 为 active Candidate
- Presentation Mode 控件列出 `complete`、`complete-with-diff` 与 `diff-only`
- 默认为 `complete`

#### Acceptance Case: 协调 View Selection 运行时状态：切换到仍包含当前 focus 的 Authored View

- 当前 focus 与部分 expanded Elements 仍属于新 Authored View 的选择边界
- Browser 保留 focus 与仍有效的 expanded Elements
- 使用新 projection key 重新布局

#### Acceptance Case: 协调 View Selection 运行时状态：切换后 focus 不可用

- 当前 focus 不在新选择中或被 `exclude` 剪除
- Browser 回到新 View 默认 root
- 被排除或不可达的 expanded Elements 不得重新出现

#### Acceptance Case: 协调 View Selection 运行时状态：当前 Model 在新 View 中无差异

- 保留的非 baseline Model Selection 与新 View Selection 没有交集
- Browser 显示明确的空差异状态
- 不自动修改 View、Model 或 Mode

#### Acceptance Case: 静态渲染不呈现交互式 Browser Chrome：导出当前 projection

- 用户从交互 Browser 导出 PNG 或 JPG
- 图片包含当前 projection 内容
- 不包含 View、Change、Mode 控件、breadcrumb 或 diagnostics chrome

#### Acceptance Case: 首页提供 Candidate 与活动 Change 快速入口：点击 Candidate 卡片

- 用户在首页点击 Candidate 入口卡片
- Browser 以 `model=candidate` 状态打开，URL 不含 `mode`
- Model Selection 显示 Candidate，Mode 为 `complete`

#### Acceptance Case: 首页提供 Candidate 与活动 Change 快速入口：点击活动 Change 卡片

- 用户在首页点击一个活动 Change 卡片
- Browser 以 `model=change:<name>&mode=diff-only` 状态打开
- View Selection 保持 Full Model

#### Acceptance Case: 首页提供 Candidate 与活动 Change 快速入口：首页与面板计数一致

- 一个 Change 含一条 MODIFIED Section，但没有 Element Declaration entry
- 首页卡片与面板均计为 Sections `~1`，不增加 Elements 计数
- 该 Section 的宿主仍可在修改节点列表中定位

#### Acceptance Case: 切换 View、Model 或 Mode 后自动适配视口：切换 View 后适配

- 用户在交互式 Browser 中切换 View Selection
- 新 projection 应用后视口自动缩放并居中
- 该 projection 的全部内容完整可见

#### Acceptance Case: 切换 View、Model 或 Mode 后自动适配视口：切换 Model 后适配

- 用户切换 Model Selection
- 新 projection 应用后视口自动缩放并居中
- 该 projection 的全部内容完整可见

#### Acceptance Case: 切换 View、Model 或 Mode 后自动适配视口：切换 Mode 后适配

- 用户切换 Presentation Mode
- 新 projection 应用后视口自动缩放并居中
- 该 projection 的全部内容完整可见

#### Acceptance Case: 切换 View、Model 或 Mode 后自动适配视口：快速入口进入后适配

- 用户通过首页快速入口卡片以 `view`/`model`/`mode` 状态打开单一 route
- 首个 projection 应用后视口自动缩放并居中
- 该 projection 的全部内容完整可见

#### Acceptance Case: 切换 View、Model 或 Mode 后自动适配视口：下钻与就地展开不触发适配

- 用户下钻 focus 或就地展开后代
- 视口保持用户当前位置
- 不自动缩放或居中

#### Acceptance Case: 呈现 Model 目标与差异：Complete 模式

- 用户使用 `complete`
- baseline 呈现当前模型，非 baseline Model 呈现其目标模型
- 不添加 diff overlay

#### Acceptance Case: 呈现 Model 目标与差异：Complete with diff 模式

- 用户使用 `complete-with-diff`
- Browser 呈现该 Model 的 target projection
- 可见节点与边叠加 ADDED、MODIFIED 与 REMOVED 差异标记
- REMOVED elements 不属于 target projection，不在该模式中呈现

#### Acceptance Case: 呈现 Model 目标与差异：Diff only 模式

- 用户使用 `diff-only`
- Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
- unchanged context 不计入 diff counts

#### Acceptance Case: 呈现 Model 目标与差异：浏览 Candidate 默认目标态

- 用户以 `model=candidate` 打开
- Browser 呈现 Candidate 目标模型，Mode 为默认 `complete`，无差异标记

#### Acceptance Case: 提供可收起的交互式缩略图：在桌面使用缩略图

- 用户在交互式 Browser 浏览一个较大的 projection
- minimap 呈现节点与当前视口，用户可平移、缩放或收起 minimap

#### Acceptance Case: 提供可收起的交互式缩略图：窄屏与静态呈现

- 用户在窄屏打开 Browser
- minimap 默认隐藏，仍可通过开关展开
- 静态预览与图片导出不包含 minimap 或开关

### Section: 提供可收起的交互式缩略图

Web SHALL 在交互式 diagram 中提供可收起的 minimap，展示当前 projection 的节点分布与当前视口，并允许通过 minimap 平移和缩放画布。变化节点 SHALL 使用对应操作颜色，未变化节点 SHALL 使用中性灰色，容器 SHALL 使用透明填充以保留子节点辨识度；缩略图背景 SHALL 跟随明暗主题。

窄于或等于 48em 的视口 SHALL 默认隐藏 minimap，并提供展开按钮；其他视口默认显示。minimap 与其开关 SHALL NOT 出现在静态预览或 PNG/JPG 导出中。

## MODIFIED Sections

### Section: 启动边界：项目根发现与无项目失败

`xirang view` SHALL 从嵌套目录沿父目录向上发现最近的 `.xirang/` 项目根，并仅在该项目根下启动嵌入式浏览器；不存在 `.xirang/` 项目时 SHALL 以非零状态失败。

### Section: 支持分层语义浏览

Web SHALL 在单一 route 中使用 Full Model 或 Authored View Selection，并可结合 Model Selection（active Candidate 或活动 Change 的 Expected Semantic Model），在被浏览 Model 实例内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

交互式 Browser SHALL 为所有 Model Selection 提供当前 focus 的 breadcrumb，包括 Candidate 与活动 Change，并保持 ancestor 导航可用。原生视图缺少标题时，导航栏与视图详情 SHALL 使用当前 View Selection 的可读名称；focus 不为视图 root 时附带 focus Element 标题。

### Section: 保持 Authored View 声明视角

Authored View SHALL 以持久化 `include`、`exclude` 与可选 `of` 确定 View Selection 边界，并 SHALL 在该边界内支持与 Model 相同的 focus、下钻、breadcrumb 与就地展开；这些 runtime 状态 SHALL NOT 修改 View Definition。

### Section: focus 失效时确定性回退

Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Web SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

### Section: URL 编码导航状态并响应浏览器前进后退

Web SHALL 在单一 route 的 URL 中编码 `view`、`model`、`mode` 与 `focus`，并将三维选择与 focus 变化呈现为浏览器历史步；expanded set SHALL 只存储于 Controller 会话和 browser history state，不进入 URL。浏览器前进/后退 SHALL 恢复对应状态，且同步 SHALL NOT 产生循环或重复历史条目。

### Section: focus breadcrumb 可拖动

Web 的 focus breadcrumb 导航 SHALL 可通过拖动手柄在 diagram 容器内移动，使用户可将它移开以避免遮挡编辑器控件；拖动 SHALL NOT 触发 diagram 平移，且 breadcrumb 内元素按钮的 focus 导航 SHALL 保持可用。

### Section: 提供当前 view 的层级树导出

Web SHALL 为当前 view 提供层级树导出：按视图内呈现元素的父子层级构建树，根为视图根元素，子元素按声明层级嵌套，且树 SHALL 仅包含当前 view 呈现的元素。

### Section: 层级树多格式与字段选择

层级树导出 SHALL 支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表与 JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容 SHALL 按 `title`/`fqn`/`kind` 字段组合呈现，JSON SHALL 恒包含 `title`、`fqn`、`kind` 与 `children`。

### Section: 图片导出所见即所得

Web SHALL 通过既有图片导出入口导出当前 layouted projection：PNG/JPG SHALL 包含当前 View Selection、optional Change、Presentation Mode、focus、direct children 与已就地展开后代对应的画布内容；交互式 Browser chrome SHALL 被排除，在没有可用 snapshot 时 SHALL 回退到既有默认导出行为。

### Section: 文件类导出保持完整模型结构

Web 的 dot、d2、mmd、puml、Draw.io 与层级树导出 SHALL 导出当前所选 source 的完整模型结构（全部 Elements 与其层级），SHALL NOT 反映当前 focus 与就地展开状态；该行为是导出能力的既定范围而非缺陷，图片导出（PNG/JPG）按“图片导出所见即所得”呈现当前视图。

### Section: 提供三维独立控制

Web SHALL 在单一 Browser route 中以持久可见且相互独立的 Model Selection、View Selection 与 Presentation Mode 控件形成当前浏览状态。Model Selection SHALL 为 baseline、active Candidate（若存在，`model=candidate`）或一个活动 Change 的 Expected Semantic Model（`model=change:<identity>`），Candidate 不存在时 SHALL NOT 出现该值；View Selection SHALL 只选择 Full Model 或一个对当前 Model 实例解析非空的 Authored View；Presentation Mode SHALL 在非 baseline Model 时提供 `complete`、`complete-with-diff` 与 `diff-only`，baseline 时锁定为 `complete`。

### Section: 协调 View Selection 运行时状态

Web SHALL 在切换 View Selection 时保留仍属于新选择边界的 focus，并将 expanded set 限制为新选择中仍有效且可达的 Elements；focus 不再有效时 SHALL 回到新 View 默认 root，Model Selection 与 Presentation Mode SHALL 保持不变。

### Section: 静态渲染不呈现交互式 Browser Chrome

Web 的三个控制器、breadcrumb、loading/error controls 与其他交互式 Browser chrome SHALL 只在交互页面呈现；首页卡片、悬停预览与 PNG/JPG 导出 SHALL 只呈现当前 layouted projection。

### Section: 首页提供 Candidate 与活动 Change 快速入口

Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `model=candidate` 状态打开单一 route 并省略 `mode`；活动 Change 卡片 SHALL 以 `model=change:<name>&mode=diff-only` 状态打开单一 route；活动 Change 与 Candidate SHALL NOT 因首页入口而形成独立 View source。

首页卡片与 Browser 差异面板 SHALL 使用相同的实体分类与操作计数口径：Elements 只统计 Element Declaration entries，Relationships 统计 Relationship entries，Sections 统计 Section entries，Metamodel 统计 Element Kind 与 Relationship Kind entries，Views 统计 Authored View entries；Acceptance Cases 与其他内部子项 SHALL NOT 独立计数。零计数分类 SHALL 不显示。

### Section: 切换 View、Model 或 Mode 后自动适配视口

Web SHALL 在 View Selection、Model Selection 或 Presentation Mode 切换产生的新 projection 应用后，自动缩放并居中，使该 projection 的全部内容完整可见；由 focus 下钻或就地展开引起的 projection 更新 SHALL NOT 触发自动适配，SHALL 保持用户当前视口。

### Section: 呈现 Model 目标与差异

Web SHALL 将 Model Selection、View Selection 与 Presentation Mode 确定性组合并呈现对应 projection；非 baseline Model SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode，默认值按 Model 值区分（Candidate 为 `complete`，活动 Change 为 `complete-with-diff`），baseline SHALL 锁定为 `complete`；系统 SHALL NOT 为每个 Model 值创建独立可选 View source。`complete` 与 `complete-with-diff` projection SHALL 使用该 Model 的 target-only sources，`diff-only` projection SHALL 使用 baseline 与该 Model 的 union sources；REMOVED elements SHALL 仅在 `diff-only` 中以 ghost 保留。
