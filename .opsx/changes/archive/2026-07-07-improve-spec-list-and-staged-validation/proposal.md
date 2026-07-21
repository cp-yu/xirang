## Why

`openspec list --specs --json` 目前只暴露 requirement 数量，作者仍需打开 spec 才能确认可引用的 `### Requirement:` 名称。`openspec validate` 已有 spec delta 与 OPSX delta 的独立验证函数，但 CLI 只能一次性合并运行，导致 artifact 编写过程中错误定位不够直接。

## What Changes

- `openspec list --specs --json` 默认为每个 spec 增加 `requirements: string[]`，值为 formal spec 中的 requirement header 名称。
- `openspec validate --change <name>` 显式验证指定 change；不带 `--artifacts` 时执行完整 change validation。
- `openspec validate --change <name> --artifacts specs|opsx-delta` 支持只验证指定 artifact scope。
- propose workflow 的生成 guidance 引用新的 staged validation 命令，方便 agent 在生成 specs 与 opsx-delta 后分阶段检查。
- 不新增 `check-delta` 命令；该能力后续独立 change 处理。

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-list`: specs JSON 输出增加 requirement header 名称列表。
- `cli-validate`: change validation 增加显式 `--change` 与 `--artifacts` scope。
- `propose-workflow`: post-propose validation guidance 使用 artifact-scoped validate 命令。

## Impact

- CLI surface: `src/cli/index.ts`, `src/core/list.ts`, `src/commands/validate.ts`
- Validation reuse: `src/core/validation/validator.ts`
- Generated workflow source: `src/core/templates/workflows/propose.ts`
- Tests: `test/core/list.test.ts`, `test/commands/validate.test.ts`, `test/core/templates/propose-template.test.ts`
