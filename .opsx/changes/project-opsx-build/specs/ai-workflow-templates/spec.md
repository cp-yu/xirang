## MODIFIED Requirements

### Requirement: 固定工作流模板集合
WorkflowManifestRegistry SHALL 恰好包含六个 user workflows：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。Registry SHALL NOT 包含 `bootstrap-arch`。

#### Scenario: Registry 包含 Project Build
- **WHEN** 查询 workflow manifest
- **THEN** SHALL 包含 workflow ID `build`，其 skill name 与 directory 均为 `opsx-build`
- **AND** SHALL NOT 包含 `bootstrap-arch` 或 `opsx-bootstrap-arch`

### Requirement: Agent definition-first authoring
编写 Project Build source 的 workflow template SHALL 消费 Candidate contract 与 CLI command surface，且 SHALL NOT 重新引入 phase-specific bootstrap instructions。

#### Scenario: Build skill authoring
- **WHEN** 生成 `opsx-build`
- **THEN** SHALL 指导 Agent 询问 exploration scope 与 build starting point
- **AND** SHALL 指导 Agent 编写 `build.md`、Candidate Architecture 与 Candidate Specs
- **AND** SHALL 指导 Agent 使用 `opsx candidate validate` diagnostics
- **AND** SHALL NOT 要求 `opsx bootstrap instructions`、scan/map files、evidence.yaml、domain-map 或固定 subagent roles
