---
element: project.root/domain.presentation/cap.presentation.semantic-browser
---

# spec-content-browser Specification

## Purpose
定义 OPSX 内置语义浏览器按 Architecture 元素索引安全、按需且只读呈现一个或多个 durable Specs 的行为。
## Requirements
### Requirement: 条件式 Specs 标签页显示

元素详情 SHALL 根据派生 Spec registry 中该 `elementId` 的 Specs 显示 `Specs` 标签页，MUST NOT 依赖 element `metadata.specs`。

#### Scenario: Element 无 Spec binding
- **WHEN** registry 对当前 element 返回空数组
- **THEN** 详情 SHALL NOT 显示 `Specs` 标签
- **AND** 其他详情标签 SHALL 保持可用

#### Scenario: Element 有 Specs
- **WHEN** registry 返回一个或多个 Spec
- **THEN** 详情 SHALL 显示 `Specs` 标签
- **AND** SHALL 使用 canonical `elementId` 关联内容

### Requirement: 单个 Spec 直接渲染

Element 仅拥有一个 Spec 时，详情 SHALL 直接按需加载并渲染该 Markdown。

#### Scenario: 单个 Spec 加载
- **WHEN** 用户打开 `Specs` 标签且 registry 返回一个 Spec
- **THEN** SHALL 显示 project-relative path 与完整 Markdown
- **AND** SHALL NOT 显示 Spec selector

#### Scenario: 单个 Spec 缺失
- **WHEN** registry entry 对应文件不存在或不可读
- **THEN** SHALL 在内容区显示 path 与错误
- **AND** SHALL NOT 关闭 element details

### Requirement: 多个 Spec 提供选择器

Element 拥有多个 Specs 时，详情 SHALL 按 registry 的确定性 Spec ID 顺序提供 selector，并默认打开第一项。

#### Scenario: 多个 Spec 默认选择
- **WHEN** registry 返回多个 Specs
- **THEN** selector SHALL 按 Spec ID 排序
- **AND** SHALL 默认按需加载第一项

#### Scenario: 切换 Spec
- **WHEN** 用户选择另一个 Spec
- **THEN** SHALL 卸载当前内容并加载新内容
- **AND** SHALL 显示新 Spec 的 project-relative path

#### Scenario: 多个 Spec 独立错误
- **WHEN** 多个 Specs 中一项加载失败
- **THEN** SHALL 只在该项显示 error
- **AND** 其他 Specs SHALL 可继续切换和加载

### Requirement: 按需安全读取 Spec 文件

服务端 SHALL 根据当前 computed OPSX Semantic Model 的 stable `elementId` 与派生 registry 授权 `.opsx/specs/**/*.md` 读取。请求 path 必须属于该 element 的 registry entries，并通过 project-relative、extension 与 realpath containment 校验。

#### Scenario: Registry 授权校验
- **WHEN** browser 请求 Spec 内容
- **THEN** request SHALL 携带当前 model project ID 与 stable `elementId`
- **AND** server SHALL 重建或读取当前 registry 并验证该 Spec 属于 element
- **AND** SHALL 拒绝不匹配的 element/path pair

#### Scenario: 路径安全
- **WHEN** path 为 absolute、包含 `..`、包含 backslash、不是 `.md` 或 realpath 逃逸 `.opsx/specs/`
- **THEN** server SHALL 拒绝读取

#### Scenario: 路径授权校验
- **WHEN** requested path 不属于 registry 中当前 element 的 Specs
- **THEN** server SHALL 拒绝读取
- **AND** SHALL NOT 仅凭 path 存在授权

#### Scenario: 符号链接逃逸
- **WHEN** `.opsx/specs/` 下 symlink 的 realpath 指向目录外
- **THEN** server SHALL 拒绝读取

#### Scenario: 按需加载
- **WHEN** 用户未打开 `Specs` 标签
- **THEN** SHALL NOT 加载 Spec body
- **AND** SHALL NOT 预载未选中的 Specs

### Requirement: Markdown 安全渲染

系统 SHALL 使用 LikeC4 现有 Markdown 渲染管线，禁止执行脚本和危险 HTML。

#### Scenario: 支持的 Markdown 元素

- **WHEN** 渲染 Spec Markdown
- **THEN** 系统 SHALL 支持标题、段落、列表、表格、代码块和链接
- **AND** SHALL 正确显示嵌套列表和多级标题

#### Scenario: 禁止危险内容

- **WHEN** Spec 包含 `<script>` 标签或事件处理属性
- **THEN** 系统 SHALL 清理或转义这些内容
- **AND** SHALL NOT 执行任何 JavaScript

### Requirement: 文件监听与热更新

系统 SHALL 监听 Spec 文件变化，并在当前打开的 Spec 修改后自动刷新。

#### Scenario: Spec 文件修改

- **WHEN** 用户在详情中打开某个 Spec
- **AND** 该 Spec 在磁盘上被修改
- **THEN** 系统 SHALL 使该 Spec 缓存失效
- **AND** SHALL 自动重新读取并渲染更新后的内容

#### Scenario: 未打开的 Spec 修改

- **WHEN** 某个 Spec 被修改但用户未在详情中打开它
- **THEN** 系统 SHALL NOT 主动刷新该 Spec
- **AND** 下次打开时 SHALL 读取最新内容

### Requirement: 异步加载状态

系统 SHALL 显示 Loading、Success 和 Error 三种异步状态。

#### Scenario: 加载中状态

- **WHEN** Spec 正在从服务端读取
- **THEN** 内容区 SHALL 显示加载指示器
- **AND** SHALL NOT 显示过期内容

#### Scenario: 加载成功

- **WHEN** Spec 成功加载
- **THEN** 内容区 SHALL 渲染完整 Markdown
- **AND** SHALL 显示项目相对路径

#### Scenario: 加载失败

- **WHEN** Spec 读取失败（网络错误、权限错误或文件不存在）
- **THEN** 内容区 SHALL 显示错误信息和文件路径
- **AND** SHALL NOT 影响详情弹窗其他标签

### Requirement: 切换元素清除状态

切换 element 时 SHALL 清除上一个 `elementId` 的 Spec state，并通过新 element 的 registry entries 重新初始化。

#### Scenario: 切换到新 element
- **WHEN** 用户从 element A 切换到 B
- **THEN** SHALL 卸载 A 的 Spec content
- **AND** SHALL NOT 短暂显示 A 的内容
- **AND** B 有 Specs 时 SHALL 按 B 的 registry entries 加载

### Requirement: 桌面与移动视口兼容

Spec 内容面板 SHALL 在桌面和移动视口中正确显示。

#### Scenario: 桌面视口

- **WHEN** 在桌面浏览器中打开元素详情
- **THEN** 详情弹窗 SHALL 不溢出视口
- **AND** 长 Spec 内容 SHALL 可垂直滚动

#### Scenario: 移动视口

- **WHEN** 在移动设备视口中打开元素详情
- **THEN** 标签与选择器 SHALL NOT 重叠
- **AND** 内容 SHALL 适配窄屏宽度
- **AND** 长 Spec SHALL 可垂直滚动

### Requirement: 只读模式

Spec 内容 SHALL 只读，不提供编辑功能。

#### Scenario: 无编辑交互

- **WHEN** 用户查看 Spec 内容
- **THEN** 系统 SHALL NOT 提供文本编辑框或保存按钮
- **AND** 用户 SHALL NOT 能在浏览器中直接修改 Spec

### Requirement: 第一阶段不提供静态构建

系统 SHALL NOT 在第一阶段提供静态网站构建或离线 Spec 内容打包。

#### Scenario: 仅本地交互浏览

- **WHEN** 用户运行 `opsx view`
- **THEN** 系统 SHALL 启动本地 Web 服务器
- **AND** Spec SHALL 按需从 `.opsx/specs/` 读取
- **AND** SHALL NOT 生成包含 Spec 内容的静态 HTML

#### Scenario: 无离线模式

- **WHEN** 用户关闭 `opsx view` 服务器
- **THEN** 浏览器 SHALL NOT 能继续访问 Spec 内容

### Requirement: Active change Specs semantic diff

Spec 内容浏览器 SHALL 在 selected active change 中按 Requirement 与 Scenario identity 展示 Formal → Target semantic diff，并从统一 Diff IR 生成 operation badges 与文本差异。

#### Scenario: Requirement operation 展示
- **WHEN** selected change 新增、修改或删除 Requirement
- **THEN** Specs 区域 SHALL 显示对应 ADDED、MODIFIED 或 REMOVED badge
- **AND** identity 与 counts SHALL 与 `opsx diff --json` 一致

#### Scenario: Scenario operation 派生
- **WHEN** `MODIFIED Requirement` 的 target Scenario set 与 Formal 不同
- **THEN** 浏览器 SHALL 通过 title 与 body 比较派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED 状态
- **AND** SHALL NOT 读取 change-local Scenario operation labels

#### Scenario: Modified text 展示
- **WHEN** Requirement statement 或 Scenario body 发生修改
- **THEN** SHALL 展示行级 additions/removals 与行内词组高亮
- **AND** unchanged lines SHALL 默认折叠并允许展开上下文

#### Scenario: Scenario title 变化
- **WHEN** Formal 与 Target 使用不同 Scenario title 且没有 stable Scenario ID
- **THEN** SHALL 显示一个 REMOVED Scenario 与一个 ADDED Scenario
- **AND** SHALL NOT 自动推断 rename

### Requirement: Active change diff loading and isolation

Spec Content Gateway SHALL 按 selected active change 与 Diff IR fingerprints 提供 Formal/Target content、diff entries 与 diagnostics。不同 active changes SHALL 相互隔离，且 generated review artifact MUST NOT 成为内容来源。

#### Scenario: Change 间隔离
- **WHEN** 用户从 change A 切换到 change B
- **THEN** gateway SHALL 使用 B 的独立 materialized target 与 fingerprints
- **AND** SHALL NOT 合并 A 的 operations

#### Scenario: effective-change.md 不作为输入
- **WHEN** `effective-change.md` 缺失、stale 或被手工修改
- **THEN** Web diff SHALL 继续从 Formal 与 change source 实时计算
- **AND** SHALL NOT 展示该文件内容作为 authoritative diff

#### Scenario: Specs parse error
- **WHEN** selected change 某个 Spec 无法解析
- **THEN** gateway SHALL 返回该 Spec 的 location-aware diagnostics
- **AND** 其他可解析 Specs 与 Architecture SHALL 保持可用

#### Scenario: Spec 修改定向失效
- **WHEN** active change 中一个 Spec 文件变化
- **THEN** SHALL 只失效相关 Specs diff 与 registry projection
- **AND** SHALL NOT 仅因该修改重新布局 Architecture graph

#### Scenario: Windows watcher path
- **WHEN** Windows watcher 返回 backslash 分隔的 change Spec path
- **THEN** gateway SHALL 规范化为 project-relative cache key
- **AND** SHALL 精确失效对应 active change 与 Spec

