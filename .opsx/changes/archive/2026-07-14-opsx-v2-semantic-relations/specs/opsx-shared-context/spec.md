## MODIFIED Requirements

### Requirement: 统一加载协议

核心 workflow SHALL 使用同一 OPSX shared context：读取 `project.opsx.yaml` 的 project intent/scope 与 domains→capabilities 作为高层导航，并通过 CLI 查询 `project.opsx.relations.yaml` 中的语义关系。Shared context MUST NOT 引导读取 code-map；代码位置 SHALL 通过 CodeGraph 或 ACE/`rg`/`read` 获取。

#### Scenario: [ADDED] Shared context 使用两文件语义模型
- **WHEN** workflow 启动且 formal OPSX v2 存在
- **THEN** SHALL 读取 project 元数据和 domain/capability structure
- **AND** SHALL 使用 `openspec opsx query` 获取 relation detail
- **AND** MUST NOT 引用 `project.opsx.code-map.yaml`

#### Scenario: [ADDED] Code evidence 与 OPSX 分层
- **WHEN** workflow 需要实现位置或 symbol dependency
- **THEN** SHALL 将 OPSX 作为语义边界模型
- **AND** SHALL 使用可选 CodeGraph 或 ACE/`rg`/`read` 作为当前代码事实

#### Scenario: [REMOVED] OPSX_SHARED_CONTEXT 包含 project 元数据引导

- **WHEN** 检查 `OPSX_SHARED_CONTEXT` fragment 的文本内容
- **THEN** 该 fragment SHALL 包含一条显式指引，要求读取 `project:` 块以获取项目 intent 和 scope
- **AND** 该指引 SHALL 在"domains → capabilities structure"指引之后

#### Scenario: [REMOVED] OPSX_SHARED_CONTEXT 为单文件协议

- **WHEN** 检查 `OPSX_SHARED_CONTEXT` fragment 的文本内容
- **THEN** 该 fragment SHALL 仅引用 `openspec/project.opsx.yaml` 一个文件路径
- **AND** SHALL NOT 包含 `project.opsx.code-map.yaml`、`project.opsx.relations.yaml` 或 `openspec/specs/` 的读取指引
- **AND** SHALL 保留"导航上下文，不替代 change artifacts"的定位表述

#### Scenario: [REMOVED] Explore 使用共享上下文

- **GIVEN** `openspec/project.opsx.yaml` 存在
- **WHEN** explore 工作流启动
- **THEN** 在探索开始前按共享协议整读 `project.opsx.yaml`
- **AND** 使用 `OPSX_SHARED_CONTEXT` fragment
- **AND** explore 模板额外保留 `OPSX_NAVIGATION_GUIDANCE` 宽视野导航（code-map 与 specs 深挖）

#### Scenario: [REMOVED] Propose 在 artifact 生成前加载 OPSX

- **GIVEN** `openspec/project.opsx.yaml` 存在
- **WHEN** propose 工作流启动
- **THEN** skill 与 command 两个模板均在 artifact 生成循环开始前注入 `OPSX_SHARED_CONTEXT`
- **AND** 不仅限于 opsx-delta 生成阶段才读取
- **AND** OPSX 中的 domain / capability 信息用于约束 proposal 形成

#### Scenario: [REMOVED] Apply 使用共享上下文

- **GIVEN** `openspec/project.opsx.yaml` 存在
- **WHEN** apply 工作流启动
- **THEN** skill 与 command 两个模板均在读取 change artifacts 之前注入 `OPSX_SHARED_CONTEXT`
- **AND** OPSX 作为全局边界/依赖约束模型，不仅用于定位代码文件

### Requirement: CLI 点查询互补定位

`OPSX_CLI_QUERY_CONTEXT` SHALL 将 `openspec opsx query <node-id...> --json` 描述为共享 project context 后的 relation detail 接口。输出 guidance SHALL 解释 relation direction 与 type，并 MUST NOT 承诺 code-map refs。

#### Scenario: [ADDED] Query fragment 与 v2 output 一致
- **WHEN** 检查 shared query fragment
- **THEN** SHALL 引导读取 incoming/outgoing 或 subgraph relation paths
- **AND** SHALL NOT 包含 `codeMap`、`--code-map` 或 code-map file guidance

#### Scenario: [REMOVED] CLI 查询 fragment 不与共享直读冲突

- **WHEN** 检查 `OPSX_CLI_QUERY_CONTEXT` fragment 的文本内容
- **THEN** SHALL NOT 包含 "instead of reading OPSX YAML files directly" 措辞
- **AND** SHALL 表述为在共享 `project.opsx.yaml` 读取之后，使用 `openspec opsx query <node-id> --json` 获取节点 relations 与 code-map 细节
- **AND** propose 与 apply 模板继续注入 `OPSX_CLI_QUERY_CONTEXT`
