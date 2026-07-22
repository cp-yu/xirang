---
capabilities:
  - cap.cli.list
---
# List Command Specification

## Purpose

The `opsx list` command SHALL provide developers with a quick overview of all active changes in the project, showing their names and task completion status.
## Requirements
### Requirement: Command Execution
The command SHALL scan and analyze either active changes or specs based on the selected mode.

#### Scenario: Scanning for changes (default)
- **WHEN** `opsx list` is executed without flags
- **THEN** scan the `.opsx/changes/` directory for change directories
- **AND** exclude the `archive/` subdirectory from results
- **AND** parse each change's `tasks.md` file to count task completion

#### Scenario: Scanning for specs
- **WHEN** `opsx list --specs` is executed
- **THEN** scan the `.opsx/specs/` directory for capabilities
- **AND** read each capability's `spec.md`
- **AND** parse requirements to compute requirement counts

### Requirement: Task Counting

The command SHALL accurately count task completion status using standard markdown checkbox patterns.

#### Scenario: Counting tasks in tasks.md

- **WHEN** parsing a `tasks.md` file
- **THEN** count tasks matching these patterns:
  - Completed: Lines containing `- [x]`
  - Incomplete: Lines containing `- [ ]`
- **AND** calculate total tasks as the sum of completed and incomplete

### Requirement: Output Format
The command SHALL display items in a clear, readable table format with mode-appropriate progress or counts.

#### Scenario: Displaying change list (default)
- **WHEN** displaying the list of changes
- **THEN** show a table with columns:
  - Change name (directory name)
  - Task progress (e.g., "3/5 tasks" or "✓ Complete")

#### Scenario: Displaying spec list
- **WHEN** displaying the list of specs
- **THEN** show a table with columns:
  - Spec id (directory name)
  - Requirement count (e.g., "requirements 12")

### Requirement: Flags
The command SHALL accept flags to select the noun being listed.

#### Scenario: Selecting specs
- **WHEN** `--specs` is provided
- **THEN** list specs instead of changes

#### Scenario: Selecting changes
- **WHEN** `--changes` is provided
- **THEN** list changes explicitly (same as default behavior)

### Requirement: Empty State
The command SHALL provide clear feedback when no items are present for the selected mode.

#### Scenario: Handling empty state (changes)
- **WHEN** no active changes exist (only archive/ or empty changes/)
- **THEN** display: "No active changes found."

#### Scenario: Handling empty state (specs)
- **WHEN** no specs directory exists or contains no capabilities
- **THEN** display: "No specs found."

### Requirement: Error Handling

The command SHALL gracefully handle missing files and directories with appropriate messages.

#### Scenario: Missing tasks.md file

- **WHEN** a change directory has no `tasks.md` file
- **THEN** display the change with "No tasks" status

#### Scenario: Missing changes directory

- **WHEN** `.opsx/changes/` directory doesn't exist
- **THEN** display error: "No OPSX changes directory found. Run 'opsx init' first."
- **AND** exit with code 1

### Requirement: Sorting

The command SHALL maintain consistent ordering of changes for predictable output.

#### Scenario: Ordering changes

- **WHEN** displaying multiple changes
- **THEN** sort them in alphabetical order by change name

### Requirement: Extracting capabilities from frontmatter

系统 SHALL 在 Specs mode 解析 YAML frontmatter 的 singular `element` binding，并 SHALL 返回一个 stable `elementId` 或 null。系统 MUST NOT 将新版 Spec 映射为 capabilities 数组。

#### Scenario: Extracting element from frontmatter
- **WHEN** parsing a新版 `spec.md`
- **THEN** SHALL 使用 `parseSpecFrontmatter()` 提取 `element`
- **AND** 合法字符串 SHALL 原样作为 canonical `elementId` 返回

#### Scenario: Missing element binding
- **WHEN** frontmatter 缺失或没有合法 `element`
- **THEN** SHALL 返回 `element: null`
- **AND** MUST NOT 返回空 capabilities 数组替代该状态

### Requirement: JSON output format for specs

`opsx list --specs --json` SHALL 返回 Spec identity、requirements 与 singular element binding。Requirement names SHALL 从 formal `### Requirement:` headers 提取。

#### Scenario: JSON output includes element and requirements
- **WHEN** 用户运行 `opsx list --specs --json`
- **THEN** 每个 item SHALL 包含 `id`、`title`、`requirementCount`、`requirements` 与 `element`
- **AND** `element` SHALL 为 stable `elementId` 或 null
- **AND** MUST NOT 包含 `capabilities` 字段

#### Scenario: Missing fields use deterministic empty values
- **WHEN** Spec 缺少 element binding
- **THEN** `element` SHALL 为 null
- **WHEN** requirement headers 不存在或无法读取
- **THEN** `requirements` SHALL 为 `[]`

#### Scenario: JSON structure example
- **WHEN** Spec `cli-list` 绑定 `cli.list`
- **THEN** output SHALL 匹配：
```json
{
  "id": "cli-list",
  "title": "List Command Specification",
  "requirementCount": 2,
  "requirements": ["Command Execution", "JSON output format for specs"],
  "element": "cli.list"
}
```

## Why

Developers need a quick way to:
- See what changes are in progress
- Identify which changes are ready to archive
- Understand the overall project evolution status
- Get a bird's-eye view without opening multiple files

This command provides that visibility with minimal effort, following OPSX's philosophy of simplicity and clarity.