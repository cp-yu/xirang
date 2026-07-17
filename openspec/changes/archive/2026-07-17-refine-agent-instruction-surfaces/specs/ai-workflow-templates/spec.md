## MODIFIED Requirements

### Requirement: Agent definition-first authoring

所有会编写 OpenSpec artifacts 或 Bootstrap source files 的 workflow skill SHALL 获取对应 CLI instruction projection，并 SHALL 指示 Agent 遵循返回 `instruction` 中的 authoring order。Workflow templates MUST NOT 重复维护 `content.includes`、`content.excludes`、`writePolicy` 或 definition-first 逐步规则；这些细节由 instruction projection 单一持有。Workflow SHALL 将 definition、dependencies/current state、config projection、instruction 与 template 作为独立 inputs，并 MUST NOT 将非 source inputs 复制进 authored files。

#### Scenario: [ADDED] Propose 消费 artifact instruction contract
- **WHEN** propose 准备编写 ready artifact
- **THEN** SHALL 读取 `openspec instructions <artifact> --change <name> --json`
- **AND** SHALL 遵循返回 `instruction` 中的 authoring order
- **AND** workflow template SHALL NOT 重复 `content.includes`、`content.excludes` 或 `writePolicy` 的消费步骤

#### Scenario: [ADDED] Snack 消费 artifact instruction contract
- **WHEN** snack reconcile proposal、Specs、design 或 OPSX delta
- **THEN** SHALL 运行对应 `openspec instructions <artifact> --change <name> --json`
- **AND** SHALL 遵循返回 `instruction` 中的 authoring order
- **AND** SHALL 将 current state 与 artifact content 分离

#### Scenario: [ADDED] Bootstrap 消费 phase instruction contract
- **WHEN** Bootstrap 进入当前 phase
- **THEN** SHALL 读取 `openspec bootstrap instructions <phase> --json`
- **AND** SHALL 遵循返回 `instruction` 中的 fileDefinitions-first order
- **AND** SHALL 只直接编辑 write policy 允许 Agent authoring 的文件

#### Scenario: [ADDED] Workflow 不复制 definitions 或 authoring rules
- **WHEN** 检查 generated workflow skill instructions
- **THEN** SHALL 只引用 CLI 返回的 authoring order 并保持结构化 inputs 分离
- **AND** SHALL NOT 内联 proposal、Specs、OPSX delta、design、tasks 或 Bootstrap 文件的完整 definition
- **AND** SHALL NOT 复制 instruction projection 已持有的 definition-first 字段级规则

#### Scenario: [REMOVED] Propose 使用 artifact instructions definition
- **WHEN** propose 准备编写 ready artifact
- **THEN** SHALL 读取 `openspec instructions <artifact> --change <name> --json` 的 `definition`
- **AND** SHALL 在遵循 instruction/template 前先应用 definition 的 content boundary 与 write policy

#### Scenario: [REMOVED] Bootstrap 使用 phase definitions
- **WHEN** bootstrap 进入当前 phase
- **THEN** SHALL 读取 `openspec bootstrap instructions <phase> --json` 的 `fileDefinitions`
- **AND** SHALL 只直接编辑 write policy 允许 Agent authoring 的文件

#### Scenario: [REMOVED] Workflow 不复制 definitions
- **WHEN** 检查 generated workflow skill instructions
- **THEN** SHALL 只包含 definition-first 消费纪律
- **AND** SHALL NOT 内联 proposal、specs、opsx-delta、design、tasks 或 bootstrap 文件的完整 definition
