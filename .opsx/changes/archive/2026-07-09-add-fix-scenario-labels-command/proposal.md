## Why

当前 scenario operation labels 的生成职责混在 agent authoring 指引与 sync/validate 语义之间，导致 snack/propose 可能遗漏 label，review 与 sync 的 scenario 级差异表达不稳定。

## What Changes

- 新增 `openspec fix-scenario-labels <change-name>` 命令，基于 main spec 与 change-local MODIFIED requirement 的确定性对比补全 scenario operation labels。
- 调整 propose/snack/specs artifact 指引：scenario operation labels 由 OpenSpec CLI 在 validation 之后自动处理，并作为 sync/archive review 的 change-local metadata。
- 在 sync 前自动处理 scenario labels，确保 `[ADDED]`/`[MODIFIED]` 去标签写入 formal specs，`[REMOVED]` scenario blocks 不写入 formal specs。
- 更新 validation 语义，使 validate 继续作为只读结构检查，不要求 agent 手工提供 scenario-level labels。

## Capabilities

### New Capabilities
- `cli-fix-scenario-labels`: 处理 change-local specs 中 scenario operation labels 的 preview/write 命令与确定性补全行为。

### Modified Capabilities
- `cli-validate`: 调整 change-local scenario operation label 校验边界，validate 不要求 MODIFIED scenarios 预先带 label。
- `cli-sync`: sync 前自动补全 scenario labels，并保持 formal spec 输出清洗 label 与省略 removed scenario 的语义。
- `propose-workflow`: 更新 specs 生成指引，说明 scenario operation labels 由 OpenSpec CLI 自动处理。
- `snack-skill`: 更新 specs reconciliation 指引，说明 scenario operation labels 由 OpenSpec CLI 自动处理。
- `specs-sync-skill`: 明确 sync/archive review 使用自动生成的 change-local scenario label metadata。

## Impact

- Affected code: `src/core/parsers/requirement-blocks.ts`, `src/core/specs-apply.ts`, `src/core/change-sync.ts`, `src/core/validation/validator.ts`, `src/commands/`, `src/cli/index.ts`, workflow template files, and related tests.
- CLI surface: adds `openspec fix-scenario-labels <change-name> [--preview] [--write] [--json]`.
- Behavior: `openspec validate` remains read-only; sync/archive consume deterministic labels generated before sync.
