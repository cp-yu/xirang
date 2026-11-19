---
entity: element-declaration
identity: completion-introspect
kind: element
parent: cli
title: Completion Introspect
definition: Completion Introspect 定义从 Commander.js 命令树运行时反射生成 `CommandDefinition[]` 的行为：命令元数据提取、集中式 `POSITIONAL_TYPE_MAP` 注入、与补全脚本生成器接口兼容，以及防漏测试确保 positionalType 完整性。
---

## MODIFIED Sections

### Section: positionalType 通过集中式 Map 注入

系统 SHALL 维护一个 `POSITIONAL_TYPE_MAP` 常量，将命令路径映射到对应的 `positionalType` 值，并在 introspect 过程中合并到输出。

- **顶层命令的 positionalType 注入**

  - `POSITIONAL_TYPE_MAP` 包含 `{ 'archive': 'archive-change-id', 'show': 'change-id' }` 且调用 `introspectCommands(program)`
  - `archive` 命令的 `CommandDefinition.positionalType` SHALL 为 `'archive-change-id'`，`show` SHALL 为 `'change-id'`

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
