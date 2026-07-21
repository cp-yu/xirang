# schema-which-command Specification

## Purpose
Define `opsx schema which` behavior for reporting resolved schema source, location, and fallback details.
## Requirements
### Requirement: Built-in Schema inspection

`opsx schema which [name]` SHALL 报告内置 `spec-driven` 与 `bootstrap` 的 package location。`--all` SHALL 列出两个内置 Schema；JSON output SHALL 包含 `name`、`source: package` 与 `path`，MUST NOT 包含 shadowing 信息。

#### Scenario: 查询内置 Schema
- **WHEN** 用户执行 `opsx schema which spec-driven` 或 `bootstrap`
- **THEN** 系统 SHALL 显示 package source 与完整 Schema directory path

#### Scenario: 列出全部内置 Schema
- **WHEN** 用户执行 `opsx schema which --all --json`
- **THEN** 输出 SHALL 恰好包含可用内置 Schema
- **AND** 每项 SHALL 使用 `source: package`

#### Scenario: 查询未知 Schema
- **WHEN** 用户查询非内置 Schema
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 列出合法内置 ID

