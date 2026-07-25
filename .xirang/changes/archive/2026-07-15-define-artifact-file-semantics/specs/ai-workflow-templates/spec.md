## ADDED Requirements

### Requirement: Agent definition-first authoring

所有会编写 OpenSpec artifacts 或 bootstrap source files 的 workflow skill SHALL 在 authoring 前获取 resolved file definition，并 SHALL 指示 Agent 依次消费 definition、dependencies/current state、instruction 与 template。Workflow templates MUST NOT 复制每种文件的具体 definition prose。

#### Scenario: Propose 使用 artifact instructions definition
- **WHEN** propose 准备编写 ready artifact
- **THEN** SHALL 读取 `openspec instructions <artifact> --change <name> --json` 的 `definition`
- **AND** SHALL 在遵循 instruction/template 前先应用 definition 的 content boundary 与 write policy

#### Scenario: Bootstrap 使用 phase definitions
- **WHEN** bootstrap 进入当前 phase
- **THEN** SHALL 读取 `openspec bootstrap instructions <phase> --json` 的 `fileDefinitions`
- **AND** SHALL 只直接编辑 write policy 允许 Agent authoring 的文件

#### Scenario: Workflow 不复制 definitions
- **WHEN** 检查 generated workflow skill instructions
- **THEN** SHALL 只包含 definition-first 消费纪律
- **AND** SHALL NOT 内联 proposal、specs、opsx-delta、design、tasks 或 bootstrap 文件的完整 definition

## MODIFIED Requirements

### Requirement: 固定工作流模板集合

工作流模板注册表 SHALL 包含固定的 6 个用户 workflow 模板：`propose`、`explore`、`apply`、`archive`、`bootstrap-opsx` 与 `snack`。Registry MUST NOT 包含 `new`、`continue`、`ff`、`verify`、`sync`、`bulk-archive` 或 `onboard` 等已删除 workflow。

#### Scenario: [ADDED] 注册表包含固定的 6 个工作流
- **WHEN** 查询 workflow manifest registry
- **THEN** SHALL 恰好包含 `propose`、`explore`、`apply`、`archive`、`bootstrap-opsx` 与 `snack`
- **AND** snack SHALL 保持其 manifest metadata 与生成 surface

#### Scenario: [MODIFIED] 已删除工作流不在注册表中
- **WHEN** 查询 workflow manifest registry
- **THEN** MUST NOT 包含 `new`、`continue`、`ff`、`verify`、`sync`、`bulk-archive` 或 `onboard`

#### Scenario: [REMOVED] 注册表包含固定的 5 个工作流

- **WHEN** 查询工作流模板注册表
- **THEN** 注册表 SHALL 包含以下 5 个工作流：
  - `propose`
  - `explore`
  - `apply`
  - `archive`
  - `bootstrap-opsx`
- **AND** 注册表 SHALL NOT 包含其他工作流
