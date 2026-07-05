## Why

当一个 requirement 包含多个 scenarios 时，change-local spec 需要复制完整 requirement block，审阅者很难看出哪些 scenario 是新增、修改或删除。需要在不引入完整 scenario-level patch 语言的前提下，让 change spec 显示局部变化并保持 formal specs 干净。

## What Changes

- 在 change-local specs 的 `#### Scenario:` 标题中支持 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation labels。
- `sync` / archive-time specs reconciliation 写入 formal specs 前清洗 labels，并删除 `[REMOVED]` scenario block。
- `validate` 对 change-local label 语法、surviving scenarios、formal spec label 污染执行结构校验。
- propose/snack 生成指导将 scenario labels 作为 review/sync metadata，而不是 formal spec 内容。

## Capabilities

### New Capabilities

### Modified Capabilities
- `specs-sync-skill`: archive-time delta reconciliation 需要处理 scenario operation labels。
- `cli-sync`: `openspec sync` 需要输出无 label 的 formal specs 并保持幂等。
- `cli-validate`: change/spec validation 需要识别合法 labels、拒绝非法 labels，并禁止 formal specs 携带 labels。
- `propose-workflow`: propose spec 生成指导需要在合适场景生成 scenario labels。
- `opsx-propose-skill`: post-propose validation 需要与 scenario label 语义保持一致。
- `snack-skill`: code-first spec reconciliation 需要在合适场景生成 scenario labels。
- `apply-preflight-scan`: task/spec 一致性扫描需要按 label-free scenario title 理解 Verifies 引用。

## Impact

- 影响 delta spec parsing、spec reconciliation、idempotency comparison、change/spec validation、task structure validation 和 workflow guidance。
- 主要代码面包括 `src/core/parsers/requirement-blocks.ts`、`src/core/specs-apply.ts`、`src/core/change-sync.ts`、`src/core/validation/validator.ts`、`src/core/parsers/task-structure.ts`、`src/core/templates/workflows/propose.ts`、`src/core/templates/workflows/snack.ts`、`schemas/spec-driven/schema.yaml` 及对应 tests。
- 不引入新依赖，不实现独立 `## ADDED Scenarios` / `## MODIFIED Scenarios` / `## REMOVED Scenarios` patch grammar。
