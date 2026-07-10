## Why

`scenario operation labels` 目前混在 `fix-scenario-labels`、`validate` 文案和 `sync` 隐式写入中，导致命令语义和 workflow 顺序不清晰。

## What Changes

- **BREAKING**: 删除 `openspec fix-scenario-labels`，改为 `openspec scenario-labels <change>`。
- 将 scenario label 程序化操作定位为 validate 之后、sync 之前的显式 change review metadata pass。
- `validate` 保持只读；`sync` 不再写回 change-local specs，也不要求 labels 存在。
- 更新 propose/snack/specs/sync guidance，移除 “fix” 和 “after validation 自动处理” 的混乱表述。
- 重命名核心 API，使用 apply/preview 语义替代 fix 语义。

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-scenario-labels`: 将命令 surface 从 `fix-scenario-labels` 重构为 `scenario-labels`，并保留确定性 preview/write 行为。
- `cli-sync`: 移除 sync 对 change-local scenario labels 的隐式写入副作用。
- `propose-workflow`: 调整 propose guidance 为 validate 后显式运行 `openspec scenario-labels`。
- `snack-skill`: 调整 snack 自检流程为 validate 后显式运行 `openspec scenario-labels`。
- `cli-validate`: 明确 validate 只读、labels 可选且由独立命令在 validate 后生成。
- `specs-sync-skill`: 明确 sync/archive 只消费并清洗已有 labels，不生成 labels。

## Impact

- CLI command registration and command tests.
- `src/core/scenario-labels.ts` API names.
- `src/core/change-sync.ts` sync preparation flow.
- Workflow templates and schema guidance.
- Formal specs and OPSX capability graph for scenario-labels/sync/propose/snack behavior.
