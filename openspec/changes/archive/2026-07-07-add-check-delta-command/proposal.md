## Why

作者和 agent 现在只能在 delta spec 写完后运行 `openspec validate --change <name> --artifacts specs` 才发现 requirement header 引用错误。新增写入前检查可以先暴露 main spec 的可引用 headers，并在落盘前拦住 `MODIFIED` 缺失和 `ADDED` 重名。

## What Changes

- 新增 `openspec check-delta` 顶层命令，用于 delta spec 写入前检查计划引用的 main spec requirement headers。
- `--caps` 按 spec directory name 解析到 `openspec/specs/<spec-id>/spec.md`。
- 支持可重复的 `--added`、`--modified`、`--removed`、`--renamed-from` flags，并按 operation 语义分类为 OK、Missing 或 Conflict。
- 支持 human output 与 `--json` 输出；任意 Missing 或 Conflict 时返回 exit code 1，但不中断其他 requirement 或其他 spec 的校验。
- 更新 `openspec-propose` workflow guidance，在写 change-local specs 前提示使用 `openspec check-delta` 做 blocking preflight；post-write validation 仍保持 warning-only。

## Capabilities

### New Capabilities
- `cli-check-delta`: 写入前 delta requirement reference 检查命令。

### Modified Capabilities
- `propose-workflow`: specs 写入前 guidance 增加 `openspec check-delta` preflight。

## Impact

- CLI surface: `src/cli/index.ts`, `src/commands/check-delta.ts`
- Parsing reuse: `src/core/parsers/requirement-blocks.ts`
- Workflow template source: `src/core/templates/workflows/propose.ts`
- Tests: `test/commands/check-delta.test.ts`, `test/core/templates/propose-template.test.ts`
- OPSX graph: `openspec/project.opsx.yaml`, `openspec/project.opsx.relations.yaml`, `openspec/project.opsx.code-map.yaml`
