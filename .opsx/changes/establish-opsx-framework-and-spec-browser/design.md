## Context

当前仓库仍以 OPSX 为产品身份，使用 `opsx` CLI 命令和 `opsx/` 工作区；LikeC4 通过 `npx likec4` 独立启动，只能在元素详情中看到 Spec 路径而不能直接浏览内容。用户需要同时理解两个命令、两个工具和目录契约。新目标是建立统一的 OPSX 开发框架产品身份，使 CLI、工作区和内置语义浏览器成为单一安装与单一命令体验。

已确认约束：
- 这是一次性产品切换，不提供 `opsx` 命令别名或 `opsx/` 回退。
- LikeC4 成为 OPSX 内置组件，不再作为独立用户依赖暴露。
- 第一阶段只支持本地交互 Web，不支持 Spec 编辑或静态站点构建。
- Spec 内容按需读取，不进入 LikeC4 模型或持久快照。

## Goals / Non-Goals

**Goals:**

- 一次性将 CLI 可执行命令、帮助、completion 和所有 active command references 从 `opsx` 切换到 `opsx`。
- 一次性将项目路径常量、发现、init/update、config、change、spec、sync/archive、validate、bootstrap 和 workflow artifact generation 从 `opsx/` 切换到 `.opsx/`。
- 将 LikeC4 `v1.59.0` 完整源码通过 Git subtree 纳入 `likec4/`，保留其 monorepo 包边界，并明确 upstream tag/commit 与 MIT License。
- 用顶层 `opsx view` 统一启动项目语义浏览器，替代独立 `arch preview` 和终端 dashboard。
- 在元素详情的条件式 `Specs` 标签页中按需安全读取并渲染一个或多个 `.opsx/specs/**/*.md` 全文。
- 提供路径安全校验、Markdown XSS 防护、文件监听与热更新、异步加载状态和多 Spec 选择器。

**Non-Goals:**

- 不提供 `opsx` 到 `opsx` 的命令别名或逐步迁移路径。
- 不在 `opsx/` 和 `.opsx/` 之间提供双读、双写或自动迁移工具。
- 不把 Spec 内容投影进 LikeC4 model 或生成快照文件。
- 不在元素详情中编辑 Spec 或提交修改。
- 不在第一阶段提供静态网站构建或离线 Spec 内容打包。
- 不改变 LikeC4 DSL、模型结构或现有架构导航逻辑。
- 不支持 npm 发布或向 `@fission-ai/opsx` 回移功能。

## Decisions

### 1. 产品身份切换：一次性无兼容层

**决策**：CLI、工作区和所有 active 引用一次性切换到 OPSX 身份，不提供 `opsx` 别名或 `opsx/` 回退。

**理由**：
- 双产品身份会造成长期歧义：用户不知道该用哪个命令，文档和 Agent 指令需要同时维护两套路径。
- 兼容层延长切换周期并增加测试复杂度；当前仓库是独立全新产品，无需保护外部用户安装基础。
- 一次性切换使 durable source、CLI 表面和生成制品立即达成一致，避免中间态冲突。

**替代方案**：
- **逐步迁移**：CLI 同时支持 `opsx` 和 `opsx`，工作区双读 `opsx/` 与 `.opsx/`。被拒绝，因为增加状态机复杂度且无明确外部迁移需求。
- **只改工作区**：保留 `opsx` 命令，只迁移 `opsx/` → `.opsx/`。被拒绝，因为 CLI 名称与产品身份不一致。

### 2. LikeC4 源码位置：根目录完整 subtree

**决策**：将 LikeC4 `v1.59.0` 完整源码通过 `git subtree add` 纳入根目录 `likec4/`，保留其原 monorepo 结构。

**理由**：
- Subtree 将上游源码直接融入主仓库历史，支持离线 clone、本地修改和单仓库构建。
- 保留完整 monorepo 使后续 LikeC4 升级和 OPSX 专用定制都有清晰边界。
- 相比 submodule，subtree 对 CI、打包和非 Git 专家更友好。

**执行**：
```bash
git subtree add --prefix=likec4 https://github.com/likec4/likec4.git v1.59.0 --squash
```

固定 upstream commit 和 tag 信息保留在 subtree merge commit message 中；同步 upstream 时使用 `git subtree pull`。

**替代方案**：
- **Git submodule**：被拒绝，因为 CI、npm 打包和本地开发都需要额外 `git submodule update` 步骤。
- **复制 `diagram/spa/vite-plugin` 三包**：被拒绝，因为 LikeC4 包间耦合强，部分复制会造成依赖缺失和升级困难。
- **独立 fork 仓库**：被拒绝，因为跨仓库开发和版本同步成本高。

### 3. CLI 浏览命令：顶层 `opsx view`

**决策**：用 `opsx view [--port <n>]` 启动内置 Web，替代 `opsx arch preview` 和 `opsx view` 终端 dashboard。

**理由**：
- 内置 Web 同时展示 Architecture 和 Specs，继续叫 `arch preview` 会错误暗示它只负责架构。
- `view` 语义清晰表达"浏览项目语义模型"，比 `preview`（易理解为构建产物预览）更准确。
- 顶层命令避免 `opsx arch view` 的冗余层级。

**行为**：
- 从当前目录或其祖先寻找最近的 `.opsx/` 项目根。
- 调用内置 LikeC4 Vite server，解析 `.opsx/architecture/` 并启动 Web。
- `--port` 选项直接传递给 Vite server。

**替代方案**：
- **`opsx preview`**：被拒绝，`preview` 语义模糊。
- **保留 `arch preview` + 增加 `spec preview`**：被拒绝，两个命令违背"单一浏览体验"目标。

### 4. Spec 内容数据通路：HTTP API + 注入式 loader

**决策**：Preview server 提供 `GET /__opsx/spec?element=<id>&path=<rel>` API，`packages/diagram` 通过注入的 `OpsxSpecLoader` 按需加载。

**理由**：
- 按需加载避免启动时读取全部 Specs，适合大型 Brownfield 项目。
- HTTP API 与 Vite HMR 和文件监听集成直接。
- 注入式 loader 保持 `packages/diagram` 与上层 CLI/server 解耦，符合 LikeC4 原分层。

**路径安全**：
- 服务端从当前 element 的 `metadata.specs` 再次核对请求路径。
- 拒绝绝对路径、`..`、反斜杠、非 `.md` 后缀和符号链接逃逸。
- 解析后路径必须位于 `<project>/.opsx/specs/` 下。

**替代方案**：
- **Vite 虚拟模块预载**：被拒绝，启动时加载全部 Specs 浪费内存且 HMR 粒度粗。
- **把 Spec 内容投影进 LikeC4 model**：被拒绝，违背 "Architecture 只保存索引" 的 durable source 边界。

### 5. LikeC4 fork 修改范围

**修改包**：
- `packages/diagram`：增加条件式 `Specs` 标签页、多 Spec 选择器、加载/错误状态和 Markdown 渲染复用。
- `packages/likec4-spa`：提供 React Context 注入 `OpsxSpecLoader`。
- `packages/vite-plugin`：实现 `/__opsx/spec` API、路径校验、文件监听和 HMR 通知；项目根由 `opsx view` 显式传入，不从 Architecture workspace 路径猜测。

**不修改**：
- LikeC4 DSL parser、模型结构、relations、views 和图形导航逻辑保持原样。
- 已有元素详情标签页（Properties / Relationships / Views / Structure / Deployments）保持可用。

### 6. 元素详情 Spec 展示交互

**UI 逻辑**：
- 无 `metadata.specs`：不显示 `Specs` 标签。
- 单个 Spec：直接渲染 Markdown 全文，显示项目相对路径。
- 多个 Spec：显示紧凑选择器，默认打开索引第一项，按需加载每个 Spec。

**状态**：
- Loading / Success / Error 独立显示，不影响其他标签或详情弹窗。
- 切换元素时清除上一个 element 的加载结果。
- Spec 文件修改后，当前打开的 Spec 自动刷新。

**安全**：
- 使用 LikeC4 现有 Markdown 安全管线，禁止执行脚本和危险 HTML。

### 7. 迁移策略：唯一 OPSX 常量与可验证自举

**阶段 1：建立唯一产品常量**
- 将现有 `OPSX_DIR_NAME` 替换为 `OPSX_DIR_NAME = '.opsx'`，并集中 CLI identity `opsx`。
- 不引入 `LEGACY_PROJECT_DIR_NAME`、目录回退或双写逻辑。

**阶段 2：迁移运行代码、测试与生成器**
- 按真实模块边界迁移 init/update/config、change/spec/sync/archive/validate/bootstrap、Architecture reader/validator/merger 和 registry。
- 更新测试 fixture、期望值、workflow skill、subagent、instruction 和 template 生成器中的命令与路径。

**阶段 3：合并 LikeC4 呈现引擎**
- 通过 Git subtree 纳入完整源码，保留 `likec4/` 自身 pnpm workspace 与构建合同。
- 根项目只提供显式编排脚本和运行入口，不把两个 workspace 隐式扁平合并。

**阶段 4：迁移当前仓库 durable source**
- 在 Apply Phase 0 最后执行 `git mv opsx .opsx`，活动 change 与 `.apply-isolation.json` 一并迁移。
- 迁移后所有验证命令改用本分支构建的 `opsx` CLI；Phase 1-3 reference 从 `.opsx/references/` 读取。

不提供自动化迁移工具；用户项目迁移通过文档指导手动执行。

## Risks / Trade-offs

**[用户现有项目需要手动迁移]** → 提供清晰文档：`git mv opsx .opsx` 和全局搜索替换 `opsx` → `opsx` 命令。该风险可接受，因为当前无外部用户安装基础。

**[LikeC4 fork 维护成本]** → 通过 subtree 保持与 upstream 的清晰合并路径；限制修改范围到三个包；完整保留 upstream license 和 commit history。

**[浏览器兼容性]** → 复用 LikeC4 现有浏览器支持策略；在 Playwright 中验证桌面与移动视口。

**[Spec 文件大小]** → 第一阶段不设文件大小限制，依赖浏览器原生 Markdown 渲染性能；若后续发现问题，可增加虚拟滚动或分页。

**[路径安全逃逸]** → 服务端双重校验（元素索引 + 路径解析）；单元测试覆盖绝对路径、`..`、符号链接和非 Markdown 攻击；拒绝时记录日志但不暴露服务端路径给浏览器。

**[Spec 与元素不一致]** → 单个 Spec 缺失或读取失败只影响对应面板，不关闭详情弹窗；显示文件路径和错误信息，便于用户定位。

## Migration Plan

本 change 实现后，`.opsx/` 与 `opsx` 立即成为项目唯一有效身份；无需回滚计划，因为这是独立新产品的首次发布状态。

**部署步骤**：
1. 合并 `likec4/` subtree。
2. 实现 CLI 身份切换、路径迁移、Spec API 和 LikeC4 UI 扩展。
3. 迁移当前仓库 durable source：`git mv opsx .opsx`。
4. 运行完整 lint / typecheck / test / build。
5. Playwright 验证 Web 浏览器无 Spec、单 Spec、多 Spec 三种元素。
6. 更新 README 与 getting started 文档。

**验证**：
- 完整测试套件通过，无 `opsx/` 或 `opsx` 命令残留。
- `opsx view` 在干净环境（无全局 LikeC4）启动成功。
- 打开含多个 Spec 的元素，切换 Spec，修改磁盘文件后确认自动刷新。

## Open Questions

无未解决决策；所有关键边界已通过 Design Summary 确认。
