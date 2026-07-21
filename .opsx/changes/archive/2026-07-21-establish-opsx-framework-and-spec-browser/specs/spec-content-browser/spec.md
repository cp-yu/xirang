---
capabilities:
  - cap.presentation.spec-content-gateway
  - cap.presentation.spec-content-panel
---
# spec-content-browser Specification

## Purpose

定义在 LikeC4 元素详情中按需、安全、可刷新地浏览一个或多个 Spec 全文的交互行为。

## ADDED Requirements

### Requirement: 条件式 Specs 标签页显示

元素详情 SHALL 在元素包含 `metadata.specs` 时显示 `Specs` 标签页。

#### Scenario: 元素无 Spec 索引

- **WHEN** 打开的元素不包含 `metadata.specs` 或索引为空
- **THEN** 详情弹窗 SHALL NOT 显示 `Specs` 标签
- **AND** 其他标签页（Properties / Relationships / Views / Structure / Deployments）SHALL 保持可用

#### Scenario: 元素有 Spec 索引

- **WHEN** 打开的元素包含非空 `metadata.specs` 数组
- **THEN** 详情弹窗 SHALL 显示 `Specs` 标签
- **AND** 标签 SHALL 与其他标签并列显示

### Requirement: 单个 Spec 直接渲染

元素仅索引一个 Spec 时，SHALL 直接渲染 Markdown 全文。

#### Scenario: 单个 Spec 加载

- **WHEN** 打开 `Specs` 标签且 `metadata.specs` 包含一个路径
- **THEN** 系统 SHALL 按需读取该 Spec 文件
- **AND** SHALL 显示项目相对路径（例如 `.opsx/specs/arch-preview/spec.md`）
- **AND** SHALL 渲染完整 Markdown 内容
- **AND** SHALL NOT 显示 Spec 选择器

#### Scenario: 单个 Spec 缺失

- **WHEN** 索引的 Spec 文件不存在或不可读
- **THEN** 系统 SHALL 在内容区显示文件路径和错误信息
- **AND** SHALL NOT 关闭详情弹窗

### Requirement: 多个 Spec 提供选择器

元素索引多个 Spec 时，SHALL 提供紧凑选择器并按索引顺序默认打开第一项。

#### Scenario: 多个 Spec 默认选择

- **WHEN** 打开 `Specs` 标签且 `metadata.specs` 包含多个路径
- **THEN** 系统 SHALL 在内容顶部显示 Spec 选择器
- **AND** SHALL 默认选中索引数组第一项
- **AND** SHALL 按需加载第一项内容

#### Scenario: 切换 Spec

- **WHEN** 用户在选择器中选择不同 Spec
- **THEN** 系统 SHALL 卸载当前 Spec 内容
- **AND** SHALL 按需加载新选中 Spec
- **AND** SHALL 显示新 Spec 的项目相对路径

#### Scenario: 多个 Spec 独立错误

- **WHEN** 多个 Spec 中某一个加载失败
- **THEN** 系统 SHALL 仅在该 Spec 内容区显示错误
- **AND** 其他 Spec SHALL 可正常切换和加载

### Requirement: 按需安全读取 Spec 文件

系统 SHALL 从服务端按需读取 `.opsx/specs/**/*.md`，并校验路径安全。

#### Scenario: 路径授权校验

- **WHEN** 浏览器请求 Spec 内容
- **THEN** 浏览器 SHALL 携带当前元素所属的 LikeC4 project ID
- **AND** 服务端 SHALL 仅从该 project 的当前 computed model 中读取元素并复核其 `metadata.specs` 请求路径
- **AND** SHALL 拒绝未在元素索引中声明的路径
- **AND** SHALL 拒绝绝对路径
- **AND** SHALL 拒绝包含 `..` 的路径
- **AND** SHALL 拒绝反斜杠路径
- **AND** SHALL 拒绝非 `.md` 后缀文件
- **AND** 解析后路径 SHALL 位于 `<project>/.opsx/specs/` 下

#### Scenario: 符号链接逃逸

- **WHEN** `.opsx/specs/` 下存在符号链接指向目录外文件
- **THEN** 服务端 SHALL 拒绝读取
- **AND** SHALL 返回错误状态

#### Scenario: 按需加载

- **WHEN** 用户未打开 `Specs` 标签
- **THEN** 系统 SHALL NOT 加载 Spec 内容
- **AND** SHALL NOT 预载未选中的 Spec

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

切换元素时，SHALL 清除上一个元素的 Spec 加载结果。

#### Scenario: 切换到新元素

- **WHEN** 用户从元素 A 切换到元素 B
- **THEN** 系统 SHALL 卸载元素 A 的 Spec 内容
- **AND** 若元素 B 包含 Spec 索引，SHALL 按新索引重新加载
- **AND** SHALL NOT 短暂显示元素 A 的内容

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
