# ai-impact-sweeper Specification

## Purpose
此规约记录变更 unify-cli-query-interface 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: Evidence Protocol 使用 CLI 查询接口

Impact sweeper SHALL 先通过 `openspec opsx query <node-id...> --json` 获取 capability 与精确 relation paths，再通过 `openspec list --specs --json` 获取 cap→spec contracts。Sweeper MUST NOT 直接读取 formal OPSX YAML。代码证据 SHALL 优先使用可用且已索引的 CodeGraph；否则 SHALL 回退 ACE、`rg`、`read` 与 `git ls-files`。CodeGraph 缺失 MUST NOT 阻塞 sweep。

#### Scenario: OPSX relation path 优先
- **WHEN** concept 映射到一个或多个 capability seeds
- **THEN** sweeper SHALL 批量查询 seeds 及必要深度的 relations
- **AND** SHALL 按 `belongs_to`、`invokes`、`consumes`、`precedes`、`constrains`、`validates` 的 propagation hint 构建候选路径
- **AND** MUST NOT 将无解释的邻居集合直接声明为影响结论

#### Scenario: 查询 cap→spec 映射
- **WHEN** sweeper 需要行为合同
- **THEN** SHALL 执行 `openspec list --specs --json`
- **AND** SHALL 使用每个 spec 的 `capabilities` 数组选择需读取的 specs

#### Scenario: CodeGraph 可选加速
- **GIVEN** `codegraph` 可调用且项目 index 可用
- **WHEN** sweeper 收集代码传播证据
- **THEN** MAY 使用 CodeGraph symbol、call/import path 与 blast-radius output
- **AND** MUST NOT 读取 `.codegraph/codegraph.db`

#### Scenario: CodeGraph 不可用时降级
- **WHEN** CodeGraph 不存在、未索引或调用失败
- **THEN** sweeper SHALL 使用 ACE、`rg`、`read` 与 tracked-file search 继续
- **AND** SHALL 将降低的代码图覆盖记录到 `unknown` 或 evidence gap
- **AND** MUST NOT 因缺少 CodeGraph 凭猜测升级为 `mustChange`

#### Scenario: 读取 specs 时执行术语提取
- **WHEN** sweeper 读取相关 specs 且 caller 提供 concept
- **THEN** SHALL 继续提取语义相近术语及分布
- **AND** SHALL 汇总到 `terminologyObservations`

### Requirement: Impact sweeper description 提示 fast model

`openspec-impact-sweeper` agent description SHALL 明确提示调用方优先使用 fast model 执行该轻量级 OPSX-grounded impact sweep。该提示 MUST 保持为描述性偏好，不得要求模板设置具体 `model` 字段。

#### Scenario: description 包含 fast model 偏好

- **WHEN** 系统读取 `openspec-impact-sweeper` subagent template
- **THEN** `description` SHALL 包含 `Prefer a fast model for this lightweight OPSX-grounded impact sweep.`
- **AND** 模板 SHALL NOT 因该提示设置具体 `model` 字段

