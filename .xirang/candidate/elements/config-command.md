---
entity: element-declaration
identity: config-command
kind: capability
parent: cli
title: Config Command
definition: Config Command 定义 `xirang config` 命令族的子命令面：path/list/get/set/unset/reset/edit/project，配置值的类型转换、schema 校验、`--scope` 保留标志，以及 `config project` 查询归一化项目配置并与 instructions 配置投影一致。
---

## Requirements

### Requirement: Command Structure

The config command SHALL provide subcommands for all configuration operations.

#### Scenario: Available subcommands

- **WHEN** user executes `xirang config --help`
- **THEN** display available subcommands:
  - `path` - Show config file location
  - `list` - Show all current settings
  - `get <key>` - Get a specific value
  - `set <key> <value>` - Set a value
  - `unset <key>` - Remove a key (revert to default)
  - `reset` - Reset configuration to defaults
  - `edit` - Open config in editor
  - `project` - Query normalized project configuration
- **AND** SHALL NOT include `profile` subcommand

### Requirement: Config Path

The config command SHALL display the config file location.

#### Scenario: Show config path

- **WHEN** 执行 `xirang config path`
- **THEN** 打印 config 文件的绝对路径
- **AND** 以 exit code 0 退出

### Requirement: Config List

The config command SHALL display all current configuration values.

#### Scenario: List config in human-readable format

- **WHEN** 执行 `xirang config list`
- **THEN** 以 YAML-like 格式显示全部 config values
- **AND** 以缩进显示嵌套对象

#### Scenario: List config as JSON

- **WHEN** 执行 `xirang config list --json`
- **THEN** 以合法 JSON 输出完整 config
- **AND** 只输出 JSON（无额外文本）

### Requirement: Config Get

The config command SHALL retrieve specific configuration values.

#### Scenario: Get top-level key

- **WHEN** user executes `xirang config get <key>` with a valid top-level key
- **THEN** print the raw value only (no labels or formatting)
- **AND** exit with code 0

#### Scenario: Get nested key with dot notation

- **WHEN** user executes `xirang config get featureFlags.someFlag`
- **THEN** traverse the nested structure using dot notation and print the value

#### Scenario: Get non-existent key

- **WHEN** user executes `xirang config get <key>` with a key that does not exist
- **THEN** print nothing (empty output)
- **AND** exit with code 1
#### Scenario: Get object value
- **WHEN** user executes `xirang config get <key>` where the value is an object
- **THEN** print the object as JSON
### Requirement: Config Set

The config command SHALL set configuration values with automatic type coercion.

#### Scenario: Set string value

- **WHEN** user executes `xirang config set <key> <value>`
- **AND** value does not match boolean or number patterns
- **THEN** store value as a string
- **AND** display confirmation message

#### Scenario: Set boolean value

- **WHEN** user executes `xirang config set <key> true` or `xirang config set <key> false`
- **THEN** store value as boolean (not string)

#### Scenario: Force string with --string flag

- **WHEN** user executes `xirang config set <key> <value> --string`
- **THEN** store value as string regardless of content
#### Scenario: Set numeric value
- **WHEN** user executes `xirang config set <key> <value>`
- **AND** value is a valid number (integer or float)
- **THEN** store value as number (not string)
#### Scenario: Set nested key
- **WHEN** user executes `xirang config set featureFlags.newFlag true`
- **THEN** create intermediate objects if they don't exist
- **AND** set the value at the nested path
### Requirement: Config Unset

The config command SHALL remove configuration overrides.

#### Scenario: Unset existing key

- **WHEN** 执行 `xirang config unset <key>` 且该 key 存在于 config
- **THEN** 从 config 文件移除该 key
- **AND** 值回退为默认值
- **AND** 显示确认消息

#### Scenario: Unset non-existent key

- **WHEN** 执行 `xirang config unset <key>` 且该 key 不存在
- **THEN** 显示 key 未被设置的提示
- **AND** 以 exit code 0 退出

### Requirement: Config Reset

The config command SHALL reset configuration to defaults.

#### Scenario: Reset all with confirmation

- **WHEN** 执行 `xirang config reset --all`
- **THEN** 继续前提示确认
- **AND** 确认后删除 config 文件或重置为默认值

#### Scenario: Reset all with -y flag

- **WHEN** 执行 `xirang config reset --all -y`
- **THEN** 不提示确认直接 reset

#### Scenario: Reset without --all flag

- **WHEN** 执行 `xirang config reset` 而不带 `--all`
- **THEN** 显示指示需要 `--all` 的错误
- **AND** 以 exit code 1 退出

### Requirement: Config Edit

The config command SHALL open the config file in the user's editor.

#### Scenario: Open editor successfully

- **WHEN** 执行 `xirang config edit` 且设置了 `$EDITOR` 或 `$VISUAL`
- **THEN** 在该 editor 中打开 config 文件
- **AND** 若文件不存在则以默认值创建
- **AND** 等待 editor 关闭后才返回

#### Scenario: No editor configured

- **WHEN** 执行 `xirang config edit` 且 `$EDITOR` 与 `$VISUAL` 均未设置
- **THEN** 显示建议设置 `$EDITOR` 的错误消息
- **AND** 以 exit code 1 退出

### Requirement: Key Naming Convention

The config command SHALL use camelCase keys matching the JSON structure.

#### Scenario: Keys match JSON structure

- **WHEN** 通过 CLI 访问配置 keys
- **THEN** 使用匹配实际 JSON property names 的 camelCase
- **AND** 支持嵌套访问的 dot notation（如 `featureFlags.someFlag`）

### Requirement: Schema Validation

The config command SHALL validate configuration writes against the config schema using zod, while rejecting unknown keys for `config set` unless explicitly overridden.

#### Scenario: Unknown key rejected by default

- **WHEN** user executes `xirang config set someFutureKey 123`
- **THEN** display a descriptive error message indicating the key is invalid
- **AND** do not modify the config file
- **AND** exit with code 1

#### Scenario: Unknown key accepted with override

- **WHEN** user executes `xirang config set someFutureKey 123 --allow-unknown`
- **THEN** the value is saved successfully
#### Scenario: Invalid feature flag value rejected
- **WHEN** user executes `xirang config set featureFlags.someFlag notABoolean`
- **THEN** display a descriptive error message
- **AND** do not modify the config file
- **AND** exit with code 1
### Requirement: Reserved Scope Flag

The config command SHALL reserve the `--scope` flag for future extensibility，当前仅支持 `global`。

#### Scenario: Scope flag defaults to global

- **WHEN** 执行任何 config command 而不带 `--scope`
- **THEN** 操作 global configuration（默认行为）

#### Scenario: Project scope 尚未实现

- **WHEN** 用户执行 `xirang config --scope project <subcommand>`
- **THEN** 命令输出错误："Error: Project-local config is not yet implemented"
- **AND** 以 exit code 1 退出，不执行任何 config 操作

### Requirement: Config CLI 拒绝写入退役的 Propose routing 路径

`xirang config set` SHALL 将 `propose`、`propose.smartRouting` 与 `propose.requireExplore` 视为已移除的配置路径，不得将其写入 global config。

#### Scenario: 默认拒绝退役 Propose 路径
- **WHEN** 用户执行 `xirang config set propose.smartRouting false` 或 `xirang config set propose.requireExplore false`
- **THEN** command SHALL 报告该路径已移除或无效
- **AND** SHALL NOT 修改 config file
- **AND** SHALL 以 exit code 1 退出

#### Scenario: allow-unknown 不恢复退役路径
- **WHEN** 用户对 `propose` routing 路径使用 `--allow-unknown`
- **THEN** command SHALL 仍拒绝该已知退役路径
- **AND** SHALL NOT 将其作为普通未知字段保存

### Requirement: 查询项目配置

系统 SHALL 提供 `xirang config project` CLI 命令，读取并返回归一化后的项目配置。输出 MUST NOT 包含已退役的 Propose routing 配置。

#### Scenario: JSON 输出包含完整配置

- **WHEN** 用户执行 `xirang config project --json`
- **THEN** 系统输出归一化后的 `NormalizedProjectConfig` JSON
- **AND** 输出包含适用的 `proseLanguage`、`context`、`optimization`、`apply`、`git` 和 `rules` 字段
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出

#### Scenario: 缺少 config.yaml 时返回空配置

- **WHEN** 项目目录中不存在 `.xirang/config.yaml`
- **THEN** 系统输出 `{ "rules": {} }` 作为最小有效配置
#### Scenario: 人类可读文本输出
- **WHEN** 用户执行 `xirang config project`（不带 `--json`）
- **THEN** 系统以 YAML-like 格式打印各配置项
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出
#### Scenario: 旧 Propose routing 配置不进入查询结果
- **WHEN** `.xirang/config.yaml` 包含旧 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** JSON 与人类可读输出 SHALL NOT 包含 `propose`
- **AND** 其他有效配置字段 SHALL 正常输出
### Requirement: 命令集成于 config 子命令体系

`config project` 命令 SHALL 作为 `xirang config` 的子命令注册。

#### Scenario: 帮助信息

- **WHEN** 用户执行 `xirang config --help`
- **THEN** 显示 `project` 作为可用子命令
- **AND** 描述该命令为查询项目级配置

### Requirement: 输出格式与 instructions 配置投影一致

`xirang config project --json` 的输出 SHALL 与 `xirang instructions <artifact> --json` 中的 `configProjection.normalized` 使用相同的 `NormalizedProjectConfig` 数据结构。

#### Scenario: 字段一致性

- **WHEN** 同一个项目中同时执行 `xirang config project --json` 和 `xirang instructions proposal --change "<name>" --json`
- **THEN** `xirang config project --json` 的顶层字段集合与 `instructions` 命令中 `configProjection.normalized` 的字段集合相同

#### Scenario: git 字段输出新结构

- **WHEN** 用户执行 `xirang config project --json`
- **THEN** 输出的 `git` 字段 SHALL 包含 `commitMessage`、`merge.strategy` 与 `branch.deleteAfterArchive`
- **AND** SHALL NOT 包含 `autoCommit` 或退役的 convention 字段
