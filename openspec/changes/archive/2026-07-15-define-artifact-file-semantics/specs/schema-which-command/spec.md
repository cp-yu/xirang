## ADDED Requirements

### Requirement: Built-in Schema inspection

`openspec schema which [name]` SHALL 报告内置 `spec-driven` 与 `bootstrap` 的 package location。`--all` SHALL 列出两个内置 Schema；JSON output SHALL 包含 `name`、`source: package` 与 `path`，MUST NOT 包含 shadowing 信息。

#### Scenario: 查询内置 Schema
- **WHEN** 用户执行 `openspec schema which spec-driven` 或 `bootstrap`
- **THEN** 系统 SHALL 显示 package source 与完整 Schema directory path

#### Scenario: 列出全部内置 Schema
- **WHEN** 用户执行 `openspec schema which --all --json`
- **THEN** 输出 SHALL 恰好包含可用内置 Schema
- **AND** 每项 SHALL 使用 `source: package`

#### Scenario: 查询未知 Schema
- **WHEN** 用户查询非内置 Schema
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 列出合法内置 ID

## REMOVED Requirements

### Requirement: Schema which shows resolution result
**Reason**: 多来源 resolution 被内置检查合同取代。
**Migration**: 使用 `Built-in Schema inspection`。

### Requirement: Schema which shows shadowing information
**Reason**: Project/user override 与 shadowing 已删除。
**Migration**: 无。

### Requirement: Schema which outputs JSON format
**Reason**: 旧 JSON 合同包含 shadows；由内置检查 JSON 合同取代。
**Migration**: 消费 `source: package` 的固定输出。

### Requirement: Schema which supports list mode
**Reason**: 旧 list mode 按多来源分组；由固定内置 list 合同取代。
**Migration**: 继续使用 `--all`。
