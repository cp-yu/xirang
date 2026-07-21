## MODIFIED Requirements

### Requirement: opsx-delta 模板文件提供 YAML 骨架

`schemas/spec-driven/templates/opsx-delta.yaml` SHALL 是 Registry renderer 追踪的生成制品，包含合法的 `schema_version: 2` 与 `ADDED`/`MODIFIED`/`REMOVED` object keys。模板 SHALL 展示 capabilities 与 relations 数组，并就地说明六种 canonical relation 的方向、endpoint、选择规则与 `note` policy；MUST NOT 展示 code-map 或旧 relation token。

#### Scenario: [MODIFIED] 模板被加载且可解析
- **WHEN** `loadTemplate('spec-driven', 'opsx-delta.yaml')` 被调用
- **THEN** 返回内容 SHALL 是合法 YAML object
- **AND** SHALL 包含 `schema_version: 2`、`ADDED`、`MODIFIED`、`REMOVED`

#### Scenario: [ADDED] 模板引导精确 relation
- **WHEN** agent 获取 `openspec instructions opsx-delta`
- **THEN** template/instruction SHALL 覆盖六种 canonical relation
- **AND** SHALL 引导无法精确分类时不创建 relation 并记录 review gap
- **AND** SHALL NOT 包含 Markdown delta headings 或 code-map 字段

#### Scenario: [ADDED] Tracked template 与 Registry 一致
- **WHEN** consistency check 重新渲染 opsx-delta template
- **THEN** 输出 SHALL 与 checked-in template 字节一致

#### Scenario: [REMOVED] 模板结构正确引导 LLM

- **WHEN** LLM 从 `openspec instructions opsx-delta` 获取 template
- **THEN** template SHALL 展示 `ADDED.capabilities`、`ADDED.relations` 等为 YAML 数组
- **AND** SHALL 展示 `MODIFIED.capabilities` 为数组
- **AND** SHALL 展示 `REMOVED.capabilities` 为数组
- **AND** SHALL NOT 包含 Markdown 风格的 `## ADDED` 标题
