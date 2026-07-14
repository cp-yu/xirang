# cli-authoring-help Specification

## Purpose
This specification records behavior introduced by change opsx-v2-semantic-relations. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: 文件级 authoring help
CLI SHALL 提供 `openspec help authoring [file]`。无 file 时 SHALL 列出 `project.opsx.yaml`、`project.opsx.relations.yaml` 与 `opsx-delta.yaml`；指定 file 时 SHALL 输出该文件的用途、结构、编写规则、示例与 validation commands。

#### Scenario: 列出 authoring topics
- **WHEN** 用户执行 `openspec help authoring`
- **THEN** 命令 SHALL 列出三个 canonical file topics
- **AND** SHALL 指示用户通过文件名获取详细帮助

#### Scenario: 未知文件返回可操作错误
- **WHEN** 用户执行 `openspec help authoring unknown.yaml`
- **THEN** 命令 SHALL 以非零退出码退出
- **AND** 错误 SHALL 列出所有合法 file topics

### Requirement: Relation authoring help
`project.opsx.relations.yaml` 与 `opsx-delta.yaml` 的 authoring help SHALL 从 `RelationDefinitionRegistry` 输出六种 relation 的 direction、valid endpoints、meaning、`useWhen`、`doNotUseWhen`、propagation hint、`note` policy 与 YAML example。`opsx-delta.yaml` help SHALL 额外说明 `ADDED`、`MODIFIED`、`REMOVED`。

#### Scenario: Relation help 完整
- **WHEN** 用户执行 `openspec help authoring project.opsx.relations.yaml`
- **THEN** 输出 SHALL 包含全部六种 canonical relation
- **AND** SHALL 包含 relation 选择决策规则、合法示例与非法用法说明
- **AND** MUST NOT 包含旧 relation token 作为可用选项

### Requirement: Authoring help JSON 输出
`openspec help authoring <file> --json` SHALL 返回稳定 JSON object，包含 `file`、`purpose`、`structure`、`validationCommands`；relation files SHALL 额外包含 Registry-derived `relations` 数组。

#### Scenario: JSON 可供 agent 消费
- **WHEN** 用户执行 `openspec help authoring project.opsx.relations.yaml --json`
- **THEN** stdout SHALL 是可解析 JSON
- **AND** 每个 `relations[]` item SHALL 包含 `type`、`fromKinds`、`toKinds`、`direction`、`meaning`、`useWhen`、`doNotUseWhen`、`propagationHint`、`notePolicy` 与 `example`

### Requirement: Commander help 兼容
新增 authoring topic MUST 保持既有 `openspec help <command...>` 与 `openspec --help` 行为。非 `authoring` topic SHALL 委托 Commander command lookup；root help SHALL 提示 `openspec help authoring`。

#### Scenario: 既有 command help 保持可用
- **WHEN** 用户执行 `openspec help bootstrap`、`openspec help validate` 或 `openspec help schema`
- **THEN** CLI SHALL 输出对应 command usage/options
- **AND** SHALL NOT 将 command name 解释为 authoring file

#### Scenario: Windows 文件 topic 解析一致
- **WHEN** Windows 用户执行 authoring help
- **THEN** CLI SHALL 通过显式 canonical file lookup 解析 topic
- **AND** MUST NOT 依赖操作系统路径分隔符或大小写启发式匹配
