---
entity: element-declaration
identity: completion-introspect
kind: element
parent: cli
title: Completion Introspect
definition: Completion Introspect 定义从 Commander.js 命令树运行时反射生成 `CommandDefinition[]` 的行为：命令元数据提取、集中式 `POSITIONAL_TYPE_MAP` 注入、与补全脚本生成器接口兼容，以及防漏测试确保 positionalType 完整性。
---

## Specification

### Section: 从 Commander.js 命令树反射生成 CommandDefinition 数组

系统 SHALL 提供 `introspectCommands(program)` 函数，通过遍历 Commander.js 的 `program` 实例运行时提取所有命令元数据。

- **提取顶层命令基本信息**

  - 调用 `introspectCommands(program)`
  - 返回的每个 `CommandDefinition` 的 `name` 与 `description` SHALL 等于对应 `Command` 实例的返回值

- **提取命令 flags**

  - 一个 Commander.js 命令注册了 `.option('--json', 'Output as JSON')`
  - 对应 `CommandDefinition.flags` 中 SHALL 包含 `{ name: 'json', description: 'Output as JSON', takesValue: false }`
  - `option.negate === true` 与 `option.hidden === true` 的条目 SHALL 被排除

- **递归提取子命令**

  - 一个命令注册了子命令
  - 对应 `CommandDefinition.subcommands` SHALL 递归包含所有子命令的 `CommandDefinition`

- **排除自动生成的 help 和 version options**

  - Commander.js 自动添加 `--help` 和 `--version` options
  - 这些 options SHALL 不出现在提取的 `flags` 数组中

- **提取短标志**

  - 一个 Commander.js 命令注册了 `.option('-y, --yes', 'Skip confirmation')`
  - 对应 flag 条目 SHALL 包含 `short: 'y'`

- **提取带参数值的 flags**

  - 一个命令注册了 `.option('--type <type>', ...)` 并通过 `.choices([...])` 限定值
  - flag 条目 SHALL 包含 `takesValue: true` 与 `values: [...]`

- **提取位置参数**

  - 命令通过 `.command('validate [item-name]')` 声明位置参数
  - `acceptsPositional` SHALL 为 `true`

- **排除 hidden 命令**

  - Commander.js 命令以 `{ hidden: true }` 注册
  - introspect 结果 SHALL NOT 包含该命令

### Section: positionalType 通过集中式 Map 注入

系统 SHALL 维护一个 `POSITIONAL_TYPE_MAP` 常量，将命令路径映射到对应的 `positionalType` 值，并在 introspect 过程中合并到输出。

- **顶层命令的 positionalType 注入**

  - `POSITIONAL_TYPE_MAP` 包含 `{ 'archive': 'change-id' }` 且调用 `introspectCommands(program)`
  - `archive` 命令的 `CommandDefinition.positionalType` SHALL 为 `'change-id'`

- **未注册命令无 positionalType**

  - 一个命令有位置参数但未在 `POSITIONAL_TYPE_MAP` 中注册
  - 该命令的 `positionalType` SHALL 为 `undefined`

- **quality 命令通过反射可发现**

  - 对包含 `quality` 命令的 `program` 实例调用 `introspectCommands()`
  - 返回结果 SHALL 包含 `quality` 条目及其 `review`/`optimize`/`seal`/`status` 子命令
  - 各子命令 SHALL 携带对应 flags 与 `positionalType`

- **嵌套子命令的 positionalType 注入**

  - `POSITIONAL_TYPE_MAP` 包含 `{ 'arch.impact': 'element-id' }`
  - 调用 `introspectCommands(program)`
  - `arch` 命令下 `impact` 子命令的 `positionalType` SHALL 为 `'element-id'`

### Section: introspect 输出与补全脚本生成器接口兼容

`introspectCommands` 的返回值 SHALL 符合现有 `CommandDefinition[]` 类型定义，使所有 shell completion generators 无需修改即可消费。

- **类型兼容性**

  - `introspectCommands` 返回的数组传入某个 generator 的 `generate()`
  - SHALL 通过 TypeScript 编译且生成有效的补全脚本

- **生成结果等价性**

  - 对完整 CLI `program` 调用 `introspectCommands` 并传入 generators
  - 生成的补全脚本 SHALL 在命令名、flags、子命令结构上与重构前等价

### Section: 防漏测试确保 positionalType 完整性

系统 SHALL 通过自动化测试确保所有声明了位置参数的命令都在 `POSITIONAL_TYPE_MAP` 中有对应条目。

- **新增带参数命令但未更新 Map 时测试失败**

  - CLI 新增了一个带位置参数的命令
  - 该命令路径未在 `POSITIONAL_TYPE_MAP` 中注册
  - 防漏测试 SHALL 失败并报告缺失的命令路径
