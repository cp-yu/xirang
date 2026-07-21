# Spec: opsx-shared-context

## Purpose

统一 explore / propose / apply 三个核心工作流对 OPSX 的加载协议，使 OPSX 成为共享一等上下文而非各模板各自为政的附加信息。
## Requirements
### Requirement: 统一加载协议

核心 workflow SHALL 使用同一 OPSX shared context：读取 `project.opsx.yaml` 的 project intent/scope 与 domains→capabilities 作为高层导航，并通过 CLI 查询 `project.opsx.relations.yaml` 中的语义关系。Shared context MUST NOT 引导读取 code-map；代码位置 SHALL 通过 CodeGraph 或 ACE/`rg`/`read` 获取。

#### Scenario: Shared context 使用两文件语义模型
- **WHEN** workflow 启动且 formal OPSX v2 存在
- **THEN** SHALL 读取 project 元数据和 domain/capability structure
- **AND** SHALL 使用 `opsx opsx query` 获取 relation detail
- **AND** MUST NOT 引用 `project.opsx.code-map.yaml`

#### Scenario: Code evidence 与 OPSX 分层
- **WHEN** workflow 需要实现位置或 symbol dependency
- **THEN** SHALL 将 OPSX 作为语义边界模型
- **AND** SHALL 使用可选 CodeGraph 或 ACE/`rg`/`read` 作为当前代码事实

### Requirement: 优雅降级

当 OPSX 文件缺失或仅部分存在时，工作流 SHALL 继续执行，并仅把缺失部分视为空集合而不是报错中断。

#### Scenario: OPSX 文件不存在时不报错
- **GIVEN** `opsx/project.opsx.yaml` 不存在
- **WHEN** 任一工作流启动
- **THEN** 跳过 OPSX 加载，继续正常执行
- **AND** 不输出错误或警告

#### Scenario: 部分 OPSX 文件缺失
- **GIVEN** `project.opsx.yaml` 存在
- **AND** `project.opsx.relations.yaml` 不存在
- **WHEN** 工作流启动
- **THEN** 加载可用的 OPSX 文件
- **AND** 缺失的文件视为空集合

### Requirement: Fragment 一致性

Explore、propose 与 apply 模板 SHALL 继续引用同一个 `OPSX_SHARED_CONTEXT` 常量，以保证共享的 OPSX 读取协议不会分叉。

#### Scenario: 三个模板使用同一 fragment 常量
- **GIVEN** `OPSX_SHARED_CONTEXT` 定义在 `opsx-fragments.ts` 中
- **WHEN** 检查 explore / propose / apply 模板源码
- **THEN** 三者均引用 `OPSX_SHARED_CONTEXT`
- **AND** 加载的 OPSX 要点集合一致

### Requirement: CLI 点查询互补定位

`OPSX_CLI_QUERY_CONTEXT` SHALL 将 `opsx opsx query <node-id...> --json` 描述为共享 project context 后的 relation detail 接口。输出 guidance SHALL 解释 relation direction 与 type，并 MUST NOT 承诺 code-map refs。

#### Scenario: Query fragment 与 v2 output 一致
- **WHEN** 检查 shared query fragment
- **THEN** SHALL 引导读取 incoming/outgoing 或 subgraph relation paths
- **AND** SHALL NOT 包含 `codeMap`、`--code-map` 或 code-map file guidance

