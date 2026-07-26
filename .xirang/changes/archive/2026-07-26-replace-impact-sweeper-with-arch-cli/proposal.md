## Why

独立 Impact Sweeper 在扁平 Contracts 阶段承担了语义导航、术语发现和影响判断，但当前 Formal Semantic Model 已具备 stable Elements、refinement hierarchy、Element Contracts 与 typed Relationships。将确定性语义查询下沉到 CLI、由 Explore Agent 保留理解与判断职责，可以消除重复的 Agent 协议并恢复清晰边界。

## What Changes

- 新增 `xirang arch search`，对 Formal Semantic Model 的 Element declarations 与 owned Contracts 执行确定性文本检索。
- 新增 `xirang arch impact`，围绕一个或多个 focus Elements 返回 bounded Relationship subgraph、refinement context、canonical shortest paths 与完整 Element Contracts。
- Explore 改为直接使用两个 CLI 命令获取语义上下文，代码证据继续通过独立代码工具收集，影响分类继续由 Agent 完成。
- **BREAKING** 退役 `xirang-impact-sweeper`、legacy `opsx-impact-sweeper` 及其专用 terminology/reporting 协议，不提供兼容调用入口。
- setup/update 只按显式受管名称清理退役 agent、skill 与 reference artifacts，不删除同名用户文件。

## Source Impact

### Behavior Source

#### New Specs

- `arch-search-command`: 定义 Formal Semantic Model 的确定性 Element 与 Contract 文本检索、稳定排序和输出行为。
- `arch-impact-command`: 定义 focus Elements 的双向 Relationship 展开、refinement context、canonical path、完整 Contract 投影与失败语义。

#### Modified Specs

- `explore-brainstorming`: 以 `arch search`、`arch impact` 和独立代码工具替换 Sweeper 委托与报告解释。
- `ai-workflow-templates`: Explore workflow surface 改为直接消费 CLI 语义查询，不再引用 Impact Sweeper internal agent。
- `internal-subagent-generation`: internal subagent 集合收敛为 Reviewer 与 Optimizer，并显式清理两个历史 Sweeper 名称。
- `subagent-self-read`: 删除 Impact Sweeper 专属权限与输出合同，保留 Reviewer/Optimizer 只读约束。
- `ai-impact-sweeper`: 移除全部旧 Sweeper 行为要求并删除该 Spec module。
- `opsx-impact-sweeper-architecture`: 移除全部旧 Sweeper Architecture 导航要求并删除该 Spec module。
- `sweeper-terminology-extraction`: 移除全部 Sweeper 专属术语提取要求并删除该 Spec module。
- `sweeper-terminology-reporting`: 移除全部 `terminologyObservations` 报告要求并删除该 Spec module。
- `explore-terminology-decision`: 移除依赖 Sweeper 报告的四态术语判断要求并删除该 Spec module。

#### One-time Migration

- update 通过三个历史生成内容的 byte-exact 指纹清理退役 Sweeper references；这是实现迁移，不修改 `references-home` 的 steady-state Element Contract。

### Architecture Source

#### Added LikeC4 Elements

- `cap.cli.arch-search`: 在 Formal Semantic Model 中确定性搜索 Element declarations 与 owned Contracts。
- `cap.cli.arch-impact`: 为 focus Elements 投影广泛但有界的 Semantic Model impact context。

#### Modified LikeC4 Elements

- `cap.ai.internal-subagent-generation`: 责任范围收敛为 Reviewer 与 Optimizer 的受管生成和历史 Sweeper artifact cleanup。

#### Removed LikeC4 Elements

- `cap.ai.impact-sweeper`: 由 CLI 确定性语义查询与 Explore Agent 判断取代。
- `cap.ai.sweeper-terminology-extraction`: 不再维护 Sweeper 专属语义近似术语提取。
- `cap.ai.sweeper-terminology-reporting`: 不再维护 `terminologyObservations` 报告投影。
- `cap.ai.explore-terminology-decision`: Explore 改为根据 Architecture 搜索候选执行普通术语澄清。

#### Architecture Relations

- `cap.cli.arch-search` 与 `cap.cli.arch-impact` 调用 LikeC4 Reader 和 Spec Registry。
- `cap.ai.explore-brainstorming` 调用 `cap.cli.arch-search` 与 `cap.cli.arch-impact`。
- `cap.cli.arch-query` 补充其现有实现对 `cap.spec.registry` 的调用关系。
- 删除退役 Sweeper terminology Elements 之间的 `invokes`、`consumes` 关系。

## Impact

- CLI：`src/commands/arch/`、Commander 注册、help、completion introspection 与 telemetry command path。
- Agent generation：Explore 模板、internal subagent registry、ArtifactSyncEngine、workflow installation 与受管 cleanup。
- 退役源：Impact Sweeper template、report types、generated agent/reference artifacts 及对应测试。
- 验证：Vitest 持久测试、`pnpm lint`、`pnpm build`，以及在本项目 Formal Semantic Model 上的一次性 CLI 验证。
