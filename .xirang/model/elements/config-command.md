---
entity: element-declaration
identity: config-command
kind: element
parent: cli
title: Config Command
definition: Config Command 定义 `xirang config` 命令族的子命令面：path/list/get/set/unset/reset/edit/project，配置值的类型转换、schema 校验、`--scope` 保留标志，以及 `config project` 查询归一化项目配置并与 instructions 配置投影一致。
---

## Specification

### Section: Command Structure

The config command SHALL provide subcommands for all configuration operations.

- **Available subcommands**

  - user executes `xirang config --help`
  - display available subcommands:
  - `path` - Show config file location
  - `list` - Show all current settings
  - `get <key>` - Get a specific value
  - `set <key> <value>` - Set a value
  - `unset <key>` - Remove a key (revert to default)
  - `reset` - Reset configuration to defaults
  - `edit` - Open config in editor
  - `project` - Query normalized project configuration
  - SHALL NOT include `profile` subcommand

### Section: Config Path

The config command SHALL display the config file location.

- **Show config path**

  - 执行 `xirang config path`
  - 打印 config 文件的绝对路径
  - 以 exit code 0 退出

### Section: Config List

The config command SHALL display all current configuration values.

- **List config in human-readable format**

  - 执行 `xirang config list`
  - 以 YAML-like 格式显示全部 config values
  - 以缩进显示嵌套对象

- **List config as JSON**

  - 执行 `xirang config list --json`
  - 以合法 JSON 输出完整 config
  - 只输出 JSON（无额外文本）

### Section: Config Get

The config command SHALL retrieve specific configuration values.

- **Get top-level key**

  - user executes `xirang config get <key>` with a valid top-level key
  - print the raw value only (no labels or formatting)
  - exit with code 0

- **Get nested key with dot notation**

  - user executes `xirang config get featureFlags.someFlag`
  - traverse the nested structure using dot notation and print the value

- **Get non-existent key**

  - user executes `xirang config get <key>` with a key that does not exist
  - print nothing (empty output)
  - exit with code 1

- **Get object value**
  - user executes `xirang config get <key>` where the value is an object
  - print the object as JSON
### Section: Config Set

The config command SHALL set configuration values with automatic type coercion.

- **Set string value**

  - user executes `xirang config set <key> <value>`
  - value does not match boolean or number patterns
  - store value as a string
  - display confirmation message

- **Set boolean value**

  - user executes `xirang config set <key> true` or `xirang config set <key> false`
  - store value as boolean (not string)

- **Force string with --string flag**

  - user executes `xirang config set <key> <value> --string`
  - store value as string regardless of content

- **Set numeric value**
  - user executes `xirang config set <key> <value>`
  - value is a valid number (integer or float)
  - store value as number (not string)

- **Set nested key**
  - user executes `xirang config set featureFlags.newFlag true`
  - create intermediate objects if they don't exist
  - set the value at the nested path
### Section: Config Unset

The config command SHALL remove configuration overrides.

- **Unset existing key**

  - 执行 `xirang config unset <key>` 且该 key 存在于 config
  - 从 config 文件移除该 key
  - 值回退为默认值
  - 显示确认消息

- **Unset non-existent key**

  - 执行 `xirang config unset <key>` 且该 key 不存在
  - 显示 key 未被设置的提示
  - 以 exit code 0 退出

### Section: Config Reset

The config command SHALL reset configuration to defaults.

- **Reset all with confirmation**

  - 执行 `xirang config reset --all`
  - 继续前提示确认
  - 确认后删除 config 文件或重置为默认值

- **Reset all with -y flag**

  - 执行 `xirang config reset --all -y`
  - 不提示确认直接 reset

- **Reset without --all flag**

  - 执行 `xirang config reset` 而不带 `--all`
  - 显示指示需要 `--all` 的错误
  - 以 exit code 1 退出

### Section: Config Edit

The config command SHALL open the config file in the user's editor.

- **Open editor successfully**

  - 执行 `xirang config edit` 且设置了 `$EDITOR` 或 `$VISUAL`
  - 在该 editor 中打开 config 文件
  - 若文件不存在则以默认值创建
  - 等待 editor 关闭后才返回

- **No editor configured**

  - 执行 `xirang config edit` 且 `$EDITOR` 与 `$VISUAL` 均未设置
  - 显示建议设置 `$EDITOR` 的错误消息
  - 以 exit code 1 退出

### Section: Key Naming Convention

The config command SHALL use camelCase keys matching the JSON structure.

- **Keys match JSON structure**

  - 通过 CLI 访问配置 keys
  - 使用匹配实际 JSON property names 的 camelCase
  - 支持嵌套访问的 dot notation（如 `featureFlags.someFlag`）

### Section: Schema Validation

The config command SHALL validate configuration writes against the config schema using zod, while rejecting unknown keys for `config set` unless explicitly overridden.

- **Unknown key rejected by default**

  - user executes `xirang config set someFutureKey 123`
  - display a descriptive error message indicating the key is invalid
  - do not modify the config file
  - exit with code 1

- **Unknown key accepted with override**

  - user executes `xirang config set someFutureKey 123 --allow-unknown`
  - the value is saved successfully

- **Invalid feature flag value rejected**
  - user executes `xirang config set featureFlags.someFlag notABoolean`
  - display a descriptive error message
  - do not modify the config file
  - exit with code 1
### Section: Reserved Scope Flag

The config command SHALL reserve the `--scope` flag for future extensibility，当前仅支持 `global`。

- **Scope flag defaults to global**

  - 执行任何 config command 而不带 `--scope`
  - 操作 global configuration（默认行为）

- **Project scope 尚未实现**

  - 用户执行 `xirang config --scope project <subcommand>`
  - 命令输出错误："Error: Project-local config is not yet implemented"
  - 以 exit code 1 退出，不执行任何 config 操作

### Section: Config CLI 拒绝写入退役的 Propose routing 路径

`xirang config set` SHALL 将 `propose`、`propose.smartRouting` 与 `propose.requireExplore` 视为已移除的配置路径，不得将其写入 global config。

- **默认拒绝退役 Propose 路径**
  - 用户执行 `xirang config set propose.smartRouting false` 或 `xirang config set propose.requireExplore false`
  - command SHALL 报告该路径已移除或无效
  - SHALL NOT 修改 config file
  - SHALL 以 exit code 1 退出

- **allow-unknown 不恢复退役路径**
  - 用户对 `propose` routing 路径使用 `--allow-unknown`
  - command SHALL 仍拒绝该已知退役路径
  - SHALL NOT 将其作为普通未知字段保存

### Section: 查询项目配置

系统 SHALL 提供 `xirang config project` CLI 命令，读取并返回归一化后的项目配置。输出 MUST NOT 包含已退役的 Propose routing 配置。

- **JSON 输出包含完整配置**

  - 用户执行 `xirang config project --json`
  - 系统输出归一化后的 `NormalizedProjectConfig` JSON
  - 输出包含适用的 `proseLanguage`、`context`、`optimization`、`apply`、`git` 和 `rules` 字段
  - 输出 SHALL NOT 包含 `propose`
  - 以 exit code 0 退出

- **缺少 config.yaml 时返回空配置**

  - 项目目录中不存在 `.xirang/config.yaml`
  - 系统输出 `{ "rules": {} }` 作为最小有效配置

- **人类可读文本输出**
  - 用户执行 `xirang config project`（不带 `--json`）
  - 系统以 YAML-like 格式打印各配置项
  - 输出 SHALL NOT 包含 `propose`
  - 以 exit code 0 退出

- **旧 Propose routing 配置不进入查询结果**
  - `.xirang/config.yaml` 包含旧 `propose.smartRouting` 或 `propose.requireExplore`
  - JSON 与人类可读输出 SHALL NOT 包含 `propose`
  - 其他有效配置字段 SHALL 正常输出
### Section: 命令集成于 config 子命令体系

`config project` 命令 SHALL 作为 `xirang config` 的子命令注册。

- **帮助信息**

  - 用户执行 `xirang config --help`
  - 显示 `project` 作为可用子命令
  - 描述该命令为查询项目级配置

### Section: 输出格式与 instructions 配置投影一致

`xirang config project --json` 的输出 SHALL 与 `xirang instructions <artifact> --json` 中的 `configProjection.normalized` 使用相同的 `NormalizedProjectConfig` 数据结构。

- **字段一致性**

  - 同一个项目中同时执行 `xirang config project --json` 和 `xirang instructions proposal --change "<name>" --json`
  - `xirang config project --json` 的顶层字段集合与 `instructions` 命令中 `configProjection.normalized` 的字段集合相同

- **git 字段输出新结构**

  - 用户执行 `xirang config project --json`
  - 输出的 `git` 字段 SHALL 包含 `commitMessage`、`merge.strategy` 与 `branch.deleteAfterArchive`
  - SHALL NOT 包含 `autoCommit` 或退役的 convention 字段
