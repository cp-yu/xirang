---
element: project.root/domain.cli/cap.cli.command-discovery
---

## MODIFIED Requirements

### Requirement: Completion Generation
Completion command SHALL 为所有 supported shells 生成来自当前 Commander.js command tree 的 completion scripts，并 SHALL 反映 setup、Candidate 与 Project Build 的当前 surface。

#### Scenario: 所有 shell 暴露当前 commands
- **WHEN** 为 Zsh、Bash、Fish 或 PowerShell 生成 completion
- **THEN** output SHALL 包含 `setup`
- **AND** SHALL 包含 `candidate` 及其 `init`、`status`、`validate`、`promote` subcommands
- **AND** SHALL NOT 包含 `init`、`bootstrap` 或 `migrate`
- **AND** SHALL 包含每个 current command 的 flags 与 descriptions

#### Scenario: Candidate subcommand completion
- **WHEN** 用户输入 `opsx candidate <TAB>`
- **THEN** shell SHALL 建议 `init`、`status`、`validate`、`promote`
- **AND** `init` SHALL complete its starting-point options
- **AND** `validate` SHALL complete `--json`
- **AND** `promote` SHALL complete `--digest`

#### Scenario: Generated script 保持 shell-native
- **WHEN** 为任一 supported shell 生成 completion
- **THEN** SHALL 保持该 shell 的 native completion primitives、escaping 和 interaction behavior
- **AND** SHALL 从 runtime command introspection 获取 command definitions

### Requirement: Dynamic Completions
Dynamic completion SHALL 继续为 change IDs 与 Spec IDs 提供 project-aware suggestions，并 SHALL NOT 从 `.opsx/candidate/` 或 `.opsx/history/` 推断 formal identifiers。

#### Scenario: Formal ID completion
- **WHEN** command 需要 change 或 Spec identifier
- **THEN** provider SHALL 从 `.opsx/changes/` 或 `.opsx/specs/` 读取 suggestions
- **AND** SHALL 排除 archive、Candidate 与 history entries

#### Scenario: Project 外 completion
- **WHEN** 当前目录不是 OPSX project
- **THEN** SHALL 仅提供 static command 和 flag suggestions
