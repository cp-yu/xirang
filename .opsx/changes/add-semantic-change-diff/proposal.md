## Why

OPSX 目前无法把 active change 编译后的 Specs 与 Architecture 实际变化统一呈现给 Agent 和用户，Architecture delta 也无法表达严格删除与完整目标状态。需要建立同一套 Semantic Delta 编译与 diff 模型，使 change 在 sync 前即可被机器校验并由 CLI、文本报告和 Web 一致审阅。

## What Changes

- 新增统一的 Target Semantic Model materialization 与 Diff IR，供 validate preview、CLI text/JSON diff、确定性审阅报告和 Web change view 共用。
- 新增 `opsx diff --change <name>`、`opsx diff --change <name> --write` 与 `opsx arch plan-remove`。
- 将 `architecture-delta.c4` 改为 identity-level `ADDED`、`MODIFIED`、`REMOVED` target-state reconciliation，并支持非语义的 element `replace` review hint。
- 扩展 `opsx view`，在现有 formal view 之外提供每个 active change 的 Specs 与 Architecture diff。
- **BREAKING** 删除 `RENAMED Requirements` 与 `opsx scenario-labels`；Requirement rename 使用 `REMOVED + ADDED`，Scenario operations 仅由 Diff IR 派生。
- 强化 validate、sync 与 archive 的 immutable snapshot、完整 target validation、fingerprint freshness 和原子写入边界。

## Source Impact

### Behavior Source

#### New Specs

- `cli-diff`: 定义 active change semantic diff 的 text、JSON 与 `effective-change.md` 输出。
- `arch-plan-remove-command`: 定义 element 非级联删除的只读依赖分析。

#### Modified Specs

- `architecture-delta-artifact`: 用 identity-level target-state dialect 替换 raw LikeC4 `extend` delta，并定义严格删除与 replacement hint。
- `arch-validate-command`: 验证新 delta dialect、declared operations 与完整 Target Semantic Model。
- `validate-change`: change validation 通过统一 compiler 验证 graph 与 contracts。
- `cli-validate`: change validation 输出 concise effective preview，并拒绝 Scenario labels 与 `RENAMED Requirements`。
- `cli-view`: selector 暴露 formal view 与所有 active change runtime views。
- `spec-content-browser`: 提供 Requirement/Scenario semantic diff、分区 diagnostics 与热更新。
- `cli-sync`: 从 Semantic Delta 编译干净 formal target，并执行 fingerprint-guarded 原子写入。
- `cli-archive`: 归档前重新生成最终 `effective-change.md`。
- `archive-sync-workflow`: 归档保留最终审阅报告，不再处理 Scenario label metadata。
- `opsx-conventions`: 统一三操作模型、generated review artifact 与 change 审阅流程。
- `cli-scenario-labels`: 删除全部现有 Requirements，使该命令退出正式行为表面。
- `validate-spec-section-type-cross-check`: 只接受三种 Requirement operations，并拒绝 `RENAMED Requirements`。
- `specs-sync-skill`: 使用完整 target Requirement reconciliation，不再归一化 labels 或执行 rename operation。
- `apply-preflight-scan`: task anchor 直接匹配 canonical Scenario title，不再剥离 labels。
- `artifact-file-definitions`: Specs、Architecture delta 与 generated review artifact 的 definition 反映新编译边界。
- `opsx-propose-skill`: 使用新 Architecture delta dialect 并审阅 effective diff。
- `propose-workflow`: 用 validate preview 与 `opsx diff --write` 替换 Scenario label preview/write。
- `snack-skill`: 用统一 semantic diff review 替换程序化 labels。

### Architecture Source

#### Added LikeC4 Elements

- `architecture.semantic_diff_engine`: materialize selected change target、验证 declared/effective operations 并生成统一 Diff IR。
- `cli.diff`: 向 Agent 与用户提供 semantic text/JSON diff 及确定性 review artifact。
- `cli.arch_plan_remove`: 分析 element 删除对 containment、relationships 与 Element Contracts 的显式影响。
- `presentation.change_review`: 将统一 Diff IR 投影为 Specs diff 与 Architecture overlay。

#### Modified LikeC4 Elements

- `architecture.delta_merger`: 从 additive module merge 转为完整 Target Semantic Model reconciliation 与 formal source compilation。
- `architecture.semantic_validator`: 联合验证 Metamodel、elements、containment、relationships、bindings、contracts 与严格非级联删除。
- `cli.validate`: 展示 validation diagnostics 与 concise effective-change preview。
- `cli.view_element`: 为 formal view 与 active change runtime views 提供统一 selector。
- `cli.sync`: 在 immutable snapshot 与 fingerprint gate 下原子提升编译后的 target modules。
- `cli.archive`: 在归档前生成最终确定性 review artifact。
- `presentation.likec4_engine`: 渲染 selected change 的 transient target graph 与 diff overlay。
- `presentation.spec_content_gateway`: 按 selected change 提供 formal/target Specs 与分区 diagnostics。
- `presentation.spec_content_panel`: 显示 Requirement/Scenario 结构化 diff 与行内文本变化。
- `ai_integration.workflow_templates`: Agent workflow 通过 validate preview 与 semantic diff 审阅 change。

#### Removed LikeC4 Elements

- `cli.scenario_labels`: Scenario operations 改由统一 Diff IR 派生，不再保留独立 labels command capability。

#### Architecture Relations

- CLI validate、diff、sync、plan-remove 与 Web change review 共同消费 Semantic Diff Engine 的 target materialization 和 Diff IR。
- Change Review 继续复用 LikeC4 Engine 与 Spec Content Gateway，不引入第二套 graph renderer。
- Delta Merger、Semantic Validator 与 Semantic Diff Engine 共同约束同一 immutable Formal → Target compilation transaction。

## Impact

- 影响 change/spec parser、Architecture delta grammar/compiler、combined validator、sync/archive transaction 与 CLI command registry。
- 影响 `opsx view` server、active change indexing、runtime cache/HMR、Specs panel 和 LikeC4 graph overlay。
- 删除 Scenario labels command、core writer、parser normalization、workflow references 与相关 tests。
- 新增 deterministic `effective-change.md` generated artifact；该文件不参与 semantic compilation。
- 需要覆盖 Windows、macOS 与 Linux 的 path、atomic write、watcher 与 report generation 行为。
