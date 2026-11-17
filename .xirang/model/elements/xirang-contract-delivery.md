---
entity: element-declaration
identity: xirang-contract-delivery
kind: browser-specification
parent: web
title: Xirang Contract Delivery
definition: Xirang Contract Delivery 是 Web 对 LikeC4 的 Contract 投递改造：按稳定 Element identity 构建 identity→content 索引，经受控 HTTP 端点向浏览器按需安全提供 Semantic Model、active Candidate 与活动 Change 目标中的 Element Contract，并以只读方式渲染。它独立建模以隔离 Contract 内容获取与投影计算、差异呈现的边界；不负责 projection 计算与差异视觉表达，不构成规范性语义来源。
---

## Specification

### Section: Contract 异步加载状态

Web SHALL 为 Contract 加载呈现 Loading、Success 与 Error 三种状态，并在 Element 或 source 变化时清除前一 Element 的内容，旧请求不得显示 stale content。

新请求 SHALL 取消或忽略前一请求；Loading 不显示旧正文，成功显示完整正文与宿主 identity；失败结果遵循 Edge Cases and Exception Handling。

### Section: 桌面与移动视口兼容

Contract 详情弹窗、tabs 与可滚动内容 SHALL 在桌面和移动视口中保持 viewport containment，无溢出、无重叠；长 Contract 内容 SHALL 可垂直滚动。

### Section: 安全渲染 Contract Markdown

Web SHALL 使用 Markdown 渲染管线渲染 Contract 内容，支持标准 Markdown 元素，并禁止执行脚本与危险 HTML。

Web SHALL 支持标题、段落、列表、表格、代码块、链接、嵌套列表和多级标题；`<script>` 与事件处理属性 SHALL 被清理或转义，不得执行 JavaScript。

### Section: 按需安全读取 Contract 单元

Web 的服务端 SHALL 从当前 Semantic Model 或所选 Change 目标模型的 `.xirang/model/elements/` 单元构建 identity→content 索引（manifest），并按稳定 Element identity 提供 Contract 内容读取。请求 SHALL 携带 project identity 与 Element identity；授权 SHALL 以 identity 为 key 的查找完成，请求输入不触达文件系统；absolute、`..`、backslash、非 `.md` 与 symlink 逃逸类输入作为查找 miss 处理，不构成路径读取。未打开的 Contract 内容无需单独请求即随 manifest 可用；Browser 的标签可见性由 manifest 中的 contracts map 决定。

### Section: Contract source 热更新

Web 服务端 SHALL 在当前有效模型、Authored View、Candidate 或活动 Change source 变化后重建对应 manifest，并使受旧 fingerprint 约束的 Contract requests 失效；未打开的 Contract 不需要独立网络请求，但下次访问 SHALL 使用最新有效 manifest 内容。

源单元位置或解析后的引用映射变化时，即使语义内容不变，Web SHALL 更新相应展示版本并使旧引用解析结果失效。刷新成功后打开的正文与下次访问 SHALL 使用新内容和新引用映射；生成失败时 SHALL 保留 last-known-good projection，显示 diagnostics，不展示半更新正文。

### Section: Scope and Non-goals

Xirang Contract Delivery SHALL 按稳定 Element identity 向浏览器提供 Semantic Model、active Candidate 与活动 Change 目标中的单一 Element Contract，并提供只读 Markdown 阅读和正文引用导航。Web SHALL 不提供 Contract 编辑或保存功能，用户不得通过浏览器修改 Contract 源文件。本能力不负责 projection 计算或差异视觉表达，不构成规范性语义来源。

### Section: Business Logic

Web SHALL 按 project identity、Element identity 与统一 source reference 提供单一 Contract。无 source 参数时读取 Semantic Model，`source=candidate` 读取 active Candidate，`source=change:<change-name>` 读取该活动 Change 的目标模型；不得使用 `source=change:candidate` reserved 编码。Candidate 的 Contract diff 与 diagnostics 呈现逻辑 SHALL 与活动 Change 一致。

当前选中 Element 在所选模型中有 Contract 时 SHALL 显示 `Contracts` tab，无 Contract 时 SHALL 隐藏该 tab，并保持其他适用详情 tabs 可用。加载成功 SHALL 显示完整 Markdown 与宿主 Element identity，不显示 Contract selector；自动化入口 SHALL 保留 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors。

正文引用 SHALL 在生成网页展示数据时解析：以承载该段正文的源单元位置为基准，规范化相对文档路径，并通过已加载单元索引定位声明的稳定 Element identity；文件名、目录和去掉 `.md` 的字符串均不得替代 identity。源 Markdown SHALL 保持原样，转换只作用于展示数据。解析与目标内容 SHALL 对应当前 Model Selection，不得以其他模型的正文替代。

Semantic Model 与 Candidate SHALL 使用各自源单元索引；Change 合成正文中继承的 Section 使用正式模型来源，ADDED/MODIFIED Section 使用该 Section 对应的 Delta 来源，Acceptance Case 随其宿主 Section 确定来源。路径只用于查找单元，目标正文仍通过 Element identity 取得。解析 SHALL 使用对应来源中的显式路径映射，不猜测同名文件，不按文件名模式匹配目标。

在 macOS、Linux 与 Windows 上，源文件系统路径 SHALL 按宿主平台处理，Markdown 引用中的 `/` SHALL 作为相对文档路径分隔符。规范化后的路径 SHALL 仅在已加载的受管单元索引中查找；文件名大小写按宿主文件系统语义匹配，不统一强制转小写。

点击成功解析且目标具有 Contract 的模型内引用时，Web SHALL 打开目标 Element 的详情并激活 Contracts，即使目标不在当前 View 中，也保持当前 Model Selection、View Selection、Presentation Mode、focus 和图形视口。外部网页链接 SHALL 保持正常网页链接行为。

引用带非空 `#fragment` 时，Web SHALL 在目标正文加载完成后定位到对应标题；仅有 fragment 时定位当前正文。标题定位 SHALL 对正文标题使用一致且确定性的标识规则，支持中文和 URL 编码的 fragment，并对重复标题消歧。较早请求或定位结果不得覆盖用户随后选择的 Element、模型或锚点。

### Section: Edge Cases and Exception Handling

Web SHALL 对有效 identity 的缺失 Contract 作为无 Contract 处理；loader 的该结果不得成为未处理异常。网络、权限或不可读等加载失败 SHALL 显示错误消息与 Element identity，且不关闭详情弹窗其他 tabs；单一 Contract 缺失时内容区 SHALL 显示 identity 与错误，不关闭 element details。

本地文档引用无法解析、引用的 Element 在当前所选模型中不存在或没有可打开的 Contract 时，点击 SHALL 在正文附近提示“无法定位引用目标”，保留当前页面和正文；不得将原始相对路径交给图形路由。该提示是界面反馈。

目标 Contract 存在而指定标题不存在时，Web SHALL 打开目标正文并提示未找到定位位置。链接不带 fragment 时不要求标题定位。

### Section: Key Acceptance Cases

系统 SHALL 通过以下案例验证 Contract 投递、正文阅读和引用导航的可观察结果。

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：加载 Semantic Model Contract

- 用户在 Full Model 中打开一个 Element 的 Contract tab
- Browser 不提供 `source` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：加载活动 Change Contract

- 用户在 Model Selection 为活动 Change 时打开一个 Element Contract
- loader 携带 `source=change:<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：加载 Candidate Contract

- 用户在 Model Selection 为 Candidate 时打开一个 Element Contract
- loader 携带 `source=candidate` 并呈现 active Candidate target 中的 Contract、diff 与 diagnostics

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：Contract 不存在

- endpoint 对有效 project、element 与可选 source 返回 Contract not found
- loader 将该结果表示为无 Contract，而不是未处理异常

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：Contract state 与当前选择一致

- Contract tab 呈现
- Contract state 对应当前选中的 Element 与 View source，且仅反映最新加载请求的结果

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：新请求替代旧请求

- 用户在前一个 Contract request 完成前切换 Element 或 Model Selection
- Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Acceptance Case: 通过 Contract 接口加载 Element Contract：使用 Contract selectors

- 自动化测试或 Browser integration 定位 Contract tab 与内容
- UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors

#### Acceptance Case: 条件式 Contracts tab 显示：Element 无 Contract 时隐藏 tab

- 当前选中 Element 的 projection 中不存在 Contract
- 详情 SHALL NOT 显示 `Contracts` tab
- 其他详情 tabs SHALL 保持可用

#### Acceptance Case: 条件式 Contracts tab 显示：Element 有 Contract 时显示 tab

- 当前选中 Element 的 projection 中存在其单一 Contract
- 详情 SHALL 显示 `Contracts` tab
- SHALL 使用该 Element 的稳定 identity 关联内容

#### Acceptance Case: Contract 异步加载状态：加载中状态

- Contract 正在从加载器读取
- 内容区 SHALL 显示加载指示器
- SHALL NOT 显示过期内容

#### Acceptance Case: Contract 异步加载状态：加载成功

- Contract 成功加载
- 内容区 SHALL 渲染完整 Contract 内容
- SHALL 显示宿主 Element identity

#### Acceptance Case: Contract 异步加载状态：加载失败

- Contract 加载失败（网络错误、权限错误或不可读）
- 内容区 SHALL 显示错误消息与 Element identity
- SHALL NOT 关闭详情弹窗其他 tabs

#### Acceptance Case: Contract 异步加载状态：切换 Element 清除旧状态

- 用户从 Element A 切换到 B，或 source 变化使当前 selection 不再适用
- SHALL 清除 A 的 Contract state
- SHALL NOT 短暂显示 A 的内容
- 旧请求 SHALL 被取消或忽略，不得覆盖当前 state

#### Acceptance Case: Contract 异步加载状态：单一 Contract 加载

- 用户打开 `Contracts` 标签且宿主 Element 携带单一 Contract
- SHALL 显示该 Contract 的完整 Markdown 与宿主 Element identity
- SHALL NOT 显示 Contract selector

#### Acceptance Case: Contract 异步加载状态：单一 Contract 缺失

- identity 索引无法定位对应 Element 单元或其正文无 Contract
- SHALL 在内容区显示 identity 与错误
- SHALL NOT 关闭 element details

#### Acceptance Case: 桌面与移动视口兼容：桌面视口

- 在桌面浏览器中打开 Element 详情
- 详情弹窗 SHALL 不溢出视口
- 长 Contract 内容 SHALL 可垂直滚动

#### Acceptance Case: 桌面与移动视口兼容：移动视口

- 在移动设备视口中打开 Element 详情
- 弹窗 SHALL 位于视口边界内
- tabs 与 Contract 内容 SHALL 位于弹窗边界内且无重叠
- 长 Contract 内容 SHALL 可垂直滚动

#### Acceptance Case: 安全渲染 Contract Markdown：支持标准 Markdown 元素

- 渲染 Contract Markdown
- 系统 SHALL 支持标题、段落、列表、表格、代码块与链接
- SHALL 正确显示嵌套列表与多级标题

#### Acceptance Case: 安全渲染 Contract Markdown：禁止危险内容

- Contract 内容包含 `<script>` 标签或事件处理属性
- 系统 SHALL 清理或转义这些内容
- SHALL NOT 执行任何 JavaScript

#### Acceptance Case: Contract 内容只读展示：无编辑交互

- 用户查看 Contract 内容
- 系统 SHALL NOT 提供文本编辑框或保存按钮
- 用户 SHALL NOT 能在浏览器中直接修改 Contract

#### Acceptance Case: 按需安全读取 Contract 单元：Identity 授权校验

- browser 请求某 Element 的 Contract 内容
- request SHALL 携带当前 model project identity 与稳定 Element identity
- server SHALL 以 identity 为 key 从 manifest 查找对应内容

#### Acceptance Case: 按需安全读取 Contract 单元：路径类输入不触达文件系统

- 请求携带 absolute、包含 `..`、包含 backslash、非 `.md` 或 symlink 逃逸类路径输入
- 该输入仅作为 identity lookup miss 处理
- SHALL NOT 作为路径读取任何文件

#### Acceptance Case: 按需安全读取 Contract 单元：路径授权校验

- 请求的 identity 不在 manifest 中
- server SHALL 拒绝读取
- SHALL NOT 仅凭路径存在授权

#### Acceptance Case: 按需安全读取 Contract 单元：符号链接逃逸

- `.xirang/model/` 下存在指向目录外的 symlink
- 请求不会因该 symlink 触达目录外文件
- 读取仅发生在本端 manifest 构建阶段对受管单元目录

#### Acceptance Case: 按需安全读取 Contract 单元：Manifest 预载 Contract 内容

- manifest 构建
- SHALL 将全部 Element Contract 内容序列化进 manifest
- Browser 启动时获取该 manifest
- 标签可见性由 manifest contracts map 决定，无需按请求读取未打开的单元

#### Acceptance Case: Contract source 热更新：打开的 Contract 被修改

- 当前 Element 的 Contract source 变化且缓存重建成功
- Browser 失效旧 Contract state 并呈现新内容
- 旧 request 不得覆盖最新 selection

#### Acceptance Case: Contract source 热更新：source 无效

- 修改后的 source 导致完整缓存生成失败
- Browser 保留 last-known-good projection
- 显示新 source 的 diagnostics，不显示半更新 Contract

#### Acceptance Case: 正文证据链接打开目标 Contract

- 当前网页为 `/view/full-model/?view=scenario`，`linux-driver-example` 的正文包含 `[ftape 驱动迁移案例](ftape-linux-timing.md)`，对应源文件与目标单元可由索引定位。
- 用户点击该引用。
- SHALL 打开 identity 为 `ftape-linux-timing` 的 Contracts，不访问 `/view/full-model/ftape-linux-timing.md`，不显示 `The diagram full-model does not exist or contains errors`。

#### Acceptance Case: 文件名与 identity 不同

- `elements/analysis.md` 引用 `research/driver-case.md`，后者声明 identity 为 `ftape-linux-timing`。
- 点击引用 SHALL 打开 `ftape-linux-timing` 的 Contracts，不把 `driver-case` 当作 identity；两个源文件字节保持不变。

#### Acceptance Case: 跨 View 阅读

- 当前 Authored View 不含证据 Element，但当前所选模型包含该 Element 及其 Contract。
- 点击正文引用 SHALL 打开目标 Contracts，Model、View、Mode、focus、图形视口保持原值。

#### Acceptance Case: Change 的混合来源

- Change 的目标 Contract 同时包含继承 Section 与 MODIFIED Section，两者来自不同目录，均使用 `evidence.md` 引用，各自来源目录中的受管目标单元声明不同 identity，且都存在于目标模型。
- 两处引用 SHALL 各自打开对应 identity 的目标模型正文，不因合成 Contract 而解析到同一文件；Acceptance Case 内的引用使用其宿主 Section 的来源。

#### Acceptance Case: 三种 Model Selection 的正文隔离

- Semantic Model、Candidate 和活动 Change 的同一目标 identity 具有不同 Contract 内容。
- 分别在三种 Model Selection 中点击有效引用，SHALL 展示对应模型的目标正文，保持该 Model Selection，不回退到其他模型的内容。

#### Acceptance Case: 标题与缺失标题

- 链接 `evidence.md#时间依据` 的目标 Contract 存在“时间依据”标题。
- 点击后 SHALL 打开该 Contract 并定位对应标题；等价的 URL 编码 fragment SHALL 指向同一标题。
- 若目标 Contract 存在而该标题缺失，SHALL 打开正文并提示未找到定位位置。

#### Acceptance Case: 当前正文与重复标题

- 当前正文有两个同名“时间依据”标题。
- 两个标题 SHALL 具有确定且不同的定位标识，仅 fragment 引用 SHALL 定位当前正文中相应标题，不请求一个空文件路径。

#### Acceptance Case: 无法定位引用目标

- 当前正文引用不存在的本地单元、当前目标模型中已移除的 Element，或无 Contract 的 Element。
- 点击 SHALL 在正文附近显示“无法定位引用目标”，保留当前页面和正文，不进入图形错误路由。

#### Acceptance Case: Windows 与 POSIX 源路径

- Windows 项目的源单元位置为 `C:\work\demo\.xirang\model\elements\analysis.md`，正文引用 `research/driver-case.md`，对应目标声明 identity 为 `ftape-linux-timing`。
- Windows 上 SHALL 按本机路径规则定位该单元并打开 `ftape-linux-timing` 的 Contracts。
- 同样的受管相对目录与 Markdown 引用在 macOS/Linux 项目中 SHALL 定位同一声明 identity；不得把 URL 的 `/` 错当成 Windows 源文件路径不匹配。

#### Acceptance Case: 外部链接与受控查找

- 正文含外部 `https://example.com/research` 和指向受管索引外文件的相对文档引用。
- 外部链接 SHALL 保留正常网页链接行为；索引外引用 SHALL 显示无法定位提示，不触发任意文件读取。

#### Acceptance Case: 定位请求不覆盖后续选择

- 用户点击带锚点的 A 引用后，在 A 加载完成前打开 B 或切换 Model Selection。
- A 的较晚响应和定位动作 SHALL 不覆盖后续正文或滚动位置。

#### Acceptance Case: 文件改名后的链接映射刷新

- 一个索引内文件位置改变而 identity 与 Contract 语义不变，且引用的解析结果因此发生变化。
- 刷新成功后 SHALL 使用新的链接映射，旧解析结果和受旧展示版本约束的请求不得恢复旧目标。
