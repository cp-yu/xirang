## Why

OPSX 当前以模糊 relation 和易过期 code-map 同时承担架构语义与代码定位，导致 impact sweeper 无法可靠解释 change 的跨 capability 传播，bootstrap/refresh 也会继承旧模型误差。OPSX 需要一次 breaking v2 收敛：以精确 relation 表达稳定架构事实，以实时代码检索提供实现证据，并让所有编辑入口共享同一关系定义。

## What Changes

- **BREAKING** 将 OPSX 升级为 `schema_version: 2`，正式模型仅保留 `project.opsx.yaml` 与 `project.opsx.relations.yaml`；删除 `project.opsx.code-map.yaml` 及其 schema、CLI、delta、validation、bootstrap 和 workflow surface。
- **BREAKING** 用 `belongs_to`、`invokes`、`consumes`、`precedes`、`constrains`、`validates` 替换旧 relation vocabulary，不接受 compatibility alias 或静默迁移。
- 新增 `RelationDefinitionRegistry`，统一驱动 relation 类型、endpoint 约束、语义验证、模板、reference、prompt summary 与 CLI help。
- 新增 `openspec help authoring [file] [--json]`，首批覆盖 `project.opsx.yaml`、`project.opsx.relations.yaml` 与 `opsx-delta.yaml`，同时保持既有 command help 行为。
- 重构 bootstrap/refresh：从当前源码、specs 与可选代码图证据完整重建两文件 candidate；旧 OPSX 仅用于 review diff，不参与推导或 partial merge。
- 重构 impact sweeper：以 capability relation path、spec contract 和代码证据输出 `mustChange`、`mustVerify`、`contextual`、`unknown`、`architectureDrift` 与 `questions`。
- 将 `colbymchenry/codegraph` 作为可选加速器；不可用时回退 ACE、`rg` 与 `read`，OpenSpec 不新增生产依赖，也不读取 `.codegraph/codegraph.db`。

## Capabilities

### New Capabilities
- `opsx-semantic-relations`: 定义 OPSX v2 六种 relation、单一权威 Registry、方向与 endpoint 合同、`note` policy 及全图语义验证。
- `cli-authoring-help`: 定义文件级 authoring help 的 topic、文本/JSON 输出与既有 Commander help 兼容行为。

### Modified Capabilities
- `init-opsx-skeleton`: init 改为生成 OPSX v2 两文件骨架，不再生成 code-map。
- `cli-opsx-query`: query 移除 code-map surface，并按新 relation 语义保留方向与传播路径。
- `opsx-delta-artifact`: delta 模板与 instructions 从 Registry 投影六种 relation 编写合同。
- `opsx-delta-merge`: delta merge 适配 OPSX v2 relation 与两文件模型，移除 code-map 处理。
- `validate-opsx-dry-run`: dry-run 使用 Registry 驱动的 relation 语义验证，不再校验 code-map。
- `bootstrap`: bootstrap 生成、review 并 promote OPSX v2 两文件完整 candidate。
- `bootstrap-refresh-mode`: refresh 从当前证据完整重建，旧 formal OPSX 仅用于 diff。
- `ai-impact-sweeper`: sweeper 改为 relation-path 驱动的语义影响分析，并采用 CodeGraph 可选、ACE/`rg` fallback 的代码证据策略。
- `ai-workflow-templates`: workflow 编辑 surface 消费 Registry 生成的 relation reference，并移除 code-map guidance。
- `snack-skill`: snack 以语义检索替代 code-map 反查，并对无法映射的 capability 显式标记 review gap。
- `opsx-shared-context`: OPSX 导航改为两文件语义模型与实时代码证据分层。

## Impact

- 主要影响 `src/utils/opsx-utils.ts`、`src/utils/bootstrap-utils.ts`、OPSX/validation/sync/init CLI、schema templates、workflow/subagent 生成源、active docs/specs 与相关测试。
- v1 OPSX 项目、旧 bootstrap workspace 与旧 relation fixtures 不再兼容，需要通过重构后的 bootstrap/refresh 重新生成。
- `project.opsx.code-map.yaml`、旧 relation token 和相关测试将被删除；archive history 保持不变。
- 不增加 npm dependency；跨平台路径继续通过 Node.js `path` API 处理。