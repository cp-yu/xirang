## MODIFIED Requirements

### Requirement: Per-tool subagent artifact 渲染

系统 SHALL 通过 `generateSubagentContent(template, toolId, version)` 把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容。渲染 SHALL 按 `toolId` 分派到对应 renderer：

- `claude` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`）
- `pi` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`）
- `opencode` SHALL 渲染为 Markdown + YAML frontmatter（含 `description`、`mode: subagent`、`permission`）
- `codex` SHALL 渲染为 TOML（含 `name`、`description`、`developer_instructions`、`sandbox_mode`）

所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时在 frontmatter 中输出 `model` 字段。当 `template.model` 为 `undefined` 或 `"inherit"` 时，SHALL NOT 输出 `model` 行，由工具自身的 fallback 机制决定模型。

Renderer SHALL NOT 复用 workflow invocation transform 管线（如 `/opsx:<slug>` 替换）。若需要 transform context，SHALL 使用独立的 `artifactType: 'subagent'`。

#### Scenario: Claude renderer 输出 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'claude', version)` 且 template 为 `openspec-reviewer`
- **THEN** 返回内容 SHALL 以 YAML frontmatter 开头，包含 `name: openspec-reviewer`、`description`、`tools`
- **AND** SHALL NOT 包含 `model` 字段（当 template.model 未设置时）
- **AND** frontmatter 后 SHALL 跟 Markdown body 承载 `prompt`
- **AND** SHALL NOT 出现 `display_name`、`sandbox_mode` 或 `permission` 等其他工具字段

#### Scenario: Pi renderer 输出含 name 的 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'pi', version)`
- **THEN** frontmatter SHALL 包含 `name`（取值为 `template.name`）、`description`、`tools`
- **AND** SHALL NOT 包含 `model` 字段（当 template.model 未设置时）
- **AND** SHALL NOT 包含 `display_name`、`disallowed_tools` 或 `enabled`
- **AND** 工具权限通过 `tools` allowlist 表达（仅列 read/grep/find/bash，未列出的工具不可用）

#### Scenario: OpenCode renderer 输出 subagent mode 与 permission

- **WHEN** 调用 `generateSubagentContent(template, 'opencode', version)`
- **THEN** frontmatter SHALL 包含 `mode: subagent`
- **AND** SHALL 包含 `permission` 块，至少声明 `edit: deny`
- **AND** SHALL NOT 包含 `model` 字段（当 template.model 未设置时）
- **AND** impact-sweeper 的 renderer 输出 SHALL 通过 prompt body 表达 "只允许写 `openspec/sweeper/`" 的硬约束

#### Scenario: Codex renderer 输出 TOML

- **WHEN** 调用 `generateSubagentContent(template, 'codex', version)`
- **THEN** 返回内容 SHALL 为合法 TOML
- **AND** SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode` 字段
- **AND** SHALL NOT 包含 `model` 行（当 template.model 未设置时）
- **AND** `developer_instructions` SHALL 使用三引号 multiline string 承载 `prompt`
- **AND** SHALL NOT 以 Markdown frontmatter 开头

#### Scenario: 显式设置 model 时输出 model 字段

- **WHEN** `template.model` 设为非 `"inherit"` 的具体模型标识（如 `"claude-sonnet-4"`）
- **THEN** 所有 renderer SHALL 在 frontmatter 中输出 `model` 字段
- **AND** 值 SHALL 等于 `template.model` 设置的值

#### Scenario: TOML multiline 安全转义

- **WHEN** template `prompt` 包含三引号序列 `"""` 或反斜杠字面量
- **THEN** Codex renderer SHALL 对三引号序列转义
- **AND** SHALL 对反斜杠字面量转义
- **AND** 输出 SHALL 仍是合法 TOML

## ADDED Requirements

### Requirement: 用户自定义 model 值在 update 时保留

`ArtifactSyncEngine.writeSubagents()` SHALL 在写入 subagent artifact 前，检查目标文件是否已存在。若已存在的 agent 文件的 frontmatter 中包含用户显式设置的 `model` 值（非 `"inherit"`），SHALL 将该值注入重新生成的内容中，确保 `openspec update` 与 `openspec update --force` 不覆盖用户自定义的模型选择。

对于 Markdown 格式（Claude/Pi/OpenCode），SHALL 从 YAML frontmatter 中解析 `model` 字段；对于 TOML 格式（Codex），SHALL 从 `model = "..."` 行中提取。当值为 `"inherit"` 时 SHALL 视为未设置，不做注入。

#### Scenario: Markdown agent 文件的用户 model 被保留

- **WHEN** 某工具的 `agents/` 目录下已存在 `openspec-reviewer.md`
- **AND** 其 YAML frontmatter 中包含 `model: "anthropic/claude-sonnet-4"`
- **AND** 用户执行 `openspec update`
- **THEN** 重新生成的 `openspec-reviewer.md` SHALL 包含 `model: "anthropic/claude-sonnet-4"`
- **AND** 其余内容 SHALL 为模板重新生成的最新内容

#### Scenario: TOML agent 文件的用户 model 被保留

- **WHEN** 某工具的 `agents/` 目录下已存在 `openspec-reviewer.toml`
- **AND** 其中包含 `model = "gpt-5"`
- **AND** 用户执行 `openspec update`
- **THEN** 重新生成的 `openspec-reviewer.toml` SHALL 包含 `model = "gpt-5"`

#### Scenario: model 值为 inherit 时不保留

- **WHEN** 已存在的 agent 文件的 model 值为 `"inherit"`
- **AND** 用户执行 `openspec update`
- **THEN** 重新生成的 agent 文件 SHALL NOT 包含 `model` 字段
- **AND** `"inherit"` 视为 sentinel 表示无自定义覆盖

#### Scenario: 首次生成不带 model 字段

- **WHEN** agent 文件不存在（首次 `openspec init` 或 `openspec update`）
- **AND** `template.model` 未设置
- **THEN** 生成的 agent 文件 SHALL NOT 包含 `model` 字段
