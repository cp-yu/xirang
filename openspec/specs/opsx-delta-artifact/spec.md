# opsx-delta-artifact Specification

## Purpose
此规约记录变更 fix-opsx-delta-artifact-and-validation 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: opsx-delta 为正式 schema artifact

`opsx-delta` SHALL 作为正式 artifact 注册在 `schemas/spec-driven/schema.yaml` 中，包含 `id`、`generates`、`template`、`instruction` 和 `requires` 字段。

#### Scenario: artifact 注册后 instructions 可用

- **WHEN** 执行 `openspec instructions opsx-delta --change "<name>" --json`
- **THEN** 返回的 JSON SHALL 包含 `template`（YAML 骨架结构）、`instruction`（格式指引）和 `outputPath`（`<change-dir>/opsx-delta.yaml`）
- **AND** `dependencies` SHALL 包含 `specs` 的状态信息

#### Scenario: artifact 不在 apply 关键路径上

- **GIVEN** `schemas/spec-driven/schema.yaml` 的 `apply.requires` 为 `[tasks]`
- **WHEN** 现有 change 缺少 `opsx-delta.yaml` 文件
- **THEN** `detectCompleted` SHALL NOT 标记 `opsx-delta` 为完成
- **AND** `formatChangeStatus` 中 `applyRequires` 仍满足（仅需 `tasks` 完成）
- **AND** apply SHALL NOT 被阻塞

#### Scenario: artifact 依赖 specs

- **WHEN** `specs` 未完成
- **THEN** `opsx-delta` artifact status SHALL 为 `blocked`
- **AND** `missingDeps` SHALL 包含 `specs`

### Requirement: opsx-delta 模板文件提供 YAML 骨架

`schemas/spec-driven/templates/opsx-delta.yaml` SHALL 是 Registry renderer 追踪的生成制品，包含合法的 `schema_version: 2` 与 `ADDED`/`MODIFIED`/`REMOVED` object keys。模板 SHALL 展示 capabilities 与 relations 数组，并就地说明六种 canonical relation 的方向、endpoint、选择规则与 `note` policy；MUST NOT 展示 code-map 或旧 relation token。

#### Scenario: 模板被加载且可解析
- **WHEN** `loadTemplate('spec-driven', 'opsx-delta.yaml')` 被调用
- **THEN** 返回内容 SHALL 是合法 YAML object
- **AND** SHALL 包含 `schema_version: 2`、`ADDED`、`MODIFIED`、`REMOVED`

#### Scenario: 模板引导精确 relation
- **WHEN** agent 获取 `openspec instructions opsx-delta`
- **THEN** template/instruction SHALL 覆盖六种 canonical relation
- **AND** SHALL 引导无法精确分类时不创建 relation 并记录 review gap
- **AND** SHALL NOT 包含 Markdown delta headings 或 code-map 字段

#### Scenario: Tracked template 与 Registry 一致
- **WHEN** consistency check 重新渲染 opsx-delta template
- **THEN** 输出 SHALL 与 checked-in template 字节一致

### Requirement: OPSX delta expresses target architecture steady state

`opsx-delta.yaml` SHALL 使用最小 `ADDED`、`MODIFIED`、`REMOVED` reconciliation operations，使其与 formal OPSX bundle 合并后得到目标架构稳态。Node intent、status 与 relations SHALL 使用 durable target-state language，MUST NOT 叙述本次如何变化、实现历史、源码路径或机械 code evidence。

#### Scenario: MODIFIED intent 是最终稳定定义
- **WHEN** change 修改 existing capability intent
- **THEN** `MODIFIED.capabilities[]` 的 `intent` SHALL 直接定义 change 后该 capability 的稳定职责
- **AND** SHALL NOT 使用“本次修改”“以前/现在”等 change-log prose

#### Scenario: Relation 表达目标架构事实
- **WHEN** change-local delta 增加或修改 relation
- **THEN** relation SHALL 使用 `RelationDefinitionRegistry` 的 canonical token、direction 与 endpoints
- **AND** SHALL 表达目标架构中持续成立的 semantic fact
- **AND** MUST NOT 仅依据 import/call evidence 机械生成

#### Scenario: Node 删除同时保持 graph 完整
- **WHEN** delta 删除会被现有 relations 引用的 node
- **THEN** delta SHALL 包含使目标 graph 不产生 dangling endpoints 所需的 relation reconciliation
- **AND** dry-run semantic validation SHALL 在遗漏时失败

#### Scenario: Delta 不包含 code-map 数据
- **WHEN** Agent 编写 `opsx-delta.yaml`
- **THEN** nodes 与 relations SHALL 排除 code paths、symbols、imports、calls 与 code-map fields
- **AND** 无法精确分类的 interaction SHALL 留作 review gap 而非创建通用 relation

