## Why

当前 Agent 的 Semantic Model 加载协议会在 `snapshot`、`query` 与 `impact` 之间重复展开 Element Definition、Contract 和导航对象，并且缺少上下文压缩或遗忘后的确定性恢复规则，造成不必要的大输出和基于残余上下文猜测语义的风险。

## What Changes

- 新增有界 Definition projection 的 `xirang arch outline`，作为 Agent 恢复完整模型结构认知的默认入口。
- 将 `arch impact` 收缩为 identity 与结构路径发现接口，将 `arch query` 收缩为显式 identities 的完整语义读取接口。
- 将 `architecture.outline.elementDefinitionDepth` 纳入项目配置、CLI config projection 与命令默认值。
- 更新所有 Xirang workflow 提示，使 Agent 在整体或局部语义不清时重新调用对应 CLI，而不是猜测。
- **BREAKING**：移除 `arch query --relations` 与 `--depth`，并调整 `arch query`、`arch impact` 的 JSON projection。

## Source Impact

### Behavior Source

#### New Specs

- `arch-outline`: 完整投影模型结构，并按配置深度局部加载 Element Definition。

#### Modified Specs

- `arch-query`: 支持批量稳定 identities，只返回显式请求 Element 的完整 Declaration 与可选 Contract。
- `arch-impact`: 只返回相关 identities、refinement context、Relationships 与 canonical paths。
- `arch-snapshot`: 保留完整模型导出职责，但不再作为 Agent workflow 的默认总览入口。
- `project-tooling-configuration`: 管理 outline Element Definition 深度的默认值、解析、迁移与 projection。
- `workflow-templates`: 统一采用 `outline -> impact -> query` 加载协议和认知缺口恢复规则。
- `explore-brainstorming`: Explore 通过 impact 发现 identities，再按需 query 完整语义。
- `task-decomposition`: 使用 impact 获取 directed semantic relationships，停止依赖 query 的关系扩展选项。

### Architecture Source

#### Added Elements

- `arch-outline`: `deterministic-operations` 下负责 Agent 模型结构总览与局部 Definition projection 的独立 CLI 能力。

#### Modified Elements

- `arch-query`: 边界从语义读取与范围导航混合职责收缩为显式 identity 语义读取。
- `arch-impact`: 边界从完整语义聚合收缩为影响 identities 与结构路径发现。
- `arch-snapshot`: 边界保留完整导出，但移除默认 Agent 上下文注入职责。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- CLI command registration、`arch` projection 类型与 text/JSON formatter。
- 项目配置 schema、默认值物化、迁移、normalized config 与 Agent-facing config projection。
- Explore、Propose、Apply、Snack、Reviewer、Optimizer 共享提示及 workflow-specific CLI 调用。
- arch command、project config、generated workflow 与 CLI integration 测试。
