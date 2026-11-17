## Context

当前 `projectContracts()` 从 `SemanticModel` 重新序列化 Markdown，得到 identity→Markdown map；运行时 manifest 交给嵌入式查看器，`/__xirang/contract` 按 identity 返回 `{ element, md }`。`ContractsTab` 直接使用通用 Markdown 渲染，生成的相对 href 被浏览器按 `/view/full-model/` 解析。Explore 已实际点击复现 ftape 引用进入错误 diagram 路由。

`ParsedModel.index` 保存正式模型和 Candidate 的单元路径，`compileChangeDelta()` 返回 Delta 的 entry→源文件映射；这些信息在当前 Contract 投影前可用。详情 actor 支持显式 identity，且可没有当前图形节点，但旧的打开入口通常从节点提取 identity。通用 Markdown 管线目前不生成标题锚点。

## Goals / Non-Goals

**Goals:**

- 让正文相对引用经过源文件定位、稳定 identity 解析与 Contracts 导航，覆盖三个 Model Selection。
- 在保持当前图形的情况下完成跨 View 阅读、标题定位和明确的失败提示。
- 局部迁移 `xirang-contract-delivery` 到已有 `browser-specification` Kind，保留既有承诺和具体案例。

**Non-Goals:**

- 不修改用户正文链接写法，不增加任意文件浏览服务，不扩展到普通项目文档或其他语义实体的阅读器。
- 不改层级、关系、Kind 定义或 Authored Views，不整理其他 Elements 的格式。
- 界面提示不引入日志系统；不为本次修复重构通用图形导航或生成工作面。

## Decisions

### 1. 在 Xirang runtime 投影边界解析引用

服务端在 Contract 序列化丢失来源信息前，构建显式源单元路径与 identity 索引，并解析 Markdown 链接节点。投影阶段输出正文及可定位到具体链接 occurrence 的解析信息，包括目标 identity、fragment 或不可解析状态；同一 href 在合成正文的不同 Section 中可能有不同目标，不能使用整份 Contract 的 href→identity 字典。前端消费解析结果并保持 Markdown 清理链路。

解析使用 Markdown AST，识别内联和引用式链接；代码示例和图片不作为文档引用。优先复用 LikeC4 已有的 `remark-parse`/`remark-gfm` 能力，通过明确的包依赖或共享导出提供给投影层，不隐式依赖 pnpm 的传递依赖，也不以正则替换任意正文。具体数据字段与函数拆分由 Apply 按实际依赖确定。runtime 类型、HTTP payload 和 frontend consumer 应在同一实施中保持一致；schema 校验应能明确拒绝不兼容数据，不能静默丢弃解析结果。

拒绝仅给 href 补前缀、删掉 `.md` 猜 identity 或向前端暴露任意文件读取接口：这些方法不能保证引用语义或复用现有 identity 授权边界。

### 2. 按 Section 保留来源，按所选模型取得内容

Semantic Model 和 Candidate 使用各自 `ParsedModel.index`。Change 对未变 Section 使用 base 来源，对 ADDED/MODIFIED Section 使用 `compiledDelta.sources`，Acceptance Case 随宿主 Section 处理。源位置用于确定相对路径，解析目标必须是已加载单元中的显式匹配，再以 identity 检查其是否存在于所选目标模型。已移除目标不回退读取正式模型内容。

来源目录内未命中的引用不猜测其他同名文件。例如 Delta 文件中的同目录引用不能只因正式模型存在同名文件就被自动替换；需要引用实际可定位的受管单元。显式路径可定位到正式模型单元时，最终展示仍取当前所选 Change 的目标内容。该做法保持文档相对路径含义，避免隐式搜索优先级。

在定位期间使用 `node:path` 的平台规则处理源文件路径，以相对索引键完成显式查找；对 Markdown URL 路径和 fragment 分开解码，保留宿主文件系统大小写语义。`/` 是 Markdown 路径分隔符，Windows 源文件路径使用本机分隔符。仅在受管单元索引中解析 `..` 规范化后的目标；HTTP 请求继续只传 project、source 与 identity，不接收文件路径作为读取授权。

### 3. 前端以 identity 打开目标详情

给现有详情打开链路补充显式 identity、初始 Contracts 标签和 fragment 意图，不依赖目标在当前图形中存在节点。从当前选中 source 的 architecture/Contract map 校验目标可阅读性，保留 Model、View、Mode、focus 和图形视口。

对同一目标已打开的情形更新激活及定位意图；现有 overlay 按 subject 去重，不能让第二次点击被去重后丢失新 fragment。仅 fragment 引用在当前正文内定位。解析失败由当前正文展示就地提示，不触发浏览器原生相对路由。目标加载失败继续使用原 Contract 错误状态。

### 4. 为 Contract 阅读增加确定性标题定位

限定在 Contract 阅读边界生成标题定位标识，避免改变所有 Markdown 展示面的输出。按标题的可见文本生成常见 GitHub 风格 slug：Unicode 小写、保留中文、空白转连字符并去标点；同名依次使用基础 slug、`-1`、`-2`，碰撞时继续递增至唯一。fragment URL 解码后匹配生成的标识，也支持与唯一可见标题文本对应的 `#标题` 写法；同名原文定位第一个，后续标题使用消歧 slug。

定位只在当前目标正文加载并渲染成功后执行。将定位意图绑定当前 source、Element 和请求版本；用户后续导航或切换模型后，旧响应与旧滚动动作必须被取消或忽略。标题缺失遵循 Delta 的提示保证。

### 5. 链接信息参与展示版本

当前分区 fingerprint 主要以语义对象计算，不能单独反映文件改名。对 Contract 来源路径及解析映射增加展示版本依据；watcher、runtime source 更新与前端失效路径使用该版本，使路径变化能够刷新链接，而不把文件路径提升为语义 identity 或改变 Semantic Model 的语义 fingerprint 定义。

source 构建应一次生成彼此一致的正文、链接信息与展示版本，失败时继续沿用 last-known-good 行为。热更新后清除过期解析及定位意图，不让旧的异步请求恢复过期正文。

### 6. 局部 Contract 整理与语义范围

`xirang-contract-delivery` 只修改 Kind，完整 Definition、identity、parent、title 沿用正式模型。四个基础 Sections 承载范围、整体机制、异常与验收；五项独立承诺保留原 Section identity，三个已并入基础 Sections 的旧 Section 用 REMOVED 表达。原 27 个具体验收场景移入 Key Acceptance Cases，内容沿用，不以这次整理改变原行为。

父级 `web` 更新 Business Logic、Edge Cases and Exception Handling 与 Key Acceptance Cases，完整承接其层级上的阅读和反馈承诺。`interaction-surfaces` 的职责仍是通过 Views 呈现语义信息，本次没有赋予其独立的文档导航协议；其现有呈现和非语义来源约束作为上下文复用，不新增条款。

## Verification Strategy

复用 `test/core/view.test.ts` 的 runtime 行为边界，覆盖源文件名与 identity 不同、三个模型来源、Change 混合 Section 来源、同 href 不同 occurrence、文件位置变化后的展示刷新。针对 transport 和 Contracts/详情组件扩展已有行为测试，覆盖 identity 传递、无节点目标、标题消歧、仅 fragment、无目标/无 Contract、提示以及请求竞争；无需为每个 Acceptance Case 另建测试。

通过现有 Semantic Browser e2e 边界验证桌面与移动端实际点击：当前 View 外证据仍能打开、目标正文与 fragment 正确、图形和选择保持、失败不进入错误 route、外链行为保持。运行前先构建 SPA，再构建嵌入式 xirang-likec4，避免读取旧 bundle。Windows CI 验证原生 Windows 源路径与 Markdown `/` 引用；POSIX 平台验证同一相对布局和大小写处理。具体文件、命令与执行顺序由 Apply 决定。

### Test Maintenance

保留原有加载状态、安全清理、受控读取、热更新、projection-only 详情与桌面/移动端用例。只有确因 Contract transport 扩展而过时的固定 payload 断言需要调整，不能删除原行为断言来迁就实现。Contract 结构整理用一次性来源到目标核对，不为标题顺序或文案创建持久测试。

### One-time Verification

核对原 27 个验收内容和独立承诺完整保留；运行语义与 Change 校验、相关类型检查和生产构建；在原始 ftape 场景复核实际链接落点。构建、格式迁移核对和现场复现作为交付证据，不新增对应的文案快照测试。

## Risks / Trade-offs

- [合成正文丢失来源] → 在序列化前逐 Section 解析，以 occurrence 绑定结果，避免仅按 href 字符串合并。
- [View 外目标缺少节点或旧 overlay 拦截重复点击] → 显式 identity 和定位意图进入详情链路，并覆盖无节点及重复 fragment 场景。
- [文件改名但语义 fingerprint 不变] → 单独让来源和链接映射影响展示版本。
- [异步正文与定位竞态] → 将解析与定位绑定当前 source/identity/request，只允许当前结果更新页面。
- [跨平台差异] → 使用路径模块与显式索引，保留宿主大小写语义，并取得 Windows CI 结果。

## Migration Plan

按同一变更更新 runtime 生成方、transport 和消费方，重建嵌入式 bundle。用户源 Markdown 无数据迁移。正式模型的 Kind/Contract 整理由后续 Change Closure 应用 Delta；本阶段不 sync。回退实现时恢复对应生成方与消费方的兼容组合，源 Markdown 不受影响。

## Open Questions

无阻塞设计决策。原始问题已复现；修复、三模型导航、Windows CI 与修复后的浏览器行为均待 Apply 实际验证，不以本设计或格式校验代替运行证据。
