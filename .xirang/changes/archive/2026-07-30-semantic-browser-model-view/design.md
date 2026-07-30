## Context

当前生成器启用 LikeC4 `implicitViews`，因此每个 Element 都成为独立 View，并由 `navigateTo` 驱动下钻。Browser runtime 同时以 `variant`/`formal` 表达 Semantic Model 与活动 Change 数据源；Relationship Kind 在 LikeC4 specification 中没有显示标题，聚合边因而呈现 `untitled`。项目 skeleton 目前只管理 `project` Kind，Browser 的 Change 图则通过前端 materializer 使用固定网格补足缺失布局。

本次变更跨越 Semantic Model、CLI setup/update、LikeC4 缓存生成、Browser runtime protocol、React/XState 导航和 E2E。废弃的 `.xirang/architecture/model.c4` 与 `views.c4` 只作为历史交互证据，不恢复为规范来源。

## Goals / Non-Goals

**Goals:**

- 以唯一默认 `Model View` 提供任意深度的原位层级导航，同时保留 Authored Views 与每个活动 Change 的单一 Change-derived View。
- 将 Perspective 作为受管内置 Element Kind 持久化，并以确定性视觉编码区别于其他 Elements。
- 以 Relationship Kind identity 标记和聚合当前层关系，不改变 Relationship 三元组语义。
- 从 Xirang-specific runtime、HTTP、public exports、selectors、errors、测试与产品文案中完整移除 `variant`/`formal` 术语。
- 保持 `.xirang/model/` 四分区为唯一规范来源，所有 Browser projection 均可重建。

**Non-Goals:**

- 不恢复旧 `.xirang/architecture/` 持久化。
- 不为 focus 创建隐藏 Views，不保留 Element-derived View 兼容层。
- 不改变 Authored View 的持久化 schema，不新增 Relationship `title` 字段。
- 不让 Authored Views 自动扩展超出其声明范围，也不增加依赖。

## Decisions

### 1. 以受管清单维护内置 Perspective Kind

`MODEL_FILE_MANIFEST` 与 setup/update 使用同一显式受管条目生成 `metamodel/perspective.md`；clean Candidate 复用该清单。新模型必须包含该文件。旧模型缺失且未使用 `perspective` 时产生可操作 WARNING，并在下一次 setup/update 补齐；同 identity 内容冲突或已存在声明被重定义时产生 ERROR，绝不覆盖用户内容。路径使用 Node.js `path` API，Windows、macOS 与 Linux 共享同一逻辑。

`perspective` 声明 `contract: optional`、允许 parent Kinds `project`/`perspective`，允许 child Kinds `perspective`/`domain`/`capability`。Kind 正文定义其规范结构语义；颜色和形状不进入正文。

替代方案是运行时隐式注入 Kind，但会使 Semantic Model 无法从四分区自包含，因此拒绝。

### 2. 生成一个固定 Model View 并关闭 implicit Views

LikeC4 config 固定 `implicitViews: false`。生成器始终在 `views.c4` 生成 identity 为 `model` 的默认 View，再按现有规则生成 Authored Views；`model` 是保留 identity，Authored View 使用该 identity 时校验失败。生成文件继续由显式常量清单跟踪。

默认 View 只作为 Browser 和 LikeC4 的单一入口。focus projection 是该 View 的运行时状态，不注册为 LikeC4 View。保留 implicit Views 并在 UI 隐藏会延续错误模型，因此拒绝。

### 3. 使用数据源与 View 状态替代 variant 状态

runtime manifest 升级为不兼容的新版本，分别携带完整 Semantic Model 浏览投影与按 Change identity 索引的 Semantic Delta、目标模型、diff、Contracts 和 diagnostics。Xirang-specific 类型与状态使用 `SemanticModel`、`SemanticDelta`、`ChangeDerivedView`、`change` 与 `view source` 命名；删除旧 aliases。

`/__xirang/contract` 使用可选 `change=<change-name>`：缺省读取 Semantic Model，提供时读取该 Change 的目标模型。旧 `variant` 参数返回明确的 unsupported request，不参与解析。manifest 刷新按现有文件 watcher 保持增量，但所有路径匹配先通过平台路径 API 规范化。

### 4. 将 focus projection 与布局作为 Browser runtime 能力

View state 由 `viewIdentity`、`focusIdentity` 与 back/forward history 构成。`Model View` 和 Change-derived View 初始 focus 为 Project Root；Authored View 不维护层级 focus。投影选择 focus Element、direct children，以及两端都能映射到不同可见节点的 Relationships。深层 endpoint 映射到其最近可见 child，无法映射或折叠为 self 的关系不进入该层画布，但原始三元组仍可从详情读取。

同一可见 endpoints 的 Relationships 合并为一条 edge；标签按 UTF-8 byte order 排序并去重全部 Kind identities，Xirang relationship details 保留原始三元组。每次 focus 变化对该小型投影应用稳定、确定性的 projection grid geometry，不复用完整全图坐标，不生成隐藏 View；LikeC4 继续负责实际 DiagramView 渲染与交互。目标模型刷新导致 focus 消失时，沿既有 ancestor 链回退，最终回到 Project Root。

### 5. 将 Perspective 样式限定在 Visual Presentation

Browser 从 declaration Kind 识别 `perspective`，使用现有 `component` shape。颜色仅依赖 Perspective identities，通过确定性无障碍调色板分配；当前可见 sibling Perspectives 不复用颜色。普通 descendants 保持自身 Kind 样式，不继承 Perspective 颜色。样式只进入运行时 DiagramView。

### 6. 明确各 View 的导航边界

View selector 只列出 `Model View`、实际 Authored Views 和 Change-derived Views。`Model View` 与 Change-derived View 允许原位下钻；leaf 打开 Element details/Contract。Authored View 严格保持 `include`/`of`，点击 Element 只打开 details，并提供显式“在 Model View 中打开”命令。

### 7. 直接投影 Relationship Kind identity

LikeC4 relationship specification 只声明 Kind local name，不支持独立显示标题语法；生成器因此在每个 relationship instance 上将原始 Kind identity 作为显示标题，不做标题化或本地化。Change-derived View materializer 使用同一值。LikeC4 validate 与 Browser E2E 共同防止空标签回归。

## Risks / Trade-offs

- [旧项目缺失内置 Kind] → 缺失先报告 WARNING，setup/update 确定性补齐；冲突始终 ERROR。
- [runtime protocol 为 breaking change] → 一次性删除旧类型、参数和 aliases，以 typecheck、public export tests 和禁止术语断言防止半迁移。
- [聚合 edge 标签过密] → 图上展示稳定去重 Kind 列表，完整关系转移到 details，不丢失原始三元组。
- [频繁布局影响性能] → 每次只布局 focus、direct children 与聚合 edges，不布局完整模型。
- [Semantic Delta 刷新使导航悬空] → 按旧 ancestor 链确定性回退，并覆盖并发请求替换场景。
- [Perspective 配色随输入顺序漂移] → 只使用 identity 排序和显式调色板常量，不读取文件或布局顺序。
- [平台路径差异] → watcher、manifest 与受管文件全部使用 `path.join`/`path.resolve` 和显式文件清单，并在 Windows CI 验证。

## Migration Plan

1. 先落实 Semantic Delta，使目标模型包含 `perspective`、Perspective hierarchy 与新的 Derived View 语义。
2. 更新 skeleton、setup/update 与 validator；旧模型在补齐前保持可读并报告 WARNING。
3. 切换生成器和 runtime protocol，再接入 focus projection 与 Browser UI；不提供双协议阶段。
4. 更新全部 consumer、测试和产品文案，确认仓库内不再存在 Xirang-specific `variant`/`formal` 表达。
5. Change Closure sync 后当前项目获得受管 Kind 与目标 hierarchy，迁移 WARNING 消失。

回滚发生在 Closure 前时删除本 Change implementation 并保留当前 Semantic Model；Closure 后回滚必须同时恢复能够理解目标 Metamodel 的实现，不允许只撤销 Browser 代码。

## Open Questions

None.
