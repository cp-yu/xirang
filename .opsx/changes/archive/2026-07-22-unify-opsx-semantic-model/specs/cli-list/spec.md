---
element: cli.list
---
## MODIFIED Requirements

### Requirement: Extracting capabilities from frontmatter

系统 SHALL 在 Specs mode 解析 YAML frontmatter 的 singular `element` binding，并 SHALL 返回一个 stable `elementId` 或 null。系统 MUST NOT 将新版 Spec 映射为 capabilities 数组。

#### Scenario: [ADDED] Extracting element from frontmatter
- **WHEN** parsing a新版 `spec.md`
- **THEN** SHALL 使用 `parseSpecFrontmatter()` 提取 `element`
- **AND** 合法字符串 SHALL 原样作为 canonical `elementId` 返回

#### Scenario: [ADDED] Missing element binding
- **WHEN** frontmatter 缺失或没有合法 `element`
- **THEN** SHALL 返回 `element: null`
- **AND** MUST NOT 返回空 capabilities 数组替代该状态

#### Scenario: [REMOVED] Extracting capabilities from frontmatter
- **WHEN** parsing a `spec.md` file in specs mode
- **THEN** 系统 SHALL 使用 `parseSpecFrontmatter()` 函数提取 YAML frontmatter
- **AND** 若 frontmatter 包含 `capabilities` 数组，SHALL 提取该数组
- **AND** 若 frontmatter 不存在或无 `capabilities` 字段，SHALL 返回空数组

### Requirement: JSON output format for specs

`opsx list --specs --json` SHALL 返回 Spec identity、requirements 与 singular element binding。Requirement names SHALL 从 formal `### Requirement:` headers 提取。

#### Scenario: [ADDED] JSON output includes element and requirements
- **WHEN** 用户运行 `opsx list --specs --json`
- **THEN** 每个 item SHALL 包含 `id`、`title`、`requirementCount`、`requirements` 与 `element`
- **AND** `element` SHALL 为 stable `elementId` 或 null
- **AND** MUST NOT 包含 `capabilities` 字段

#### Scenario: [ADDED] Missing fields use deterministic empty values
- **WHEN** Spec 缺少 element binding
- **THEN** `element` SHALL 为 null
- **WHEN** requirement headers 不存在或无法读取
- **THEN** `requirements` SHALL 为 `[]`

#### Scenario: [MODIFIED] JSON structure example
- **WHEN** Spec `cli-list` 绑定 `cli.list`
- **THEN** output SHALL 匹配：
```json
{
  "id": "cli-list",
  "title": "List Command Specification",
  "requirementCount": 2,
  "requirements": ["Command Execution", "JSON output format for specs"],
  "element": "cli.list"
}
```

#### Scenario: [REMOVED] JSON output includes capabilities and requirements fields
- **WHEN** 用户执行 `opsx list --specs --json`
- **THEN** 系统 SHALL 输出 JSON 数组
- **AND** 每个数组元素 SHALL 包含以下字段：
  - `id`: spec 的目录名（字符串）
  - `title`: spec 的标题（字符串）
  - `requirementCount`: requirements 数量（数字）
  - `requirements`: 从 `### Requirement:` headers 提取的 requirement 名称数组（字符串数组）
  - `capabilities`: 从 frontmatter 提取的 capabilities 数组（字符串数组）

#### Scenario: [REMOVED] Capabilities and requirements fields are empty arrays when missing
- **WHEN** spec 文件无 YAML frontmatter 或 frontmatter 无 `capabilities` 字段
- **THEN** JSON 输出中该 spec 的 `capabilities` 字段 SHALL 为空数组 `[]`
- **AND** MUST NOT 返回 null 或 undefined
- **WHEN** spec 文件无法读取、无法解析 requirement headers、或不包含 requirement headers
- **THEN** JSON 输出中该 spec 的 `requirements` 字段 SHALL 为空数组 `[]`
- **AND** MUST NOT 返回 null 或 undefined
