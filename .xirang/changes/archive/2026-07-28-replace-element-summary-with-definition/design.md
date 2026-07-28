## Context

Element Declaration 当前在 IR、frontmatter、CLI、LikeC4 投影与生成工作面中统一使用 `summary`。该字段既作为规范性作者表述，又承担紧凑展示，无法表达完整概念边界。项目仍处于单用户测试阶段，可接受 migration-first hard cutover；但当前 Formal Model 与活动 Change 必须先完成机械迁移，才能启用只识别 `definition` 的新 parser。

LikeC4 已原生区分短 `summary` 与长 `description`，因此 Xirang 无需持久化第二份展示文本。Browser adapter 可从完整 Definition 确定性派生 excerpt。

## Goals / Non-Goals

**Goals:**

- 将 Element Declaration 的唯一作者表述切换为完整、非空的 `definition`，并明确其与 Element Contract 的边界。
- 让 IR、Delta、diff、fingerprint、Candidate、Sync 和 Agent-facing CLI 全程保留完整 Definition。
- 仅在 Semantic Browser 的 Xirang→LikeC4 adapter 中派生紧凑 excerpt。
- 统一 Build、Explore、Propose、Snack 与初始化流程的 Definition authoring contract。
- 安全迁移当前有效工作面，并在 `tmp_script/` 保留可供其他项目复用且有自动化测试覆盖的独立迁移工具。

**Non-Goals:**

- 不保留 `summary` alias、fallback、双写或 legacy mode。
- 不扩写迁移得到的旧短文本，也不在本 Change 中重建全部 Formal Definitions。
- 不迁移 `.xirang/history/`、`.xirang/changes/archive/`、缓存或生成制品。
- 不修改 LikeC4 core 的 `summary`、`description` 或 fallback 语义。
- 不将 excerpt 引入 Xirang IR、CLI、Delta、diff、fingerprint 或持久文件。

## Decisions

### 1. 采用 migration-first hard cutover

先以独立 Node.js 脚本迁移当前有效工作面，再切换 model kernel。新 parser 只接受 `definition`，并对 legacy `summary` 返回明确诊断；不采用渐进兼容，因为双字段会造成作者语义漂移，并使 serializer 或 Sync 有静默丢字段风险。

迁移脚本保留为仓库根目录 `tmp_script/migrate-element-summary-to-definition.mjs`，默认以调用时 `cwd` 作为待迁移项目根目录，使其他项目可以直接调用。它固定扫描由显式路径组成的工作面：`.xirang/model/`、存在时的 `.xirang/candidate/`，以及 `.xirang/changes/` 下除显式 `archive` 目录外的活动 Change。路径使用 Node.js `path` API；不得依赖 `/`、glob 排除猜测或平台大小写行为。脚本解析 Markdown frontmatter 和 YAML，仅处理 `entity: element-declaration`。

完整 preflight 先将文件分类为待迁移、已迁移或冲突。只有 `summary` 时原值改名；只有 `definition` 时跳过；两者同时存在或同时缺失时整次运行失败且不开始写入。每个文件使用同目录临时文件与 rename 原子替换。`--check` 在存在待迁移或冲突时返回非零，不写文件。

脚本及其自动化测试作为跨项目迁移工具保留，但不注册 Xirang CLI command、不加入 `package.json` script、不进入 package 发布 `files`、不被 runtime 引用，也不进入 Semantic Model。

### 2. Definition 是唯一规范性概念表述

目标 Declaration 为 `identity + kind + parent + title + definition`。Definition 在 Element 自身抽象层级说明该 Element 是什么、为何独立存在、包含和排除什么，以及与 parent、children、siblings 的必要区分。它描述稳定目标概念，不包含 `SHALL` 义务、Scenario、验收条件、实现路径、Change 动机或历史。

字段必须是 trim 后非空字符串，但 parser 和 serializer 不自动改写作者文本。ADDED/MODIFIED Declaration Delta 携带完整目标 Definition；REMOVED 仍只携带 identity。canonical frontmatter 顺序为 `identity, kind, parent, title, definition`。

### 3. 完整 Definition 贯穿 core 与 CLI

`ElementDeclaration` IR 直接以 `definition` 取代 `summary`。现有泛型 property diff、canonicalization 与 fingerprint 以 IR 为输入，应让 Definition 自然进入这些链路，而不建立平行特殊字段。parser、serializer、validator、transaction、candidate digest、Delta compiler、Sync writer 和 runtime manifest 类型同步硬切换。

`arch search` 搜索完整 Definition，并把 evidence field 从 `summary` 改为 `definition`；结果 Element、evidence text 与 JSON 均不截断。`arch query` 文本标签改为 `Definition`，其余 Agent-facing query/impact/runtime 输出携带完整字段。

### 4. Excerpt 仅属于 Semantic Browser adapter

Formal Model 生成路径和 Change variant runtime 路径共享同一纯函数规则：trim Definition，取空行前第一段，将段内换行与连续空白折叠为单空格，按 Unicode code points 计算，最多保留 120 个；超限时截断并追加 `...`。

两条路径都映射为：

```text
LikeC4 summary     <- excerpt(definition)
LikeC4 description <- definition
```

该函数放在 Xirang Browser/LikeC4 adapter 可共同消费的最小位置，不修改 LikeC4 全局模型。完整 Definition 继续供 Element Details 使用，紧凑 summary 供图节点和 Browser 搜索使用。

### 5. 从单一共享规则生成 Definition authoring guidance

生成源码增加统一 Definition authoring contract，避免各 skill 独立维护副本。Build 在 Contract 前结合相邻层级完成 Definition，并让 clean-context semantic review 检查标题换写、概念重叠、边界漂移和 Contract 内容混入。Explore 在新增 Element 或改变概念边界时，把目标 Definition 澄清进 conversation-only Design Summary。Propose 为 Declaration Delta写完整目标态，而非本次变化摘要。Snack 只有在用户意图与证据足以确定稳定概念边界时才调和，否则询问用户。

项目初始化将 Project Root 输入与内部 skeleton 从 summary 语义改为 Project Definition。只修改 `src/core/templates/...` 与 `schemas/spec-driven/...` 等生成源码，再通过现有生成机制刷新托管工作面；不得直接维护 `.pi/skills` 等生成结果。

### 6. 以 TDD 和分阶段门禁控制切换

先建立正式 RED tests，再建立并运行独立迁移能力。数据迁移成功后切换 model kernel，随后贯通 Delta/CLI/Browser/authoring surfaces。迁移工具测试与脚本共同保留，用于证明跨项目扫描、冲突零写入、幂等和跨平台路径行为；正式 runtime 行为测试另行长期保留。

最终验证覆盖 parser/serializer round-trip、legacy rejection、Delta/diff/fingerprint/Sync、CLI 完整输出、两条 Browser 投影、Unicode excerpt 边界、schema/template parity、生成工作面、lint、build、项目 tests、受影响 LikeC4 tests/typecheck，以及 Windows 路径行为。迁移范围测试使用 `path.join()` 构造期望路径。

## Risks / Trade-offs

- [迁移与 parser 切换顺序错误会使当前模型不可读] → 固定执行 preflight、迁移、kernel cutover 的顺序，并在每阶段验证 Formal、Candidate 和活动 Changes。
- [旧 archive/history 无法直接由新 parser 当作当前模型加载] → 保留历史原貌并明确这是 hard cutover 的已接受代价；不建立长期兼容层。
- [机械改名后的短文本不满足完整 Definition 质量] → 迁移保证不丢信息，质量提升留给独立模型审查或后续 Build，不由脚本猜测。
- [多字节文本截断错误] → 使用 Unicode code point 迭代而非 UTF-16 code unit 索引，并覆盖 119、120、121 与非 BMP 字符。
- [Browser 两条投影产生不同展示] → 复用同一 excerpt 函数，并为 Formal 和 Change variant 分别建立测试。
- [生成源码与托管工作面漂移] → 只改生成源码，执行现有投影命令并验证 parity。
- [跨项目调用时误用仓库路径或平台分隔符] → 工具以调用时 `cwd` 为目标根目录，使用 Node.js `path`、显式目录列表和同目录临时文件；Windows 场景进入持久测试与 CI 检查。
- [保留工具被误认为 Xirang 产品能力] → 限定在 `tmp_script/`，不注册 CLI、不进入发布 `files`、runtime 或 Semantic Model。
