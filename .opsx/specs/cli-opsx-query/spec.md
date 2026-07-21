# cli-opsx-query Specification

## Purpose
此规约记录变更 unify-cli-query-interface 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: OPSX query 命令基本结构
系统 SHALL 提供 `opsx opsx query <node-id...> --json` 查询 OPSX v2 nodes 与 semantic relations。单 node 且未指定 `--depth` 时 SHALL 返回 `{node, relations}`；MUST NOT 返回 `codeMap`。

#### Scenario: 查询存在节点
- **WHEN** 用户查询存在的 node
- **THEN** JSON SHALL 包含 `node` 与 `relations.incoming/outgoing`
- **AND** 每条 relation SHALL 保留 `from`、`to`、`type` 与可选 `note`

#### Scenario: 查询不存在节点
- **WHEN** requested node 不存在
- **THEN** 命令 SHALL 非零退出并列出前 5 个可用 IDs

#### Scenario: OPSX 文件不存在
- **WHEN** 任一 v2 formal file 缺失
- **THEN** 命令 SHALL 非零退出并提示 init/bootstrap

### Requirement: 过滤参数支持
系统 SHALL 支持 `--relations` 以明确只请求 relation detail。`--code-map` MUST NOT 是受支持 option。

#### Scenario: Relations filter
- **WHEN** 用户使用 `--relations`
- **THEN** output SHALL 包含 node 与 relations

#### Scenario: Code-map option 被拒绝
- **WHEN** 用户传入 `--code-map`
- **THEN** Commander SHALL 以未知 option 非零退出

### Requirement: Relations 数据结构

系统 SHALL 将关系按方向分为 incoming 和 outgoing 两类返回。

#### Scenario: 返回 incoming relations

- **WHEN** 查询一个作为关系目标的节点
- **AND** 存在其他节点指向该节点的关系
- **THEN** `relations.incoming` 数组 SHALL 包含所有 `to` 字段为该节点的关系
- **AND** 每个关系对象 SHALL 包含 `from`、`type` 字段

#### Scenario: 返回 outgoing relations

- **WHEN** 查询一个作为关系源的节点
- **AND** 该节点指向其他节点的关系存在
- **THEN** `relations.outgoing` 数组 SHALL 包含所有 `from` 字段为该节点的关系
- **AND** 每个关系对象 SHALL 包含 `to`、`type` 字段

#### Scenario: 节点无任何关系

- **WHEN** 查询一个没有任何关系的节点
- **THEN** `relations.incoming` 和 `relations.outgoing` SHALL 均为空数组
- **AND** MUST NOT 返回 null 或 undefined

### Requirement: 数据访问层复用
系统 MUST 复用 v2 `readProjectOpsx()`，其 bundle SHALL 包含 domains、capabilities 与 relations，MUST NOT 包含 `code_map`。

#### Scenario: Query 使用 v2 bundle
- **WHEN** query 执行
- **THEN** SHALL 从 shared reader 获取 two-file bundle
- **AND** MUST NOT 单独实现 YAML parser

### Requirement: 批量节点子图输出
多个 node-id 或显式 `--depth` SHALL 返回 `seeds`、`nodes`、`relations`、`missing`，MUST NOT 返回 `codeMap`。

#### Scenario: 批量查询
- **WHEN** 多个 seeds 存在
- **THEN** output SHALL 去重 nodes 与 `{from,type,to}` relations
- **AND** `missing` SHALL 记录不存在的请求 IDs

### Requirement: depth 深度展开
`--depth <n>` SHALL 按 Registry relation direction 与 type 保留路径，最大深度 5。Traversal MAY 收集 incoming/outgoing context，但 SHALL NOT 将 `belongs_to` 或任意邻居自动标记为 change impact。

#### Scenario: Depth output 保留方向
- **WHEN** depth query 展开 relation path
- **THEN** relation objects SHALL 保留 canonical `from` 与 `to`
- **AND** nodes/relations SHALL 去重

#### Scenario: 非法 depth
- **WHEN** depth 非正整数或大于 5
- **THEN** 命令 SHALL 非零退出并说明有效范围

### Requirement: 子图输出的过滤参数作用域
`--relations` 在子图模式 SHALL 保留 `seeds`、`nodes`、`relations`、`missing`。系统不存在 code-map filter scope。

#### Scenario: 子图使用 relations filter
- **WHEN** 用户批量查询并传入 `--relations`
- **THEN** output SHALL 包含四个 v2 subgraph fields

