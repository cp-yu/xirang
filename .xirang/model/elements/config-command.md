---
entity: element-declaration
identity: config-command
kind: element
parent: cli
title: Config Command
definition: Config Command 是配置查询与管理的 CLI 命令族。它包含全局配置的 path、list、get、set、unset、reset、edit，以及查询当前归一化项目配置的 project，负责配置值转换、选择读取、写入校验与作用域边界。它提供有效配置数据，不以重复提示词交付工作流的静态遵循规则。
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
  - stdout 保持为空，在 stderr 报告该 key 不存在的具体诊断
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
  - 成功且无警告时 stdout 与 stderr 均为空，以退出码 0 表示完成

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
  - 成功且无警告时 stdout 与 stderr 均为空

- **Unset non-existent key**

  - 执行 `xirang config unset <key>` 且该 key 不存在
  - 保持配置不变，不输出确认消息
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

系统 SHALL 提供 xirang config project，使用共享配置加载与归一化规则返回当前有效项目配置。未指定选择范围时 SHALL 返回完整配置；包含适用的 proseLanguage、context、decomposition、architecture、optimization、apply、git 和 rules，不包含已退役的 Propose routing。每次调用 SHALL 读取当前磁盘配置，先前查询结果不得遮蔽后续修改。

--select <key> SHALL 可重复使用，按配置字段的点路径选择数据，并保持原嵌套对象形状；不选择时不缩小范围。--artifact <id> SHALL 将 rules 限于匹配制品，未匹配或空规则以空 rules 对象表达，不注入其它制品规则。--artifact 与 --select 可组合：先归一化并限定 rules，再投影选中路径；存在且非空的其它字段不因 --artifact 被省略。非法选择路径或未知 artifact ID SHALL 非零退出并给出具体诊断；合法但未配置的可选字段 SHALL 省略，结果无字段时返回 {}，作为有效查询结果。

JSON SHALL 返回所请求的配置数据；文本 SHALL 以紧凑 YAML-like 表达同一范围。context 与 rules 的内容 SHALL 保持原文及换行；JSON 语法转义解码后内容相同。不输出 prompt fragments、compiledLines 或重复的语言强化段落。未配置字段和默认值 SHALL 遵循共享归一化规则，不由输出层制造新的默认值。

- 查询 --select proseLanguage --select rules --artifact proposal：只返回有效 proseLanguage 与 proposal 对应 rules，不返回 specs rules 或完整配置。
- 已查询配置后修改项目语言或 rules：下一次相同查询返回新有效值。
- context 含 Markdown、URL、<、>、& 或多行文本：输出解码后内容完整保持。
- 配置含退役 Propose routing：输出不包含 propose，其他有效字段正常返回；真实配置警告进入 stderr。
- 查询合法可选字段但没有配置：返回 {} 且退出码 0；拼错字段名则在 stderr 报错，不能将错误当作空结果。

### Section: 命令集成于 config 子命令体系

`config project` 命令 SHALL 作为 `xirang config` 的子命令注册。

- **帮助信息**

  - 用户执行 `xirang config --help`
  - 显示 `project` 作为可用子命令
  - 描述该命令为查询项目级配置

### Section: 保持有效配置的统一表示

config project SHALL 使用共享 NormalizedProjectConfig 表示。工作流 SHALL 从该有效数据读取配置，遵循共享 skill/reference 中的配置适用规则，不直接解析 raw YAML 重新解释默认值。

git 字段 SHALL 保持 commitMessage、merge.strategy 与 branch.deleteAfterArchive 结构，不包含 autoCommit 或退役的 convention 字段。语言、context、匹配 artifact rules、Apply isolation 与 Archive git 配置 SHALL 在适用工作流中保持同一语义。
