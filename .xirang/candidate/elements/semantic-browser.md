---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是息壤的可视化语义界面。它使用 Views 呈现 Semantic Model 与 Change-derived information，使用户能够浏览不同抽象层级的 Elements、Element Contracts 与 Relationships，观察 Change 带来的语义差异，并据此理解、讨论、审查和决策项目。
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

Semantic Browser SHALL 使用 Model View 或 Change-derived View 在单一 View identity 内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；初始 focus SHALL 为 Project Root，当前层 SHALL 包含 focus Element、direct children、已就地展开 Element 的后代与可映射到不同可见 endpoints 的 Relationships。

#### Scenario: 下钻 Element

- **WHEN** 用户进入一个具有 children 的 Element
- **THEN** Browser 保持当前 View identity，更新 focus、当前层布局、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context 且不创建空 View

### Requirement: 呈现 Change 目标与差异

Semantic Browser SHALL 为每个活动 Change 提供一个由当前 Semantic Model 与该 Change 的 Semantic Delta 确定性推导的 Change-derived View，并呈现目标模型及其相对当前 Semantic Model 的差异。

#### Scenario: 审查活动 Change

- **WHEN** 用户选择一个 Change-derived View
- **THEN** Browser 显示目标模型并区分其相对当前 Semantic Model 的 ADDED、MODIFIED 与 REMOVED 语义

### Requirement: 保持 LikeC4 投影有效

Semantic Browser 的 LikeC4 投影 SHALL 关闭 `implicitViews`、固定生成 identity 为 `model` 的默认 View，并省略 LikeC4 无法表示的 self 与 ancestor-chain relationships；投影 SHALL 保持 siblings、跨子树关系及 Semantic Model 中的原始 Relationships 不变。

#### Scenario: 生成 Browser 缓存

- **WHEN** CLI 从 Semantic Model 生成 LikeC4 缓存
- **THEN** 缓存包含唯一默认 `model` View、不包含按 Element 生成的 View ids、通过 LikeC4 校验且不修改 Semantic Model

#### Scenario: 模型包含祖先链关系

- **WHEN** Semantic Model 包含 ancestor-to-descendant 或 descendant-to-ancestor Relationship
- **THEN** LikeC4 缓存省略该关系且 Semantic Model 仍保留原始三元组

### Requirement: 分层呈现 Element Definition

Semantic Browser SHALL 在 Semantic Model 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 确定性派生 Definition Excerpt

Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 120 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

#### Scenario: Definition 超过显示上限

- **WHEN** 第一段规范化后超过 120 Unicode code points
- **THEN** Browser summary 包含前 120 个 code points 和 `...`，description 保持完整原文

#### Scenario: Definition 不超过显示上限

- **WHEN** 第一段规范化后不超过 120 Unicode code points
- **THEN** Browser summary 原样使用该规范化段落且不追加省略号

### Requirement: 通过 Contract 接口加载 Element Contract

Semantic Browser SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract` 加载 Semantic Model 或活动 Change 目标模型中的 Element Contract；请求 MAY 使用 `change=<change-name>` 选择目标模型，且 public exports、runtime state、errors 与 test selectors SHALL NOT 使用 `variant`、`formal` 或旧 Spec aliases。

#### Scenario: 加载 Semantic Model Contract

- **WHEN** 用户在 Model View 中打开一个 Element 的 Contract tab
- **THEN** Browser 不提供 `change` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户在 Change-derived View 中打开一个 Element Contract
- **THEN** loader 携带 `change=<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与可选 change 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element、Model View 或 Change-derived View
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 拒绝旧接口术语

- **WHEN** consumer 使用 `variant` 参数、旧 Xirang-specific runtime aliases、`/__xirang/spec` 或旧 Spec loader aliases
- **THEN** Browser protocol 与 public exports 明确拒绝或不提供该接口

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors，且不暴露旧 `data-xirang-spec*` selectors
#### Scenario: 仅本地交互浏览
- **WHEN** 用户运行 `xirang view`
- **THEN** 系统 SHALL 启动本地 Web 服务器并按需从模型 source 读取内容
- **AND** SHALL NOT 生成包含 Contract 内容的静态 HTML
#### Scenario: 无离线模式
- **WHEN** 用户关闭 `xirang view` 服务器
- **THEN** 浏览器 SHALL NOT 能继续访问 Contract 内容
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

Semantic Browser 的服务端 SHALL 监听模型 source 变化，并在当前打开的 Contract 或当前浏览内容被修改后自动刷新。

#### Scenario: 打开的 Contract 被修改

- **WHEN** 用户在详情中打开某 Element 的 Contract
- **AND** 该 source 在磁盘上被修改
- **THEN** 系统 SHALL 使对应缓存失效
- **AND** SHALL 自动重新读取并渲染更新后的内容

#### Scenario: 未打开的内容修改不主动刷新

- **WHEN** 某 source 被修改但用户未打开对应内容
- **THEN** 系统 SHALL NOT 主动刷新该内容
- **AND** 下次打开时 SHALL 读取最新内容
#### Scenario: Active change 热更新
- **WHEN** selected change 的 Contracts、四分区 delta 单元或 Formal dependencies 变化
- **THEN** 系统 SHALL 定向失效对应 runtime cache
- **AND** SHALL 通过 HMR 更新当前 view
- **AND** Contracts-only 修改 SHALL NOT 强制重新计算无关 Architecture layout
#### Scenario: 跨平台路径处理
- **WHEN** 在 Windows、macOS 或 Linux 查找项目、active changes 或监听 source files
- **THEN** 系统 SHALL 使用 Node.js path API 与 normalized project-relative paths
- **AND** SHALL NOT 假设路径分隔符
#### Scenario: Contract 文件修改
- **WHEN** 用户在详情中打开某个 Element 的 Contract
- **AND** 该 Contract 在磁盘上被修改
- **THEN** 系统 SHALL 使该 Contract 缓存失效
- **AND** SHALL 自动重新读取并渲染更新后的内容
#### Scenario: change 级 source 变化定向失效
- **WHEN** active change 中一个 source 文件变化
- **THEN** SHALL 只失效该 Change 相关的 diff 与投影
- **AND** SHALL NOT 仅因该修改重新布局 Architecture graph
#### Scenario: Windows watcher path 规范化
- **WHEN** Windows watcher 返回 backslash 分隔的 change source path
- **THEN** 系统 SHALL 规范化为 project-relative cache key
- **AND** SHALL 精确失效对应 active change 与 source
### Requirement: Contract 内容只读展示

Semantic Browser 中的 Contract 内容 SHALL 只读，不提供编辑功能。

#### Scenario: 无编辑交互

- **WHEN** 用户查看 Contract 内容
- **THEN** 系统 SHALL NOT 提供文本编辑框或保存按钮
- **AND** 用户 SHALL NOT 能在浏览器中直接修改 Contract

### Requirement: 只列出真实 Views

Semantic Browser 的 View selector SHALL 只列出唯一 Model View、实际 Authored Views 与每个活动 Change 的唯一 Change-derived View，且 SHALL NOT 列出 focus projection 或按 Element 生成的 Views。

#### Scenario: 查看 View selector

- **WHEN** 项目包含 Authored Views 和活动 Changes
- **THEN** selector 显示 `Model View`、这些 Authored Views 与对应 Change-derived Views，且没有 Element View entries

#### Scenario: Archive change 不显示

- **WHEN** change 位于 `.xirang/changes/archive/`
- **THEN** selector SHALL NOT 显示该 change

#### Scenario: Contract-only change 仍显示

- **WHEN** active change 只包含 `elements/` Requirement delta 而没有结构单元 delta
- **THEN** selector SHALL 仍显示该 change
- **AND** 其 Architecture 区域 SHALL 显示无 semantic graph change

#### Scenario: Change 编译 diagnostics 展示

- **WHEN** selected change 的 delta 无法编译或 validation 失败
- **THEN** 对应 Change-derived View SHALL 显示 diagnostics 并以 Invalid 标记
- **AND** change selector SHALL 保留该 invalid change
- **AND** 其他可编译的 Changes 与 Model View SHALL 继续可浏览

### Requirement: 保持 Authored View 声明视角

Authored View SHALL 严格呈现其 `include` 与 `of` 声明且 SHALL NOT 自动下钻；Element details SHALL 提供显式命令在 Model View 中以该 Element 为 focus 打开。

#### Scenario: 从 Authored View 浏览 Element

- **WHEN** 用户在 Authored View 中选择一个具有 children 的 Element
- **THEN** Browser 打开 details 而不改变 Authored View，并允许用户显式跳转到 Model View

### Requirement: 聚合当前层 Relationships

Semantic Browser SHALL 将深层 Relationship endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 edge，同一可见 endpoints 的 edge 标签 SHALL 按 UTF-8 byte order 显示去重后的全部 Relationship Kind identities，详情 SHALL 保留原始三元组。

#### Scenario: 展开后 endpoint 下移

- **WHEN** 一个 Relationship endpoint 的祖先被就地展开而该 endpoint 随之可见
- **THEN** edge 连接该 endpoint 本身而不再连接其祖先容器

### Requirement: 呈现 Perspective Elements

Semantic Browser SHALL 只对 Kind 为 `perspective` 的可见 Elements 使用 `document` shape 与基于 identity 确定性分配的不同无障碍颜色；该 shape SHALL 将全部装饰限制在节点边界内；普通 descendants SHALL 保持自身 Kind 样式，且这些样式 SHALL NOT 写入 Semantic Model 或 Semantic Delta。

#### Scenario: 区分同层 Perspectives

- **WHEN** 当前层包含多个 Kind 为 `perspective` 的 Elements
- **THEN** 每个 Perspective 使用 `document` shape 与由 identity 确定的互不相同的无障碍颜色

### Requirement: focus 失效时确定性回退

Semantic Model 或 Semantic Delta 刷新使当前 focus 不再存在时，Semantic Browser SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

#### Scenario: Change 更新移除当前 focus

- **WHEN** 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- **THEN** Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

### Requirement: 合并呈现 Requirement 差异

Semantic Browser SHALL 在 Change-derived View 的 Element Details 中将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本
