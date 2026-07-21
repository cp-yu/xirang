## MODIFIED Requirements

### Requirement: JSON output format for specs

系统 SHALL 在 specs 模式下支持 `--json` 输出，返回包含 `capabilities` 与 `requirements` 字段的结构化数据。`requirements` SHALL 使用 formal spec 中 `### Requirement: <name>` header 的 `<name>`，而不是 requirement 正文。

#### Scenario: [MODIFIED] JSON output includes capabilities and requirements fields
- **WHEN** 用户执行 `openspec list --specs --json`
- **THEN** 系统 SHALL 输出 JSON 数组
- **AND** 每个数组元素 SHALL 包含以下字段：
  - `id`: spec 的目录名（字符串）
  - `title`: spec 的标题（字符串）
  - `requirementCount`: requirements 数量（数字）
  - `requirements`: 从 `### Requirement:` headers 提取的 requirement 名称数组（字符串数组）
  - `capabilities`: 从 frontmatter 提取的 capabilities 数组（字符串数组）

#### Scenario: [MODIFIED] Capabilities and requirements fields are empty arrays when missing
- **WHEN** spec 文件无 YAML frontmatter 或 frontmatter 无 `capabilities` 字段
- **THEN** JSON 输出中该 spec 的 `capabilities` 字段 SHALL 为空数组 `[]`
- **AND** MUST NOT 返回 null 或 undefined
- **WHEN** spec 文件无法读取、无法解析 requirement headers、或不包含 requirement headers
- **THEN** JSON 输出中该 spec 的 `requirements` 字段 SHALL 为空数组 `[]`
- **AND** MUST NOT 返回 null 或 undefined

#### Scenario: [MODIFIED] JSON structure example
- **WHEN** 执行 `openspec list --specs --json`
- **THEN** 输出结构 SHALL 符合以下示例：
  ```json
  [
    {
      "id": "cli-list",
      "title": "List Command Specification",
      "requirementCount": 7,
      "requirements": ["Command Execution", "JSON output format for specs"],
      "capabilities": ["cap.cli.list"]
    },
    {
      "id": "cli-spec",
      "title": "Spec Command Specification",
      "requirementCount": 5,
      "requirements": ["Spec display", "Spec validation"],
      "capabilities": ["cap.cli.spec"]
    }
  ]
  ```
