## Why

Element Declaration 当前以 `summary` 持久化作者表述，无法稳定承载 Element 的完整概念身份与边界，迫使 Agent 从 Contract、层级或实现中反推概念。继续并存 `summary` 与 `definition` 又会形成无法确定性校验的一式两份语义，因此需要在测试阶段直接完成单字段切换。

## What Changes

- **BREAKING**：Element Declaration 从持久化 `summary` 硬切换为必填、非空的 `definition`，不保留 alias、fallback 或 legacy mode。
- 明确 Definition 的写作质量及其与 Element Contract、Change Plan、实现证据的边界，并将规则投影到 Build、Explore、Propose、Snack 与项目初始化工作面。
- CLI 查询、搜索、Delta、diff、fingerprint、Candidate 与 Sync 全链路使用完整 `definition`。
- Semantic Browser 将完整 Definition 投影为 LikeC4 `description`，并仅在 Browser 投影中派生紧凑 `summary` excerpt。
- 通过保留在仓库根目录 `tmp_script/` 的独立迁移工具机械迁移当前有效工作面；历史与归档保持原貌，Xirang runtime、CLI 与 Semantic Model 不引入迁移兼容层。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `element-declaration`：以完整 Definition 取代概要字段，并拒绝当前输入中的 legacy `summary`。
- `element-contract`：描述性概念语义归属 Declaration Definition，Contract 继续只表达规范性承诺。
- `deterministic-operations`：确定性加载、校验、序列化、查询、搜索、Delta、diff、fingerprint、Candidate 与 Sync 全程保留完整 Definition。
- `semantic-browser`：仅在 Xirang→LikeC4 投影中派生 Definition excerpt，同时保留完整 Definition 供详情呈现。
- `semantic-model-build`：在 Contract 前编写完整 Definition，并对概念身份和层级边界执行独立语义审查。
- `explore`：结构变化涉及 Element 概念或边界时，在 Design Summary 中澄清目标 Definition。
- `propose`：Declaration Delta 编写完整目标态 Definition，不以 Change 动机或局部变化代替定义。
- `snack`：只有证据足以确定稳定概念边界时才调和 Definition，否则等待用户确认。
- `project-tooling-configuration`：从共享规则投影 Definition authoring contract，并以 Project Definition 初始化根 Element。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `element-declaration`：概念表述从紧凑概要改为完整 Definition，并明确与 Contract 的语义分工。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- 核心 Semantic Model IR、frontmatter schema、parser、serializer、validator、Delta、semantic diff、fingerprint、Candidate、Sync 与 Change 编译链路。
- `arch search`、`arch query`、`arch impact` 等 Agent-facing text/JSON 输出。
- Formal Model 与 Change variant 的两条 Semantic Browser / LikeC4 投影路径。
- Build、Explore、Propose、Snack、schema/templates 及项目初始化的生成源码和重新投影的托管工作面。
- 当前 `.xirang/model/`、可选 `.xirang/candidate/` 与活动 Changes 的机械迁移；`.xirang/history/` 和 `.xirang/changes/archive/` 保持原貌。
- `tmp_script/migrate-element-summary-to-definition.mjs` 及其自动化测试作为跨项目复用工具长期保留，但不注册为 Xirang command、不进入发布面或 Semantic Model。
- 不增加运行时依赖；不修改 LikeC4 的全局 Element 模型或 fallback 规则。
