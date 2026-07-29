## Why

当前 Change 展示与列表仍通过只理解 change-local `specs/` 的旧 `ChangeParser` 计算 Delta，导致四分区 Change 被错误呈现为空，并保留了与现行 Semantic Delta 模型冲突的 schema、converter 与校验代码。

## What Changes

- `xirang show <change> --json` 改为呈现 compiler 推导的 Change diff contract。
- Change 列表的 Delta 数量改为四分区 Semantic Delta 的有效实体级差异数量。
- 删除旧 `ChangeParser`、旧 Change/Delta schema、JSON converter 及其专属解析和校验路径。
- **BREAKING**：Change JSON 从 `{ deltaCount, deltas }` 切换为 `{ valid, summary, entries, diagnostics }`，并移除 `--deltas-only` 与 `--requirements-only`。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `deterministic-operations`: Change 展示与列表 SHALL 从当前 Semantic Model 和四分区 Semantic Delta 推导稳定输出，不再读取 change-local `specs/` 或从 Change Plan 推断 Delta。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `src/commands/change.ts`、`src/commands/show.ts` 与 CLI options。
- `src/core/change-compiler.ts`、Semantic Delta 与 Change diff 的现有输出类型。
- `src/core/parsers/`、`src/core/converters/`、`src/core/schemas/` 与旧 validation constants。
- Change list/show、Markdown parser、JSON converter 与 validation tests。
- `docs/cli.md` 的 Change JSON 与 flags 文档。
