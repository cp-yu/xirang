## MODIFIED Requirements

### Requirement: Evidence Protocol 使用 CLI 查询接口

Impact sweeper SHALL 先通过 `openspec opsx query <node-id...> --json` 获取 capability 与精确 relation paths，再通过 `openspec list --specs --json` 获取 cap→spec contracts。Sweeper MUST NOT 直接读取 formal OPSX YAML。代码证据 SHALL 优先使用可用且已索引的 CodeGraph；否则 SHALL 回退 ACE、`rg`、`read` 与 `git ls-files`。CodeGraph 缺失 MUST NOT 阻塞 sweep。

#### Scenario: [ADDED] OPSX relation path 优先
- **WHEN** concept 映射到一个或多个 capability seeds
- **THEN** sweeper SHALL 批量查询 seeds 及必要深度的 relations
- **AND** SHALL 按 `belongs_to`、`invokes`、`consumes`、`precedes`、`constrains`、`validates` 的 propagation hint 构建候选路径
- **AND** MUST NOT 将无解释的邻居集合直接声明为影响结论

#### Scenario: [MODIFIED] 查询 cap→spec 映射
- **WHEN** sweeper 需要行为合同
- **THEN** SHALL 执行 `openspec list --specs --json`
- **AND** SHALL 使用每个 spec 的 `capabilities` 数组选择需读取的 specs

#### Scenario: [ADDED] CodeGraph 可选加速
- **GIVEN** `codegraph` 可调用且项目 index 可用
- **WHEN** sweeper 收集代码传播证据
- **THEN** MAY 使用 CodeGraph symbol、call/import path 与 blast-radius output
- **AND** MUST NOT 读取 `.codegraph/codegraph.db`

#### Scenario: [ADDED] CodeGraph 不可用时降级
- **WHEN** CodeGraph 不存在、未索引或调用失败
- **THEN** sweeper SHALL 使用 ACE、`rg`、`read` 与 tracked-file search 继续
- **AND** SHALL 将降低的代码图覆盖记录到 `unknown` 或 evidence gap
- **AND** MUST NOT 因缺少 CodeGraph 凭猜测升级为 `mustChange`

#### Scenario: [MODIFIED] 读取 specs 时执行术语提取
- **WHEN** sweeper 读取相关 specs 且 caller 提供 concept
- **THEN** SHALL 继续提取语义相近术语及分布
- **AND** SHALL 汇总到 `terminologyObservations`

#### Scenario: [REMOVED] 批量查询 OPSX 节点信息

- **WHEN** sweeper 需要获取 OPSX 节点信息、关系或 code-map 引用
- **THEN** SHALL 将全部 plausible node IDs 通过单次 `openspec opsx query <node-id...> --json` 批量调用获取数据
- **AND** 需要二跳展开时 SHALL 使用 `--depth 2` 参数，MUST NOT 通过逐节点连环查询模拟多跳展开
- **AND** SHALL 使用返回的 `nodes`、`relations`、`codeMap`、`missing` 字段作为证据
- **AND** MUST NOT 直接读取 `openspec/project.opsx.yaml`、`openspec/project.opsx.relations.yaml` 或 `openspec/project.opsx.code-map.yaml`

#### Scenario: [REMOVED] OPSX 文件不存在时的处理

- **WHEN** 执行 `openspec opsx query` 返回错误（OPSX 文件不存在）
- **THEN** sweeper SHALL 在报告的 `coverageGaps` 中记录 "OPSX files not found"
- **AND** SHALL 在报告的 `questions` 中添加关于是否需要运行 bootstrap 的问题
- **AND** MAY 降级到基于 git ls-files 的文件系统搜索
