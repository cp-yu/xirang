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

