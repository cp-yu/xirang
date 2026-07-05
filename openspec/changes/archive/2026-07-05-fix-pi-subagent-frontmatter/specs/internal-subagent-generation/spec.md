## MODIFIED Requirements

### Requirement: Per-tool subagent artifact 渲染

系统 SHALL 通过 `generateSubagentContent(template, toolId, version)` 把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容。渲染 SHALL 按 `toolId` 分派到对应 renderer：

- `claude` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`、`model`）
- `pi` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`、`model`）
- `opencode` SHALL 渲染为 Markdown + YAML frontmatter（含 `description`、`mode: subagent`、`model`、`permission`）
- `codex` SHALL 渲染为 TOML（含 `name`、`description`、`developer_instructions`、`sandbox_mode`）

Renderer SHALL NOT 复用 workflow invocation transform 管线（如 `/opsx:<slug>` 替换）。若需要 transform context，SHALL 使用独立的 `artifactType: 'subagent'`。

#### Scenario: Claude renderer 输出 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'claude', version)` 且 template 为 `openspec-reviewer`
- **THEN** 返回内容 SHALL 以 YAML frontmatter 开头，包含 `name: openspec-reviewer`、`description`、`tools`、`model`
- **AND** frontmatter 后 SHALL 跟 Markdown body 承载 `prompt`
- **AND** SHALL NOT 出现 `display_name`、`sandbox_mode` 或 `permission` 等其他工具字段

#### Scenario: Pi renderer 输出含 name 的 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'pi', version)`
- **THEN** frontmatter SHALL 包含 `name`（取值为 `template.name`）、`description`、`tools`、`model`
- **AND** SHALL NOT 包含 `display_name`、`disallowed_tools` 或 `enabled`
- **AND** 工具权限通过 `tools` allowlist 表达（仅列 read/grep/find/bash，未列出的工具不可用）

#### Scenario: OpenCode renderer 输出 subagent mode 与 permission

- **WHEN** 调用 `generateSubagentContent(template, 'opencode', version)`
- **THEN** frontmatter SHALL 包含 `mode: subagent`
- **AND** SHALL 包含 `permission` 块，至少声明 `edit: deny`
- **AND** impact-sweeper 的 renderer 输出 SHALL 通过 prompt body 表达 "只允许写 `openspec/sweeper/`" 的硬约束

#### Scenario: Codex renderer 输出 TOML

- **WHEN** 调用 `generateSubagentContent(template, 'codex', version)`
- **THEN** 返回内容 SHALL 为合法 TOML
- **AND** SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode` 字段
- **AND** `developer_instructions` SHALL 使用三引号 multiline string 承载 `prompt`
- **AND** SHALL NOT 以 Markdown frontmatter 开头

#### Scenario: TOML multiline 安全转义

- **WHEN** template `prompt` 包含三引号序列 `"""` 或反斜杠字面量
- **THEN** Codex renderer SHALL 对三引号序列转义
- **AND** SHALL 对反斜杠字面量转义
- **AND** 输出 SHALL 仍是合法 TOML
