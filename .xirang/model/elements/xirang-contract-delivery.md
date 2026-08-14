---
entity: element-declaration
identity: xirang-contract-delivery
kind: element
parent: web
title: Xirang Contract Delivery
definition: Xirang Contract Delivery 是 Web 对 LikeC4 的 Contract 投递改造：按稳定 Element identity 构建 identity→content 索引，经受控 HTTP 端点向浏览器按需安全提供 Semantic Model、active Candidate 与活动 Change 目标中的 Element Contract，并以只读方式渲染。它独立建模以隔离 Contract 内容获取与投影计算、差异呈现的边界；不负责 projection 计算与差异视觉表达，不构成规范性语义来源。
---

## Requirements

### Requirement: 通过 Contract 接口加载 Element Contract

Web SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract`，按统一 source reference 加载 Semantic Model、active Candidate、Candidate Diff 或活动 Change target 中的 Element Contract；请求 MAY 使用 `source=change:<change-name>`、`source=candidate` 或 `source=candidate-diff` 选择来源。

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

Web SHALL 仅当当前选中 Element 在 Semantic Model 或 Change-derived projection 中存在其单一 Contract 时显示 `Contracts` tab；无 Contract 时隐藏该 tab，其他详情 tabs 保持可用。

#### Scenario: Element 无 Contract 时隐藏 tab

- **WHEN** 当前选中 Element 的 projection 中不存在 Contract
- **THEN** 详情 SHALL NOT 显示 `Contracts` tab
- **AND** 其他详情 tabs SHALL 保持可用

#### Scenario: Element 有 Contract 时显示 tab

- **WHEN** 当前选中 Element 的 projection 中存在其单一 Contract
- **THEN** 详情 SHALL 显示 `Contracts` tab
- **AND** SHALL 使用该 Element 的稳定 identity 关联内容

### Requirement: Contract 异步加载状态

Web SHALL 为 Contract 加载呈现 Loading、Success 与 Error 三种状态，并在 Element 或 source 变化时清除前一 Element 的内容，旧请求不得显示 stale content。

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

Web SHALL 使用 Markdown 渲染管线渲染 Contract 内容，支持标准 Markdown 元素，并禁止执行脚本与危险 HTML。

#### Scenario: 支持标准 Markdown 元素

- **WHEN** 渲染 Contract Markdown
- **THEN** 系统 SHALL 支持标题、段落、列表、表格、代码块与链接
- **AND** SHALL 正确显示嵌套列表与多级标题

#### Scenario: 禁止危险内容

- **WHEN** Contract 内容包含 `<script>` 标签或事件处理属性
- **THEN** 系统 SHALL 清理或转义这些内容
- **AND** SHALL NOT 执行任何 JavaScript

### Requirement: Contract 内容只读展示

Web 中的 Contract 内容 SHALL 只读，不提供编辑功能。

#### Scenario: 无编辑交互

- **WHEN** 用户查看 Contract 内容
- **THEN** 系统 SHALL NOT 提供文本编辑框或保存按钮
- **AND** 用户 SHALL NOT 能在浏览器中直接修改 Contract

### Requirement: 按需安全读取 Contract 单元

Web 的服务端 SHALL 从当前 Semantic Model 或所选 Change 目标模型的 `.xirang/model/elements/` 单元构建 identity→content 索引（manifest），并按稳定 Element identity 提供 Contract 内容读取。请求 SHALL 携带 project identity 与 Element identity；授权 SHALL 以 identity 为 key 的查找完成，请求输入不触达文件系统；absolute、`..`、backslash、非 `.md` 与 symlink 逃逸类输入作为查找 miss 处理，不构成路径读取。未打开的 Contract 内容无需单独请求即随 manifest 可用；Browser 的标签可见性由 manifest 中的 contracts map 决定。

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

### Requirement: Contract source 热更新

Web 服务端 SHALL 在当前有效模型、Authored View、Candidate 或活动 Change source 变化后重建对应 manifest，并使受旧 fingerprint 约束的 Contract requests 失效；未打开的 Contract 不需要独立网络请求，但下次访问 SHALL 使用最新有效 manifest 内容。

#### Scenario: 打开的 Contract 被修改

- **WHEN** 当前 Element 的 Contract source 变化且缓存重建成功
- **THEN** Browser 失效旧 Contract state 并呈现新内容
- **AND** 旧 request 不得覆盖最新 selection

#### Scenario: source 无效

- **WHEN** 修改后的 source 导致完整缓存生成失败
- **THEN** Browser 保留 last-known-good projection
- **AND** 显示新 source 的 diagnostics，不显示半更新 Contract
