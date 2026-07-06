## Why

当前 bootstrap 已保存 `granularity`，但它默认 `coarse` 且没有真实影响 spec 生成；结果是 bootstrap 仍按 capability 生成过多分散 specs，和用户期望的 agent 驱动建模不一致。

## What Changes

- 让 `openspec-bootstrap-opsx` skill agent 在 init 前询问用户选择 `coarse` 或 `fine`，解释差异，并禁止默认选择。
- 为 `openspec bootstrap init` 增加显式 `--granularity coarse|fine`，仅用于把 agent 确认过的选择写入 `scope.yaml`。
- 在 `domain-map/*.yaml` 中新增 `spec_groups` 作为 `coarse` 模式的 group-level spec source。
- 让 `coarse` 使用 `spec_groups` 生成 grouped specs；让 `fine` 保留现有 `capabilities[].spec` per-capability 行为。
- 移除 hidden `coarse` 默认与 coarse/fine fallback；缺失或不匹配时 validate fail。
- 在 promote/backfill 完成后要求 bootstrap skill agent 运行 `openspec validate --all`。

## Capabilities

### New Capabilities

### Modified Capabilities
- `bootstrap`: bootstrap workflow 的 agent/CLI 职责、granularity 选择、`spec_groups` 编译和完成后验证行为发生变化。
- `bootstrap-baseline`: `raw + full` 的 spec 输出合同从 capability/spec 一一对应改为 capability coverage。
- `bootstrap-init-ux`: init 的 scope 配置必须显式携带 granularity，且 granularity 由 agent 询问后传入 CLI。
- `bootstrap-domain-map-state`: domain-map schema 与 gate 需要识别并验证 `spec_groups`。

## Impact

- `src/core/templates/workflows/bootstrap-opsx.ts`
- `src/commands/bootstrap.ts`
- `src/utils/bootstrap-utils.ts`
- `schemas/bootstrap/schema.yaml`
- `schemas/bootstrap/templates/domain-map.md`
- `test/commands/bootstrap.test.ts`
- `test/utils/bootstrap-utils.test.ts`
- `test/utils/bootstrap-utils.pbt.contract.test.ts`
- `test/cli-e2e/bootstrap-lifecycle.test.ts`
- `docs/opsx-bootstrap.md`
