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

当前 Formal Architecture 使用聚合 capability 表达稳定职责。本 change 保持该粒度，不恢复已被合并的 command-level 或 implementation-level elements。

#### Added LikeC4 Elements

None.

#### Modified LikeC4 Elements

- `project.root/domain.architecture/cap.architecture.semantic-model`: 增加 immutable Formal → Target materialization、完整 validation、统一 Diff IR 与干净 formal source compilation 职责。
- `project.root/domain.change_workflow/cap.change.semantic-delta`: 增加 identity-level graph/contract compilation、fingerprint gate 与 rollback-capable transaction 职责。
- `project.root/domain.change_workflow/cap.change.lifecycle`: 增加 final deterministic review report 与 archive gate 职责。
- `project.root/domain.cli/cap.cli.architecture-navigation`: 增加只读 removal impact planning。
- `project.root/domain.cli/cap.cli.change-operations`: 增加 semantic diff command，并从正式命令职责中移除 Scenario labels。
- `project.root/domain.presentation/cap.presentation.semantic-browser`: 增加 active change selector、Specs diff、Architecture overlay、Diff only 与分区 diagnostics。
- `project.root/domain.ai_integration/cap.ai.workflow-generation`: Agent workflow 通过 validate preview 与 semantic diff 审阅 change。
- `project.root/domain.validation/cap.validation.semantic-contract`: 联合验证 Requirement operations、Architecture target、bindings、strict removals 与 partial diagnostics。

#### Removed LikeC4 Elements

None。Scenario labels 已包含在聚合的 `project.root/domain.cli/cap.cli.change-operations` 中，不存在可删除的独立 Formal element。

#### Architecture Relations

- `project.root/domain.change_workflow/cap.change.semantic-delta` 消费 versioned Semantic Model。
- CLI change operations 与 architecture navigation 调用 Semantic Delta Application。
- Semantic Browser 与 Agent Workflow Generation 消费同一 Semantic Delta Application 结果。
- 现有 validation 与 change lifecycle relations 继续约束同一 immutable Formal → Target compilation transaction。

## Impact

- 影响 change/spec parser、Architecture delta grammar/compiler、combined validator、sync/archive transaction 与 CLI command registry。
- 影响 `opsx view` server、active change indexing、runtime cache/HMR、Specs panel 和 LikeC4 graph overlay。
- 删除 Scenario labels command、core writer、parser normalization、workflow references 与相关 tests。
- 新增 deterministic `effective-change.md` generated artifact；该文件不参与 semantic compilation。
- 需要覆盖 Windows、macOS 与 Linux 的 path、atomic write、watcher 与 report generation 行为。
