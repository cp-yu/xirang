---
operation: MODIFIED
entity: element-declaration
identity: config-command
kind: element
parent: cli
title: "Config Command"
definition: "Config Command 是配置查询与管理的 CLI 命令族。它包含全局配置的 path、list、get、set、unset、reset、edit，以及查询当前归一化项目配置的 project，负责配置值转换、选择读取、写入校验与作用域边界。它提供有效配置数据，不以重复提示词交付工作流的静态遵循规则。"
---

## MODIFIED Sections

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

### Section: 查询项目配置

系统 SHALL 提供 xirang config project，使用共享配置加载与归一化规则返回当前有效项目配置。未指定选择范围时 SHALL 返回完整配置；包含适用的 proseLanguage、context、decomposition、architecture、optimization、apply、git 和 rules，不包含已退役的 Propose routing。每次调用 SHALL 读取当前磁盘配置，先前查询结果不得遮蔽后续修改。

--select <key> SHALL 可重复使用，按配置字段的点路径选择数据，并保持原嵌套对象形状；不选择时不缩小范围。--artifact <id> SHALL 将 rules 限于匹配制品，未匹配或空规则以空 rules 对象表达，不注入其它制品规则。--artifact 与 --select 可组合：先归一化并限定 rules，再投影选中路径；存在且非空的其它字段不因 --artifact 被省略。非法选择路径或未知 artifact ID SHALL 非零退出并给出具体诊断；合法但未配置的可选字段 SHALL 省略，结果无字段时返回 {}，作为有效查询结果。

JSON SHALL 返回所请求的配置数据；文本 SHALL 以紧凑 YAML-like 表达同一范围。context 与 rules 的内容 SHALL 保持原文及换行；JSON 语法转义解码后内容相同。不输出 prompt fragments、compiledLines 或重复的语言强化段落。未配置字段和默认值 SHALL 遵循共享归一化规则，不由输出层制造新的默认值。

- 查询 --select proseLanguage --select rules --artifact proposal：只返回有效 proseLanguage 与 proposal 对应 rules，不返回 specs rules 或完整配置。
- 已查询配置后修改项目语言或 rules：下一次相同查询返回新有效值。
- context 含 Markdown、URL、<、>、& 或多行文本：输出解码后内容完整保持。
- 配置含退役 Propose routing：输出不包含 propose，其他有效字段正常返回；真实配置警告进入 stderr。
- 查询合法可选字段但没有配置：返回 {} 且退出码 0；拼错字段名则在 stderr 报错，不能将错误当作空结果。

## ADDED Sections

### Section: 保持有效配置的统一表示

config project SHALL 使用共享 NormalizedProjectConfig 表示。工作流 SHALL 从该有效数据读取配置，遵循共享 skill/reference 中的配置适用规则，不直接解析 raw YAML 重新解释默认值。

git 字段 SHALL 保持 commitMessage、merge.strategy 与 branch.deleteAfterArchive 结构，不包含 autoCommit 或退役的 convention 字段。语言、context、匹配 artifact rules、Apply isolation 与 Archive git 配置 SHALL 在适用工作流中保持同一语义。

## REMOVED Sections

### Section: 输出格式与 instructions 配置投影一致
