## MODIFIED Requirements

### Requirement: OPSX query 命令基本结构
系统 SHALL 提供 `openspec opsx query <node-id...> --json` 查询 OPSX v2 nodes 与 semantic relations。单 node 且未指定 `--depth` 时 SHALL 返回 `{node, relations}`；MUST NOT 返回 `codeMap`。

#### Scenario: [ADDED] 查询存在节点
- **WHEN** 用户查询存在的 node
- **THEN** JSON SHALL 包含 `node` 与 `relations.incoming/outgoing`
- **AND** 每条 relation SHALL 保留 `from`、`to`、`type` 与可选 `note`

#### Scenario: [ADDED] 查询不存在节点
- **WHEN** requested node 不存在
- **THEN** 命令 SHALL 非零退出并列出前 5 个可用 IDs

#### Scenario: [ADDED] OPSX 文件不存在
- **WHEN** 任一 v2 formal file 缺失
- **THEN** 命令 SHALL 非零退出并提示 init/bootstrap

#### Scenario: [REMOVED] 查询存在的节点返回完整信息

- **WHEN** 用户执行 `openspec opsx query cap.cli.list --json`
- **AND** node `cap.cli.list` 存在于 OPSX 文件中
- **THEN** 系统 SHALL 返回 JSON 对象，包含三个顶层字段：`node`、`relations`、`codeMap`
- **AND** `node` 字段 SHALL 包含 `id`、`type`、`intent`、`status` 属性
- **AND** `relations` 字段 SHALL 包含 `incoming` 和 `outgoing` 两个数组
- **AND** `codeMap` 字段 SHALL 是数组，包含该节点的所有 code-map 引用

#### Scenario: [REMOVED] 查询不存在的节点报错

- **WHEN** 用户执行 `openspec opsx query cap.nonexistent --json`
- **AND** node `cap.nonexistent` 不存在于 OPSX 文件中
- **THEN** 系统 SHALL 以非零退出码退出
- **AND** 错误信息 SHALL 包含 `Node 'cap.nonexistent' not found in OPSX`
- **AND** 错误信息 SHALL 列出前 5 个可用节点 ID 作为提示

#### Scenario: [REMOVED] OPSX 文件不存在时报错

- **WHEN** 用户在未初始化 OPSX 的项目中执行 `openspec opsx query <any-id> --json`
- **AND** `openspec/project.opsx.yaml` 文件不存在
- **THEN** 系统 SHALL 以非零退出码退出
- **AND** 错误信息 SHALL 包含 `OPSX files not found`
- **AND** 错误信息 SHALL 提示运行 `openspec bootstrap init` 或 `openspec init`

#### Scenario: [REMOVED] 单 node-id 且未指定 --depth 时输出形态保持不变

- **WHEN** 用户执行 `openspec opsx query cap.cli.list --json`
- **AND** 命令行中只提供一个 node-id 且未显式指定 `--depth`
- **THEN** 系统 SHALL 返回与历史版本完全一致的 `{node, relations, codeMap}` 单节点形态
- **AND** MUST NOT 输出 `seeds`、`nodes`、`missing` 等子图形态字段

### Requirement: 过滤参数支持
系统 SHALL 支持 `--relations` 以明确只请求 relation detail。`--code-map` MUST NOT 是受支持 option。

#### Scenario: [ADDED] Relations filter
- **WHEN** 用户使用 `--relations`
- **THEN** output SHALL 包含 node 与 relations

#### Scenario: [ADDED] Code-map option 被拒绝
- **WHEN** 用户传入 `--code-map`
- **THEN** Commander SHALL 以未知 option 非零退出

#### Scenario: [REMOVED] 使用 --relations 过滤

- **WHEN** 用户执行 `openspec opsx query cap.cli.list --relations --json`
- **THEN** 系统 SHALL 返回 JSON 对象，仅包含 `node` 和 `relations` 字段
- **AND** MUST NOT 包含 `codeMap` 字段

#### Scenario: [REMOVED] 使用 --code-map 过滤

- **WHEN** 用户执行 `openspec opsx query cap.cli.list --code-map --json`
- **THEN** 系统 SHALL 返回 JSON 对象，仅包含 `node` 和 `codeMap` 字段
- **AND** MUST NOT 包含 `relations` 字段

#### Scenario: [REMOVED] 同时使用 --relations 和 --code-map

- **WHEN** 用户执行 `openspec opsx query cap.cli.list --relations --code-map --json`
- **THEN** 系统 SHALL 返回完整 JSON 对象，包含 `node`、`relations` 和 `codeMap` 字段

### Requirement: 数据访问层复用
系统 MUST 复用 v2 `readProjectOpsx()`，其 bundle SHALL 包含 domains、capabilities 与 relations，MUST NOT 包含 `code_map`。

#### Scenario: [ADDED] Query 使用 v2 bundle
- **WHEN** query 执行
- **THEN** SHALL 从 shared reader 获取 two-file bundle
- **AND** MUST NOT 单独实现 YAML parser

#### Scenario: [REMOVED] 调用 readProjectOpsx 获取数据

- **WHEN** `openspec opsx query` 命令执行
- **THEN** 系统 SHALL 调用 `readProjectOpsx(projectRoot)` 获取 OPSX bundle
- **AND** bundle SHALL 使用既有 `ProjectOpsxBundle` 结构，包含 `domains`、`capabilities`、`relations`、`code_map` 等字段
- **AND** 系统 SHALL 基于 bundle 数据构建 JSON 响应

### Requirement: 批量节点子图输出
多个 node-id 或显式 `--depth` SHALL 返回 `seeds`、`nodes`、`relations`、`missing`，MUST NOT 返回 `codeMap`。

#### Scenario: [ADDED] 批量查询
- **WHEN** 多个 seeds 存在
- **THEN** output SHALL 去重 nodes 与 `{from,type,to}` relations
- **AND** `missing` SHALL 记录不存在的请求 IDs

#### Scenario: [REMOVED] 批量查询多个存在的节点

- **WHEN** 用户执行 `openspec opsx query cap.cli.list cap.cli.show --json`
- **AND** 两个节点均存在于 OPSX 文件中
- **THEN** 系统 SHALL 返回 JSON 对象，`seeds` SHALL 为 `["cap.cli.list", "cap.cli.show"]`
- **AND** `nodes` 数组 SHALL 包含两个 seed 节点对象且无重复，每个节点对象 SHALL 包含 `id`、`type`、`intent`、`status` 属性
- **AND** `relations` 数组 SHALL 包含 seed 节点的全部直接关系，每条关系 SHALL 包含 `from`、`to`、`type` 字段且无重复
- **AND** `codeMap` SHALL 是以 node-id 为键、code-map 引用数组为值的对象
- **AND** `missing` SHALL 为空数组

#### Scenario: [REMOVED] 批量查询部分节点不存在

- **WHEN** 用户执行 `openspec opsx query cap.cli.list cap.nonexistent --json`
- **AND** `cap.cli.list` 存在而 `cap.nonexistent` 不存在
- **THEN** 系统 SHALL 以退出码 0 退出
- **AND** `seeds` SHALL 仅包含 `cap.cli.list`
- **AND** `missing` SHALL 为 `["cap.nonexistent"]`
- **AND** `nodes` SHALL 包含 `cap.cli.list` 节点对象

#### Scenario: [REMOVED] 批量查询全部节点不存在

- **WHEN** 用户执行 `openspec opsx query cap.nope1 cap.nope2 --json`
- **AND** 所有请求的 node-id 均不存在于 OPSX 文件中
- **THEN** 系统 SHALL 以非零退出码退出
- **AND** 错误信息 SHALL 包含 `not found in OPSX`
- **AND** 错误信息 SHALL 列出前 5 个可用节点 ID 作为提示

### Requirement: depth 深度展开
`--depth <n>` SHALL 按 Registry relation direction 与 type 保留路径，最大深度 5。Traversal MAY 收集 incoming/outgoing context，但 SHALL NOT 将 `belongs_to` 或任意邻居自动标记为 change impact。

#### Scenario: [ADDED] Depth output 保留方向
- **WHEN** depth query 展开 relation path
- **THEN** relation objects SHALL 保留 canonical `from` 与 `to`
- **AND** nodes/relations SHALL 去重

#### Scenario: [ADDED] 非法 depth
- **WHEN** depth 非正整数或大于 5
- **THEN** 命令 SHALL 非零退出并说明有效范围

#### Scenario: [REMOVED] depth 2 展开二跳邻居

- **WHEN** 用户执行 `openspec opsx query cap.a --depth 2 --json`
- **AND** 存在关系 `cap.a → cap.b` 与 `cap.b → cap.c`
- **THEN** `nodes` 数组 SHALL 包含 `cap.a`、`cap.b`、`cap.c` 三个节点对象
- **AND** `relations` 数组 SHALL 包含上述两条关系
- **AND** 展开 SHALL 同时覆盖 incoming 与 outgoing 两个方向的边

#### Scenario: [REMOVED] 展开结果去重

- **WHEN** 多个 seed 的展开路径到达同一节点或同一关系
- **THEN** `nodes` 数组中该节点 SHALL 只出现一次
- **AND** `relations` 数组中同一 `{from, to, type}` 关系 SHALL 只出现一次

#### Scenario: [REMOVED] depth 超出上限报错

- **WHEN** 用户执行 `openspec opsx query cap.a --depth 6 --json`
- **THEN** 系统 SHALL 以非零退出码退出
- **AND** 错误信息 SHALL 说明 `--depth` 的有效范围为 1 到 5

#### Scenario: [REMOVED] depth 为非法值报错

- **WHEN** 用户执行 `openspec opsx query cap.a --depth abc --json` 或 `--depth 0`
- **THEN** 系统 SHALL 以非零退出码退出
- **AND** 错误信息 SHALL 说明 `--depth` 必须为正整数

### Requirement: 子图输出的过滤参数作用域
`--relations` 在子图模式 SHALL 保留 `seeds`、`nodes`、`relations`、`missing`。系统不存在 code-map filter scope。

#### Scenario: [ADDED] 子图使用 relations filter
- **WHEN** 用户批量查询并传入 `--relations`
- **THEN** output SHALL 包含四个 v2 subgraph fields

#### Scenario: [REMOVED] 子图输出使用 --relations 过滤

- **WHEN** 用户执行 `openspec opsx query cap.a cap.b --relations --json`
- **THEN** 返回 JSON SHALL 包含 `seeds`、`nodes`、`relations`、`missing` 字段
- **AND** MUST NOT 包含 `codeMap` 字段

#### Scenario: [REMOVED] 子图输出使用 --code-map 过滤

- **WHEN** 用户执行 `openspec opsx query cap.a cap.b --code-map --json`
- **THEN** 返回 JSON SHALL 包含 `seeds`、`nodes`、`codeMap`、`missing` 字段
- **AND** MUST NOT 包含 `relations` 字段

## REMOVED Requirements

### Requirement: Code-map 数据结构
**Reason**: OPSX v2 删除静态 capability→path companion file，代码定位由可选 CodeGraph 或 ACE/`rg`/`read` 提供。
**Migration**: 使用 `openspec opsx query` 获取语义关系，再使用当前代码检索工具定位实现。
