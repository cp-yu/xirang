## Why

当前仓库仍以 OPSX 产品身份、`opsx` 命令和 `opsx/` 工作区运行，而新的目标是一个独立 OPSX 开发框架；同时，LikeC4 仅能展示架构元素的 Spec 路径，不能在元素详情中直接浏览行为规约全文。需要一次性建立统一的 OPSX 身份、`.opsx/` durable workspace 和 CLI 内置语义浏览器，消除双产品、双目录与额外 LikeC4 安装。

## What Changes

- **BREAKING**：CLI 可执行命令从 `opsx` 一次性切换为 `opsx`，不提供旧命令别名。
- **BREAKING**：目标项目工作区从 `opsx/` 完整切换为 `.opsx/`；CLI 的发现、读取、生成、验证、同步、归档、bootstrap、配置和 Agent 指令不再回退或双写旧目录。
- 将 LikeC4 `v1.59.0` 完整源码以 Git subtree 纳入根目录 `likec4/`，作为 OPSX 的内置呈现引擎而非独立用户依赖。
- 用顶层 `opsx view [--port <n>]` 启动内置 Web，替代旧架构专用 preview 和终端 dashboard 语义。
- 在元素详情中按 `metadata.specs` 索引按需读取并安全渲染一个或多个 `.opsx/specs/**/*.md` 全文；Architecture 继续只保存索引，不复制 Spec 内容。
- 第一阶段仅支持 CLI 启动的本地交互浏览，不提供 Spec 编辑或静态网站内容投影。

## Source Impact

### Behavior Source

#### New Specs

- `opsx-framework-identity`: 定义独立 OPSX 产品身份、`opsx` CLI、`.opsx/` 完整工作区和无兼容层迁移合同。
- `spec-content-browser`: 定义元素详情中单个或多个 Spec 的按需、安全、可刷新全文浏览行为。

#### Modified Specs

- `cli-view`: 将旧终端 dashboard 行为替换为 `opsx view` 内置 Web 启动与项目发现行为。
- `arch-preview-command`: 移除被 `opsx view` 取代的 `opsx arch preview` 行为。
- `cli-init`: 将初始化身份、命令、目录、配置和输出切换到 OPSX 与 `.opsx/`。
- `init-project-structure`: 将 LikeC4 架构骨架生成位置切换到 `.opsx/architecture/`。
- `config-loading`: 将项目配置权威位置切换到 `.opsx/config.yaml`。
- `references-home`: 将受管 reference 物化与路由位置切换到 `.opsx/references/`。
- `spec-registry`: 将 Spec registry 扫描根切换到 `.opsx/specs/`。
- `cli-update`: 仅将 `.opsx/` 识别为已初始化项目并在该目录迁移配置默认值。
- `cli-command-reference-consistency`: 将所有 active CLI 与项目路径引用约束到 `opsx` 和 `.opsx/`，并拒绝 active legacy 引用。
- `opsx-conventions`: 将项目结构与 CLI 命名约定重定义为 OPSX steady state。
- `architecture-delta-artifact`: 定义 nested element metadata extension 的 lowering 语义，使既有 capability 的 intent、lifecycle 与 Specs 索引可由 change delta 合并到 formal LikeC4 source。

### Architecture Source

#### Added LikeC4 Elements

- `presentation.likec4_engine`: OPSX 内置的 LikeC4 DSL 与交互式 Web 呈现引擎。
- `presentation.spec_content_gateway`: 依据元素索引受控读取 `.opsx/specs/**/*.md` 的 Preview 数据边界。
- `presentation.spec_content_panel`: 在元素详情中按需呈现一个或多个 Spec 的只读 UI。

#### Modified LikeC4 Elements

- `cli.view_element`: 从终端摘要视图改为启动完整项目语义 Web 浏览器。
- `cli.init`: 初始化 `.opsx/` durable workspace 与 LikeC4 架构骨架。
- `config.project_element`: 从 `.opsx/config.yaml` 加载并投影项目配置。
- `validation.registry`: 从 `.opsx/specs/` 构建 capability↔Spec registry。
- `ai_integration.workflow_templates`: 生成仅引用 `opsx` 命令和 `.opsx/` 路径的 Agent 工作流。

#### Removed LikeC4 Elements

- `cli.arch_preview`: 保留为 `status 'deprecated'` 的历史架构节点，其运行时命令被移除，责任由统一的 `cli.view_element` 承担。

#### Architecture Relations

- `cli.view_element` 启动内置呈现引擎；呈现引擎消费正式 LikeC4 模型并通过受控 gateway 为 Spec 面板提供内容。
- Spec 内容加载保持在呈现/Preview 边界内，不进入 Architecture model 或持久化快照。

## Impact

- CLI 注册、bin 名称、帮助、completion、telemetry command identity 与全部 active command references。
- 项目路径常量、项目发现、init/update、config、change、spec、sync/archive、validate、bootstrap 和 workflow artifact generation。
- 当前仓库的 durable source 从 `opsx/` 迁移到 `.opsx/`，包括活动 change 自举迁移。
- 新增根目录 `likec4/` subtree 及其 build/test 编排；修改 LikeC4 `packages/diagram`、`packages/likec4-spa` 与 `packages/vite-plugin`。
- 增加本地 Preview API、Spec 文件监听、Markdown 渲染、安全路径校验及浏览器测试。
- 保留 LikeC4 上游来源、固定 tag/commit 与 MIT License。
